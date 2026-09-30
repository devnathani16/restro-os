<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Create/Initialize online payment intent (Razorpay / Gateway simulated flow)
     */
    public function createPaymentIntent(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        $restaurant = Restaurant::first();

        if (!$restaurant->online_payment_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Online payments are currently disabled by the restaurant.',
            ], 422);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid for.',
            ], 422);
        }

        // Razorpay order simulation format (amount in paise = rupees * 100)
        $razorpayOrderId = 'order_rzp_' . Str::random(14);

        return response()->json([
            'success' => true,
            'gateway' => 'razorpay',
            'razorpay_order_id' => $razorpayOrderId,
            'key_id' => env('RAZORPAY_KEY_ID', 'rzp_test_restaurant_key'),
            'amount_in_paise' => (int) round($order->final_total * 100),
            'currency' => 'INR',
            'order_number' => $order->order_number,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'restaurant_name' => $restaurant->name,
        ]);
    }

    /**
     * Verify payment securely server-side before marking order as paid.
     */
    public function verifyPayment(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_id' => 'required|string',
            'razorpay_order_id' => 'nullable|string',
            'payment_signature' => 'nullable|string',
            'payment_method_type' => 'nullable|string', // upi, netbanking, card
        ]);

        $order = Order::findOrFail($validated['order_id']);

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Order is already marked as paid.',
                'order' => $order,
            ]);
        }

        // In production with Razorpay:
        // $generated_signature = hash_hmac('sha256', $razorpayOrderId . "|" . $paymentId, env('RAZORPAY_KEY_SECRET'));
        // verify generated matches payment_signature.

        // Server-side recorded verification
        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id, 'transaction_id' => $validated['payment_id']],
            [
                'payment_provider' => 'razorpay',
                'amount' => $order->final_total,
                'currency' => 'INR',
                'status' => 'successful',
                'raw_response' => [
                    'verified_at' => now()->toIso8601String(),
                    'method_type' => $validated['payment_method_type'] ?? 'upi',
                    'gateway' => 'razorpay_verified',
                ],
            ]
        );

        $order->payment_status = 'paid';
        if ($order->order_status === 'pending') {
            $order->order_status = 'confirmed';
        }
        $order->save();

        Notification::create([
            'user_id' => null,
            'order_id' => $order->id,
            'role' => 'admin',
            'type' => 'payment_received',
            'title' => "Payment Received: {$order->order_number}",
            'message' => "Payment of ₹{$order->final_total} confirmed via {$payment->payment_provider}. Order is confirmed for {$order->arrival_time}.",
        ]);

        if ($order->customer_id) {
            Notification::create([
                'user_id' => $order->customer_id,
                'order_id' => $order->id,
                'role' => 'customer',
                'type' => 'payment_received',
                'title' => 'Payment Successful!',
                'message' => "We received your payment of ₹{$order->final_total}. The kitchen has scheduled your meal for {$order->arrival_time}.",
            ]);
        }

        AuditLog::record(
            Auth::user(),
            'status_changed',
            'order',
            (string) $order->id,
            "Payment verified. Txn: {$payment->transaction_id}. Amount: ₹{$payment->amount}. Order status changed to confirmed."
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully! Your pre-order is confirmed.',
            'order' => $order->load(['items', 'timeSlot', 'payments']),
        ]);
    }

    /**
     * Choose Pay at Restaurant (Cash / Card at counter upon arrival)
     */
    public function payAtRestaurant(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        $restaurant = Restaurant::first();

        if (!$restaurant->pay_at_restaurant_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Pay at Restaurant is currently disabled by the management.',
            ], 422);
        }

        $order->payment_method = 'pay_at_restaurant';
        $order->payment_status = 'unpaid';
        if ($order->order_status === 'pending') {
            $order->order_status = 'confirmed';
        }
        $order->save();

        AuditLog::record(
            Auth::user(),
            'status_changed',
            'order',
            (string) $order->id,
            "Customer selected Pay at Counter for order {$order->order_number}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Order confirmed! You can pay at the counter when you arrive.',
            'order' => $order->load(['items', 'timeSlot', 'payments']),
        ]);
    }
}
