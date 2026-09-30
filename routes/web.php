<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RestaurantController;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web & Application Routes
|--------------------------------------------------------------------------
*/

// Customer Front-End
Route::get('/', function () {
    $restaurant = Restaurant::first();
    return view('customer.index', compact('restaurant'));
})->name('home');

Route::get('/track/{orderNumber?}', function ($orderNumber = null) {
    $restaurant = Restaurant::first();
    return view('customer.track', compact('restaurant', 'orderNumber'));
})->name('track');

// Kitchen Display System Portal
Route::get('/kitchen', function () {
    if (!Auth::check() || !Auth::user()->isKitchen()) {
        return redirect('/login?intended=' . urlencode('/kitchen'))->with('error', 'Kitchen access requires authorized staff login.');
    }
    $restaurant = Restaurant::first();
    return view('kitchen.index', compact('restaurant'));
})->name('kitchen');

// Admin Management Portal
Route::get('/admin/{section?}', function ($section = 'dashboard') {
    if (!Auth::check() || !Auth::user()->isAdmin()) {
        return redirect('/login?intended=' . urlencode('/admin/' . $section))->with('error', 'Administrator login required.');
    }
    $restaurant = Restaurant::first();
    return view('admin.index', compact('restaurant', 'section'));
})->where('section', '.*')->name('admin');

// Dedicated Authentication Page
Route::get('/login', function (Request $request) {
    $intended = $request->query('intended', '/');
    if (Auth::check()) {
        return redirect($intended);
    }
    $restaurant = Restaurant::first();
    return view('auth.login', compact('restaurant', 'intended'));
})->name('login');

/*
|--------------------------------------------------------------------------
| API Endpoints (Session-authenticated & CSRF protected)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->group(function () {
    // 1. Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/quick-login', [AuthController::class, 'quickLogin']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/profile', [AuthController::class, 'updateProfile'])->middleware('auth');
    });

    // 2. Public Restaurant & Menu Data
    Route::prefix('restaurant')->group(function () {
        Route::get('/data', [RestaurantController::class, 'getPublicData']);
        Route::post('/check-slot', [RestaurantController::class, 'checkSlotAvailability']);
        Route::post('/validate-coupon', [RestaurantController::class, 'validateCoupon']);
    });

    // 3. Orders
    Route::prefix('orders')->group(function () {
        Route::post('/calculate', [OrderController::class, 'calculateSummary']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/my-orders', [OrderController::class, 'myOrders'])->middleware('auth');
        Route::get('/{orderNumber}', [OrderController::class, 'show']);
        Route::get('/{orderNumber}/track', [OrderController::class, 'track']);
        Route::post('/{orderNumber}/cancel', [OrderController::class, 'cancel']);
    });

    // 4. Payments
    Route::prefix('payments')->group(function () {
        Route::post('/{orderId}/intent', [PaymentController::class, 'createPaymentIntent']);
        Route::post('/verify', [PaymentController::class, 'verifyPayment']);
        Route::post('/{orderId}/pay-at-restaurant', [PaymentController::class, 'payAtRestaurant']);
    });

    // 5. Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->middleware('auth');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('auth');
    });

    // 6. Kitchen Operations (Kitchen staff or Admin)
    Route::prefix('kitchen')->middleware(['auth', 'kitchen'])->group(function () {
        Route::get('/active-orders', [KitchenController::class, 'activeOrders']);
        Route::post('/orders/{orderId}/prepare', [KitchenController::class, 'startPreparing']);
        Route::post('/orders/{orderId}/ready', [KitchenController::class, 'markReady']);
        Route::post('/orders/{orderId}/complete', [KitchenController::class, 'markCompleted']);
    });

    // 7. Admin Operations (Admin only)
    Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboardStats']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::post('/orders/{orderId}/status', [AdminController::class, 'updateOrderStatus']);
        Route::get('/menu-items', [AdminController::class, 'menuItems']);
        Route::post('/menu-items', [AdminController::class, 'storeMenuItem']);
        Route::put('/menu-items/{id}', [AdminController::class, 'updateMenuItem']);
        Route::delete('/menu-items/{id}', [AdminController::class, 'deleteMenuItem']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories', [AdminController::class, 'storeCategory']);
        Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [AdminController::class, 'deleteCategory']);
        Route::get('/customization-groups', [AdminController::class, 'customizationGroups']);
        Route::post('/customization-groups', [AdminController::class, 'storeCustomizationGroup']);
        Route::put('/customization-groups/{id}', [AdminController::class, 'updateCustomizationGroup']);
        Route::delete('/customization-groups/{id}', [AdminController::class, 'deleteCustomizationGroup']);
        Route::get('/coupons', [AdminController::class, 'coupons']);
        Route::post('/coupons', [AdminController::class, 'storeCoupon']);
        Route::put('/coupons/{id}', [AdminController::class, 'updateCoupon']);
        Route::delete('/coupons/{id}', [AdminController::class, 'deleteCoupon']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::get('/analytics', [AdminController::class, 'analytics']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::post('/settings', [AdminController::class, 'updateSettings']);
    });
});

/*
|--------------------------------------------------------------------------
| SEO Sitemap & Robots
|--------------------------------------------------------------------------
*/
Route::get('/sitemap.xml', function () {
    $restaurant = Restaurant::first();
    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    $xml .= '<url><loc>' . url('/') . '</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
    $xml .= '<url><loc>' . url('/track') . '</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>';
    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'text/xml');
});

Route::get('/robots.txt', function () {
    $content = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /kitchen\nDisallow: /api/\nSitemap: " . url('/sitemap.xml') . "\n";
    return response($content, 200)->header('Content-Type', 'text/plain');
});
