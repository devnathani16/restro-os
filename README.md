# Spice & Hearth Bistro — Production Restaurant Food Pre-Ordering Platform & Admin Suite

> **"Order Ahead, Arrive to a Hot Gourmet Feast Waiting for You."**
> A production-ready, full-stack restaurant pre-ordering platform built with **PHP Laravel**, **React (via CDN)**, **Tailwind CSS**, and **SQLite**. Zero complex node/npm build dependencies required — runs immediately with `php artisan serve`.

---

## 🌟 Architecture & Tech Stack

- **Backend Framework**: PHP 8.4+ / Laravel 11/12
- **Database**: SQLite (`database/database.sqlite`), fully portable and zero-daemon setup.
- **Frontend Architecture**: React 18 CDN + Babel Standalone + Tailwind CSS v3 CDN + Lucide Icons + Chart.js.
- **Session & Security**: Native Laravel session authentication, role-based authorization middleware (`admin`, `kitchen`), server-side price recalculation, transaction locking to prevent time-slot overbooking, CSRF protection, and audit logging.

---

## 🍽️ Key Modules & Capabilities

### 1. Customer Pre-Ordering Experience (`/`)
- **Arrival Scheduling Bar**: Select planned arrival date (today up to 7 days ahead) and 30-minute preparation time slots (e.g. 19:00, 19:30).
- **Time Slot Capacity Protection**: Automatically validates operating hours, cutoffs (minimum 30 minutes lead notice), and remaining slot capacity.
- **Dining Options**: Dine-In (reserved seating) vs Express Takeaway.
- **Menu System**: 8 manageable categories, 25+ chef-crafted dishes with high-res photography, vegetarian/non-vegetarian emblems, allergen warnings, spice level ratings (0-3), and preparation times.
- **Food Customization Engine**: Select portion sizes, artisanal crusts, chef extra add-ons, and cooking notes with dynamic live price calculation.
- **Promotional Coupon System**: Apply discount codes (e.g., `WELCOME20`, `PREORDER50`, `FEAST100`) with instant validation and discount computation.
- **Transparent Itemized Billing**: Subtotal, Coupon Discount, 5% GST, 2.5% Service Charge (dine-in), ₹15 Packaging Fee (takeaway), Grand Total.
- **Configurable Payment**: Razorpay-ready online payment simulation + Pay at Restaurant (Counter Cash/Card).

### 2. Live Order Progress Tracker (`/track/{orderNumber?}`)
- Real-time 5-stage progress tracker:
  $$\text{Order Placed} \longrightarrow \text{Confirmed} \longrightarrow \text{Preparing (Kitchen Cooking)} \longrightarrow \text{Ready (Plated)} \longrightarrow \text{Completed}$$
- Prominent preparation schedule guarantee: *"Your food will be prepared before your selected arrival time."*
- Auto-refreshing poll every 8 seconds.
- Cancellation safety: Customers can cancel only *before* cooking begins; once the kitchen starts preparation, cancellation is blocked to prevent food waste.

### 3. Dedicated Kitchen Display System (KDS) (`/kitchen`)
- **Tablet / Touchscreen Optimized**: High-contrast, large-button design built for busy kitchen lines.
- **Arrival-Time Grouped Tickets**: Groups active tickets by arrival time blocks (e.g., 7:00 PM, 7:30 PM).
- **Action Buttons**:
  - `START PREPARING`: Fired when chefs start cooking (notifies customer).
  - `MARK READY`: Fired when food is plated and hot at the pass.
  - `HANDOVER / COMPLETE`: Fired when food is served or collected.
- **Audio Chime Toggle & Digital Clock**: Visual and auditory signals for incoming orders.

### 4. Comprehensive Admin Management Suite (`/admin`)
- **Executive Overview**: Today's revenue, order counts, pending, in-prep, ready, upcoming, orders by time slot, and popular dishes.
- **Order Management**: Filter by date (Today, Tomorrow, Upcoming, Past), status, and payment; update order statuses; view customer notes.
- **Menu & Dish Management**: Full CRUD for dishes (names, descriptions, pricing, discounts, image URLs, dietary indicators, spice levels, allergens, preparation times, availability toggles, popular/featured badges).
- **Category Management**: Create, edit, and reorder categories.
- **Customization Groups**: Configure add-ons, crust selections, portion sizes with extra price modifiers and selection rules (min/max).
- **Coupons & Promotions**: Set percentage or fixed discounts, minimum cart spend, expiry dates, and usage limits.
- **Customer Directory**: Registered diner profiles, order counts, lifetime spending.
- **Sales Analytics**: 14-day interactive sales trends and volume chart powered by Chart.js.
- **Security Audit Log**: Complete audit trail of administrative activities with timestamps, user names, action types, entity IDs, and IP addresses.
- **Restaurant Settings**: Configure operating hours for every day of the week, time slot capacity limits, lead times, tax rates, service charges, packaging fees, emergency closed switch, and legal policies.

---

## 🔑 Demo Accounts & Credentials

The application includes realistic seeded test data. You can switch between demo accounts with 1-click buttons in the top navigation bar or log in manually:

| Role | Name | Email | Password | Access Area |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Chef Vikram Anand | `admin@spiceandhearth.com` | `password123` | Full Access (`/admin`, `/kitchen`, `/`) |
| **Kitchen Staff** | Rajesh Kumar | `kitchen@spiceandhearth.com` | `password123` | Kitchen KDS (`/kitchen`, `/`) |
| **Customer 1** | Priya Sharma | `priya@example.com` | `password123` | Ordering & Profile (`/`, `/track`) |
| **Customer 2** | Arjun Patel | `arjun@example.com` | `password123` | Ordering & Profile (`/`, `/track`) |

### Active Promotional Coupon Codes
- `WELCOME20`: 20% off up to ₹150 (Min. spend ₹400)
- `PREORDER50`: Flat ₹50 off (Min. spend ₹350)
- `FEAST100`: Flat ₹100 off (Min. spend ₹800)

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- PHP 8.2 or higher (with `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer` extensions)
- Composer

### Installation Steps

1. **Navigate to the project directory**:
   ```bash
   cd /home/codespace/.gemini/antigravity-cli/scratch/restaurant-preorder
   ```

2. **Install Composer dependencies**:
   ```bash
   composer install --no-interaction
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Initialize SQLite Database & Seed Demo Feasts**:
   ```bash
   php artisan migrate:fresh --seed
   ```

5. **Start the Application**:
   ```bash
   php artisan serve --port=8000
   ```
   Open your browser at `http://localhost:8000`.

---

## 🌐 Production Deployment Guide

### 1. Web Server Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name your-restaurant-domain.com;
    root /var/www/restaurant-preorder/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 2. Environment Variables (.env)

```env
APP_NAME="Spice & Hearth Bistro"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-restaurant-domain.com

DB_CONNECTION=sqlite
# For MySQL / PostgreSQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=restaurant_db
# DB_USERNAME=restaurant_user
# DB_PASSWORD=your_secure_password

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. File Permissions
```bash
sudo chown -R www-data:www-data /var/www/restaurant-preorder/storage /var/www/restaurant-preorder/bootstrap/cache
sudo chmod -R 775 /var/www/restaurant-preorder/storage /var/www/restaurant-preorder/bootstrap/cache
```

### 4. Caching for High Performance
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔒 Security & Business Rules Enforced

1. **Server-Side Pricing**: Prices and customizations are strictly fetched and calculated from the database. Client totals are never trusted.
2. **Double-Booking Prevention**: Database transactions with row locks ensure time-slot capacity cannot be exceeded even under concurrent checkout attempts.
3. **Advance Cutoff Rules**: Orders require a configured minimum lead notice (default 30 mins) before the arrival slot.
4. **Operating Hours Validation**: Rejects bookings on closed days or outside opening and closing hours.
5. **Emergency Closure Override**: Allows management to pause order acceptance instantly with a customizable message.
6. **Role-Based API Protection**: Kitchen staff cannot modify restaurant settings or access administrative financial analytics.
7. **Strict Order Cancellation Policy**: Cancellations are disallowed once food preparation has commenced.
8. **Audit Trail**: Every significant administrative modification is recorded in the audit log.
