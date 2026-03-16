<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Notification;
use App\Models\ActivityLog;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $profile = Profile::where('user_id', $request->user()->id)->first();
        if (!$profile) return response()->json(['error' => 'Profile not found'], 404);
        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $v = Validator::make($request->all(), [
            'first_name'    => 'nullable|string|max:100|regex:/^[\pL\s\'\-]+$/u',
            'last_name'     => 'nullable|string|max:100|regex:/^[\pL\s\'\-]+$/u',
            'middle_name'   => 'nullable|string|max:100',
            'phone'         => 'nullable|string|max:20|regex:/^[\+0-9\s\-]+$/',
            'city'          => 'nullable|string|max:100',
            'address'       => 'nullable|string|max:255',
            'gender'        => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date|before:today',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        $profile = Profile::where('user_id', $request->user()->id)->first();
        if (!$profile) return response()->json(['error' => 'Profile not found'], 404);

        // Only allow safe fields — never allow direct kyc_status, status, role changes
        $allowed = array_intersect_key(
            $request->only(['first_name', 'last_name', 'middle_name', 'phone', 'city', 'address', 'gender', 'date_of_birth']),
            array_flip(['first_name', 'last_name', 'middle_name', 'phone', 'city', 'address', 'gender', 'date_of_birth'])
        );

        $profile->update(array_filter($allowed, fn($v) => $v !== null));

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'profile_updated',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'profile' => $profile->fresh()]);
    }

    /**
     * POST /api/v1/profile/kyc
     * Upload KYC documents (ID front, back, selfie)
     */
    public function uploadKyc(Request $request)
    {
        $v = Validator::make($request->all(), [
            'id_front' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'id_back'  => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'selfie'   => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'id_front.required' => 'Front of ID document is required.',
            'id_back.required'  => 'Back of ID document is required.',
            'selfie.required'   => 'A selfie photo is required.',
            '*.mimes'           => 'Only JPG, PNG and WebP images are accepted.',
            '*.max'             => 'Each file must be under 5MB.',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        $profile = Profile::where('user_id', $request->user()->id)->first();
        if (!$profile) return response()->json(['error' => 'Profile not found'], 404);

        // Prevent re-upload if already approved
        if ($profile->kyc_status === 'approved') {
            return response()->json(['error' => 'KYC already approved. Contact support for changes.'], 400);
        }

        $updates = [];
        $userId = $request->user()->id;

        foreach (['id_front' => 'id_front_url', 'id_back' => 'id_back_url', 'selfie' => 'selfie_url'] as $field => $col) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                // Validate file is actually an image (anti-spoofing)
                $mime = $file->getMimeType();
                if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'])) {
                    return response()->json(['error' => "Invalid file type for {$field}"], 422);
                }
                $path = $file->store("kyc/{$userId}", 'public');
                $updates[$col] = "/storage/{$path}";
            }
        }

        if (!empty($updates)) {
            $updates['kyc_status'] = 'pending';
            $updates['kyc_rejection_reason'] = null; // Clear any previous rejection
            $profile->update($updates);
        }

        Notification::create([
            'user_id' => $userId,
            'title'   => 'KYC Documents Submitted',
            'message' => 'Your documents have been submitted for review. You will be notified once verified.',
            'type'    => 'info',
        ]);

        ActivityLog::create([
            'actor_id'   => $userId,
            'action'     => 'kyc_documents_uploaded',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'KYC documents submitted for review.']);
    }
}
