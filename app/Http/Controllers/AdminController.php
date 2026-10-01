<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CustomizationGroup;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use App\Models\TimeSlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Dashboard Overview Metrics
     */
    public function dashboardStats()
    {
        $today = Carbon::today()->format('Y-m-d');

        $todayOrders = Order::whereDate('arrival_date', $today)->get();
        $todayRevenue = $todayOrders->where('payment_status', 'paid')->sum('final_total');

        $pendingCount = Order::whereDate('arrival_date', $today)->where('order_status', 'pending')->count();
        $preparingCount = Order::whereDate('arrival_date', $today)->where('order_status', 'preparing')->count();
        $readyCount = Order::whereDate('arrival_date', $today)->where('order_status', 'ready')->count();
        $completedCount = Order::whereDate('arrival_date', $today)->where('order_status', 'completed')->count();
        $upcomingCount = Order::whereDate('arrival_date', '>', $today)->whereNotIn('order_status', ['cancelled', 'refunded'])->count();

        $totalCustomers = User::where('role', 'customer')->count();

        // Top 5 popular dishes by quantity ordered
        $popularDishes = DB::table('order_items')
            ->select('item_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(total_price) as total_revenue'))
            ->groupBy('item_name')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        // Orders by time slot today
        $ordersByTimeSlot = Order::whereDate('arrival_date', $today)
            ->select('arrival_time', DB::raw('COUNT(*) as count'))
            ->groupBy('arrival_time')
            ->orderBy('arrival_time')
            ->get();

        // Recent 5 orders
        $recentOrders = Order::with(['items', 'timeSlot'])->latest()->take(5)->get();

        return response()->json([
            'success' => true,
            'metrics' => [
                'today_orders_count' => $todayOrders->count(),
                'today_revenue' => round($todayRevenue, 2),
                'pending_count' => $pendingCount,
                'preparing_count' => $preparingCount,
                'ready_count' => $readyCount,
                'completed_count' => $completedCount,
                'upcoming_count' => $upcomingCount,
                'total_customers' => $totalCustomers,
            ],
            'popular_dishes' => $popularDishes,
            'orders_by_time_slot' => $ordersByTimeSlot,
            'recent_orders' => $recentOrders,
        ]);
    }

    /**
     * Order Management with filters
     */
    public function orders(Request $request)
    {
        $query = Order::with(['items.menuItem', 'timeSlot', 'payments'])->latest();

        $today = Carbon::today()->format('Y-m-d');
        $tomorrow = Carbon::tomorrow()->format('Y-m-d');

        // Filter by date quick links
        if ($request->filled('date_filter')) {
            match ($request->query('date_filter')) {
                'today' => $query->whereDate('arrival_date', $today),
                'tomorrow' => $query->whereDate('arrival_date', $tomorrow),
                'upcoming' => $query->whereDate('arrival_date', '>=', $today),
                'past' => $query->whereDate('arrival_date', '<', $today),
                default => null,
            };
        }

        // Specific arrival date
        if ($request->filled('arrival_date')) {
            $query->whereDate('arrival_date', $request->query('arrival_date'));
        }

        // Status filter
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('order_status', $request->query('status'));
        }

        // Payment status filter
        if ($request->filled('payment_status') && $request->query('payment_status') !== 'all') {
            $query->where('payment_status', $request->query('payment_status'));
        }

        // Search query (order number, customer name, phone, email)
        if ($request->filled('search')) {
            $s = trim($request->query('search'));
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%")
                    ->orWhere('customer_email', 'like', "%{$s}%");
            });
        }

        $orders = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    /**
     * Admin status update
     */
    public function updateOrderStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,preparing,ready,customer_arrived,completed,cancelled,refunded',
            'payment_status' => 'nullable|in:unpaid,paid,refunded,failed',
            'notes' => 'nullable|string',
        ]);

        $order = Order::findOrFail($orderId);
        $oldStatus = $order->order_status;
        $order->order_status = $validated['status'];

        if (! empty($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }

        if ($validated['status'] === 'preparing' && ! $order->preparation_started_at) {
            $order->preparation_started_at = now();
        } elseif ($validated['status'] === 'ready' && ! $order->ready_at) {
            $order->ready_at = now();
        } elseif ($validated['status'] === 'completed' && ! $order->completed_at) {
            $order->completed_at = now();
        } elseif ($validated['status'] === 'cancelled') {
            $order->cancellation_reason = $validated['notes'] ?? 'Cancelled by administrator.';
        }

        $order->save();

        AuditLog::record(Auth::user(), 'status_changed', 'order', (string) $order->id, "Status changed from {$oldStatus} to {$order->order_status}");

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} status updated to {$order->order_status}.",
            'order' => $order->load(['items', 'timeSlot', 'payments']),
        ]);
    }

    /**
     * Menu Items CRUD
     */
    public function menuItems(Request $request)
    {
        $items = MenuItem::with(['category', 'customizationGroups.options'])
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'success' => true,
            'menu_items' => $items,
        ]);
    }

    public function storeMenuItem(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discounted_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'preparation_time' => 'required|integer|min:1',
            'vegetarian' => 'required|boolean',
            'ingredients' => 'nullable|string',
            'allergens' => 'nullable|string',
            'spice_level' => 'required|integer|min:0|max:3',
            'available' => 'boolean',
            'featured' => 'boolean',
            'popular' => 'boolean',
            'display_order' => 'nullable|integer',
            'customization_group_ids' => 'nullable|array',
            'customization_group_ids.*' => 'exists:customization_groups,id',
        ]);

        $validated['slug'] = Str::slug($validated['name']).'-'.rand(100, 999);

        $menuItem = MenuItem::create($validated);

        if (! empty($validated['customization_group_ids'])) {
            $menuItem->customizationGroups()->sync($validated['customization_group_ids']);
        }

        AuditLog::record(Auth::user(), 'created', 'menu_item', (string) $menuItem->id, "Created dish: {$menuItem->name} (₹{$menuItem->price})");

        return response()->json([
            'success' => true,
            'message' => 'Menu item created successfully.',
            'menu_item' => $menuItem->load(['category', 'customizationGroups.options']),
        ]);
    }

    public function updateMenuItem(Request $request, $id)
    {
        $menuItem = MenuItem::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'discounted_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'preparation_time' => 'sometimes|required|integer|min:1',
            'vegetarian' => 'sometimes|required|boolean',
            'ingredients' => 'nullable|string',
            'allergens' => 'nullable|string',
            'spice_level' => 'sometimes|required|integer|min:0|max:3',
            'available' => 'boolean',
            'featured' => 'boolean',
            'popular' => 'boolean',
            'display_order' => 'nullable|integer',
            'customization_group_ids' => 'nullable|array',
            'customization_group_ids.*' => 'exists:customization_groups,id',
        ]);

        $menuItem->update($validated);

        if (isset($validated['customization_group_ids'])) {
            $menuItem->customizationGroups()->sync($validated['customization_group_ids']);
        }

        AuditLog::record(Auth::user(), 'updated', 'menu_item', (string) $menuItem->id, "Updated dish: {$menuItem->name}");

        return response()->json([
            'success' => true,
            'message' => 'Menu item updated successfully.',
            'menu_item' => $menuItem->load(['category', 'customizationGroups.options']),
        ]);
    }

    public function deleteMenuItem(Request $request, $id)
    {
        $menuItem = MenuItem::findOrFail($id);
        $name = $menuItem->name;
        $menuItem->delete();

        AuditLog::record(Auth::user(), 'deleted', 'menu_item', (string) $id, "Deleted dish: {$name}");

        return response()->json([
            'success' => true,
            'message' => "Menu item '{$name}' deleted successfully.",
        ]);
    }

    /**
     * Categories CRUD
     */
    public function categories()
    {
        $categories = Category::withCount('menuItems')->orderBy('display_order')->get();

        return response()->json(['success' => true, 'categories' => $categories]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'display_order' => 'nullable|integer',
            'active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']).'-'.rand(10, 99);
        $category = Category::create($validated);

        AuditLog::record(Auth::user(), 'created', 'category', (string) $category->id, "Created category: {$category->name}");

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'category' => $category,
        ]);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'display_order' => 'nullable|integer',
            'active' => 'boolean',
        ]);

        $category->update($validated);

        AuditLog::record(Auth::user(), 'updated', 'category', (string) $category->id, "Updated category: {$category->name}");

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'category' => $category,
        ]);
    }

    public function deleteCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $name = $category->name;
        $category->delete();

        AuditLog::record(Auth::user(), 'deleted', 'category', (string) $id, "Deleted category: {$name}");

        return response()->json(['success' => true, 'message' => "Category '{$name}' deleted."]);
    }

    /**
     * Customization Groups & Options CRUD
     */
    public function customizationGroups()
    {
        $groups = CustomizationGroup::with('options')->get();

        return response()->json(['success' => true, 'groups' => $groups]);
    }

    public function storeCustomizationGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'required' => 'boolean',
            'min_selection' => 'integer|min:0',
            'max_selection' => 'integer|min:1',
            'options' => 'required|array|min:1',
            'options.*.name' => 'required|string|max:255',
            'options.*.additional_price' => 'required|numeric|min:0',
        ]);

        $group = CustomizationGroup::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'required' => $validated['required'] ?? false,
            'min_selection' => $validated['min_selection'] ?? 0,
            'max_selection' => $validated['max_selection'] ?? 1,
        ]);

        $order = 1;
        foreach ($validated['options'] as $opt) {
            $group->options()->create([
                'name' => $opt['name'],
                'additional_price' => $opt['additional_price'],
                'available' => true,
                'display_order' => $order++,
            ]);
        }

        AuditLog::record(Auth::user(), 'created', 'customization_group', (string) $group->id, "Created group: {$group->name}");

        return response()->json([
            'success' => true,
            'message' => 'Customization group created.',
            'group' => $group->load('options'),
        ]);
    }

    public function updateCustomizationGroup(Request $request, $id)
    {
        $group = CustomizationGroup::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'required' => 'boolean',
            'min_selection' => 'integer|min:0',
            'max_selection' => 'integer|min:1',
            'options' => 'nullable|array',
            'options.*.id' => 'nullable|integer',
            'options.*.name' => 'required|string|max:255',
            'options.*.additional_price' => 'required|numeric|min:0',
            'options.*.available' => 'nullable|boolean',
        ]);

        $group->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'required' => $validated['required'] ?? false,
            'min_selection' => $validated['min_selection'] ?? 0,
            'max_selection' => $validated['max_selection'] ?? 1,
        ]);

        if (isset($validated['options'])) {
            // Replace options
            $group->options()->delete();
            $order = 1;
            foreach ($validated['options'] as $opt) {
                $group->options()->create([
                    'name' => $opt['name'],
                    'additional_price' => $opt['additional_price'],
                    'available' => $opt['available'] ?? true,
                    'display_order' => $order++,
                ]);
            }
        }

        AuditLog::record(Auth::user(), 'updated', 'customization_group', (string) $group->id, "Updated group: {$group->name}");

        return response()->json([
            'success' => true,
            'message' => 'Customization group updated.',
            'group' => $group->load('options'),
        ]);
    }

    public function deleteCustomizationGroup(Request $request, $id)
    {
        $group = CustomizationGroup::findOrFail($id);
        $group->delete();

        return response()->json(['success' => true, 'message' => 'Customization group deleted.']);
    }

    /**
     * Coupons CRUD
     */
    public function coupons()
    {
        $coupons = Coupon::latest()->get();

        return response()->json(['success' => true, 'coupons' => $coupons]);
    }

    public function storeCoupon(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code|max:50',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:1',
            'minimum_order' => 'required|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:1',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'active' => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $coupon = Coupon::create($validated);

        AuditLog::record(Auth::user(), 'created', 'coupon', (string) $coupon->id, "Created coupon: {$coupon->code}");

        return response()->json(['success' => true, 'message' => 'Coupon created.', 'coupon' => $coupon]);
    }

    public function updateCoupon(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);
        $validated = $request->validate([
            'code' => "required|string|max:50|unique:coupons,code,{$id}",
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:1',
            'minimum_order' => 'required|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:1',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
            'active' => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $coupon->update($validated);

        AuditLog::record(Auth::user(), 'updated', 'coupon', (string) $coupon->id, "Updated coupon: {$coupon->code}");

        return response()->json(['success' => true, 'message' => 'Coupon updated.', 'coupon' => $coupon]);
    }

    public function deleteCoupon(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json(['success' => true, 'message' => 'Coupon deleted.']);
    }

    /**
     * Customer Management
     */
    public function customers(Request $request)
    {
        // Show all users so admin can manage roles (upgrade/downgrade)
        $customers = User::withCount('orders')
            ->withSum(['orders' => function ($q) {
                $q->where('payment_status', 'paid');
            }], 'final_total')
            ->latest()
            ->paginate(50);

        return response()->json([
            'success' => true,
            'customers' => $customers,
        ]);
    }

    public function updateUserRole(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => 'required|in:customer,kitchen_staff,admin',
        ]);

        // Prevent self-demotion
        if ($user->id === Auth::id() && $validated['role'] !== 'admin') {
            return response()->json(['success' => false, 'message' => 'You cannot demote yourself.'], 403);
        }

        $oldRole = $user->role;
        $user->role = $validated['role'];
        $user->save();

        AuditLog::record(Auth::user(), 'updated', 'user', (string) $user->id, "Changed user {$user->email} role from {$oldRole} to {$validated['role']}");

        return response()->json([
            'success' => true,
            'message' => "User role updated to {$validated['role']}.",
        ]);
    }

    /**
     * Analytics
     */
    public function analytics()
    {
        // 1. Sales over the last 14 days
        $days = [];
        $salesTrend = [];
        $ordersTrend = [];

        for ($i = 13; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i)->format('Y-m-d');
            $days[] = Carbon::today()->subDays($i)->format('M d');

            $dailyOrders = Order::whereDate('arrival_date', $d)->get();
            $salesTrend[] = round($dailyOrders->where('payment_status', 'paid')->sum('final_total'), 2);
            $ordersTrend[] = $dailyOrders->count();
        }

        // 2. Average Order Value
        $paidOrders = Order::where('payment_status', 'paid')->get();
        $aov = $paidOrders->count() > 0 ? round($paidOrders->sum('final_total') / $paidOrders->count(), 2) : 0;

        // 3. Status breakdown
        $statusBreakdown = Order::select('order_status', DB::raw('count(*) as count'))
            ->groupBy('order_status')
            ->get();

        // 4. Dining Option breakdown
        $diningBreakdown = Order::select('dining_option', DB::raw('count(*) as count'))
            ->groupBy('dining_option')
            ->get();

        // 5. Customer retention: new vs returning
        $customersWithOrders = User::where('role', 'customer')
            ->withCount('orders')
            ->get();
        $singleOrderCustomers = $customersWithOrders->where('orders_count', 1)->count();
        $repeatCustomers = $customersWithOrders->where('orders_count', '>', 1)->count();

        return response()->json([
            'success' => true,
            'charts' => [
                'labels' => $days,
                'sales_trend' => $salesTrend,
                'orders_trend' => $ordersTrend,
            ],
            'average_order_value' => $aov,
            'status_breakdown' => $statusBreakdown,
            'dining_breakdown' => $diningBreakdown,
            'retention' => [
                'first_time' => $singleOrderCustomers,
                'repeat' => $repeatCustomers,
            ],
        ]);
    }

    /**
     * Audit Logs
     */
    public function auditLogs(Request $request)
    {
        $logs = AuditLog::with('user')->latest()->paginate(30);

        return response()->json(['success' => true, 'logs' => $logs]);
    }

    /**
     * Restaurant Settings
     */
    public function settings()
    {
        $restaurant = Restaurant::first();
        $hours = RestaurantHour::orderBy('day_number')->get();
        $timeSlots = TimeSlot::orderBy('start_time')->get();

        return response()->json([
            'success' => true,
            'restaurant' => $restaurant,
            'hours' => $hours,
            'time_slots' => $timeSlots,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $restaurant = Restaurant::firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'logo' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'description' => 'nullable|string',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'required|email|max:100',
            'google_maps_url' => 'nullable|string',
            'google_maps_embed' => 'nullable|string',
            'min_advance_minutes' => 'required|integer|min:5|max:1440',
            'max_advance_days' => 'required|integer|min:1|max:60',
            'tax_percentage' => 'required|numeric|min:0|max:50',
            'service_charge_percentage' => 'required|numeric|min:0|max:50',
            'packaging_charge' => 'required|numeric|min:0|max:500',
            'online_payment_enabled' => 'boolean',
            'pay_at_restaurant_enabled' => 'boolean',
            'is_closed_override' => 'boolean',
            'closed_reason' => 'nullable|string|max:255',
            'cancellation_policy' => 'nullable|string',
            'refund_policy' => 'nullable|string',
            'privacy_policy' => 'nullable|string',
            'terms_policy' => 'nullable|string',
            'social_links' => 'nullable|array',
            'hours' => 'nullable|array',
            'hours.*.id' => 'required|exists:restaurant_hours,id',
            'hours.*.opening_time' => 'required|string',
            'hours.*.closing_time' => 'required|string',
            'hours.*.is_closed' => 'required|boolean',
            'time_slots' => 'nullable|array',
            'time_slots.*.id' => 'required|exists:time_slots,id',
            'time_slots.*.maximum_orders' => 'required|integer|min:1',
            'time_slots.*.active' => 'required|boolean',
        ]);

        $restaurant->update($validated);

        if (! empty($validated['hours'])) {
            foreach ($validated['hours'] as $h) {
                RestaurantHour::where('id', $h['id'])->update([
                    'opening_time' => $h['opening_time'],
                    'closing_time' => $h['closing_time'],
                    'is_closed' => $h['is_closed'],
                ]);
            }
        }

        if (! empty($validated['time_slots'])) {
            foreach ($validated['time_slots'] as $ts) {
                TimeSlot::where('id', $ts['id'])->update([
                    'maximum_orders' => $ts['maximum_orders'],
                    'active' => $ts['active'],
                ]);
            }
        }

        AuditLog::record(Auth::user(), 'settings_updated', 'restaurant_settings', (string) $restaurant->id, 'Updated restaurant settings and policies.');

        return response()->json([
            'success' => true,
            'message' => 'Restaurant settings updated successfully.',
            'restaurant' => $restaurant,
        ]);
    }
}
