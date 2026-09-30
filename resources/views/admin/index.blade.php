@extends('layouts.base')

@section('title', 'Admin Executive Suite | Spice & Hearth Bistro')

@section('content')
<div id="admin-root">
    <div class="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200">
        <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
</div>

@push('scripts')
<script src="{{ asset('js/admin-app.js') }}?v={{ filemtime(public_path('js/admin-app.js')) }}"></script>
@endpush
@endsection
