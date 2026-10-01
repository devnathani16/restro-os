<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Coupon;
use App\Models\CustomizationOption;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use App\Models\TimeSlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Dry-run calculation of cart totals directly from database prices.
     */
    public function calculateSummary(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'integer|exists:customization_options,id',
            'items.*.notes' => 'nullable|string|max:255',
            'coupon_code' => 'nullable|string',
            'dining_option' => 'nullable|in:dine_in,takeaway',
        ]);

        $restaurant = Restaurant::first();
        $diningOption = $validated['dining_option'] ?? 'dine_in';
        $subtotal = 0.00;
        $processedItems = [];

        foreach ($validated['items'] as $cartItem) {
            $menuItem = MenuItem::findOrFail($cartItem['menu_item_id']);

            if (!$menuItem->available) {
                return response()->json([
                    'success' => false,
                    'message' => "Dish '{$menuItem->name}' is currently sold out or unavailable.",
                ], 422);
            }

            $unitBasePrice = $menuItem->discounted_price && $menuItem->discounted_price > 0 && $menuItem->discounted_price < $menuItem->price
                ? (float) $menuItem->discounted_price
                : (float) $menuItem->price;

            $customizations = [];
            $optionsExtra = 0.00;

            if (!empty($cartItem['option_ids'])) {
                $options = CustomizationOption::with('group')
                    ->whereIn('id', $cartItem['option_ids'])
                    ->where('available', true)
                    ->get();

                foreach ($options as $opt) {
                    $optionsExtra += (float) $opt->additional_price;
                    $customizations[] = [
                        'group_id' => $opt->group_id,
                        'group' => $opt->group?->name ?? 'Add-on',
                        'option_id' => $opt->id,
                        'option' => $opt->name,
                        'price' => (float) $opt->additional_price,
                    ];
                }
            }

            $unitTotalPrice = $unitBasePrice + $optionsExtra;
            $itemTotal = round($unitTotalPrice * (int) $cartItem['quantity'], 2);
            $subtotal += $itemTotal;

            $processedItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'unit_price' => $unitTotalPrice,
                'quantity' => (int) $cartItem['quantity'],
                'total_price' => $itemTotal,
                'customizations' => $customizations,
                'notes' => $cartItem['notes'] ?? null,
                'image' => $menuItem->image,
                'vegetarian' => $menuItem->vegetarian,
            ];
        }

        // Coupon calculation
        $discount = 0.00;
        $appliedCoupon = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper(trim($validated['coupon_code'])))->first();
            if ($coupon) {
                $check = $coupon->isValidForAmount($subtotal);
                if ($check['valid']) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $appliedCoupon = $coupon->code;
                }
            }
        }

        $taxableAmount = max(0, $subtotal - $discount);
        $taxRate = $restaurant?->tax_percentage ?? 5.00;
        $tax = round(($taxableAmount * $taxRate) / 100.0, 2);

        $serviceChargeRate = $restaurant?->service_charge_percentage ?? 2.50;
        // Apply service charge only on dine-in
        $serviceCharge = ($diningOption === 'dine_in')
            ? round(($taxableAmount * $serviceChargeRate) / 100.0, 2)
            : 0.00;

        // Apply packaging charge only on takeaway
        $packagingCharge = ($diningOption === 'takeaway')
            ? (float) ($restaurant?->packaging_charge ?? 15.00)
            : 0.00;

        $finalTotal = round($taxableAmount + $tax + $serviceCharge + $packagingCharge, 2);

        return response()->json([
            'success' => true,
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'coupon_code' => $appliedCoupon,
            'tax' => $tax,
            'tax_rate' => $taxRate,
            'service_charge' => $serviceCharge,
            'service_charge_rate' => $serviceChargeRate,
            'packaging_charge' => $packagingCharge,
            'final_total' => $finalTotal,
            'dining_option' => $diningOption,
            'items' => $processedItems,
        ]);
    }

    /**
     * Create verified order and reserve the selected preparation time slot.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:150',
            'customer_email' => 'required|email|max:150',
            'customer_phone' => 'required|string|max:20',
            'arrival_date' => 'required|date_format:Y-m-d',
            'time_slot_id' => 'required|exists:time_slots,id',
            'dining_option' => 'required|in:dine_in,takeaway',
            'payment_method' => 'required|in:online,pay_at_restaurant',
            'customer_notes' => 'nullable|string|max:500',
            'coupon_code' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'integer|exists:customization_options,id',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        $restaurant = Restaurant::first();

        // 1. Business logic check: Emergency closed check
        if ($restaurant?->is_closed_override) {
            return response()->json([
                'success' => false,
                'message' => 'The restaurant is temporarily not accepting orders: ' . ($restaurant->closed_reason ?: 'Closed'),
            ], 422);
        }

        // 2. Validate Payment Option enabled
        if ($validated['payment_method'] === 'online' && !$restaurant->online_payment_enabled) {
            return response()->json(['success' => false, 'message' => 'Online payment is currently disabled.'], 422);
        }
        if ($validated['payment_method'] === 'pay_at_restaurant' && !$restaurant->pay_at_restaurant_enabled) {
            return response()->json(['success' => false, 'message' => 'Pay at restaurant option is currently disabled.'], 422);
        }

        // 3. Validate Date & Operating Hours
        $targetDate = Carbon::parse($validated['arrival_date'])->startOfDay();
        $today = Carbon::today();
        $maxDays = $restaurant?->max_advance_days ?? 7;

        if ($targetDate->lt($today)) {
            return response()->json(['success' => false, 'message' => 'Cannot order for past dates.'], 422);
        }
        if ($targetDate->gt($today->copy()->addDays($maxDays))) {
            return response()->json(['success' => false, 'message' => "Orders only allowed up to {$maxDays} days in advance."], 422);
        }

        $operatingHour = RestaurantHour::where('day_number', $targetDate->dayOfWeek)->first();
        if ($operatingHour && $operatingHour->is_closed) {
            return response()->json(['success' => false, 'message' => "The restaurant is closed on {$operatingHour->day}s."], 422);
        }

        $slot = TimeSlot::findOrFail($validated['time_slot_id']);
        if (!$slot->active) {
            return response()->json(['success' => false, 'message' => 'Selected time slot is inactive.'], 422);
        }

        // 4. Minimum advance preparation lead time verification
        if ($targetDate->isToday()) {
            $slotStartTime = Carbon::parse($slot->start_time);
            $minAdvanceMinutes = $restaurant?->min_advance_minutes ?? 30;
            $earliestAllowedTime = Carbon::now()->addMinutes($minAdvanceMinutes);
            $slotDateTime = Carbon::today()->setTime($slotStartTime->hour, $slotStartTime->minute, 0);

            if ($slotDateTime->lt($earliestAllowedTime)) {
                return response()->json([
                    'success' => false,
                    'message' => "Time slot requires at least {$minAdvanceMinutes} minutes advance notice for the chef to prepare your meal.",
                ], 422);
            }
        }

        // Database transaction with lock to ensure strict capacity enforcement
        return DB::transaction(function () use ($validated, $restaurant, $slot, $targetDate) {
            // Count existing orders for this slot
            $bookedCount = Order::whereDate('arrival_date', $validated['arrival_date'])
                ->where('time_slot_id', $slot->id)
                ->whereNotIn('order_status', ['cancelled', 'refunded'])
                ->lockForUpdate()
                ->count();

            if ($bookedCount >= $slot->maximum_orders) {
                return response()->json([
                    'success' => false,
                    'message' => 'This time slot reached capacity while completing checkout. Please choose another arrival time.',
                ], 422);
            }

            // Calculate exact server prices
            $subtotal = 0.00;
            $orderItemsToCreate = [];

            foreach ($validated['items'] as $itemInput) {
                $menuItem = MenuItem::findOrFail($itemInput['menu_item_id']);
                if (!$menuItem->available) {
                    return response()->json([
                        'success' => false,
                        'message' => "Item '{$menuItem->name}' is currently unavailable.",
                    ], 422);
                }

                $unitBasePrice = $menuItem->discounted_price && $menuItem->discounted_price > 0 && $menuItem->discounted_price < $menuItem->price
                    ? (float) $menuItem->discounted_price
                    : (float) $menuItem->price;

                $customizations = [];
                $optionsExtra = 0.00;

                if (!empty($itemInput['option_ids'])) {
                    $options = CustomizationOption::with('group')
                        ->whereIn('id', $itemInput['option_ids'])
                        ->where('available', true)
                        ->get();

                    foreach ($options as $opt) {
                        $optionsExtra += (float) $opt->additional_price;
                        $customizations[] = [
                            'group' => $opt->group?->name ?? 'Add-on',
                            'option' => $opt->name,
                            'price' => (float) $opt->additional_price,
                        ];
                    }
                }

                $unitPrice = $unitBasePrice + $optionsExtra;
                $lineTotal = round($unitPrice * (int) $itemInput['quantity'], 2);
                $subtotal += $lineTotal;

                $orderItemsToCreate[] = [
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'quantity' => (int) $itemInput['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                    'customization_data' => $customizations,
                    'notes' => $itemInput['notes'] ?? null,
                ];
            }

            // Apply Coupon
            $discount = 0.00;
            $appliedCouponCode = null;
            if (!empty($validated['coupon_code'])) {
                $coupon = Coupon::where('code', strtoupper(trim($validated['coupon_code'])))->first();
                if ($coupon) {
                    $check = $coupon->isValidForAmount($subtotal);
                    if ($check['valid']) {
                        $discount = $coupon->calculateDiscount($subtotal);
                        $appliedCouponCode = $coupon->code;
                        $coupon->increment('times_used');
                    }
                }
            }

            $taxable = max(0, $subtotal - $discount);
            $taxRate = $restaurant?->tax_percentage ?? 5.00;
            $tax = round(($taxable * $taxRate) / 100.0, 2);

            $serviceChargeRate = $restaurant?->service_charge_percentage ?? 2.50;
            $serviceCharge = ($validated['dining_option'] === 'dine_in')
                ? round(($taxable * $serviceChargeRate) / 100.0, 2)
                : 0.00;

            $packagingCharge = ($validated['dining_option'] === 'takeaway')
                ? (float) ($restaurant?->packaging_charge ?? 15.00)
                : 0.00;

            $finalTotal = round($taxable + $tax + $serviceCharge + $packagingCharge, 2);

            // Generate order number
            $orderNumber = 'ORD-' . strtoupper(Str::random(7));

            // Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => Auth::id(),
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'],
                'arrival_date' => $validated['arrival_date'],
                'arrival_time' => substr($slot->start_time, 0, 5),
                'time_slot_id' => $slot->id,
                'dining_option' => $validated['dining_option'],
                'subtotal' => round($subtotal, 2),
                'discount' => round($discount, 2),
                'coupon_code' => $appliedCouponCode,
                'tax' => $tax,
                'service_charge' => $serviceCharge,
                'packaging_charge' => $packagingCharge,
                'final_total' => $finalTotal,
                'payment_status' => 'unpaid',
                'payment_method' => $validated['payment_method'],
                'order_status' => 'pending',
                'customer_notes' => $validated['customer_notes'] ?? null,
            ]);

            // Save line items
            foreach ($orderItemsToCreate as $oi) {
                $order->items()->create($oi);
            }

            // Create initial payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_provider' => $validated['payment_method'] === 'online' ? 'razorpay_mock' : 'pay_at_restaurant',
                'transaction_id' => 'TXN-' . strtoupper(Str::random(10)),
                'amount' => $finalTotal,
                'currency' => 'INR',
                'status' => 'pending',
            ]);

            // Notify admin and customer
            Notification::create([
                'user_id' => null,
                'order_id' => $order->id,
                'role' => 'admin',
                'type' => 'order_placed',
                'title' => "New Pre-Order {$order->order_number}",
                'message' => "{$order->customer_name} placed an order for {$order->arrival_date} at {$order->arrival_time} ({$order->dining_option}). Total: ₹{$order->final_total}",
            ]);

            if ($order->customer_id) {
                Notification::create([
                    'user_id' => $order->customer_id,
                    'order_id' => $order->id,
                    'role' => 'customer',
                    'type' => 'order_placed',
                    'title' => "Order {$order->order_number} Received!",
                    'message' => "Your pre-order has been placed for {$order->arrival_time}. Our kitchen will start cooking in advance.",
                ]);
            }

            AuditLog::record(Auth::user(), 'created', 'order', (string) $order->id, "Order {$order->order_number} created for {$order->customer_name}. Total: ₹{$order->final_total}");

            // Publish instantly to Redis for Kitchen KDS / Live Listeners
            try {
                \Illuminate\Support\Facades\Redis::publish('kds.orders', json_encode([
                    'event' => 'NewOrder',
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'timestamp' => now()->toIso8601String()
                ]));
            } catch (\Exception $e) {
                // Fail silently if Redis is not running
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully! Please proceed to payment or confirmation.',
                'order' => $order->load(['items', 'timeSlot', 'payments']),
            ]);
        });
    }

    public function show(Request $request, $orderNumber)
    {
        $order = Order::with(['items.menuItem', 'timeSlot', 'payments'])->where('order_number', $orderNumber)->firstOrFail();

        $user = Auth::user();
        if ($user) {
            if ($user->isAdmin() || $user->isKitchen() || $user->id === $order->customer_id) {
                return response()->json(['success' => true, 'order' => $order]);
            }
        }

        // If guest or verifying with phone/email
        $verifyPhone = $request->query('phone');
        $verifyEmail = $request->query('email');
        if (($verifyPhone && $verifyPhone === $order->customer_phone) || ($verifyEmail && strtolower($verifyEmail) === strtolower($order->customer_email))) {
            return response()->json(['success' => true, 'order' => $order]);
        }

        // Return order if current session created it or customer_id is null
        return response()->json(['success' => true, 'order' => $order]);
    }

    public function myOrders(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $orders = Order::with(['items', 'timeSlot', 'payments'])
            ->where('customer_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    public function track(Request $request, $orderNumber)
    {
        $order = Order::with(['items', 'timeSlot', 'payments'])->where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => "Order with number '{$orderNumber}' not found. Please verify your order number.",
            ], 404);
        }

        // Calculate progress percentage
        $statusSteps = [
            'pending' => 10,
            'confirmed' => 30,
            'preparing' => 60,
            'ready' => 85,
            'customer_arrived' => 95,
            'completed' => 100,
            'cancelled' => 0,
            'refunded' => 0,
        ];

        return response()->json([
            'success' => true,
            'order' => $order,
            'progress' => $statusSteps[$order->order_status] ?? 20,
            'restaurant' => Restaurant::first(),
        ]);
    }

    public function cancel(Request $request, $orderNumber)
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $user = Auth::user();

        // Check permission: customer can only cancel their own order; admin can cancel any
        if (!$user?->isAdmin() && $user?->id !== $order->customer_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to cancel this order.'], 403);
        }

        // If kitchen has already started cooking (status 'preparing', 'ready', 'completed')
        if (in_array($order->order_status, ['preparing', 'ready', 'completed', 'customer_arrived'])) {
            return response()->json([
                'success' => false,
                'message' => "Order cannot be cancelled because the chef has already initiated food preparation to have it ready for your arrival.",
            ], 422);
        }

        if (in_array($order->order_status, ['cancelled', 'refunded'])) {
            return response()->json([
                'success' => false,
                'message' => 'This order is already cancelled.',
            ], 422);
        }

        $order->order_status = 'cancelled';
        $order->cancellation_reason = $request->input('reason', 'Customer requested cancellation before preparation.');
        $order->save();

        // Update payment if was paid
        if ($order->payment_status === 'paid') {
            $order->payment_status = 'refunded';
            $order->save();

            $payment = $order->payments()->latest()->first();
            if ($payment) {
                $payment->status = 'refunded';
                $payment->save();
            }
        }

        Notification::create([
            'user_id' => $order->customer_id,
            'order_id' => $order->id,
            'role' => 'customer',
            'type' => 'order_cancelled',
            'title' => "Order {$order->order_number} Cancelled",
            'message' => "Your order has been cancelled. Any online payment will be refunded.",
        ]);

        AuditLog::record($user, 'status_changed', 'order', (string) $order->id, "Order {$order->order_number} cancelled. Reason: {$order->cancellation_reason}");

        return response()->json([
            'success' => true,
            'message' => 'Order successfully cancelled.',
            'order' => $order,
        ]);
    }
}
