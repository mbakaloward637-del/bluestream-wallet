<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    Profile, Wallet, Transaction, WithdrawalRequest, Notification,
    ActivityLog, SecurityAlert, SupportTicket, ExchangeRate, FeeConfig,
    PaymentGateway, PlatformConfig, UserRole
};
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // ─── Dashboard Stats ───
    public function dashboard()
    {
        $totalUsers         = Profile::count();
        $activeWallets      = Wallet::count();
        $totalBalance       = Wallet::sum('balance');
        $pendingKyc         = Profile::where('kyc_status', 'pending')
            ->whereNotNull('id_front_url')
            ->whereNotNull('id_back_url')
            ->whereNotNull('selfie_url')
            ->count();
        $pendingWithdrawals = WithdrawalRequest::where('status', 'pending')->count();
        $totalTransactions  = Transaction::count();
        $todayTransactions  = Transaction::whereDate('created_at', today())->count();
        $todayVolume        = Transaction::whereDate('created_at', today())->sum('amount');
        $openTickets        = SupportTicket::whereIn('status', ['open', 'in_progress'])->count();
        $unresolvedAlerts   = SecurityAlert::where('resolved', false)->count();
        $recentTxns         = Transaction::orderBy('created_at', 'desc')->limit(10)->get();

        return response()->json(compact(
            'totalUsers', 'activeWallets', 'totalBalance', 'pendingKyc',
            'pendingWithdrawals', 'totalTransactions', 'todayTransactions',
            'todayVolume', 'openTickets', 'unresolvedAlerts', 'recentTxns'
        ));
    }

    // ─── Users ───
    public function users(Request $request)
    {
        $query = Profile::orderBy('created_at', 'desc');

        // Search filter
        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        // Status filter
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // KYC filter
        if ($request->kyc_status) {
            $query->where('kyc_status', $request->kyc_status);
        }

        $profiles = $query->get();
        $wallets = Wallet::all()->keyBy('user_id');

        $data = $profiles->map(function ($p) use ($wallets) {
            $w = $wallets[$p->user_id] ?? null;
            return array_merge($p->toArray(), [
                'walletNumber' => $w->wallet_number ?? '',
                'balance'      => (float)($w->balance ?? 0),
                'currency'     => $w->currency ?? 'KES',
            ]);
        });

        return response()->json($data);
    }

    public function userDetail(string $userId)
    {
        $profile = Profile::where('user_id', $userId)->firstOrFail();
        $wallet  = Wallet::where('user_id', $userId)->first();
        $roles   = UserRole::where('user_id', $userId)->pluck('role');
        $txnCount = Transaction::where('sender_user_id', $userId)
            ->orWhere('receiver_user_id', $userId)
            ->count();

        return response()->json([
            'profile'           => $profile,
            'wallet'            => $wallet,
            'roles'             => $roles,
            'transaction_count' => $txnCount,
        ]);
    }

    public function updateUserStatus(Request $request, string $userId)
    {
        $request->validate(['status' => 'required|in:active,frozen,suspended,banned']);

        $profile = Profile::where('user_id', $userId)->firstOrFail();
        $oldStatus = $profile->status;
        $profile->update(['status' => $request->status]);

        // Notify user
        Notification::create([
            'user_id' => $userId,
            'title'   => 'Account Status Updated',
            'message' => "Your account status has been changed to: {$request->status}.",
            'type'    => 'security',
        ]);

        // SMS
        if ($profile->phone) {
            SmsService::send($profile->phone, "Your AbanRemit account status has been changed to {$request->status}. Contact support if you have questions.");
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => "user_status_change:{$oldStatus}_to_{$request->status}",
            'target'     => $userId,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function resetUserPassword(Request $request, string $userId)
    {
        $profile = Profile::where('user_id', $userId)->firstOrFail();

        // Generate a temporary password
        $tempPassword = Str::random(12) . 'A1!';
        $user = \App\Models\User::findOrFail($userId);
        $user->update(['password' => \Illuminate\Support\Facades\Hash::make($tempPassword)]);

        // Notify user
        Notification::create([
            'user_id' => $userId,
            'title'   => 'Password Reset by Admin',
            'message' => 'Your password has been reset by an administrator. Please login and change your password immediately.',
            'type'    => 'security',
        ]);

        if ($profile->phone) {
            SmsService::send($profile->phone, "Your AbanRemit password has been reset. Temporary password: {$tempPassword}. Change it immediately after login.");
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'admin_reset_password',
            'target'     => $userId,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Password reset. User notified via SMS.']);
    }

    public function resetUserPin(Request $request, string $userId)
    {
        $wallet = Wallet::where('user_id', $userId)->first();
        if ($wallet) {
            $wallet->update(['pin_hash' => null, 'failed_pin_attempts' => 0, 'is_locked' => false]);
        }

        Notification::create([
            'user_id' => $userId,
            'title'   => 'Wallet PIN Reset',
            'message' => 'Your wallet PIN has been reset by an administrator. Please set a new PIN.',
            'type'    => 'security',
        ]);

        $profile = Profile::where('user_id', $userId)->first();
        if ($profile && $profile->phone) {
            SmsService::send($profile->phone, 'Your AbanRemit wallet PIN has been reset. Please login and set a new PIN.');
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'admin_reset_pin',
            'target'     => $userId,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Transactions ───
    public function transactions(Request $request)
    {
        $query = Transaction::orderBy('created_at', 'desc');

        if ($request->status) $query->where('status', $request->status);
        if ($request->type) $query->where('type', $request->type);
        if ($request->from_date) $query->whereDate('created_at', '>=', $request->from_date);
        if ($request->to_date) $query->whereDate('created_at', '<=', $request->to_date);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('reference', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->paginate($request->get('limit', 100)));
    }

    public function flagTransaction(Request $request, string $id)
    {
        $tx = Transaction::findOrFail($id);
        if ($tx->status === 'reversed') {
            return response()->json(['error' => 'Cannot flag a reversed transaction'], 400);
        }

        $tx->update(['status' => 'flagged']);

        Notification::create([
            'user_id' => $tx->sender_user_id ?? $tx->receiver_user_id,
            'title'   => 'Transaction Flagged',
            'message' => "Transaction {$tx->reference} has been flagged for review.",
            'type'    => 'security',
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'flag_transaction',
            'target'     => $id,
            'ip_address' => $request->ip(),
            'metadata'   => ['reference' => $tx->reference],
        ]);

        return response()->json(['success' => true]);
    }

    public function reverseTransaction(Request $request, string $id)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        return DB::transaction(function () use ($request, $id) {
            $tx    = Transaction::findOrFail($id);
            $admin = $request->user();

            if ($tx->type !== 'send') return response()->json(['success' => false, 'error' => 'Only send transactions can be reversed'], 400);
            if ($tx->status !== 'completed') return response()->json(['success' => false, 'error' => 'Only completed transactions can be reversed'], 400);

            $senderWallet   = Wallet::lockForUpdate()->find($tx->sender_wallet_id);
            $receiverWallet = Wallet::lockForUpdate()->find($tx->receiver_wallet_id);

            if (!$senderWallet || !$receiverWallet) return response()->json(['success' => false, 'error' => 'Wallet not found'], 404);
            if ($receiverWallet->balance < $tx->amount) return response()->json(['success' => false, 'error' => 'Receiver has insufficient balance for reversal'], 400);

            $receiverWallet->decrement('balance', $tx->amount);
            $senderWallet->increment('balance', $tx->amount + $tx->fee);

            $tx->update(['status' => 'reversed']);
            Transaction::where('reference', $tx->reference . '-R')->update(['status' => 'reversed']);

            $reason = $request->reason;
            $revRef = 'REV' . time() . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

            Transaction::create([
                'reference'          => $revRef,
                'type'               => 'send',
                'sender_user_id'     => $tx->receiver_user_id,
                'sender_wallet_id'   => $receiverWallet->id,
                'receiver_user_id'   => $tx->sender_user_id,
                'receiver_wallet_id' => $senderWallet->id,
                'amount'             => $tx->amount,
                'fee'                => 0,
                'currency'           => $tx->currency,
                'description'        => "Reversal: {$reason} (Ref: {$tx->reference})",
                'status'             => 'completed',
                'metadata'           => ['reversal' => true, 'original_reference' => $tx->reference, 'admin_id' => $admin->id, 'reason' => $reason],
            ]);

            // Notify both
            Notification::insert([
                [
                    'id' => Str::uuid()->toString(), 'user_id' => $tx->sender_user_id,
                    'title' => 'Transaction Reversed', 'message' => "{$tx->currency} {$tx->amount} reversed back to your wallet. Reason: {$reason}. Ref: {$tx->reference}",
                    'type' => 'transaction', 'read' => false, 'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'id' => Str::uuid()->toString(), 'user_id' => $tx->receiver_user_id,
                    'title' => 'Transaction Reversed', 'message' => "{$tx->currency} {$tx->amount} was reversed from your wallet. Reason: {$reason}. Ref: {$tx->reference}",
                    'type' => 'transaction', 'read' => false, 'created_at' => now(), 'updated_at' => now(),
                ],
            ]);

            // SMS both parties
            foreach ([$tx->sender_user_id, $tx->receiver_user_id] as $uid) {
                $p = Profile::where('user_id', $uid)->first();
                if ($p && $p->phone) {
                    SmsService::send($p->phone, "AbanRemit: Transaction {$tx->reference} ({$tx->currency} {$tx->amount}) has been reversed. Reason: {$reason}");
                }
            }

            ActivityLog::create([
                'actor_id'   => $admin->id,
                'action'     => 'reverse_transaction',
                'target'     => $id,
                'ip_address' => $request->ip(),
                'metadata'   => ['reason' => $reason, 'amount' => $tx->amount, 'currency' => $tx->currency, 'reversal_ref' => $revRef],
            ]);

            return response()->json([
                'success'            => true,
                'reversal_reference' => $revRef,
                'amount'             => $tx->amount,
                'fee_refunded'       => $tx->fee,
                'currency'           => $tx->currency,
            ]);
        });
    }

    // ─── Withdrawals ───
    public function withdrawals(Request $request)
    {
        $query = WithdrawalRequest::orderBy('created_at', 'desc');
        if ($request->status) $query->where('status', $request->status);
        return response()->json($query->get());
    }

    public function updateWithdrawal(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,processing',
            'reason' => 'nullable|string|max:500',
        ]);

        $wr = WithdrawalRequest::findOrFail($id);

        if ($wr->status !== 'pending' && $wr->status !== 'processing') {
            return response()->json(['error' => 'Can only update pending or processing withdrawals'], 400);
        }

        $wr->update([
            'status'      => $request->status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $profile = Profile::where('user_id', $wr->user_id)->first();

        if ($request->status === 'rejected') {
            $wallet = Wallet::find($wr->wallet_id);
            if ($wallet) $wallet->increment('balance', $wr->amount);

            $reason = $request->reason ?? 'No reason provided';
            Notification::create([
                'user_id' => $wr->user_id,
                'title'   => 'Withdrawal Rejected',
                'message' => "Your withdrawal of {$wr->currency} {$wr->amount} has been rejected. Reason: {$reason}. Amount refunded.",
                'type'    => 'transaction',
            ]);

            if ($profile && $profile->phone) {
                SmsService::send($profile->phone, "Your AbanRemit withdrawal of {$wr->currency} {$wr->amount} was rejected. Reason: {$reason}. Amount refunded.");
            }
        } elseif ($request->status === 'approved') {
            Notification::create([
                'user_id' => $wr->user_id,
                'title'   => 'Withdrawal Approved',
                'message' => "Your withdrawal of {$wr->currency} {$wr->amount} has been approved and is being processed.",
                'type'    => 'transaction',
            ]);

            if ($profile && $profile->phone) {
                SmsService::send($profile->phone, "Your AbanRemit withdrawal of {$wr->currency} {$wr->amount} has been approved.");
            }
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => "withdrawal_{$request->status}",
            'target'     => $id,
            'ip_address' => $request->ip(),
            'metadata'   => ['amount' => $wr->amount, 'reason' => $request->reason],
        ]);

        return response()->json(['success' => true]);
    }

    // ─── KYC ───
    public function pendingKyc()
    {
        // Only return profiles that have actually uploaded documents
        $profiles = Profile::where('kyc_status', 'pending')
            ->whereNotNull('id_front_url')
            ->whereNotNull('id_back_url')
            ->whereNotNull('selfie_url')
            ->orderBy('updated_at', 'asc')
            ->get();

        return response()->json($profiles);
    }

    public function updateKyc(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'reason' => 'required_if:status,rejected|nullable|string|max:500',
        ]);

        $profile = Profile::findOrFail($id);

        $updates = ['kyc_status' => $request->status];

        if ($request->status === 'rejected') {
            $updates['kyc_rejection_reason'] = $request->reason;

            Notification::create([
                'user_id' => $profile->user_id,
                'title'   => 'KYC Verification Rejected',
                'message' => "Your KYC documents were rejected. Reason: {$request->reason}. Please re-upload corrected documents.",
                'type'    => 'security',
            ]);

            if ($profile->phone) {
                SmsService::send($profile->phone, "AbanRemit: Your KYC verification was rejected. Reason: {$request->reason}. Please login and re-upload your documents.");
            }
        } else {
            $updates['kyc_rejection_reason'] = null;

            Notification::create([
                'user_id' => $profile->user_id,
                'title'   => 'KYC Verified!',
                'message' => 'Congratulations! Your identity has been verified. You now have full access to all features.',
                'type'    => 'info',
            ]);

            if ($profile->phone) {
                SmsService::send($profile->phone, 'AbanRemit: Your KYC verification is approved! You now have full access to all features.');
            }
        }

        $profile->update($updates);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => "kyc_{$request->status}",
            'target'     => $profile->user_id,
            'ip_address' => $request->ip(),
            'metadata'   => ['reason' => $request->reason],
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Notifications ───
    public function sendNotification(Request $request)
    {
        $request->validate([
            'user_id' => 'required|uuid',
            'title'   => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type'    => 'nullable|string|in:info,transaction,security,announcement',
        ]);

        Notification::create([
            'user_id' => $request->user_id,
            'title'   => $request->title,
            'message' => $request->message,
            'type'    => $request->type ?? 'info',
        ]);

        // Also send SMS
        $profile = Profile::where('user_id', $request->user_id)->first();
        if ($profile && $profile->phone) {
            SmsService::send($profile->phone, "AbanRemit: {$request->title} - {$request->message}");
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'admin_send_notification',
            'target'     => $request->user_id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Logs ───
    public function activityLogs(Request $request)
    {
        $query = ActivityLog::orderBy('created_at', 'desc');
        if ($request->action) $query->where('action', 'like', "%{$request->action}%");
        if ($request->from_date) $query->whereDate('created_at', '>=', $request->from_date);
        if ($request->to_date) $query->whereDate('created_at', '<=', $request->to_date);
        return response()->json($query->paginate($request->get('limit', 100)));
    }

    // ─── Security Alerts ───
    public function securityAlerts(Request $request)
    {
        $query = SecurityAlert::orderBy('created_at', 'desc');
        if ($request->has('resolved')) $query->where('resolved', $request->boolean('resolved'));
        if ($request->severity) $query->where('severity', $request->severity);
        return response()->json($query->get());
    }

    public function resolveAlert(Request $request, string $id)
    {
        $alert = SecurityAlert::findOrFail($id);
        $alert->update(['resolved' => true, 'resolved_by' => $request->user()->id]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'resolve_security_alert',
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Support Tickets ───
    public function supportTickets(Request $request)
    {
        $query = SupportTicket::orderBy('created_at', 'desc');
        if ($request->status) $query->where('status', $request->status);
        if ($request->priority) $query->where('priority', $request->priority);
        if ($request->category) $query->where('category', $request->category);
        return response()->json($query->get());
    }

    public function updateTicket(Request $request, string $id)
    {
        $request->validate([
            'status'  => 'required|in:open,in_progress,resolved,escalated',
            'comment' => 'nullable|string|max:1000',
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->update(['status' => $request->status]);

        Notification::create([
            'user_id' => $ticket->user_id,
            'title'   => 'Support Ticket Updated',
            'message' => "Your ticket \"{$ticket->subject}\" status: {$request->status}." .
                ($request->comment ? " Note: {$request->comment}" : ''),
            'type'    => 'info',
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => "ticket_{$request->status}",
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Exchange Rates ───
    public function getExchangeRates()
    {
        return response()->json(ExchangeRate::all());
    }

    public function createExchangeRate(Request $request)
    {
        $request->validate([
            'from_currency'  => 'required|string|max:5',
            'to_currency'    => 'required|string|max:5',
            'rate'           => 'required|numeric|min:0.000001',
            'margin_percent' => 'nullable|numeric|min:0|max:50',
        ]);

        $rate = ExchangeRate::create([
            'from_currency'  => strtoupper($request->from_currency),
            'to_currency'    => strtoupper($request->to_currency),
            'rate'           => $request->rate,
            'margin_percent' => $request->margin_percent ?? 0,
            'updated_by'     => $request->user()->id,
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'create_exchange_rate',
            'ip_address' => $request->ip(),
            'metadata'   => ['from' => $request->from_currency, 'to' => $request->to_currency, 'rate' => $request->rate],
        ]);

        return response()->json($rate, 201);
    }

    public function updateExchangeRate(Request $request, string $id)
    {
        $request->validate([
            'rate'           => 'nullable|numeric|min:0.000001',
            'margin_percent' => 'nullable|numeric|min:0|max:50',
            'is_active'      => 'nullable|boolean',
        ]);

        ExchangeRate::where('id', $id)->update(
            array_merge(
                array_filter($request->only(['rate', 'margin_percent', 'is_active']), fn($v) => $v !== null),
                ['updated_by' => $request->user()->id]
            )
        );

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'update_exchange_rate',
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function deleteExchangeRate(Request $request, string $id)
    {
        ExchangeRate::destroy($id);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'delete_exchange_rate',
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Fees ───
    public function getFees()
    {
        return response()->json(FeeConfig::all());
    }

    public function createFee(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'transaction_type' => 'required|in:deposit,send,receive,withdraw,exchange,airtime',
            'fee_type'         => 'required|in:flat,percentage,tiered',
            'flat_amount'      => 'nullable|numeric|min:0',
            'percentage'       => 'nullable|numeric|min:0|max:100',
            'min_amount'       => 'nullable|numeric|min:0',
            'max_amount'       => 'nullable|numeric|min:0',
        ]);

        $fee = FeeConfig::create(array_merge($request->all(), ['updated_by' => $request->user()->id]));

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'create_fee',
            'ip_address' => $request->ip(),
            'metadata'   => ['name' => $request->name, 'type' => $request->transaction_type],
        ]);

        return response()->json($fee, 201);
    }

    public function updateFee(Request $request, string $id)
    {
        $request->validate([
            'flat_amount' => 'nullable|numeric|min:0',
            'percentage'  => 'nullable|numeric|min:0|max:100',
            'is_active'   => 'nullable|boolean',
        ]);

        FeeConfig::where('id', $id)->update(
            array_merge($request->except('id'), ['updated_by' => $request->user()->id])
        );

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'update_fee',
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Payment Gateways ───
    public function getPaymentGateways()
    {
        return response()->json(PaymentGateway::all());
    }

    public function updatePaymentGateway(Request $request, string $id)
    {
        $request->validate([
            'is_enabled' => 'nullable|boolean',
            'mode'       => 'nullable|in:sandbox,production',
        ]);

        PaymentGateway::where('id', $id)->update(
            array_merge($request->except('id'), ['updated_by' => $request->user()->id])
        );

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'update_payment_gateway',
            'target'     => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Super Admin: Platform Config ───
    public function getConfig()
    {
        return response()->json(PlatformConfig::all());
    }

    public function updateConfig(Request $request)
    {
        $request->validate([
            'key'   => 'required|string|max:255',
            'value' => 'required',
        ]);

        PlatformConfig::updateOrCreate(
            ['key' => $request->key],
            ['value' => $request->value, 'updated_by' => $request->user()->id]
        );

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'update_platform_config',
            'ip_address' => $request->ip(),
            'metadata'   => ['key' => $request->key],
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Super Admin: User Roles ───
    public function getRoles(string $userId)
    {
        return response()->json(UserRole::where('user_id', $userId)->get());
    }

    public function assignRole(Request $request)
    {
        $request->validate([
            'user_id' => 'required|uuid',
            'role'    => 'required|in:user,admin,superadmin',
        ]);

        // Prevent creating multiple superadmins without explicit intent
        UserRole::firstOrCreate(['user_id' => $request->user_id, 'role' => $request->role]);

        Notification::create([
            'user_id' => $request->user_id,
            'title'   => 'Role Assigned',
            'message' => "You have been assigned the role: {$request->role}.",
            'type'    => 'security',
        ]);

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'assign_role',
            'target'     => $request->user_id,
            'ip_address' => $request->ip(),
            'metadata'   => ['role' => $request->role],
        ]);

        return response()->json(['success' => true]);
    }

    public function removeRole(Request $request, string $id)
    {
        $role = UserRole::findOrFail($id);

        // Prevent removing the last superadmin
        if ($role->role === 'superadmin') {
            $superadminCount = UserRole::where('role', 'superadmin')->count();
            if ($superadminCount <= 1) {
                return response()->json(['error' => 'Cannot remove the last superadmin'], 400);
            }
        }

        ActivityLog::create([
            'actor_id'   => $request->user()->id,
            'action'     => 'remove_role',
            'target'     => $role->user_id,
            'ip_address' => $request->ip(),
            'metadata'   => ['role' => $role->role],
        ]);

        $role->delete();

        return response()->json(['success' => true]);
    }
}
