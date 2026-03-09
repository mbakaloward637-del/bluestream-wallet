<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Override default users table to use UUIDs ───
        // Laravel's default users migration runs first; this adds UUID support.
        // If using fresh install, drop and recreate:
        Schema::dropIfExists('users');
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // ─── PROFILES ───
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('country')->default('Kenya');
            $table->string('country_code', 5)->default('KE');
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('id_front_url')->nullable();
            $table->string('id_back_url')->nullable();
            $table->string('selfie_url')->nullable();
            $table->enum('kyc_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('status', ['active', 'frozen', 'suspended', 'banned'])->default('active');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ─── WALLETS ───
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('wallet_number')->unique();
            $table->decimal('balance', 15, 2)->default(0.00);
            $table->string('currency', 5)->default('KES');
            $table->string('pin_hash')->nullable();
            $table->integer('failed_pin_attempts')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ─── USER ROLES ───
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('role', ['user', 'admin', 'superadmin'])->default('user');
            $table->unique(['user_id', 'role']);

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ─── TRANSACTIONS ───
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->enum('type', ['deposit', 'send', 'receive', 'withdraw', 'exchange', 'airtime']);
            $table->uuid('sender_user_id')->nullable();
            $table->uuid('sender_wallet_id')->nullable();
            $table->uuid('receiver_user_id')->nullable();
            $table->uuid('receiver_wallet_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->decimal('fee', 15, 2)->default(0.00);
            $table->string('currency', 5);
            $table->text('description')->nullable();
            $table->enum('status', ['completed', 'pending', 'failed', 'flagged', 'reversed'])->default('pending');
            $table->string('method')->nullable();
            $table->string('provider')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('sender_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('sender_wallet_id')->references('id')->on('wallets')->nullOnDelete();
            $table->foreign('receiver_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('receiver_wallet_id')->references('id')->on('wallets')->nullOnDelete();
        });

        // ─── WITHDRAWAL REQUESTS ───
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('wallet_id');
            $table->decimal('amount', 15, 2);
            $table->string('currency', 5);
            $table->string('method');
            $table->string('destination');
            $table->enum('status', ['pending', 'approved', 'rejected', 'processing'])->default('pending');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('wallet_id')->references('id')->on('wallets');
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
        });

        // ─── NOTIFICATIONS (custom table to avoid Laravel's built-in) ───
        Schema::create('notifications_custom', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->boolean('read')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'read']);
        });

        // ─── EXCHANGE RATES ───
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('from_currency', 5);
            $table->string('to_currency', 5);
            $table->decimal('rate', 15, 6);
            $table->decimal('margin_percent', 5, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // ─── FEE CONFIG ───
        Schema::create('fee_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('transaction_type', ['deposit', 'send', 'receive', 'withdraw', 'exchange', 'airtime']);
            $table->enum('fee_type', ['flat', 'percentage', 'tiered'])->default('flat');
            $table->decimal('flat_amount', 15, 2)->nullable()->default(0.00);
            $table->decimal('percentage', 5, 2)->nullable()->default(0.00);
            $table->decimal('min_amount', 15, 2)->nullable()->default(0.00);
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // ─── VIRTUAL CARDS ───
        Schema::create('virtual_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('card_number');
            $table->string('cvv');
            $table->string('expiry');
            $table->string('cardholder_name');
            $table->string('provider')->default('paystack');
            $table->string('provider_ref')->nullable();
            $table->boolean('is_frozen')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ─── ACTIVITY LOGS ───
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('actor_id');
            $table->string('action');
            $table->string('target')->nullable();
            $table->string('ip_address')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('actor_id')->references('id')->on('users');
            $table->index('created_at');
        });

        // ─── SECURITY ALERTS ───
        Schema::create('security_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['failed_login', 'failed_pin', 'suspicious_transaction', 'unusual_pattern']);
            $table->uuid('user_id')->nullable();
            $table->text('description');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->boolean('resolved')->default(false);
            $table->uuid('resolved_by')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
        });

        // ─── SUPPORT TICKETS ───
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('subject');
            $table->text('description');
            $table->enum('category', ['failed_transaction', 'login_issue', 'payment_dispute', 'general', 'account_issue'])->default('general');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'escalated'])->default('open');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ─── PAYMENT GATEWAYS ───
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('provider');
            $table->string('mode')->default('sandbox');
            $table->boolean('is_enabled')->default(false);
            $table->json('config')->default('{}');
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // ─── PLATFORM CONFIG ───
        Schema::create('platform_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->json('value')->default('{}');
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_config');
        Schema::dropIfExists('payment_gateways');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('security_alerts');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('virtual_cards');
        Schema::dropIfExists('fee_config');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('notifications_custom');
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('profiles');
        Schema::dropIfExists('users');
    }
};
