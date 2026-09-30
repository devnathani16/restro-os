@extends('layouts.base')

@section('title', 'Spice & Hearth Bistro | Fresh Gourmet Pre-Ordering')

@section('content')
<div id="root">
    <!-- Instant loading placeholder -->
    <div class="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200">
        <div class="text-center space-y-4">
            <div class="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 class="text-2xl font-serif text-orange-400 tracking-wide">Spice & Hearth Bistro</h2>
            <p class="text-xs text-stone-400">Loading your culinary pre-ordering experience...</p>
        </div>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/customer-app.js') }}?v={{ filemtime(public_path('js/customer-app.js')) }}"></script>
@endpush
@endsection
