<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->where('read', false);
        }

        $notifications = $query->paginate($request->get('limit', 50));
        $unreadCount   = Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $updated = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->update(['read' => true]);

        if (!$updated) return response()->json(['error' => 'Notification not found'], 404);

        return response()->json(['success' => true]);
    }

    /**
     * PUT /api/v1/notifications/read-all
     * Mark all notifications as read
     */
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }
}
