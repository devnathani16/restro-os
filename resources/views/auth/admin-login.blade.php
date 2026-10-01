@extends('layouts.base')

@section('title', 'Sign In | Spice & Hearth Bistro')

@section('content')
<div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-stone-100">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" class="inline-flex items-center gap-3 group">
            <img src="{{ $restaurant->logo ?? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80' }}" 
                 alt="{{ $restaurant->name ?? 'Spice & Hearth' }}" 
                 class="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/80 shadow-lg group-hover:scale-105 transition">
            <div class="text-left">
                <h1 class="text-2xl font-serif font-bold text-white tracking-wide">{{ $restaurant->name ?? 'Spice & Hearth Bistro' }}</h1>
                <p class="text-xs text-orange-400 font-medium">Order Ahead & Kitchen Management</p>
            </div>
        </a>

        @if(str_contains($intended ?? '', 'admin'))
            <div class="mt-6 mx-4 sm:mx-0 p-3.5 bg-orange-950/70 border border-orange-500/50 rounded-2xl text-left flex items-start gap-3">
                <i data-lucide="shield-alert" class="w-5 h-5 text-orange-400 shrink-0 mt-0.5"></i>
                <div class="text-xs">
                    <p class="font-semibold text-orange-200">Administrator Access Required</p>
                    <p class="text-stone-300 mt-0.5">Please sign in as an Administrator to access the restaurant control center.</p>
                </div>
            </div>
        @elseif(str_contains($intended ?? '', 'kitchen'))
            <div class="mt-6 mx-4 sm:mx-0 p-3.5 bg-amber-950/70 border border-amber-500/50 rounded-2xl text-left flex items-start gap-3">
                <i data-lucide="utensils" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5"></i>
                <div class="text-xs">
                    <p class="font-semibold text-amber-200">Kitchen Display Staff Access Required</p>
                    <p class="text-stone-300 mt-0.5">Please sign in as Kitchen Staff or Administrator to view incoming order prep tickets.</p>
                </div>
            </div>
        @endif
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="bg-stone-900/90 border border-stone-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-md">
            
            <!-- 1-CLICK DEMO LOGIN BUTTONS -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold uppercase tracking-wider text-stone-400">1-Click Instant Demo Login</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ⚡ Instant Access
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-2.5">
                    <button type="button" onclick="quickLogin('admin')" 
                            class="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs shadow-md transition transform active:scale-98">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
                                <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
                            </div>
                            <div class="text-left">
                                <div class="font-bold">Sign In as Administrator</div>
                                <div class="text-[10px] text-orange-100">Chef Vikram Anand • Full Control</div>
                            </div>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 opacity-80"></i>
                    </button>

                    <button type="button" onclick="quickLogin('kitchen')" 
                            class="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-white font-medium text-xs transition transform active:scale-98">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <i data-lucide="chef-hat" class="w-4 h-4 text-amber-400"></i>
                            </div>
                            <div class="text-left">
                                <div class="font-bold text-stone-200">Sign In as Kitchen Lead</div>
                                <div class="text-[10px] text-stone-400">Chef Ananya Sharma • KDS Screen</div>
                            </div>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 text-stone-400"></i>
                    </button>

                    <button type="button" onclick="quickLogin('customer')" 
                            class="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-white font-medium text-xs transition transform active:scale-98">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <i data-lucide="user" class="w-4 h-4 text-orange-400"></i>
                            </div>
                            <div class="text-left">
                                <div class="font-bold text-stone-200">Sign In as Customer</div>
                                <div class="text-[10px] text-stone-400">Priya Patel • Pre-order & Cart</div>
                            </div>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 text-stone-400"></i>
                    </button>
                </div>
            </div>

            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-stone-800"></div>
                </div>
                <div class="relative flex justify-center text-xs">
                    <span class="px-3 bg-stone-900 text-stone-500 uppercase tracking-wider font-semibold">Or Email & Password</span>
                </div>
            </div>

            <!-- MANUAL LOGIN FORM -->
            <form id="loginForm" onsubmit="handleManualLogin(event)" class="space-y-4">
                <div id="errorMessage" class="hidden p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-xs text-rose-200"></div>

                <div>
                    <label class="block text-xs font-medium text-stone-300 mb-1">Email Address</label>
                    <input type="email" id="email" required placeholder="admin@spiceandhearth.com" 
                           class="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 transition">
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-xs font-medium text-stone-300">Password</label>
                        <span class="text-[10px] text-stone-500">Default: password123</span>
                    </div>
                    <input type="password" id="password" required placeholder="••••••••" 
                           class="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 transition">
                </div>

                <button type="submit" id="submitBtn" 
                        class="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                </button>
            </form>

            <div class="mt-6 pt-4 border-t border-stone-800 text-center">
                <a href="/" class="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1.5">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                    <span>Back to Food Menu & Pre-Ordering</span>
                </a>
            </div>

        </div>
    </div>
</div>

<script>
const intendedUrl = @json($intended ?? '/');

function quickLogin(role) {
    const btn = event.currentTarget;
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';

    fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ role: role })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Determine redirect
            if (intendedUrl && intendedUrl !== '/' && !intendedUrl.includes('login')) {
                window.location.href = intendedUrl;
            } else if (role === 'admin') {
                window.location.href = '/admin';
            } else if (role === 'kitchen') {
                window.location.href = '/kitchen';
            } else {
                window.location.href = '/';
            }
        } else {
            alert(data.message || 'Login failed.');
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    })
    .catch(err => {
        alert('Network error. Please try again.');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    });
}

function handleManualLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const errBox = document.getElementById('errorMessage');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.innerHTML = 'Signing in...';
    errBox.classList.add('hidden');

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            if (intendedUrl && intendedUrl !== '/' && !intendedUrl.includes('login')) {
                window.location.href = intendedUrl;
            } else if (data.user && data.user.role === 'admin') {
                window.location.href = '/admin';
            } else if (data.user && data.user.role === 'kitchen_staff') {
                window.location.href = '/kitchen';
            } else {
                window.location.href = '/';
            }
        } else {
            errBox.textContent = data.message || 'Invalid credentials.';
            errBox.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = '<span>Sign In</span>';
        }
    })
    .catch(err => {
        errBox.textContent = 'Server communication error. Please try again.';
        errBox.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span>';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();
});
</script>
@endsection
