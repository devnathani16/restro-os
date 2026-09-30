<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\TimeSlot;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantPreorderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_customer_portal_home_page_loads_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertSee('Spice &amp; Hearth Bistro', false);
    }

    public function test_public_restaurant_data_endpoint_returns_catalog(): void
    {
        $response = $this->getJson('/api/restaurant/data');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'restaurant',
                'categories',
                'hours',
                'time_slots',
                'featured_items',
                'reviews',
            ]);
    }

    public function test_slot_availability_check_works(): void
    {
        $slot = TimeSlot::first();

        $response = $this->postJson('/api/restaurant/check-slot', [
            'date' => date('Y-m-d', strtotime('+1 day')),
            'time_slot_id' => $slot->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'available',
                'remaining_capacity',
                'max_capacity',
            ]);
    }

    public function test_coupon_validation_calculates_correct_discount(): void
    {
        $response = $this->postJson('/api/restaurant/validate-coupon', [
            'code' => 'WELCOME20',
            'subtotal' => 600,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'calculated_discount' => 120, // 20% of 600
            ]);
    }

    public function test_order_calculation_dry_run(): void
    {
        $item = MenuItem::where('available', true)->first();

        $response = $this->postJson('/api/orders/calculate', [
            'items' => [
                [
                    'menu_item_id' => $item->id,
                    'quantity' => 2,
                    'customizations' => [],
                ]
            ],
            'coupon_code' => 'WELCOME20',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'subtotal',
                'discount',
                'tax',
                'packaging_charge',
                'service_charge',
                'final_total',
                'items',
            ]);
    }

    public function test_customer_can_place_order_and_track(): void
    {
        $customer = User::where('role', 'customer')->first();
        $item = MenuItem::where('available', true)->first();
        $slot = TimeSlot::first();
        $arrivalDate = date('Y-m-d', strtotime('+1 day'));

        $orderPayload = [
            'customer_name' => 'Aditi Sharma',
            'customer_email' => 'aditi@example.com',
            'customer_phone' => '+91 98765 43210',
            'arrival_date' => $arrivalDate,
            'time_slot_id' => $slot->id,
            'dining_option' => 'dine_in',
            'payment_method' => 'pay_at_restaurant',
            'customer_notes' => 'Please keep it mild spice',
            'items' => [
                [
                    'menu_item_id' => $item->id,
                    'quantity' => 2,
                    'customizations' => [],
                ]
            ]
        ];

        $response = $this->actingAs($customer)->postJson('/api/orders', $orderPayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $orderNumber = $response->json('order.order_number');
        $this->assertNotEmpty($orderNumber);

        // Verify order tracking
        $trackResponse = $this->getJson("/api/orders/{$orderNumber}/track");
        $trackResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order' => [
                    'order_number' => $orderNumber,
                    'order_status' => 'pending',
                ]
            ]);
    }

    public function test_kitchen_workflow_and_prep_status_updates(): void
    {
        $kitchenStaff = User::where('role', 'kitchen_staff')->first();
        $order = Order::where('order_status', 'confirmed')->first();

        $this->assertNotNull($order);

        // Kitchen staff fetches active orders
        $activeResponse = $this->actingAs($kitchenStaff)->getJson('/api/kitchen/active-orders');
        $activeResponse->assertStatus(200);

        // Start preparing
        $prepResponse = $this->actingAs($kitchenStaff)->postJson("/api/kitchen/orders/{$order->id}/prepare");
        $prepResponse->assertStatus(200);

        $order->refresh();
        $this->assertEquals('preparing', $order->order_status);

        // Customer cannot cancel an order once kitchen starts prep
        $customer = User::find($order->customer_id) ?? User::where('role', 'customer')->first();
        $order->customer_id = $customer->id;
        $order->save();

        $cancelResponse = $this->actingAs($customer)->postJson("/api/orders/{$order->order_number}/cancel", [
            'reason' => 'Changed my mind',
        ]);
        $cancelResponse->assertStatus(422);

        // Kitchen marks ready
        $readyResponse = $this->actingAs($kitchenStaff)->postJson("/api/kitchen/orders/{$order->id}/ready");
        $readyResponse->assertStatus(200);

        $order->refresh();
        $this->assertEquals('ready', $order->order_status);
    }

    public function test_admin_route_security_rejects_unauthorized_users(): void
    {
        $customer = User::where('role', 'customer')->first();

        // Customer trying to access admin dashboard should be forbidden (403)
        $response = $this->actingAs($customer)->getJson('/api/admin/dashboard');
        $response->assertStatus(403);

        // Admin can access admin dashboard
        $admin = User::where('role', 'admin')->first();
        $adminResponse = $this->actingAs($admin)->getJson('/api/admin/dashboard');
        $adminResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'metrics' => [
                    'today_orders_count',
                    'today_revenue',
                    'pending_count',
                    'preparing_count',
                    'ready_count',
                    'completed_count',
                    'upcoming_count',
                    'total_customers',
                ],
                'popular_dishes',
                'orders_by_time_slot',
                'recent_orders',
            ]);
    }
}
