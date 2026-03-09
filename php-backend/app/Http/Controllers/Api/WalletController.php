<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        return response()->json($wallet);
    }

    public function setPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:6',
            'current_pin' => 'nullable|string',
        ]);

        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        if ($wallet->pin_hash) {
            if (!$request->current_pin) return response()->json(['error' => 'Current PIN required'], 400);
            if (!$wallet->verifyPin($request->current_pin)) return response()->json(['error' => 'Current PIN is incorrect'], 403);
        }

        $wallet->setPin($request->pin);
        return response()->json(['success' => true]);
    }

    public function verifyPin(Request $request)
    {
        $request->validate(['pin' => 'required|string']);
        $wallet = Wallet::where('user_id', $request->user()->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        return response()->json(['valid' => $wallet->verifyPin($request->pin)]);
    }
}
