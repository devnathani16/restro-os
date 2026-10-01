<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'role' => 'customer',
            'password' => Hash::make($validated['password']),
            'preferences' => [],
        ]);

        Auth::login($user);

        AuditLog::record($user, 'registered', 'user', (string) $user->id, "Customer registered account: {$user->email}");

        return response()->json([
            'success' => true,
            'message' => 'Registration successful! Welcome to Spice & Hearth Bistro.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'preferences' => $user->preferences,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember', true))) {
            $request->session()->regenerate();
            $user = Auth::user();

            AuditLog::record($user, 'login', 'user', (string) $user->id, "User logged in: {$user->email} ({$user->role})");

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'preferences' => $user->preferences,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid email or password. Please check your credentials.',
        ], 422);
    }

    public function quickLogin(Request $request)
    {
        $role = $request->input('role', 'customer');
        $user = match ($role) {
            'admin' => User::where('role', 'admin')->first(),
            'kitchen' => User::where('role', 'kitchen_staff')->first(),
            default => User::where('role', 'customer')->first(),
        };

        if (! $user) {
            // Auto-recreate essential staff users if they were wiped
            if ($role === 'admin') {
                $user = User::create([
                    'name' => 'Chef Vikram Anand',
                    'email' => 'admin@spiceandhearth.com',
                    'phone' => '+91 98000 12345',
                    'role' => 'admin',
                    'password' => Hash::make('password123'),
                ]);
            } elseif ($role === 'kitchen') {
                $user = User::create([
                    'name' => 'Chef Ananya Sharma',
                    'email' => 'kitchen@spiceandhearth.com',
                    'phone' => '+91 98000 54321',
                    'role' => 'kitchen_staff',
                    'password' => Hash::make('password123'),
                ]);
            } else {
                return response()->json(['success' => false, 'message' => "Demo user for role '{$role}' not found."], 404);
            }
        }

        Auth::login($user);
        $request->session()->regenerate();

        AuditLog::record($user, 'login', 'user', (string) $user->id, "Quick demo login as {$user->role}");

        return response()->json([
            'success' => true,
            'message' => "Logged in as {$user->name} ({$user->role}).",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'preferences' => $user->preferences,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            AuditLog::record($user, 'logout', 'user', (string) $user->id, 'User logged out');
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json([
                'authenticated' => false,
                'user' => null,
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'preferences' => $user->preferences,
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'required|string|max:20',
            'preferences' => 'nullable|array',
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:6',
        ]);

        if (! empty($validated['current_password']) && ! empty($validated['new_password'])) {
            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided current password does not match.',
                ], 422);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'];
        if (isset($validated['preferences'])) {
            $user->preferences = $validated['preferences'];
        }
        $user->save();

        AuditLog::record($user, 'updated', 'user', (string) $user->id, 'Customer updated profile details');

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'preferences' => $user->preferences,
            ],
        ]);
    }
}
