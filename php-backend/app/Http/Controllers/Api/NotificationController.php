<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($notifications);
    }

    public function markRead(Request $request, string $id)
    {
        Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->update(['read' => true]);
        return response()->json(['success' => true]);
    }
}
