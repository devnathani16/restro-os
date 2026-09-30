<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>@yield('title', 'Spice & Hearth Bistro | Order Ahead & Dine Without Waiting')</title>
    <meta name="description" content="@yield('meta_description', 'Pre-order authentic woodfired pizzas, clay oven kebabs, and slow-dum biryanis in advance. Select your exact arrival time and skip the waiting line.')">
    <meta name="keywords" content="restaurant pre-order, order ahead, food pre-ordering, zero wait dining, gourmet food bangalore, spice and hearth bistro">
    <meta name="author" content="Spice & Hearth Bistro">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="restaurant">
    <meta property="og:title" content="@yield('title', 'Spice & Hearth Bistro | Order Ahead & Dine Without Waiting')">
    <meta property="og:description" content="@yield('meta_description', 'Fresh gourmet feasts prepared before you arrive. Pre-order your meal and enjoy instant hot service.')">
    <meta property="og:image" content="{{ $restaurant->cover_image ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80' }}">
    <meta property="og:url" content="{{ url()->current() }}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@yield('title', 'Spice & Hearth Bistro | Order Ahead & Dine Without Waiting')">
    <meta name="twitter:description" content="@yield('meta_description', 'Fresh gourmet feasts prepared before you arrive. Pre-order your meal and enjoy instant hot service.')">
    <meta name="twitter:image" content="{{ $restaurant->cover_image ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80' }}">

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json">
    {!! json_encode([
        '@context' => 'https://schema.org',
        '@type' => 'Restaurant',
        'name' => $restaurant->name ?? 'Spice & Hearth Bistro',
        'image' => $restaurant->cover_image ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
        'telephone' => $restaurant->phone ?? '+91 98765 43210',
        'email' => $restaurant->email ?? 'concierge@spiceandhearth.com',
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => $restaurant->address ?? '452 Indiranagar 100ft Road',
            'addressLocality' => 'Bengaluru',
            'addressRegion' => 'Karnataka',
            'postalCode' => '560038',
            'addressCountry' => 'IN'
        ],
        'servesCuisine' => ['North Indian', 'Awadhi', 'Woodfired Pizza', 'Tandoori', 'Artisanal Desserts'],
        'priceRange' => '₹₹',
        'acceptsReservations' => 'True',
        'hasMenu' => url('/') . '#menu'
    ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <!-- Tailwind CSS with custom configuration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#fff7ed',
                            100: '#ffedd5',
                            200: '#fed7aa',
                            300: '#fdba74',
                            400: '#fb923c',
                            500: '#f97316',
                            600: '#ea580c',
                            700: '#c2410c',
                            800: '#9a3412',
                            900: '#7c2d12',
                        },
                        amberbistro: {
                            400: '#fbbf24',
                            500: '#f59e0b',
                            600: '#d97706',
                        },
                        darkbg: '#0f141c',
                        cardbg: '#181f2a',
                    },
                    fontFamily: {
                        sans: ['Outfit', 'system-ui', 'sans-serif'],
                        serif: ['"Playfair Display"', 'Georgia', 'serif'],
                    }
                }
            }
        }
    </script>

    <!-- React 18 & ReactDOM 18 from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Chart.js for analytics -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #faf9f6;
            color: #1f2937;
        }
        .font-serif {
            font-family: 'Playfair Display', Georgia, serif;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        @@keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .animate-pulse-subtle {
            animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    </style>

    @php
        $initialAuth = Auth::check() ? [
            'authenticated' => true,
            'user' => [
                'id' => Auth::user()->id,
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
                'phone' => Auth::user()->phone,
                'role' => Auth::user()->role,
                'preferences' => Auth::user()->preferences,
            ]
        ] : ['authenticated' => false, 'user' => null];
    @endphp

    <script>
        // Global pre-injected state
        window.__CSRF_TOKEN__ = "{{ csrf_token() }}";
        window.__INITIAL_AUTH__ = @json($initialAuth);
        window.__RESTAURANT__ = @json($restaurant ?? null);

        // Global fetch interceptor: injects CSRF token and ngrok bypass header on all AJAX calls
        const _nativeFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            options = options || {};
            options.headers = options.headers || {};
            if (typeof options.headers.set === 'function') {
                options.headers.set('ngrok-skip-browser-warning', 'true');
                if (window.__CSRF_TOKEN__) options.headers.set('X-CSRF-TOKEN', window.__CSRF_TOKEN__);
            } else {
                options.headers['ngrok-skip-browser-warning'] = 'true';
                if (window.__CSRF_TOKEN__) options.headers['X-CSRF-TOKEN'] = window.__CSRF_TOKEN__;
            }
            return _nativeFetch(url, options);
        };
    </script>
</head>
<body class="min-h-screen flex flex-col bg-stone-50 text-stone-900 antialiased selection:bg-orange-500 selection:text-white">
    @yield('content')

    <script>
        // Trigger lucide icon rendering whenever DOM updates
        document.addEventListener('DOMContentLoaded', () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    </script>
    @stack('scripts')
</body>
</html>
