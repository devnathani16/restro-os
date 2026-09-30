<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Restaurant Settings & Info
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Spice & Hearth Bistro');
            $table->string('tagline')->default('Authentic Flavors, Prepared Before You Arrive');
            $table->string('logo')->nullable();
            $table->string('cover_image')->nullable();
            $table->text('description')->nullable();
            $table->string('address')->default('452 Indiranagar 100ft Road, Bangalore, Karnataka 560038');
            $table->string('phone')->default('+91 98765 43210');
            $table->string('email')->default('concierge@spiceandhearth.com');
            $table->text('google_maps_url')->nullable();
            $table->text('google_maps_embed')->nullable();
            $table->integer('min_advance_minutes')->default(30); // minimum lead time for pre-order
            $table->integer('max_advance_days')->default(7); // how far ahead customer can book
            $table->decimal('tax_percentage', 5, 2)->default(5.00); // 5% GST
            $table->decimal('service_charge_percentage', 5, 2)->default(2.50);
            $table->decimal('packaging_charge', 8, 2)->default(15.00);
            $table->boolean('online_payment_enabled')->default(true);
            $table->boolean('pay_at_restaurant_enabled')->default(true);
            $table->boolean('is_closed_override')->default(false); // emergency closed switch
            $table->string('closed_reason')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->text('refund_policy')->nullable();
            $table->text('privacy_policy')->nullable();
            $table->text('terms_policy')->nullable();
            $table->json('social_links')->nullable();
            $table->timestamps();
        });

        // 2. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // 3. Menu Items
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('discounted_price', 10, 2)->nullable();
            $table->string('image')->nullable();
            $table->integer('preparation_time')->default(20); // in minutes
            $table->boolean('vegetarian')->default(true); // true = veg, false = non-veg
            $table->text('ingredients')->nullable();
            $table->string('allergens')->nullable();
            $table->integer('spice_level')->default(1); // 0 = none, 1 = mild, 2 = medium, 3 = hot
            $table->boolean('available')->default(true);
            $table->boolean('featured')->default(false);
            $table->boolean('popular')->default(false);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // 4. Customization Groups
        Schema::create('customization_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Size", "Crust", "Extra Cheese", "Spice Level"
            $table->string('description')->nullable();
            $table->boolean('required')->default(false);
            $table->integer('min_selection')->default(0);
            $table->integer('max_selection')->default(1);
            $table->timestamps();
        });

        // 5. Customization Options
        Schema::create('customization_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('customization_groups')->cascadeOnDelete();
            $table->string('name'); // e.g. "Large", "Thin Crust", "Extra Mozzarella"
            $table->decimal('additional_price', 8, 2)->default(0.00);
            $table->boolean('available')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // 6. Pivot: Menu Items to Customization Groups
        Schema::create('menu_item_customization_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->foreignId('customization_group_id')->constrained('customization_groups')->cascadeOnDelete();
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // 7. Operating Hours
        Schema::create('restaurant_hours', function (Blueprint $table) {
            $table->id();
            $table->string('day'); // Monday, Tuesday, etc.
            $table->integer('day_number'); // 0 = Sunday, 1 = Monday, etc.
            $table->time('opening_time')->default('11:00');
            $table->time('closing_time')->default('23:00');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
        });

        // 8. Time Slots
        Schema::create('time_slots', function (Blueprint $table) {
            $table->id();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('maximum_orders')->default(10);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // 9. Coupons & Discounts
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('discount_type')->default('percentage'); // percentage or fixed
            $table->decimal('discount_value', 8, 2);
            $table->decimal('minimum_order', 8, 2)->default(0.00);
            $table->decimal('maximum_discount', 8, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('times_used')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // 10. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->date('arrival_date');
            $table->string('arrival_time'); // "19:30"
            $table->foreignId('time_slot_id')->nullable()->constrained('time_slots')->nullOnDelete();
            $table->string('dining_option')->default('dine_in'); // dine_in, takeaway
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0.00);
            $table->string('coupon_code')->nullable();
            $table->decimal('tax', 10, 2)->default(0.00);
            $table->decimal('service_charge', 10, 2)->default(0.00);
            $table->decimal('packaging_charge', 10, 2)->default(0.00);
            $table->decimal('final_total', 10, 2);
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, refunded, failed
            $table->string('payment_method')->default('online'); // online, pay_at_restaurant
            $table->string('order_status')->default('pending'); 
            // pending, confirmed, preparing, ready, customer_arrived, completed, cancelled, refunded
            $table->text('customer_notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('preparation_started_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 11. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_name');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->json('customization_data')->nullable(); // selected group + options + add prices
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 12. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('payment_provider')->default('razorpay_mock'); // razorpay, online, counter_pay
            $table->string('transaction_id')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('INR');
            $table->string('status')->default('successful'); // pending, successful, failed, refunded
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });

        // 13. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('role')->default('customer'); // customer, admin, kitchen_staff
            $table->string('type'); // order_placed, order_confirmed, order_preparing, order_ready, order_completed, order_cancelled, payment_received
            $table->string('title');
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        // 14. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('action'); // created, updated, deleted, status_changed, settings_updated, login
            $table->string('entity_type'); // menu_item, category, order, coupon, restaurant_settings, user
            $table->string('entity_id')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        // 15. Reviews / Testimonials
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->integer('rating')->default(5);
            $table->text('comment');
            $table->string('dish_name')->nullable();
            $table->boolean('is_featured')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('time_slots');
        Schema::dropIfExists('restaurant_hours');
        Schema::dropIfExists('menu_item_customization_group');
        Schema::dropIfExists('customization_options');
        Schema::dropIfExists('customization_groups');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('restaurants');
    }
};
