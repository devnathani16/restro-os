<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => true, 'notifications' => [], 'unread_count' => 0]);
        }

        $query = Notification::latest();

        if ($user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('role', 'admin')->orWhere('user_id', $user->id);
            });
        } elseif ($user->isKitchen()) {
            $query->where(function ($q) use ($user) {
                $q->where('role', 'kitchen_staff')->orWhere('role', 'admin')->orWhere('user_id', $user->id);
            });
        } else {
            $query->where('user_id', $user->id);
        }

        $notifications = $query->take(20)->get();
        $unreadCount = $notifications->where('read', false)->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->read = true;
        $notification->save();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            Notification::where(function ($q) use ($user) {
                if ($user->isAdmin()) {
                    $q->where('role', 'admin')->orWhere('user_id', $user->id);
                } elseif ($user->isKitchen()) {
                    $q->where('role', 'kitchen_staff')->orWhere('role', 'admin')->orWhere('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id);
                }
            })->update(['read' => true]);
        }

        return response()->json(['success' => true]);
    }
}
