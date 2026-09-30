<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CustomizationGroup;
use App\Models\CustomizationOption;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use App\Models\Review;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Restaurant Information & Configuration
        $restaurant = Restaurant::create([
            'name' => 'Spice & Hearth Bistro',
            'tagline' => 'Fresh Gourmet Feasts, Pre-Cooked to Perfection for Your Exact Arrival',
            'logo' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
            'cover_image' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
            'description' => 'Welcome to Spice & Hearth Bistro — the pioneering dine-in & takeaway pre-ordering destination. Skip waiting for food preparation: select your arrival slot, customize your favorite clay oven delicacies, aromatic biryanis and woodfired specialties, and arrive to a piping hot table waiting exclusively for you.',
            'address' => '452 Indiranagar 100ft Road, Defence Colony, Bengaluru, Karnataka 560038',
            'phone' => '+91 98765 43210',
            'email' => 'concierge@spiceandhearth.com',
            'google_maps_url' => 'https://maps.google.com/?q=Indiranagar+Bangalore',
            'google_maps_embed' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.985472851221!2d77.6406987!3d12.9727508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae16a7eb2b851b%3A0x6b6459d8c8230538!2sIndiranagar%2C%20Bengaluru!5e0!3m2!1sen!2sin!4v1700000000000',
            'min_advance_minutes' => 30,
            'max_advance_days' => 7,
            'tax_percentage' => 5.00,
            'service_charge_percentage' => 2.50,
            'packaging_charge' => 15.00,
            'online_payment_enabled' => true,
            'pay_at_restaurant_enabled' => true,
            'is_closed_override' => false,
            'closed_reason' => null,
            'cancellation_policy' => 'Orders can be freely cancelled up to 45 minutes before the selected arrival time slot. Once our kitchen initiates preparation, orders become non-refundable to prevent kitchen food waste.',
            'refund_policy' => 'Online payment refunds are automatically credited back to your original payment method within 3-5 business days upon approved cancellation.',
            'privacy_policy' => 'Spice & Hearth Bistro respects your privacy. We securely protect your customer profile, contact details, and dietary preferences, and never share them with third parties.',
            'terms_policy' => 'By pre-ordering through our platform, you confirm your planned arrival window. Reserved tables are held for 25 minutes past your chosen arrival slot.',
            'social_links' => [
                'instagram' => 'https://instagram.com/spiceandhearth',
                'facebook' => 'https://facebook.com/spiceandhearth',
                'twitter' => 'https://twitter.com/spiceandhearth',
            ],
        ]);

        // 2. Users (Admin, Kitchen Staff, Demo Customers)
        $admin = User::create([
            'name' => 'Chef Vikram Anand (Admin)',
            'email' => 'admin@spiceandhearth.com',
            'password' => Hash::make('password123'),
            'phone' => '+91 98765 00001',
            'role' => 'admin',
            'preferences' => ['notifications_email' => true, 'kitchen_audio_alerts' => true],
        ]);

        $kitchen = User::create([
            'name' => 'Rajesh Kumar (Kitchen Lead)',
            'email' => 'kitchen@spiceandhearth.com',
            'password' => Hash::make('password123'),
            'phone' => '+91 98765 00002',
            'role' => 'kitchen_staff',
            'preferences' => ['kitchen_audio_alerts' => true, 'display_density' => 'comfortable'],
        ]);

        $customer1 = User::create([
            'name' => 'Priya Sharma',
            'email' => 'priya@example.com',
            'password' => Hash::make('password123'),
            'phone' => '+91 98111 22233',
            'role' => 'customer',
            'preferences' => ['spice_preference' => 'medium', 'favorite_seating' => 'outdoor'],
        ]);

        $customer2 = User::create([
            'name' => 'Arjun Patel',
            'email' => 'arjun@example.com',
            'password' => Hash::make('password123'),
            'phone' => '+91 98222 33344',
            'role' => 'customer',
            'preferences' => ['dietary' => 'vegetarian', 'allergens' => ['peanuts']],
        ]);

        // 3. Operating Hours (Monday - Sunday, 11:00 AM - 11:00 PM)
        $days = [
            ['day' => 'Monday', 'day_number' => 1, 'opening' => '11:00', 'closing' => '23:00'],
            ['day' => 'Tuesday', 'day_number' => 2, 'opening' => '11:00', 'closing' => '23:00'],
            ['day' => 'Wednesday', 'day_number' => 3, 'opening' => '11:00', 'closing' => '23:00'],
            ['day' => 'Thursday', 'day_number' => 4, 'opening' => '11:00', 'closing' => '23:00'],
            ['day' => 'Friday', 'day_number' => 5, 'opening' => '11:00', 'closing' => '23:30'],
            ['day' => 'Saturday', 'day_number' => 6, 'opening' => '11:00', 'closing' => '23:30'],
            ['day' => 'Sunday', 'day_number' => 0, 'opening' => '11:00', 'closing' => '23:00'],
        ];

        foreach ($days as $d) {
            RestaurantHour::create([
                'day' => $d['day'],
                'day_number' => $d['day_number'],
                'opening_time' => $d['opening'],
                'closing_time' => $d['closing'],
                'is_closed' => false,
            ]);
        }

        // 4. Pre-ordering Time Slots (Every 30 minutes from 11:30 to 22:30)
        $slotTimes = [
            ['11:30', '12:00'], ['12:00', '12:30'], ['12:30', '13:00'],
            ['13:00', '13:30'], ['13:30', '14:00'], ['14:00', '14:30'],
            ['14:30', '15:00'], ['17:30', '18:00'], ['18:00', '18:30'],
            ['18:30', '19:00'], ['19:00', '19:30'], ['19:30', '20:00'],
            ['20:00', '20:30'], ['20:30', '21:00'], ['21:00', '21:30'],
            ['21:30', '22:00'], ['22:00', '22:30'],
        ];

        $createdSlots = [];
        foreach ($slotTimes as $st) {
            $createdSlots[] = TimeSlot::create([
                'start_time' => $st[0],
                'end_time' => $st[1],
                'maximum_orders' => 8,
                'active' => true,
            ]);
        }

        // 5. Customization Groups & Options
        $portionGroup = CustomizationGroup::create([
            'name' => 'Portion Size',
            'description' => 'Choose your preferred serving portion',
            'required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
        ]);
        CustomizationOption::create(['group_id' => $portionGroup->id, 'name' => 'Regular (Serves 1-2)', 'additional_price' => 0.00, 'display_order' => 1]);
        CustomizationOption::create(['group_id' => $portionGroup->id, 'name' => 'Large Feast (Serves 2-3)', 'additional_price' => 120.00, 'display_order' => 2]);

        $crustGroup = CustomizationGroup::create([
            'name' => 'Artisanal Base / Crust',
            'description' => 'Handcrafted slow-fermented crust selection',
            'required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
        ]);
        CustomizationOption::create(['group_id' => $crustGroup->id, 'name' => 'Classic Sourdough', 'additional_price' => 0.00, 'display_order' => 1]);
        CustomizationOption::create(['group_id' => $crustGroup->id, 'name' => 'Garlic Butter Stuffed Crust', 'additional_price' => 85.00, 'display_order' => 2]);
        CustomizationOption::create(['group_id' => $crustGroup->id, 'name' => 'Smoked Cheddar Infused', 'additional_price' => 110.00, 'display_order' => 3]);

        $addonsGroup = CustomizationGroup::create([
            'name' => 'Chef Extra Add-ons',
            'description' => 'Gourmet enhancements for your dish',
            'required' => false,
            'min_selection' => 0,
            'max_selection' => 4,
        ]);
        CustomizationOption::create(['group_id' => $addonsGroup->id, 'name' => 'Aged Parmesan & Truffle Oil', 'additional_price' => 95.00, 'display_order' => 1]);
        CustomizationOption::create(['group_id' => $addonsGroup->id, 'name' => 'Fresh Buff Mozzarella (100g)', 'additional_price' => 120.00, 'display_order' => 2]);
        CustomizationOption::create(['group_id' => $addonsGroup->id, 'name' => 'House Smoked Herb Mayo Dip', 'additional_price' => 45.00, 'display_order' => 3]);
        CustomizationOption::create(['group_id' => $addonsGroup->id, 'name' => 'Extra Raita & Salan', 'additional_price' => 50.00, 'display_order' => 4]);

        $spiceGroup = CustomizationGroup::create([
            'name' => 'Spice Intensity',
            'description' => 'Customized to your spice tolerance',
            'required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
        ]);
        CustomizationOption::create(['group_id' => $spiceGroup->id, 'name' => 'Mild & Aromatic', 'additional_price' => 0.00, 'display_order' => 1]);
        CustomizationOption::create(['group_id' => $spiceGroup->id, 'name' => 'Traditional Medium', 'additional_price' => 0.00, 'display_order' => 2]);
        CustomizationOption::create(['group_id' => $spiceGroup->id, 'name' => 'Fiery Desi Hot', 'additional_price' => 0.00, 'display_order' => 3]);

        $drinkGroup = CustomizationGroup::create([
            'name' => 'Sweetness & Temperature',
            'description' => 'Prepared fresh upon your request',
            'required' => true,
            'min_selection' => 1,
            'max_selection' => 1,
        ]);
        CustomizationOption::create(['group_id' => $drinkGroup->id, 'name' => 'Chilled with Normal Ice', 'additional_price' => 0.00, 'display_order' => 1]);
        CustomizationOption::create(['group_id' => $drinkGroup->id, 'name' => 'Less Ice / No Added Sugar', 'additional_price' => 0.00, 'display_order' => 2]);
        CustomizationOption::create(['group_id' => $drinkGroup->id, 'name' => 'Warm / Room Temperature', 'additional_price' => 0.00, 'display_order' => 3]);

        // 6. Categories (8 realistic categories)
        $categoriesData = [
            [
                'name' => 'Starters & Small Plates',
                'slug' => 'starters-small-plates',
                'description' => 'Crisp appetizers and flavorful starters grilled fresh to awaken your appetite.',
                'image' => 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
                'display_order' => 1,
            ],
            [
                'name' => 'Clay Oven & Tandoor',
                'slug' => 'clay-oven-tandoor',
                'description' => 'Charcoal-smoked kebabs and artisanal skewers roasted on live embers.',
                'image' => 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
                'display_order' => 2,
            ],
            [
                'name' => 'Signature Curries & Mains',
                'slug' => 'signature-mains',
                'description' => 'Slow-simmered rich curries prepared with stone-ground heirloom spices.',
                'image' => 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
                'display_order' => 3,
            ],
            [
                'name' => 'Dum Biryanis & Fragrant Rice',
                'slug' => 'dum-biryanis-rice',
                'description' => 'Long-grain aged basmati dum-cooked in sealed clay handis with saffron and mint.',
                'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
                'display_order' => 4,
            ],
            [
                'name' => 'Artisanal Breads & Naans',
                'slug' => 'artisanal-breads',
                'description' => 'Freshly baked tandoori rotis, flaky parathas and garlic truffle naans.',
                'image' => 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
                'display_order' => 5,
            ],
            [
                'name' => 'Gourmet Pizzas & Hearth Breads',
                'slug' => 'gourmet-pizzas',
                'description' => 'Woodfired 72-hour fermented sourdough pizzas topped with farm-fresh cheeses.',
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
                'display_order' => 6,
            ],
            [
                'name' => 'Beverages & Craft Coolers',
                'slug' => 'beverages-craft-coolers',
                'description' => 'Signature fruit coolers, infused sodas, artisanal lassis and craft mocktails.',
                'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
                'display_order' => 7,
            ],
            [
                'name' => 'Desserts & Sweet Endings',
                'slug' => 'desserts-sweet-endings',
                'description' => 'Warm molten cakes, saffron infused rasmalai, and housemade pistachio kulfi.',
                'image' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
                'display_order' => 8,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::create($c);
        }

        // 7. Menu Items (25+ realistic dishes with pictures, allergens, spice levels)
        $itemsData = [
            // Starters & Small Plates
            [
                'category_slug' => 'starters-small-plates',
                'name' => 'Truffle Mushroom Galouti Kebab',
                'slug' => 'truffle-mushroom-galouti',
                'description' => 'Melt-in-mouth wild portobello and button mushrooms smoked with cloves, laced with truffle oil and served on saffron ulta tawa paratha.',
                'price' => 380.00,
                'discounted_price' => 340.00,
                'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 15,
                'vegetarian' => true,
                'ingredients' => 'Wild mushrooms, Truffle oil, Ghee, Saffron, Stone ground spices',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 1,
                'featured' => true,
                'popular' => true,
                'groups' => [$spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'starters-small-plates',
                'name' => 'Crispy Lotus Stem in Spiced Honey Chilli',
                'slug' => 'crispy-lotus-stem',
                'description' => 'Thinly sliced golden lotus roots tossed in a fiery kashmiri chilli, raw forest honey glaze and toasted sesame seeds.',
                'price' => 340.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 12,
                'vegetarian' => true,
                'ingredients' => 'Lotus root, Kashmiri chilli paste, Raw honey, Sesame, Scallions',
                'allergens' => 'Sesame',
                'spice_level' => 2,
                'featured' => false,
                'popular' => true,
                'groups' => [$spiceGroup->id],
            ],
            [
                'category_slug' => 'starters-small-plates',
                'name' => 'Gunpowder Ghee Tossed Idli Bites',
                'slug' => 'gunpowder-ghee-idli',
                'description' => 'Bite-sized steamed rice cakes pan-seared in golden A2 cow ghee with house-roasted lentil gunpowder podi and curry leaf crisps.',
                'price' => 260.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 10,
                'vegetarian' => true,
                'ingredients' => 'Fermented rice batter, A2 Cow Ghee, Roasted chana dal, Dried red chilli, Fresh curry leaves',
                'allergens' => 'Dairy',
                'spice_level' => 2,
                'featured' => false,
                'popular' => false,
                'groups' => [$portionGroup->id, $addonsGroup->id],
            ],

            // Clay Oven & Tandoor
            [
                'category_slug' => 'clay-oven-tandoor',
                'name' => 'Old Delhi Murgh Malai Tikka',
                'slug' => 'murgh-malai-tikka',
                'description' => 'Boneless chicken thighs marinated overnight in mascarpone cheese, hung yogurt, green cardamom and crushed black peppercorn, roasted over oak coals.',
                'price' => 460.00,
                'discounted_price' => 420.00,
                'image' => 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 20,
                'vegetarian' => false,
                'ingredients' => 'Free-range chicken, Cream cheese, Hung curd, Cardamom, Garlic, Coriander root',
                'allergens' => 'Dairy',
                'spice_level' => 1,
                'featured' => true,
                'popular' => true,
                'groups' => [$portionGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'clay-oven-tandoor',
                'name' => 'Peshawari Bhatti Paneer Tikka',
                'slug' => 'peshawari-bhatti-paneer-tikka',
                'description' => 'Farm-fresh cottage cheese cubes marinated in yellow mustard oil, charred bell peppers, crushed coriander seeds and roasted fenugreek leaves.',
                'price' => 410.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 18,
                'vegetarian' => true,
                'ingredients' => 'Fresh Malai Paneer, Mustard oil, Ajwain, Roasted gram flour, Kasuri methi',
                'allergens' => 'Dairy, Mustard',
                'spice_level' => 2,
                'featured' => false,
                'popular' => true,
                'groups' => [$spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'clay-oven-tandoor',
                'name' => 'Afghani Saffron Lamb Chops',
                'slug' => 'afghani-saffron-lamb-chops',
                'description' => 'Prime tender lamb chops marinated in raw papaya paste, Kashmiri saffron broth and royal cumin, charcoal grilled to tender juicy perfection.',
                'price' => 690.00,
                'discounted_price' => 640.00,
                'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 25,
                'vegetarian' => false,
                'ingredients' => 'New Zealand lamb chops, Saffron, Raw papaya, Shahi jeera, Garlic butter',
                'allergens' => 'Dairy',
                'spice_level' => 2,
                'featured' => true,
                'popular' => false,
                'groups' => [$portionGroup->id, $spiceGroup->id],
            ],

            // Signature Curries & Mains
            [
                'category_slug' => 'signature-mains',
                'name' => 'Grandmother 1947 Butter Chicken',
                'slug' => 'butter-chicken-1947',
                'description' => 'Charcoal-smoked shredded tandoori chicken simmered in a luscious gravy of vine-ripened tomatoes, cashew butter, honey and dried fenugreek.',
                'price' => 495.00,
                'discounted_price' => 450.00,
                'image' => 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 20,
                'vegetarian' => false,
                'ingredients' => 'Tandoori chicken, Fresh tomato reduction, Cashew paste, Makkhan, Kasuri methi',
                'allergens' => 'Dairy, Tree Nuts',
                'spice_level' => 1,
                'featured' => true,
                'popular' => true,
                'groups' => [$portionGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'signature-mains',
                'name' => 'Dal Makhani Bukhara Style',
                'slug' => 'dal-makhani-bukhara',
                'description' => 'Whole black urad lentils slow simmered over embers for 24 hours with vine tomatoes, garlic and churned white butter.',
                'price' => 395.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 15,
                'vegetarian' => true,
                'ingredients' => 'Black lentils, Kidney beans, Cultured white butter, Ginger, San Marzano style tomatoes',
                'allergens' => 'Dairy',
                'spice_level' => 1,
                'featured' => true,
                'popular' => true,
                'groups' => [$portionGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'signature-mains',
                'name' => 'Paneer Lababdar Awadhi',
                'slug' => 'paneer-lababdar-awadhi',
                'description' => 'Chunks of organic cottage cheese in an unctuous onion-tomato gravy with grated paneer swirls, melon seeds, and fragrant whole spices.',
                'price' => 440.00,
                'discounted_price' => 410.00,
                'image' => 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 18,
                'vegetarian' => true,
                'ingredients' => 'Paneer, Onion tomato masala, Magaz melon seed paste, Fresh cream, Green chilli',
                'allergens' => 'Dairy, Seeds',
                'spice_level' => 2,
                'featured' => false,
                'popular' => true,
                'groups' => [$portionGroup->id, $spiceGroup->id],
            ],
            [
                'category_slug' => 'signature-mains',
                'name' => 'Kerala Coastal Fish Curry',
                'slug' => 'kerala-coastal-fish-curry',
                'description' => 'Seer fish fillets cooked in freshly extracted coconut milk, kudampuli (Malabar kokum), shallots, and fragrant curry leaves.',
                'price' => 540.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 22,
                'vegetarian' => false,
                'ingredients' => 'Kingfish / Seer fish, Cold-pressed coconut milk, Kudampuli kokum, Fresh green chillies, Mustard seeds',
                'allergens' => 'Fish, Mustard',
                'spice_level' => 3,
                'featured' => false,
                'popular' => false,
                'groups' => [$portionGroup->id, $spiceGroup->id],
            ],

            // Dum Biryanis & Fragrant Rice
            [
                'category_slug' => 'dum-biryanis-rice',
                'name' => 'Royal Nizami Chicken Dum Biryani',
                'slug' => 'royal-nizami-chicken-biryani',
                'description' => 'Tender chicken marinated in browned onions, mint and whole garam masala, layered with aged basmati rice and sealed with dough for authentic steam dum.',
                'price' => 480.00,
                'discounted_price' => 440.00,
                'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 25,
                'vegetarian' => false,
                'ingredients' => 'Chicken on bone, Aged basmati rice, Saffron milk, Birista crispy onions, Fresh mint, Ghee',
                'allergens' => 'Dairy',
                'spice_level' => 2,
                'featured' => true,
                'popular' => true,
                'groups' => [$portionGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'dum-biryanis-rice',
                'name' => 'Awadhi Subz Dum Biryani',
                'slug' => 'awadhi-subz-dum-biryani',
                'description' => 'Seasonal farm vegetables, baby potatoes, carrots and paneer tossed with aromatic spices, layered with saffron basmati and baked in a clay pot.',
                'price' => 390.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 22,
                'vegetarian' => true,
                'ingredients' => 'Basmati rice, French beans, Florets, Paneer, Rose water, Kewra essence',
                'allergens' => 'Dairy',
                'spice_level' => 1,
                'featured' => false,
                'popular' => true,
                'groups' => [$portionGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'dum-biryanis-rice',
                'name' => 'Gosht Dum Pukht Biryani',
                'slug' => 'gosht-dum-pukht-biryani',
                'description' => 'Melt-in-mouth mutton cuts slow-cooked with basmati rice, caramelized shallots and royal saffron in a sealed brass degh.',
                'price' => 650.00,
                'discounted_price' => 595.00,
                'image' => 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 28,
                'vegetarian' => false,
                'ingredients' => 'Tender goat meat, Basmati rice, Saffron, Cardamom, Cloves, Pure ghee',
                'allergens' => 'Dairy',
                'spice_level' => 2,
                'featured' => true,
                'popular' => false,
                'groups' => [$portionGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],

            // Artisanal Breads & Naans
            [
                'category_slug' => 'artisanal-breads',
                'name' => 'Truffle Garlic Butter Naan',
                'slug' => 'truffle-garlic-butter-naan',
                'description' => 'Soft leavened tandoor bread brushed with melted butter, roasted minced garlic, fresh coriander and black truffle oil.',
                'price' => 125.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 8,
                'vegetarian' => true,
                'ingredients' => 'Fine flour, Garlic, Butter, Coriander, Truffle oil',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 0,
                'featured' => false,
                'popular' => true,
                'groups' => [$addonsGroup->id],
            ],
            [
                'category_slug' => 'artisanal-breads',
                'name' => 'Smoked Cheddar & Jalapeno Kulcha',
                'slug' => 'cheddar-jalapeno-kulcha',
                'description' => 'Crisp tandoori flatbread stuffed with sharp English cheddar, pickled jalapenos, and sprinkled with nigella seeds.',
                'price' => 155.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 10,
                'vegetarian' => true,
                'ingredients' => 'Leavened dough, Smoked cheddar, Pickled jalapeno, Kalonji seeds',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 1,
                'featured' => false,
                'popular' => true,
                'groups' => [$addonsGroup->id],
            ],
            [
                'category_slug' => 'artisanal-breads',
                'name' => 'Laccha Paratha Pudina Twist',
                'slug' => 'laccha-paratha-pudina',
                'description' => 'Multi-layered whole wheat spiral bread baked in tandoor with fresh dried mint flakes and golden butter.',
                'price' => 95.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 8,
                'vegetarian' => true,
                'ingredients' => 'Stone ground whole wheat, Butter, Dried mint',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 0,
                'featured' => false,
                'popular' => false,
                'groups' => [],
            ],

            // Gourmet Pizzas & Hearth Breads
            [
                'category_slug' => 'gourmet-pizzas',
                'name' => 'Burrata Margherita Woodfired Pizza (12")',
                'slug' => 'burrata-margherita-pizza',
                'description' => '72-hr fermented slow sourdough crust, San Marzano tomato sauce, fresh basil, whole creamy artisanal burrata ball and cold pressed EVOO.',
                'price' => 595.00,
                'discounted_price' => 540.00,
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 18,
                'vegetarian' => true,
                'ingredients' => 'Italian Tipo 00 flour, San Marzano tomatoes, Fresh Burrata cheese, Basil leaves, Extra virgin olive oil',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 0,
                'featured' => true,
                'popular' => true,
                'groups' => [$crustGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'gourmet-pizzas',
                'name' => 'Tandoori Smoked Chicken Tikka Pizza (12")',
                'slug' => 'tandoori-chicken-pizza',
                'description' => 'Oak-fired sourdough topped with shredded clay-oven spiced chicken, charred peppers, red onions, pickled green chillies and molten mozzarella.',
                'price' => 640.00,
                'discounted_price' => 590.00,
                'image' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 20,
                'vegetarian' => false,
                'ingredients' => 'Sourdough base, Tandoori chicken tikka, Fior di Latte mozzarella, Bell peppers, Red onions',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 2,
                'featured' => true,
                'popular' => true,
                'groups' => [$crustGroup->id, $spiceGroup->id, $addonsGroup->id],
            ],
            [
                'category_slug' => 'gourmet-pizzas',
                'name' => 'Wild Forest Truffle Mushroom Flatbread',
                'slug' => 'wild-forest-mushroom-flatbread',
                'description' => 'Crisp hearth flatbread topped with white garlic cream, roasted cremini and shiitake mushrooms, thyme and melted fontina cheese.',
                'price' => 530.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 16,
                'vegetarian' => true,
                'ingredients' => 'Slow sourdough, Wild mushrooms, Garlic cream, Thyme, Fontina cheese, Truffle oil',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 0,
                'featured' => false,
                'popular' => false,
                'groups' => [$crustGroup->id, $addonsGroup->id],
            ],

            // Beverages & Craft Coolers
            [
                'category_slug' => 'beverages-craft-coolers',
                'name' => 'Kokum Cumin Fizz Sparkler',
                'slug' => 'kokum-cumin-fizz',
                'description' => 'Sun-dried Konkan kokum fruit nectar muddled with roasted cumin, rock salt, mint sprigs and fizzy sparkling soda.',
                'price' => 190.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 5,
                'vegetarian' => true,
                'ingredients' => 'Wild Kokum concentrate, Roasted cumin, Himalayan black salt, Sparkling water, Mint',
                'allergens' => 'None',
                'spice_level' => 0,
                'featured' => false,
                'popular' => true,
                'groups' => [$drinkGroup->id],
            ],
            [
                'category_slug' => 'beverages-craft-coolers',
                'name' => 'Royal Alphonso Mango Saffron Lassi',
                'slug' => 'alphonso-mango-saffron-lassi',
                'description' => 'Thick creamy churned yogurt blended with Ratnagiri Alphonso mango pulp, saffron infusion and topped with sliced pistachios.',
                'price' => 220.00,
                'discounted_price' => 195.00,
                'image' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 5,
                'vegetarian' => true,
                'ingredients' => 'Farm curd, Alphonso mango puree, Cardamom, Kashmiri saffron, Pistachio slivers',
                'allergens' => 'Dairy, Tree Nuts',
                'spice_level' => 0,
                'featured' => true,
                'popular' => true,
                'groups' => [$drinkGroup->id],
            ],
            [
                'category_slug' => 'beverages-craft-coolers',
                'name' => 'Cold Brew Spiced Hibiscus Iced Tea',
                'slug' => 'spiced-hibiscus-iced-tea',
                'description' => 'Organic dried hibiscus petals steeped cold for 18 hours with cinnamon quills, clove, and fresh Valencia orange slices.',
                'price' => 195.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 5,
                'vegetarian' => true,
                'ingredients' => 'Hibiscus flowers, Ceylon cinnamon, Orange juice, Jaggery syrup, Ice',
                'allergens' => 'None',
                'spice_level' => 0,
                'featured' => false,
                'popular' => false,
                'groups' => [$drinkGroup->id],
            ],

            // Desserts & Sweet Endings
            [
                'category_slug' => 'desserts-sweet-endings',
                'name' => 'Belgian Dark Chocolate Molten Rasmalai Cake',
                'slug' => 'molten-rasmalai-cake',
                'description' => 'Fusion dessert featuring warm 70% dark Belgian cocoa fondant cake with a hidden creamy saffron rasmalai center.',
                'price' => 320.00,
                'discounted_price' => 280.00,
                'image' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 12,
                'vegetarian' => true,
                'ingredients' => 'Belgian chocolate, Saffron rasmalai, Flour, Farm butter, Vanilla bean',
                'allergens' => 'Gluten, Dairy',
                'spice_level' => 0,
                'featured' => true,
                'popular' => true,
                'groups' => [$addonsGroup->id],
            ],
            [
                'category_slug' => 'desserts-sweet-endings',
                'name' => 'Baked Gulab Jamun Cheesecake',
                'slug' => 'gulab-jamun-cheesecake',
                'description' => 'New York style slow-baked cream cheese on a cardamom graham cracker crust, studded with miniature gulab jamuns and pistachio dust.',
                'price' => 290.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 8,
                'vegetarian' => true,
                'ingredients' => 'Cream cheese, Khoya gulab jamuns, Graham cracker, Cardamom, Rose petals',
                'allergens' => 'Gluten, Dairy, Tree Nuts',
                'spice_level' => 0,
                'featured' => false,
                'popular' => true,
                'groups' => [],
            ],
            [
                'category_slug' => 'desserts-sweet-endings',
                'name' => 'Roasted Pistachio & Rose Matka Kulfi',
                'slug' => 'matka-kulfi-rose',
                'description' => 'Traditional slow-reduced whole milk ice cream set in porous terracotta pots with crushed Iranian green pistachios and dried edible rose petals.',
                'price' => 210.00,
                'discounted_price' => null,
                'image' => 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80',
                'preparation_time' => 5,
                'vegetarian' => true,
                'ingredients' => 'Rabri milk, Pistachios, Cardamom seeds, Damask rose water',
                'allergens' => 'Dairy, Tree Nuts',
                'spice_level' => 0,
                'featured' => false,
                'popular' => false,
                'groups' => [],
            ],
        ];

        $createdMenuItems = [];
        $displayOrder = 1;
        foreach ($itemsData as $item) {
            $cat = $categories[$item['category_slug']];
            $menuItem = MenuItem::create([
                'category_id' => $cat->id,
                'name' => $item['name'],
                'slug' => $item['slug'],
                'description' => $item['description'],
                'price' => $item['price'],
                'discounted_price' => $item['discounted_price'],
                'image' => $item['image'],
                'preparation_time' => $item['preparation_time'],
                'vegetarian' => $item['vegetarian'],
                'ingredients' => $item['ingredients'],
                'allergens' => $item['allergens'],
                'spice_level' => $item['spice_level'],
                'available' => true,
                'featured' => $item['featured'],
                'popular' => $item['popular'],
                'display_order' => $displayOrder++,
            ]);

            if (!empty($item['groups'])) {
                $menuItem->customizationGroups()->sync($item['groups']);
            }

            $createdMenuItems[$item['slug']] = $menuItem;
        }

        // 8. Coupons
        Coupon::create([
            'code' => 'WELCOME20',
            'discount_type' => 'percentage',
            'discount_value' => 20.00,
            'minimum_order' => 400.00,
            'maximum_discount' => 150.00,
            'start_date' => now()->subDays(5)->format('Y-m-d'),
            'expiry_date' => now()->addDays(90)->format('Y-m-d'),
            'usage_limit' => 1000,
            'times_used' => 42,
            'active' => true,
        ]);

        Coupon::create([
            'code' => 'PREORDER50',
            'discount_type' => 'fixed',
            'discount_value' => 50.00,
            'minimum_order' => 350.00,
            'maximum_discount' => null,
            'start_date' => now()->subDays(10)->format('Y-m-d'),
            'expiry_date' => now()->addDays(60)->format('Y-m-d'),
            'usage_limit' => 500,
            'times_used' => 18,
            'active' => true,
        ]);

        Coupon::create([
            'code' => 'FEAST100',
            'discount_type' => 'fixed',
            'discount_value' => 100.00,
            'minimum_order' => 800.00,
            'maximum_discount' => null,
            'start_date' => now()->subDays(10)->format('Y-m-d'),
            'expiry_date' => now()->addDays(30)->format('Y-m-d'),
            'usage_limit' => 200,
            'times_used' => 5,
            'active' => true,
        ]);

        // 9. Realistic Orders across time slots and statuses
        // Order 1: Today Evening - PREPARING (Great for Kitchen display testing!)
        $order1 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $customer1->id,
            'customer_name' => 'Priya Sharma',
            'customer_email' => 'priya@example.com',
            'customer_phone' => '+91 98111 22233',
            'arrival_date' => now()->format('Y-m-d'),
            'arrival_time' => '19:30',
            'time_slot_id' => $createdSlots[11]->id,
            'dining_option' => 'dine_in',
            'subtotal' => 890.00,
            'discount' => 150.00,
            'coupon_code' => 'WELCOME20',
            'tax' => 37.00,
            'service_charge' => 18.50,
            'packaging_charge' => 0.00,
            'final_total' => 795.50,
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'order_status' => 'preparing',
            'customer_notes' => 'Table by the window if possible. Please keep food extra hot.',
            'preparation_started_at' => now()->subMinutes(10),
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $createdMenuItems['royal-nizami-chicken-biryani']->id,
            'item_name' => 'Royal Nizami Chicken Dum Biryani',
            'quantity' => 1,
            'unit_price' => 440.00,
            'total_price' => 440.00,
            'customization_data' => [
                ['group' => 'Portion Size', 'option' => 'Regular (Serves 1-2)', 'price' => 0.00],
                ['group' => 'Spice Intensity', 'option' => 'Traditional Medium', 'price' => 0.00],
            ],
            'notes' => 'Extra salan on the side',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $createdMenuItems['butter-chicken-1947']->id,
            'item_name' => 'Grandmother 1947 Butter Chicken',
            'quantity' => 1,
            'unit_price' => 450.00,
            'total_price' => 450.00,
            'customization_data' => [
                ['group' => 'Portion Size', 'option' => 'Regular (Serves 1-2)', 'price' => 0.00],
            ],
        ]);

        Payment::create([
            'order_id' => $order1->id,
            'payment_provider' => 'razorpay_mock',
            'transaction_id' => 'pay_rzp_' . Str::random(12),
            'amount' => 795.50,
            'currency' => 'INR',
            'status' => 'successful',
            'raw_response' => ['gateway' => 'razorpay', 'method' => 'upi', 'vpa' => 'priya@okhdfcbank'],
        ]);

        // Order 2: Today Evening - READY
        $order2 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $customer2->id,
            'customer_name' => 'Arjun Patel',
            'customer_email' => 'arjun@example.com',
            'customer_phone' => '+91 98222 33344',
            'arrival_date' => now()->format('Y-m-d'),
            'arrival_time' => '19:00',
            'time_slot_id' => $createdSlots[10]->id,
            'dining_option' => 'takeaway',
            'subtotal' => 665.00,
            'discount' => 50.00,
            'coupon_code' => 'PREORDER50',
            'tax' => 30.75,
            'service_charge' => 0.00,
            'packaging_charge' => 15.00,
            'final_total' => 660.75,
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'order_status' => 'ready',
            'customer_notes' => 'Strictly vegetarian. Packing for car travel.',
            'preparation_started_at' => now()->subMinutes(25),
            'ready_at' => now()->subMinutes(5),
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $createdMenuItems['truffle-mushroom-galouti']->id,
            'item_name' => 'Truffle Mushroom Galouti Kebab',
            'quantity' => 1,
            'unit_price' => 340.00,
            'total_price' => 340.00,
            'customization_data' => [
                ['group' => 'Spice Intensity', 'option' => 'Mild & Aromatic', 'price' => 0.00],
            ],
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $createdMenuItems['cheddar-jalapeno-kulcha']->id,
            'item_name' => 'Smoked Cheddar & Jalapeno Kulcha',
            'quantity' => 2,
            'unit_price' => 155.00,
            'total_price' => 310.00,
            'customization_data' => [],
        ]);

        Payment::create([
            'order_id' => $order2->id,
            'payment_provider' => 'razorpay_mock',
            'transaction_id' => 'pay_rzp_' . Str::random(12),
            'amount' => 660.75,
            'currency' => 'INR',
            'status' => 'successful',
        ]);

        // Order 3: CONFIRMED (Upcoming 20:30 slot)
        $order3 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => null,
            'customer_name' => 'Sunita Rao',
            'customer_email' => 'sunita.rao@example.com',
            'customer_phone' => '+91 99000 88776',
            'arrival_date' => now()->format('Y-m-d'),
            'arrival_time' => '20:30',
            'time_slot_id' => $createdSlots[13]->id,
            'dining_option' => 'dine_in',
            'subtotal' => 1125.00,
            'discount' => 0.00,
            'coupon_code' => null,
            'tax' => 56.25,
            'service_charge' => 28.13,
            'packaging_charge' => 0.00,
            'final_total' => 1209.38,
            'payment_status' => 'unpaid',
            'payment_method' => 'pay_at_restaurant',
            'order_status' => 'confirmed',
            'customer_notes' => 'Celebrating 5th anniversary dinner!',
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'menu_item_id' => $createdMenuItems['burrata-margherita-pizza']->id,
            'item_name' => 'Burrata Margherita Woodfired Pizza (12")',
            'quantity' => 1,
            'unit_price' => 540.00,
            'total_price' => 540.00,
            'customization_data' => [
                ['group' => 'Artisanal Base / Crust', 'option' => 'Garlic Butter Stuffed Crust', 'price' => 85.00],
            ],
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'menu_item_id' => $createdMenuItems['molten-rasmalai-cake']->id,
            'item_name' => 'Belgian Dark Chocolate Molten Rasmalai Cake',
            'quantity' => 2,
            'unit_price' => 280.00,
            'total_price' => 560.00,
            'customization_data' => [],
        ]);

        // Order 4: COMPLETED (Earlier today)
        $order4 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $customer1->id,
            'customer_name' => 'Priya Sharma',
            'customer_email' => 'priya@example.com',
            'customer_phone' => '+91 98111 22233',
            'arrival_date' => now()->format('Y-m-d'),
            'arrival_time' => '13:00',
            'time_slot_id' => $createdSlots[3]->id,
            'dining_option' => 'dine_in',
            'subtotal' => 585.00,
            'discount' => 50.00,
            'coupon_code' => 'PREORDER50',
            'tax' => 26.75,
            'service_charge' => 13.38,
            'packaging_charge' => 0.00,
            'final_total' => 575.13,
            'payment_status' => 'paid',
            'payment_method' => 'online',
            'order_status' => 'completed',
            'preparation_started_at' => now()->subHours(4),
            'ready_at' => now()->subHours(3)->subMinutes(35),
            'completed_at' => now()->subHours(3),
        ]);

        OrderItem::create([
            'order_id' => $order4->id,
            'menu_item_id' => $createdMenuItems['dal-makhani-bukhara']->id,
            'item_name' => 'Dal Makhani Bukhara Style',
            'quantity' => 1,
            'unit_price' => 395.00,
            'total_price' => 395.00,
        ]);

        OrderItem::create([
            'order_id' => $order4->id,
            'menu_item_id' => $createdMenuItems['truffle-garlic-butter-naan']->id,
            'item_name' => 'Truffle Garlic Butter Naan',
            'quantity' => 2,
            'unit_price' => 125.00,
            'total_price' => 250.00,
        ]);

        Payment::create([
            'order_id' => $order4->id,
            'payment_provider' => 'razorpay_mock',
            'transaction_id' => 'pay_rzp_' . Str::random(12),
            'amount' => 575.13,
            'currency' => 'INR',
            'status' => 'successful',
        ]);

        // 10. Reviews & Testimonials
        Review::create([
            'user_id' => $customer1->id,
            'customer_name' => 'Priya Sharma',
            'rating' => 5,
            'comment' => 'The pre-ordering experience is revolutionary! We booked a table for 7:30 PM, arrived right on time, and our piping hot Dum Biryani and Butter Chicken were served within 3 minutes of sitting down. No awkward 45-minute wait while starving!',
            'dish_name' => 'Royal Nizami Chicken Dum Biryani',
            'is_featured' => true,
        ]);

        Review::create([
            'user_id' => $customer2->id,
            'customer_name' => 'Arjun Patel',
            'rating' => 5,
            'comment' => 'Their Woodfired Truffle Pizza and Galouti kebabs are world-class. Ordering ahead for takeaway meant I just pulled up, showed my order number on the phone, and picked up the freshest food imaginable.',
            'dish_name' => 'Truffle Mushroom Galouti Kebab',
            'is_featured' => true,
        ]);

        Review::create([
            'user_id' => null,
            'customer_name' => 'Kavita Menon',
            'rating' => 5,
            'comment' => 'Hands down the best dining experience in Indiranagar. The time slot booking was seamless, the kitchen display system kept everything on track, and the dessert rasmalai cake is divine!',
            'dish_name' => 'Molten Rasmalai Cake',
            'is_featured' => true,
        ]);

        Review::create([
            'user_id' => null,
            'customer_name' => 'Rohan Sen',
            'rating' => 5,
            'comment' => 'Clean UI, accurate preparation schedule, and courteous staff. This is how modern restaurant dining should always be.',
            'dish_name' => 'Old Delhi Murgh Malai Tikka',
            'is_featured' => true,
        ]);

        // 11. Initial Notifications
        Notification::create([
            'user_id' => $admin->id,
            'order_id' => $order1->id,
            'role' => 'admin',
            'type' => 'order_placed',
            'title' => 'New Order ' . $order1->order_number,
            'message' => 'Priya Sharma placed a pre-order for ' . $order1->arrival_time . ' (Dine-in). Total: ₹' . $order1->final_total,
            'read' => false,
        ]);

        Notification::create([
            'user_id' => $customer1->id,
            'order_id' => $order1->id,
            'role' => 'customer',
            'type' => 'order_preparing',
            'title' => 'Chef Started Cooking!',
            'message' => 'Our kitchen has begun preparing your dishes for your arrival at ' . $order1->arrival_time . '.',
            'read' => false,
        ]);

        // 12. Audit Logs
        AuditLog::record($admin, 'created', 'restaurant_settings', (string) $restaurant->id, 'Initial restaurant settings and operational policies configured.');
        AuditLog::record($admin, 'created', 'menu_item', (string) $createdMenuItems['butter-chicken-1947']->id, 'Created Grandmother 1947 Butter Chicken menu item.');
        AuditLog::record($kitchen, 'status_changed', 'order', (string) $order1->id, 'Order status changed to preparing.');
    }
}
