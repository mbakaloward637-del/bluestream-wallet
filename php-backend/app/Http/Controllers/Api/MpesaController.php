<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    /**
     * POST /api/v1/mpesa/stk-push
     * Initiates an STK Push for M-Pesa deposit
     */
    public function stkPush(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'amount' => 'required|numeric|min:1',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $phone = $this->formatPhone($request->phone);
        $amount = (int) $request->amount;

        // Get access token
        $token = $this->getAccessToken();
        if (!$token) return response()->json(['error' => 'M-Pesa service unavailable'], 503);

        $shortcode = config('services.mpesa.shortcode');
        $passkey = config('services.mpesa.passkey');
        $timestamp = now()->format('YmdHis');
        $password = base64_encode($shortcode . $passkey . $timestamp);
        $callbackUrl = config('services.mpesa.callback_url');

        $ref = 'MPD' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);

        try {
            $response = Http::withToken($token)->post(
                config('services.mpesa.base_url') . '/mpesa/stkpush/v1/processrequest',
                [
                    'BusinessShortCode' => $shortcode,
                    'Password' => $password,
                    'Timestamp' => $timestamp,
                    'TransactionType' => 'CustomerPayBillOnline',
                    'Amount' => $amount,
                    'PartyA' => $phone,
                    'PartyB' => $shortcode,
                    'PhoneNumber' => $phone,
                    'CallBackURL' => $callbackUrl,
                    'AccountReference' => $wallet->wallet_number,
                    'TransactionDesc' => 'Wallet Deposit',
                ]
            );

            $result = $response->json();

            if (($result['ResponseCode'] ?? '') === '0') {
                Transaction::create([
                    'reference' => $ref,
                    'type' => 'deposit',
                    'receiver_user_id' => $user->id,
                    'receiver_wallet_id' => $wallet->id,
                    'amount' => $amount,
                    'currency' => 'KES',
                    'description' => 'M-Pesa STK Push Deposit',
                    'status' => 'pending',
                    'method' => 'mpesa',
                    'provider' => 'M-Pesa',
                    'metadata' => [
                        'checkout_request_id' => $result['CheckoutRequestID'] ?? '',
                        'merchant_request_id' => $result['MerchantRequestID'] ?? '',
                        'phone' => $phone,
                    ],
                ]);

                return response()->json([
                    'success' => true,
                    'reference' => $ref,
                    'checkout_request_id' => $result['CheckoutRequestID'] ?? '',
                    'message' => 'STK Push sent. Please enter your M-Pesa PIN.',
                ]);
            }

            Log::error('M-Pesa STK Push failed', $result);
            return response()->json(['success' => false, 'error' => $result['errorMessage'] ?? 'STK Push failed'], 400);

        } catch (\Exception $e) {
            Log::error('M-Pesa STK Push exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'M-Pesa service error'], 500);
        }
    }

    /**
     * POST /api/v1/mpesa/b2c
     * Initiates B2C withdrawal to user's M-Pesa
     */
    public function b2c(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'amount' => 'required|numeric|min:10',
            'pin' => 'required|string|min:4|max:6',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);
        if (!$wallet->verifyPin($request->pin)) return response()->json(['error' => 'Invalid PIN'], 403);

        $amount = (int) $request->amount;
        if ($wallet->balance < $amount) {
            return response()->json(['error' => 'Insufficient balance'], 400);
        }

        $phone = $this->formatPhone($request->phone);
        $token = $this->getAccessToken();
        if (!$token) return response()->json(['error' => 'M-Pesa service unavailable'], 503);

        $ref = 'MPW' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);

        // Deduct immediately (refund on failure via webhook)
        $wallet->decrement('balance', $amount);

        try {
            $response = Http::withToken($token)->post(
                config('services.mpesa.base_url') . '/mpesa/b2c/v3/paymentrequest',
                [
                    'OriginatorConversationID' => $ref,
                    'InitiatorName' => config('services.mpesa.initiator_name'),
                    'SecurityCredential' => config('services.mpesa.security_credential'),
                    'CommandID' => 'BusinessPayment',
                    'Amount' => $amount,
                    'PartyA' => config('services.mpesa.shortcode'),
                    'PartyB' => $phone,
                    'Remarks' => 'Wallet Withdrawal',
                    'QueueTimeOutURL' => config('services.mpesa.b2c_timeout_url'),
                    'ResultURL' => config('services.mpesa.b2c_result_url'),
                    'Occasion' => 'Withdrawal',
                ]
            );

            $result = $response->json();

            Transaction::create([
                'reference' => $ref,
                'type' => 'withdraw',
                'sender_user_id' => $user->id,
                'sender_wallet_id' => $wallet->id,
                'amount' => $amount,
                'currency' => 'KES',
                'description' => "M-Pesa withdrawal to {$phone}",
                'status' => 'pending',
                'method' => 'mpesa',
                'provider' => 'M-Pesa',
                'metadata' => [
                    'conversation_id' => $result['ConversationID'] ?? '',
                    'originator_conversation_id' => $result['OriginatorConversationID'] ?? $ref,
                    'phone' => $phone,
                ],
            ]);

            return response()->json([
                'success' => true,
                'reference' => $ref,
                'message' => 'Withdrawal is being processed.',
            ]);

        } catch (\Exception $e) {
            $wallet->increment('balance', $amount);
            Log::error('M-Pesa B2C exception: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'M-Pesa service error'], 500);
        }
    }

    private function getAccessToken(): ?string
    {
        $key = config('services.mpesa.consumer_key');
        $secret = config('services.mpesa.consumer_secret');
        if (!$key || !$secret) return null;

        try {
            $response = Http::withBasicAuth($key, $secret)
                ->get(config('services.mpesa.base_url') . '/oauth/v1/generate?grant_type=client_credentials');
            return $response->json('access_token');
        } catch (\Exception $e) {
            Log::error('M-Pesa auth error: ' . $e->getMessage());
            return null;
        }
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) $phone = '254' . substr($phone, 1);
        if (str_starts_with($phone, '+')) $phone = substr($phone, 1);
        if (!str_starts_with($phone, '254')) $phone = '254' . $phone;
        return $phone;
    }
}
