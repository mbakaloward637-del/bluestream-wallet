<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\ActivityLog;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BulkNotificationController extends Controller
{
    /**
     * POST /api/v1/admin/notifications/bulk
     * Send notification to all users or a filtered group
     */
    public function sendBulk(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string',
            'filter' => 'nullable|in:all,active,country',
            'country' => 'nullable|string',
        ]);

        $filter = $request->filter ?? 'all';
        $query = Profile::query();

        if ($filter === 'active') {
            $query->where('status', 'active');
        } elseif ($filter === 'country' && $request->country) {
            $query->where('country', $request->country);
        }

        $userIds = $query->pluck('user_id');
        $now = now();
        $type = $request->type ?? 'announcement';

        $inserts = $userIds->map(fn($uid) => [
            'id' => Str::uuid()->toString(),
            'user_id' => $uid,
            'title' => $request->title,
            'message' => $request->message,
            'type' => $type,
            'read' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        // Batch insert in chunks of 500
        foreach (array_chunk($inserts, 500) as $chunk) {
            Notification::insert($chunk);
        }

        ActivityLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'bulk_notification',
            'target' => "filter:{$filter}",
            'ip_address' => $request->ip(),
            'metadata' => ['title' => $request->title, 'recipients' => count($inserts)],
        ]);

        return response()->json([
            'success' => true,
            'recipients' => count($inserts),
        ]);
    }

    /**
     * POST /api/v1/admin/sms/bulk
     * Send bulk SMS via TalkSasa
     */
    public function sendBulkSms(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:480',
            'filter' => 'nullable|in:all,active,country',
            'country' => 'nullable|string',
            'phone_numbers' => 'nullable|array',
        ]);

        if (!config('services.talksasa.api_token')) {
            return response()->json(['error' => 'SMS provider not configured'], 503);
        }

        // Get phone numbers
        if ($request->phone_numbers && count($request->phone_numbers)) {
            $phones = $request->phone_numbers;
        } else {
            $filter = $request->filter ?? 'all';
            $query = Profile::whereNotNull('phone')->where('phone', '!=', '');
            if ($filter === 'active') $query->where('status', 'active');
            if ($filter === 'country' && $request->country) $query->where('country', $request->country);
            $phones = $query->pluck('phone')->toArray();
        }

        if (empty($phones)) {
            return response()->json(['error' => 'No phone numbers found'], 400);
        }

        // Send via TalkSasa
        $sent = 0;
        $failed = 0;

        foreach (array_chunk($phones, 100) as $batch) {
            $results = SmsService::sendBulk($batch, $request->message);
            $sent += $results['sent'];
            $failed += $results['failed'];
        }

        ActivityLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'bulk_sms',
            'ip_address' => $request->ip(),
            'metadata' => ['sent' => $sent, 'failed' => $failed, 'total' => count($phones)],
        ]);

        return response()->json([
            'success' => true,
            'sent' => $sent,
            'failed' => $failed,
            'total' => count($phones),
        ]);
    }
}
