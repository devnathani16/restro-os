<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\CustomizationGroup;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use App\Models\Review;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function getPublicData(Request $request)
    {
        $data = \Illuminate\Support\Facades\Cache::remember('public_restaurant_data', 600, function () {
            $restaurant = Restaurant::first();
            if (!$restaurant) {
                $restaurant = Restaurant::create(['name' => 'Spice & Hearth Bistro']);
            }

            $categories = Category::where('active', true)
                ->orderBy('display_order')
                ->with(['menuItems' => function ($query) {
                    $query->where('available', true)
                          ->orderBy('display_order')
                          ->with(['customizationGroups.options' => function ($q) {
                              $q->where('available', true)->orderBy('display_order');
                          }]);
                }])
                ->get();

            $featuredItems = MenuItem::where('available', true)
                ->where('featured', true)
                ->with(['customizationGroups.options'])
                ->take(6)
                ->get();

            $popularItems = MenuItem::where('available', true)
                ->where('popular', true)
                ->with(['customizationGroups.options'])
                ->take(6)
                ->get();

            $hours = RestaurantHour::orderBy('day_number')->get();
            $timeSlots = TimeSlot::where('active', true)->orderBy('start_time')->get();
            $reviews = Review::where('is_featured', true)->latest()->take(8)->get();

            return [
                'restaurant' => $restaurant->toArray(),
                'categories' => $categories->toArray(),
                'featured_items' => $featuredItems->toArray(),
                'popular_items' => $popularItems->toArray(),
                'hours' => $hours->toArray(),
                'time_slots' => $timeSlots->toArray(),
                'reviews' => $reviews->toArray(),
            ];
        });

        return response()->json($data);
    }

    public function checkSlotAvailability(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'time_slot_id' => 'required|exists:time_slots,id',
        ]);

        $restaurant = Restaurant::first();
        $targetDate = Carbon::parse($validated['date'])->startOfDay();
        $today = Carbon::today();

        // 1. Check max advance booking window
        $maxDays = $restaurant?->max_advance_days ?? 7;
        if ($targetDate->lt($today)) {
            return response()->json([
                'available' => false,
                'message' => 'Cannot select a date in the past.',
            ], 422);
        }

        if ($targetDate->gt($today->copy()->addDays($maxDays))) {
            return response()->json([
                'available' => false,
                'message' => "Reservations are only accepted up to {$maxDays} days in advance.",
            ], 422);
        }

        // 2. Check emergency closed override
        if ($restaurant?->is_closed_override) {
            return response()->json([
                'available' => false,
                'message' => 'The restaurant is currently not accepting orders: ' . ($restaurant->closed_reason ?: 'Temporary closure.'),
            ], 422);
        }

        // 3. Check day-of-week operating hours
        $dayOfWeek = $targetDate->dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
        $operatingHour = RestaurantHour::where('day_number', $dayOfWeek)->first();

        if ($operatingHour && $operatingHour->is_closed) {
            return response()->json([
                'available' => false,
                'message' => "The restaurant is closed on {$operatingHour->day}s.",
            ], 422);
        }

        $slot = TimeSlot::findOrFail($validated['time_slot_id']);
        if (!$slot->active) {
            return response()->json([
                'available' => false,
                'message' => 'This time slot is currently not active.',
            ], 422);
        }

        // 4. Check minimum advance notice if date is today
        $now = Carbon::now();
        if ($targetDate->isToday()) {
            $slotStartTime = Carbon::parse($slot->start_time);
            $minAdvanceMinutes = $restaurant?->min_advance_minutes ?? 30;
            $earliestAllowedTime = $now->copy()->addMinutes($minAdvanceMinutes);

            $slotDateTime = Carbon::today()->setTime($slotStartTime->hour, $slotStartTime->minute, 0);

            if ($slotDateTime->lt($earliestAllowedTime)) {
                return response()->json([
                    'available' => false,
                    'message' => "This time slot requires at least {$minAdvanceMinutes} minutes advance preparation notice. Please pick a later slot.",
                ], 422);
            }
        }

        // 5. Check slot capacity
        $existingOrdersCount = Order::whereDate('arrival_date', $validated['date'])
            ->where('time_slot_id', $slot->id)
            ->whereNotIn('order_status', ['cancelled', 'refunded'])
            ->count();

        $maxOrders = $slot->maximum_orders;
        $remaining = max(0, $maxOrders - $existingOrdersCount);

        if ($existingOrdersCount >= $maxOrders) {
            return response()->json([
                'available' => false,
                'remaining_capacity' => 0,
                'max_capacity' => $maxOrders,
                'message' => 'This time slot is completely booked to ensure culinary quality. Please choose another slot.',
            ], 422);
        }

        return response()->json([
            'available' => true,
            'remaining_capacity' => $remaining,
            'max_capacity' => $maxOrders,
            'message' => "Slot available! ({$remaining} slots remaining)",
        ]);
    }

    public function validateCoupon(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($validated['code']));
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid promo coupon code.',
            ], 422);
        }

        $check = $coupon->isValidForAmount((float) $validated['subtotal']);
        if (!$check['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $check['message'],
            ], 422);
        }

        $discount = $coupon->calculateDiscount((float) $validated['subtotal']);

        return response()->json([
            'valid' => true,
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'calculated_discount' => $discount,
            'message' => "Promo code applied! You saved ₹{$discount}.",
        ]);
    }
}
