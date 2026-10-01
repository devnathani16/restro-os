@extends('layouts.base')

@section('title', 'Live Order Tracker | Spice & Hearth Bistro')

@section('content')
<div id="track-root">
    <div class="min-h-screen flex items-center justify-center bg-stone-950 text-stone-200">
        <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
</div>

<script>
    window.__ORDER_NUMBER__ = @json($orderNumber ?? null);
</script>

@push('scripts')
<script src="/js/track-app.js?v={{ filemtime(public_path('js/track-app.js')) }}"></script>
@endpush
@endsection
