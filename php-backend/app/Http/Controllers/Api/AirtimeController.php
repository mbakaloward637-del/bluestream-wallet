<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Notification;
use App\Models\FeeConfig;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AirtimeController extends Controller
{
    /**
     * POST /api/v1/airtime/purchase
     * Purchases airtime via Instalipa API
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10|max:10000',
            'phone' => 'required|string',
            'network' => 'required|in:Safaricom,Airtel,Telkom',
        ]);

        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $amount = (float) $request->amount;

        // Calculate fee
        $feeConfig = FeeConfig::where('transaction_type', 'airtime')->where('is_active', true)->first();
        $fee = 0;
        if ($feeConfig) {
            $fee = $feeConfig->fee_type === 'flat'
                ? (float)($feeConfig->flat_amount ?? 0)
                : round($amount * ($feeConfig->percentage ?? 0) / 100, 2);
        }

        $totalDebit = $amount + $fee;
        if ($wallet->balance < $totalDebit) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $ref = 'AIR' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $phone = $this->formatPhone($request->phone);

        return DB::transaction(function () use ($user, $wallet, $request, $amount, $fee, $totalDebit, $ref, $phone) {
            $wallet->decrement('balance', $totalDebit);

            $providerStatus = 'pending';
            $providerResponse = null;

            $consumerKey = config('services.instalipa.consumer_key');
            $consumerSecret = config('services.instalipa.consumer_secret');
            $apiUrl = config('services.instalipa.api_url');

            if ($consumerKey && $consumerSecret && $apiUrl) {
                try {
                    // Get Instalipa access token
                    $tokenResponse = Http::withBasicAuth($consumerKey, $consumerSecret)
                        ->timeout(15)
                        ->post("{$apiUrl}/oauth/token", [
                            'grant_type' => 'client_credentials',
                        ]);

                    $accessToken = $tokenResponse->json('access_token');

                    if (!$accessToken) {
                        throw new \Exception('Failed to get Instalipa access token');
                    }

                    // Purchase airtime
                    $response = Http::withToken($accessToken)
                        ->timeout(30)
                        ->post("{$apiUrl}/airtime/purchase", [
                            'phone_number' => $phone,
                            'amount' => $amount,
                            'reference' => $ref,
                            'callback_url' => config('services.instalipa.callback_url'),
                        ]);

                    $providerResponse = $response->json();

                    if ($response->successful() && ($providerResponse['status'] ?? '') === 'success') {
                        $providerStatus = 'completed';
                    } else {
                        $providerStatus = 'failed';
                        $wallet->increment('balance', $totalDebit);
                    }
                } catch (\Exception $e) {
                    Log::error('Instalipa airtime error: ' . $e->getMessage());
                    $providerStatus = 'failed';
                    $wallet->increment('balance', $totalDebit);
                }
            } else {
                // No provider configured — mark as completed (manual fulfillment)
                $providerStatus = 'completed';
                Log::warning('Instalipa not configured — airtime marked completed without provider call');
            }

            // Create transaction record
            Transaction::create([
                'reference' => $ref,
                'type' => 'airtime',
                'sender_user_id' => $user->id,
                'sender_wallet_id' => $wallet->id,
                'amount' => $amount,
                'fee' => $fee,
                'currency' => $wallet->currency,
                'description' => "{$request->network} airtime to {$request->phone}",
                'status' => $providerStatus,
                'provider' => 'Instalipa',
                'metadata' => [
                    'phone' => $request->phone,
                    'network' => $request->network,
                    'provider_response' => $providerResponse,
                ],
            ]);

            // Notify user
            Notification::create([
                'user_id' => $user->id,
                'title' => $providerStatus === 'completed' ? 'Airtime Sent' : 'Airtime Failed',
                'message' => $providerStatus === 'completed'
                    ? "KES {$amount} {$request->network} airtime sent to {$request->phone}"
                    : "Failed to send airtime. Amount refunded to wallet.",
                'type' => 'transaction',
            ]);

            // Send SMS confirmation
            if ($providerStatus === 'completed') {
                SmsService::send($request->phone, "You have received KES {$amount} airtime from AbanRemit. Ref: {$ref}");
            }

            if ($providerStatus === 'failed') {
                return response()->json([
                    'success' => false,
                    'error' => 'Airtime purchase failed. Amount refunded.',
                    'reference' => $ref,
                ], 400);
            }

            return response()->json([
                'success' => true,
                'reference' => $ref,
                'amount' => $amount,
                'fee' => $fee,
                'network' => $request->network,
                'phone' => $request->phone,
                'new_balance' => $wallet->fresh()->balance,
            ]);
        });
    }

    /**
     * GET /api/v1/airtime/networks
     */
    public function networks()
    {
        return response()->json([
            ['id' => 'safaricom', 'name' => 'Safaricom', 'min' => 10, 'max' => 10000],
            ['id' => 'airtel', 'name' => 'Airtel', 'min' => 10, 'max' => 10000],
            ['id' => 'telkom', 'name' => 'Telkom', 'min' => 10, 'max' => 10000],
        ]);
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
