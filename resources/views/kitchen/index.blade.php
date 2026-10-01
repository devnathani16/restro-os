@extends('layouts.base')

@section('title', 'Kitchen Display System (KDS) | Spice & Hearth Bistro')

@section('content')
<div id="kitchen-root">
    <div class="min-h-screen flex items-center justify-center bg-stone-950 text-stone-200">
        <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
</div>

@push('scripts')
<script src="/js/kitchen-app.js?v={{ filemtime(public_path('js/kitchen-app.js')) }}"></script>
@endpush
@endsection
