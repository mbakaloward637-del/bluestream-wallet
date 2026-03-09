<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $profile = Profile::where('user_id', $request->user()->id)->first();
        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $profile = Profile::where('user_id', $request->user()->id)->first();
        if (!$profile) return response()->json(['error' => 'Profile not found'], 404);

        $profile->update($request->only([
            'first_name', 'last_name', 'middle_name', 'phone',
            'city', 'address', 'gender', 'date_of_birth',
        ]));

        return response()->json(['success' => true, 'profile' => $profile->fresh()]);
    }

    public function uploadKyc(Request $request)
    {
        $request->validate([
            'id_front' => 'nullable|image|max:5120',
            'id_back' => 'nullable|image|max:5120',
            'selfie' => 'nullable|image|max:5120',
        ]);

        $profile = Profile::where('user_id', $request->user()->id)->first();
        $updates = [];

        foreach (['id_front' => 'id_front_url', 'id_back' => 'id_back_url', 'selfie' => 'selfie_url'] as $field => $col) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store("kyc/{$request->user()->id}", 'public');
                $updates[$col] = "/storage/{$path}";
            }
        }

        if (!empty($updates)) {
            $updates['kyc_status'] = 'pending';
            $profile->update($updates);
        }

        return response()->json(['success' => true]);
    }
}
