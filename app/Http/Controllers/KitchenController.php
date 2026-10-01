<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KitchenController extends Controller
{
    /**
     * Get active kitchen orders grouped by arrival time slot.
     */
    public function activeOrders(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        $targetDate = $request->query('date', $today);

        // Fetch orders scheduled for this date that require kitchen attention
        $orders = Order::with(['items.menuItem', 'timeSlot'])
            ->whereDate('arrival_date', $targetDate)
            ->whereIn('order_status', ['confirmed', 'preparing', 'ready'])
            ->orderBy('arrival_time')
            ->orderBy('created_at')
            ->get();

        // Group by arrival time
        $grouped = [];
        foreach ($orders as $order) {
            $slotKey = $order->arrival_time;
            if (!isset($grouped[$slotKey])) {
                $grouped[$slotKey] = [
                    'arrival_time' => $slotKey,
                    'orders' => [],
                    'total_items_count' => 0,
                ];
            }
            $itemCount = $order->items->sum('quantity');
            $grouped[$slotKey]['total_items_count'] += $itemCount;
            $grouped[$slotKey]['orders'][] = $order;
        }

        return response()->json([
            'success' => true,
            'date' => $targetDate,
            'active_count' => $orders->count(),
            'grouped_slots' => array_values($grouped),
            'raw_orders' => $orders,
            'restaurant' => \App\Models\Restaurant::first(),
        ]);
    }

    /**
     * Start preparing order
     */
    public function startPreparing(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        $user = Auth::user();

        if (in_array($order->order_status, ['cancelled', 'refunded', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => "Cannot prepare order in '{$order->order_status}' status.",
            ], 422);
        }

        $order->order_status = 'preparing';
        $order->preparation_started_at = now();
        $order->save();

        if ($order->customer_id) {
            Notification::create([
                'user_id' => $order->customer_id,
                'order_id' => $order->id,
                'role' => 'customer',
                'type' => 'order_preparing',
                'title' => 'Chef Started Cooking!',
                'message' => "Our culinary team has fired up the ovens and is preparing your meal for your {$order->arrival_time} arrival.",
            ]);
        }

        AuditLog::record($user, 'status_changed', 'order', (string) $order->id, "Kitchen started preparing order {$order->order_number}");

        try { \Illuminate\Support\Facades\Redis::publish('kds.orders', json_encode(['event' => 'StatusUpdate', 'order_id' => $order->id, 'status' => 'preparing'])); } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} marked as PREPARING.",
            'order' => $order->load(['items', 'timeSlot']),
        ]);
    }

    /**
     * Mark order as Ready
     */
    public function markReady(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        $user = Auth::user();

        $order->order_status = 'ready';
        $order->ready_at = now();
        $order->save();

        if ($order->customer_id) {
            Notification::create([
                'user_id' => $order->customer_id,
                'order_id' => $order->id,
                'role' => 'customer',
                'type' => 'order_ready',
                'title' => 'Your Food is Piping Hot & Ready!',
                'message' => "Order {$order->order_number} is freshly plated and waiting for you at Spice & Hearth Bistro.",
            ]);
        }

        AuditLog::record($user, 'status_changed', 'order', (string) $order->id, "Kitchen marked order {$order->order_number} as READY");

        try { \Illuminate\Support\Facades\Redis::publish('kds.orders', json_encode(['event' => 'StatusUpdate', 'order_id' => $order->id, 'status' => 'ready'])); } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} marked as READY for customer arrival.",
            'order' => $order->load(['items', 'timeSlot']),
        ]);
    }

    /**
     * Mark order completed (Customer arrived, ate/picked up, left)
     */
    public function markCompleted(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        $user = Auth::user();

        $order->order_status = 'completed';
        $order->completed_at = now();
        // If payment was pay_at_restaurant, marking completed usually means customer paid at counter
        if ($order->payment_method === 'pay_at_restaurant') {
            $order->payment_status = 'paid';
        }
        $order->save();

        if ($order->customer_id) {
            Notification::create([
                'user_id' => $order->customer_id,
                'order_id' => $order->id,
                'role' => 'customer',
                'type' => 'order_completed',
                'title' => 'Thank you for dining with us!',
                'message' => "Order {$order->order_number} has been completed. We hope you loved your meal!",
            ]);
        }

        AuditLog::record($user, 'status_changed', 'order', (string) $order->id, "Order {$order->order_number} marked as COMPLETED");

        try { \Illuminate\Support\Facades\Redis::publish('kds.orders', json_encode(['event' => 'StatusUpdate', 'order_id' => $order->id, 'status' => 'completed'])); } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => "Order {$order->order_number} marked as COMPLETED.",
            'order' => $order->load(['items', 'timeSlot']),
        ]);
    }
}
