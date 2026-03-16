<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\ActivityLog;
use App\Models\Notification;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        return response()->json([
            'id'            => $wallet->id,
            'wallet_number' => $wallet->wallet_number,
            'balance'       => (float) $wallet->balance,
            'currency'      => $wallet->currency,
            'is_locked'     => $wallet->is_locked,
            'pin_set'       => !empty($wallet->pin_hash),
            'created_at'    => $wallet->created_at,
        ]);
    }

    public function setPin(Request $request)
    {
        $request->validate([
            'pin'         => 'required|string|min:4|max:6|regex:/^\d+$/',
            'current_pin' => 'nullable|string',
        ]);

        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        if ($wallet->is_locked) {
            return response()->json(['error' => 'Wallet is locked. Contact support.'], 403);
        }

        if ($wallet->pin_hash) {
            if (!$request->current_pin) return response()->json(['error' => 'Current PIN required'], 400);
            if (!$wallet->verifyPin($request->current_pin)) {
                $wallet->increment('failed_pin_attempts');
                if ($wallet->failed_pin_attempts >= 5) {
                    $wallet->update(['is_locked' => true]);
                }
                return response()->json(['error' => 'Current PIN is incorrect'], 403);
            }
        }

        // Prevent setting sequential or repeated PINs
        if (preg_match('/^(\d)\1+$/', $request->pin)) {
            return response()->json(['error' => 'PIN cannot be all the same digit'], 400);
        }

        $wallet->setPin($request->pin);

        Notification::create([
            'user_id' => $request->user()->id,
            'title'   => $wallet->pin_hash ? 'PIN Changed' : 'PIN Set',
            'message' => 'Your wallet PIN has been updated successfully.',
            'type'    => 'security',
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => $wallet->pin_hash ? 'pin_changed' : 'pin_set',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function verifyPin(Request $request)
    {
        $request->validate(['pin' => 'required|string|min:4|max:6']);

        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        if ($wallet->is_locked) {
            return response()->json(['valid' => false, 'error' => 'Wallet is locked'], 403);
        }

        $valid = $wallet->verifyPin($request->pin);

        if (!$valid) {
            $wallet->increment('failed_pin_attempts');
            if ($wallet->failed_pin_attempts >= 5) {
                $wallet->update(['is_locked' => true]);
            }
        } else {
            if ($wallet->failed_pin_attempts > 0) {
                $wallet->update(['failed_pin_attempts' => 0]);
            }
        }

        return response()->json(['valid' => $valid]);
    }
}
