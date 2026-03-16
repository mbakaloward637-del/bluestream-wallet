<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Notification;
use App\Models\FeeConfig;
use App\Models\Profile;
use App\Models\ActivityLog;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    /**
     * GET /api/v1/transactions
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $query = Transaction::where(function ($q) use ($userId) {
            $q->where('sender_user_id', $userId)
              ->orWhere('receiver_user_id', $userId);
        })->orderBy('created_at', 'desc');

        if ($request->type) $query->where('type', $request->type);
        if ($request->status) $query->where('status', $request->status);
        if ($request->from_date) $query->whereDate('created_at', '>=', $request->from_date);
        if ($request->to_date) $query->whereDate('created_at', '<=', $request->to_date);

        return response()->json($query->paginate($request->get('limit', 50)));
    }

    /**
     * POST /api/v1/transactions/transfer
     */
    public function transfer(Request $request)
    {
        $v = Validator::make($request->all(), [
            'recipient_wallet' => 'nullable|string|max:20',
            'recipient_phone'  => 'nullable|string|max:20',
            'amount'           => 'required|numeric|min:10|max:500000',
            'pin'              => 'required|string|min:4|max:6|regex:/^\d+$/',
            'description'      => 'nullable|string|max:255',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        if (!$request->recipient_wallet && !$request->recipient_phone) {
            return response()->json(['error' => 'Provide recipient wallet number or phone'], 422);
        }

        $user   = $request->user();
        $amount = (float) $request->amount;

        // Check KYC for large transfers
        $profile = $user->profile;
        if ($amount > 50000 && (!$profile || $profile->kyc_status !== 'approved')) {
            return response()->json(['error' => 'KYC verification required for transfers above KES 50,000'], 403);
        }

        return DB::transaction(function () use ($user, $request, $amount) {
            $senderWallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();

            if (!$senderWallet) return response()->json(['success' => false, 'error' => 'Wallet not found'], 404);
            if ($senderWallet->is_locked) return response()->json(['success' => false, 'error' => 'Your wallet is locked. Contact support.'], 403);
            if (!$senderWallet->pin_hash) return response()->json(['success' => false, 'error' => 'Wallet PIN not set. Please set your PIN first.'], 400);

            // Verify PIN
            if (!$senderWallet->verifyPin($request->pin)) {
                $senderWallet->increment('failed_pin_attempts');
                if ($senderWallet->failed_pin_attempts >= 5) {
                    $senderWallet->update(['is_locked' => true]);

                    \App\Models\SecurityAlert::create([
                        'type'        => 'failed_pin',
                        'user_id'     => $user->id,
                        'description' => 'Wallet locked after 5 failed PIN attempts',
                        'severity'    => 'high',
                    ]);

                    Notification::create([
                        'user_id' => $user->id,
                        'title'   => 'Wallet Locked',
                        'message' => 'Your wallet has been locked due to too many failed PIN attempts. Contact support.',
                        'type'    => 'security',
                    ]);
                }
                return response()->json(['success' => false, 'error' => 'Invalid PIN. ' . (5 - $senderWallet->failed_pin_attempts) . ' attempts remaining.'], 403);
            }

            if ($senderWallet->failed_pin_attempts > 0) {
                $senderWallet->update(['failed_pin_attempts' => 0]);
            }

            // Find receiver
            $receiverWallet = null;
            if ($request->recipient_wallet) {
                $receiverWallet = Wallet::where('wallet_number', $request->recipient_wallet)->lockForUpdate()->first();
            } elseif ($request->recipient_phone) {
                $rProfile = Profile::where('phone', $request->recipient_phone)->first();
                if ($rProfile) $receiverWallet = Wallet::where('user_id', $rProfile->user_id)->lockForUpdate()->first();
            }

            if (!$receiverWallet) return response()->json(['success' => false, 'error' => 'Recipient not found'], 404);
            if ($senderWallet->id === $receiverWallet->id) return response()->json(['success' => false, 'error' => 'Cannot send to yourself'], 400);

            // Check receiver status
            $receiverProfile = Profile::where('user_id', $receiverWallet->user_id)->first();
            if ($receiverProfile && in_array($receiverProfile->status, ['suspended', 'banned'])) {
                return response()->json(['success' => false, 'error' => 'Recipient account is not active'], 400);
            }

            $fee        = $this->calculateFee('send', $amount);
            $totalDebit = $amount + $fee;

            if ($senderWallet->balance < $totalDebit) {
                return response()->json(['success' => false, 'error' => 'Insufficient balance. You need ' . $senderWallet->currency . ' ' . number_format($totalDebit, 2)], 400);
            }

            $senderWallet->decrement('balance', $totalDebit);
            $receiverWallet->increment('balance', $amount);

            $receiverName = $receiverProfile ? trim($receiverProfile->first_name . ' ' . $receiverProfile->last_name) : 'Unknown';
            $senderProfile = Profile::where('user_id', $user->id)->first();
            $senderName    = $senderProfile ? trim($senderProfile->first_name . ' ' . $senderProfile->last_name) : 'Unknown';

            $ref = 'TRF' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

            // Sender record
            Transaction::create([
                'reference' => $ref, 'type' => 'send',
                'sender_user_id' => $user->id, 'sender_wallet_id' => $senderWallet->id,
                'receiver_user_id' => $receiverWallet->user_id, 'receiver_wallet_id' => $receiverWallet->id,
                'amount' => $amount, 'fee' => $fee, 'currency' => $senderWallet->currency,
                'description' => $request->description ?? "Sent to {$receiverName}",
                'status' => 'completed',
            ]);

            // Receiver record
            Transaction::create([
                'reference' => $ref . '-R', 'type' => 'receive',
                'sender_user_id' => $user->id, 'sender_wallet_id' => $senderWallet->id,
                'receiver_user_id' => $receiverWallet->user_id, 'receiver_wallet_id' => $receiverWallet->id,
                'amount' => $amount, 'fee' => 0, 'currency' => $senderWallet->currency,
                'description' => "Received from {$senderName}", 'status' => 'completed',
            ]);

            // Notify receiver
            Notification::create([
                'user_id' => $receiverWallet->user_id,
                'title'   => 'Money Received',
                'message' => "You received {$senderWallet->currency} " . number_format($amount, 2) . " from {$senderName}. Ref: {$ref}",
                'type'    => 'transaction',
            ]);

            // Notify sender
            Notification::create([
                'user_id' => $user->id,
                'title'   => 'Money Sent',
                'message' => "You sent {$senderWallet->currency} " . number_format($amount, 2) . " to {$receiverName}. Fee: {$senderWallet->currency} " . number_format($fee, 2) . ". Ref: {$ref}",
                'type'    => 'transaction',
            ]);

            // SMS notifications
            if ($receiverProfile && $receiverProfile->phone) {
                SmsService::send($receiverProfile->phone, "You received {$senderWallet->currency} " . number_format($amount, 2) . " from {$senderName} on AbanRemit. Ref: {$ref}");
            }
            if ($senderProfile && $senderProfile->phone) {
                SmsService::send($senderProfile->phone, "You sent {$senderWallet->currency} " . number_format($amount, 2) . " to {$receiverName}. New balance: {$senderWallet->currency} " . number_format($senderWallet->fresh()->balance, 2) . ". Ref: {$ref}");
            }

            ActivityLog::create([
                'actor_id'   => $user->id,
                'action'     => 'transfer',
                'ip_address' => request()->ip(),
                'metadata'   => ['ref' => $ref, 'amount' => $amount, 'fee' => $fee, 'receiver' => $receiverWallet->user_id],
            ]);

            return response()->json([
                'success'        => true,
                'reference'      => $ref,
                'amount'         => $amount,
                'fee'            => $fee,
                'currency'       => $senderWallet->currency,
                'recipient_name' => $receiverName,
                'new_balance'    => $senderWallet->fresh()->balance,
            ]);
        });
    }

    /**
     * POST /api/v1/transactions/deposit
     */
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1|max:1000000',
            'method' => 'required|in:card,mpesa,bank',
        ]);

        $user   = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $providerMap = ['card' => 'Paystack', 'mpesa' => 'M-Pesa', 'bank' => 'Bank Transfer'];
        $ref    = 'DEP' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        $amount = (float) $request->amount;

        if ($request->method === 'card') {
            // For card: create pending transaction, return Paystack initialize data
            Transaction::create([
                'reference'          => $ref,
                'type'               => 'deposit',
                'receiver_user_id'   => $user->id,
                'receiver_wallet_id' => $wallet->id,
                'amount'             => $amount,
                'currency'           => $wallet->currency,
                'description'        => 'Card Deposit (pending)',
                'status'             => 'pending',
                'method'             => 'card',
                'provider'           => 'Paystack',
                'metadata'           => ['user_id' => $user->id],
            ]);

            return response()->json([
                'success'    => true,
                'reference'  => $ref,
                'amount'     => $amount,
                'amount_kobo' => (int)($amount * 100), // Paystack uses kobo
                'currency'   => $wallet->currency,
                'email'      => $user->email,
                'method'     => 'card',
                'message'    => 'Proceed to Paystack payment.',
            ]);
        }

        // For M-Pesa: redirect to STK Push endpoint
        if ($request->method === 'mpesa') {
            return response()->json([
                'success' => true,
                'method'  => 'mpesa',
                'message' => 'Use the M-Pesa STK Push endpoint for M-Pesa deposits.',
            ]);
        }

        // Bank: create pending transaction (manual processing)
        Transaction::create([
            'reference'          => $ref,
            'type'               => 'deposit',
            'receiver_user_id'   => $user->id,
            'receiver_wallet_id' => $wallet->id,
            'amount'             => $amount,
            'currency'           => $wallet->currency,
            'description'        => 'Bank Transfer Deposit (pending)',
            'status'             => 'pending',
            'method'             => 'bank',
            'provider'           => 'Bank Transfer',
        ]);

        return response()->json([
            'success'   => true,
            'reference' => $ref,
            'amount'    => $amount,
            'currency'  => $wallet->currency,
            'method'    => 'bank',
            'message'   => 'Bank deposit created. It will be confirmed once payment is received.',
        ]);
    }

    /**
     * POST /api/v1/transactions/withdraw
     */
    public function withdraw(Request $request)
    {
        $v = Validator::make($request->all(), [
            'amount'      => 'required|numeric|min:100|max:500000',
            'method'      => 'required|in:bank,mobile,mpesa',
            'destination' => 'required|string|max:100',
            'pin'         => 'required|string|min:4|max:6|regex:/^\d+$/',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        $user   = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        if (!$wallet->verifyPin($request->pin)) {
            $wallet->increment('failed_pin_attempts');
            if ($wallet->failed_pin_attempts >= 5) {
                $wallet->update(['is_locked' => true]);
            }
            return response()->json(['success' => false, 'error' => 'Invalid PIN'], 403);
        }

        if ($wallet->failed_pin_attempts > 0) {
            $wallet->update(['failed_pin_attempts' => 0]);
        }

        $amount     = (float) $request->amount;
        $fee        = $this->calculateFee('withdraw', $amount);
        $totalDebit = $amount + $fee;

        if ($wallet->balance < $totalDebit) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $wallet->decrement('balance', $totalDebit);
        $ref = 'WDR' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);

        \App\Models\WithdrawalRequest::create([
            'user_id'     => $user->id,
            'wallet_id'   => $wallet->id,
            'amount'      => $amount,
            'currency'    => $wallet->currency,
            'method'      => $request->method,
            'destination' => $request->destination,
            'status'      => 'pending',
        ]);

        Transaction::create([
            'reference'        => $ref,
            'type'             => 'withdraw',
            'sender_user_id'   => $user->id,
            'sender_wallet_id' => $wallet->id,
            'amount'           => $amount,
            'fee'              => $fee,
            'currency'         => $wallet->currency,
            'description'      => "Withdrawal to {$request->destination}",
            'status'           => 'pending',
            'method'           => $request->method,
        ]);

        Notification::create([
            'user_id' => $user->id,
            'title'   => 'Withdrawal Submitted',
            'message' => "Your withdrawal of {$wallet->currency} " . number_format($amount, 2) . " is being processed. Ref: {$ref}",
            'type'    => 'transaction',
        ]);

        $profile = Profile::where('user_id', $user->id)->first();
        if ($profile && $profile->phone) {
            SmsService::send($profile->phone, "AbanRemit withdrawal of {$wallet->currency} " . number_format($amount, 2) . " submitted. Ref: {$ref}");
        }

        ActivityLog::create([
            'actor_id'   => $user->id,
            'action'     => 'withdrawal_request',
            'ip_address' => $request->ip(),
            'metadata'   => ['ref' => $ref, 'amount' => $amount, 'method' => $request->method],
        ]);

        return response()->json([
            'success'   => true,
            'reference' => $ref,
            'amount'    => $amount,
            'fee'       => $fee,
            'currency'  => $wallet->currency,
        ]);
    }

    /**
     * POST /api/v1/transactions/exchange
     */
    public function exchange(Request $request)
    {
        $request->validate([
            'amount'        => 'required|numeric|min:1|max:1000000',
            'from_currency' => 'required|string|max:5',
            'to_currency'   => 'required|string|max:5',
        ]);

        $user   = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) return response()->json(['error' => 'Wallet not found'], 404);

        $amount = (float) $request->amount;

        if (strtoupper($request->from_currency) !== $wallet->currency) {
            return response()->json(['error' => 'Can only exchange from your wallet currency'], 400);
        }
        if (strtoupper($request->from_currency) === strtoupper($request->to_currency)) {
            return response()->json(['error' => 'Cannot exchange to the same currency'], 400);
        }
        if ($wallet->balance < $amount) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $rate = \App\Models\ExchangeRate::where('from_currency', strtoupper($request->from_currency))
            ->where('to_currency', strtoupper($request->to_currency))
            ->where('is_active', true)->first();

        if (!$rate) return response()->json(['error' => 'Exchange rate not available for this pair'], 400);

        $effectiveRate = $rate->rate * (1 - ($rate->margin_percent / 100));
        $converted     = round($amount * $effectiveRate, 2);
        $fee           = $this->calculateFee('exchange', $amount);

        if ($wallet->balance < ($amount + $fee)) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance including fee'], 400);
        }

        $wallet->decrement('balance', $amount + $fee);
        $wallet->increment('balance', $converted);

        $ref = 'EXC' . time() . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        Transaction::create([
            'reference'          => $ref,
            'type'               => 'exchange',
            'sender_user_id'     => $user->id,
            'sender_wallet_id'   => $wallet->id,
            'receiver_user_id'   => $user->id,
            'receiver_wallet_id' => $wallet->id,
            'amount'             => $amount,
            'fee'                => $fee,
            'currency'           => strtoupper($request->from_currency),
            'description'        => strtoupper($request->from_currency) . ' → ' . strtoupper($request->to_currency) . ' Exchange',
            'status'             => 'completed',
            'metadata'           => [
                'to_currency'      => strtoupper($request->to_currency),
                'rate'             => $rate->rate,
                'effective_rate'   => $effectiveRate,
                'converted_amount' => $converted,
                'margin_percent'   => $rate->margin_percent,
            ],
        ]);

        Notification::create([
            'user_id' => $user->id,
            'title'   => 'Exchange Complete',
            'message' => "Exchanged {$request->from_currency} " . number_format($amount, 2) . " → {$request->to_currency} " . number_format($converted, 2) . ". Ref: {$ref}",
            'type'    => 'transaction',
        ]);

        return response()->json([
            'success'   => true,
            'reference' => $ref,
            'converted' => $converted,
            'rate'      => $effectiveRate,
            'fee'       => $fee,
        ]);
    }

    /**
     * POST /api/v1/recipients/lookup
     */
    public function lookupRecipient(Request $request)
    {
        $request->validate([
            'lookup_type'  => 'required|in:wallet,phone',
            'lookup_value' => 'required|string|max:50',
        ]);

        if ($request->lookup_type === 'wallet') {
            $wallet = Wallet::where('wallet_number', $request->lookup_value)->first();
            if (!$wallet) return response()->json(['found' => false]);

            $profile = Profile::where('user_id', $wallet->user_id)->first();
            if (!$profile || in_array($profile->status, ['banned', 'suspended'])) {
                return response()->json(['found' => false]);
            }

            return response()->json([
                'found'      => true,
                'name'       => trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')),
                'wallet'     => $wallet->wallet_number,
                'user_id'    => $wallet->user_id,
                'avatar_url' => $profile->avatar_url ?? null,
            ]);
        }

        $profile = Profile::where('phone', $request->lookup_value)->first();
        if (!$profile || in_array($profile->status, ['banned', 'suspended'])) {
            return response()->json(['found' => false]);
        }

        $wallet = Wallet::where('user_id', $profile->user_id)->first();
        return response()->json([
            'found'      => true,
            'name'       => trim($profile->first_name . ' ' . $profile->last_name),
            'wallet'     => $wallet->wallet_number ?? '',
            'user_id'    => $profile->user_id,
            'avatar_url' => $profile->avatar_url,
        ]);
    }

    private function calculateFee(string $transactionType, float $amount): float
    {
        $config = FeeConfig::where('transaction_type', $transactionType)->where('is_active', true)->first();
        if (!$config) return 0;

        if ($config->fee_type === 'flat') return (float)($config->flat_amount ?? 0);
        if ($config->fee_type === 'percentage') return round($amount * ($config->percentage ?? 0) / 100, 2);
        return 0;
    }
}
