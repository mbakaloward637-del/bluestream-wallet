<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StatementController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\AirtimeController;
use App\Http\Controllers\Api\BulkNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes — /api/v1/
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ─── Public Auth ───
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    // ─── Public Data ───
    Route::get('exchange-rates', [ExchangeRateController::class, 'index']);
    Route::get('fees', [FeeController::class, 'index']);
    Route::get('airtime/networks', [AirtimeController::class, 'networks']);

    // ─── Webhooks (no auth — verified by signature/IP) ───
    Route::prefix('webhooks')->group(function () {
        Route::post('paystack', [WebhookController::class, 'paystack']);
        Route::post('mpesa/c2b', [WebhookController::class, 'mpesaC2B']);
        Route::post('mpesa/b2c', [WebhookController::class, 'mpesaB2C']);
        Route::post('mpesa/validation', [WebhookController::class, 'mpesaValidation']);
        Route::post('airtime', [WebhookController::class, 'airtimeCallback']);
    });

    // ─── Authenticated Routes ───
    Route::middleware('auth:api')->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/change-password', [AuthController::class, 'changePassword']);

        // Wallet
        Route::get('wallet', [WalletController::class, 'show']);
        Route::post('wallet/set-pin', [WalletController::class, 'setPin']);
        Route::post('wallet/verify-pin', [WalletController::class, 'verifyPin']);

        // Transactions
        Route::get('transactions', [TransactionController::class, 'index']);
        Route::post('transactions/transfer', [TransactionController::class, 'transfer']);
        Route::post('transactions/deposit', [TransactionController::class, 'deposit']);
        Route::post('transactions/withdraw', [TransactionController::class, 'withdraw']);

        // Airtime (Instalipa)
        Route::post('airtime/purchase', [AirtimeController::class, 'purchase']);

        // Exchange
        Route::post('transactions/exchange', [TransactionController::class, 'exchange']);

        // M-Pesa direct
        Route::post('mpesa/stk-push', [MpesaController::class, 'stkPush']);
        Route::post('mpesa/b2c', [MpesaController::class, 'b2c']);

        // Statements
        Route::post('statements/download', [StatementController::class, 'download']);
        Route::get('statements/preview', [StatementController::class, 'preview']);

        // Recipients
        Route::post('recipients/lookup', [TransactionController::class, 'lookupRecipient']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::put('notifications/{id}/read', [NotificationController::class, 'markRead']);

        // Profile
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::post('profile/kyc', [ProfileController::class, 'uploadKyc']);

        // Support Tickets (user)
        Route::get('support-tickets', [SupportController::class, 'index']);
        Route::post('support-tickets', [SupportController::class, 'store']);
        Route::get('support-tickets/{id}', [SupportController::class, 'show']);

        // ─── Admin Routes ───
        Route::prefix('admin')->middleware(\App\Http\Middleware\AdminMiddleware::class)->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard']);

            // Users
            Route::get('users', [AdminController::class, 'users']);
            Route::get('users/{id}', [AdminController::class, 'userDetail']);
            Route::put('users/{id}/status', [AdminController::class, 'updateUserStatus']);
            Route::post('users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
            Route::post('users/{id}/reset-pin', [AdminController::class, 'resetUserPin']);

            // Transactions
            Route::get('transactions', [AdminController::class, 'transactions']);
            Route::post('transactions/{id}/flag', [AdminController::class, 'flagTransaction']);
            Route::post('transactions/{id}/reverse', [AdminController::class, 'reverseTransaction']);

            // Withdrawals
            Route::get('withdrawals', [AdminController::class, 'withdrawals']);
            Route::put('withdrawals/{id}', [AdminController::class, 'updateWithdrawal']);

            // KYC
            Route::get('kyc', [AdminController::class, 'pendingKyc']);
            Route::put('kyc/{id}', [AdminController::class, 'updateKyc']);

            // Notifications
            Route::post('notifications', [AdminController::class, 'sendNotification']);
            Route::post('notifications/bulk', [BulkNotificationController::class, 'sendBulk']);
            Route::post('sms/bulk', [BulkNotificationController::class, 'sendBulkSms']);

            // Logs & Security
            Route::get('logs', [AdminController::class, 'activityLogs']);
            Route::get('security-alerts', [AdminController::class, 'securityAlerts']);
            Route::put('security-alerts/{id}', [AdminController::class, 'resolveAlert']);

            // Support
            Route::get('support-tickets', [AdminController::class, 'supportTickets']);
            Route::put('support-tickets/{id}', [AdminController::class, 'updateTicket']);

            // ─── Super Admin Only ───
            Route::middleware(\App\Http\Middleware\SuperAdminMiddleware::class)->group(function () {
                Route::get('exchange-rates', [AdminController::class, 'getExchangeRates']);
                Route::post('exchange-rates', [AdminController::class, 'createExchangeRate']);
                Route::put('exchange-rates/{id}', [AdminController::class, 'updateExchangeRate']);
                Route::delete('exchange-rates/{id}', [AdminController::class, 'deleteExchangeRate']);

                Route::get('fees', [AdminController::class, 'getFees']);
                Route::post('fees', [AdminController::class, 'createFee']);
                Route::put('fees/{id}', [AdminController::class, 'updateFee']);

                Route::get('payment-gateways', [AdminController::class, 'getPaymentGateways']);
                Route::put('payment-gateways/{id}', [AdminController::class, 'updatePaymentGateway']);

                Route::get('platform-config', [AdminController::class, 'getConfig']);
                Route::put('platform-config', [AdminController::class, 'updateConfig']);

                Route::get('roles/{userId}', [AdminController::class, 'getRoles']);
                Route::post('roles', [AdminController::class, 'assignRole']);
                Route::delete('roles/{id}', [AdminController::class, 'removeRole']);

                Route::get('audit-logs', [AdminController::class, 'activityLogs']);
            });
        });
    });
});
