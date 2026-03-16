<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VirtualCard;
use App\Models\Wallet;
use App\Models\Notification;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VirtualCardController extends Controller
{
    /**
     * GET /api/v1/card
     */
    public function show(Request $request)
    {
        $card = VirtualCard::where('user_id', $request->user()->id)->first();
        if (!$card) {
            return response()->json(['has_card' => false]);
        }

        return response()->json([
            'has_card'        => true,
            'card'            => [
                'id'              => $card->id,
                'card_number'     => $card->card_number,
                'last_four'       => substr($card->card_number, -4),
                'masked_number'   => '•••• •••• •••• ' . substr($card->card_number, -4),
                'cvv'             => $card->cvv,
                'expiry'          => $card->expiry,
                'cardholder_name' => $card->cardholder_name,
                'provider'        => $card->provider,
                'is_frozen'       => $card->is_frozen,
                'created_at'      => $card->created_at,
            ],
        ]);
    }

    /**
     * POST /api/v1/card/create
     */
    public function create(Request $request)
    {
        $user = $request->user();

        // Check if user already has a card
        if (VirtualCard::where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'You already have a virtual card'], 400);
        }

        // KYC must be approved
        $profile = $user->profile;
        if (!$profile || $profile->kyc_status !== 'approved') {
            return response()->json(['error' => 'KYC verification required before creating a virtual card'], 400);
        }

        // Generate card details
        $cardNumber = $this->generateCardNumber();
        $cvv        = str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
        $expiry     = now()->addYears(3)->format('m/y');
        $name       = strtoupper(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? ''));

        $card = VirtualCard::create([
            'user_id'         => $user->id,
            'card_number'     => $cardNumber,
            'cvv'             => $cvv,
            'expiry'          => $expiry,
            'cardholder_name' => $name,
            'provider'        => 'abanremit',
            'is_frozen'       => false,
        ]);

        Notification::create([
            'user_id' => $user->id,
            'title'   => 'Virtual Card Created',
            'message' => 'Your virtual card has been created successfully. View it in the Card section.',
            'type'    => 'info',
        ]);

        ActivityLog::create([
            'actor_id'   => $user->id,
            'action'     => 'virtual_card_created',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'card'    => [
                'id'              => $card->id,
                'card_number'     => $card->card_number,
                'last_four'       => substr($card->card_number, -4),
                'masked_number'   => '•••• •••• •••• ' . substr($card->card_number, -4),
                'cvv'             => $card->cvv,
                'expiry'          => $card->expiry,
                'cardholder_name' => $card->cardholder_name,
                'is_frozen'       => false,
            ],
        ], 201);
    }

    /**
     * PUT /api/v1/card/freeze
     */
    public function toggleFreeze(Request $request)
    {
        $card = VirtualCard::where('user_id', $request->user()->id)->first();
        if (!$card) return response()->json(['error' => 'No virtual card found'], 404);

        $card->update(['is_frozen' => !$card->is_frozen]);
        $status = $card->is_frozen ? 'frozen' : 'unfrozen';

        Notification::create([
            'user_id' => $request->user()->id,
            'title'   => 'Card ' . ucfirst($status),
            'message' => "Your virtual card has been {$status}.",
            'type'    => 'info',
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => "card_{$status}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'is_frozen' => $card->is_frozen]);
    }

    /**
     * Generate a Visa-like card number (starts with 4)
     */
    private function generateCardNumber(): string
    {
        do {
            $prefix = '4' . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
            $middle = str_pad(rand(0, 99999999), 8, '0', STR_PAD_LEFT);
            $partial = $prefix . $middle;

            // Luhn check digit
            $sum = 0;
            $alt = false;
            for ($i = strlen($partial) - 1; $i >= 0; $i--) {
                $n = (int) $partial[$i];
                if ($alt) {
                    $n *= 2;
                    if ($n > 9) $n -= 9;
                }
                $sum += $n;
                $alt = !$alt;
            }
            $check = (10 - ($sum % 10)) % 10;
            $cardNumber = $partial . $check;
        } while (VirtualCard::where('card_number', $cardNumber)->exists());

        return $cardNumber;
    }
}
