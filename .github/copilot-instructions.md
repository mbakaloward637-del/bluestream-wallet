# Project Instructions for GitHub Copilot

## PHP Backend (php-backend/)
- This is a **Laravel 10** REST API using **tymon/jwt-auth** for authentication.
- All models use **UUIDs** (HasUuids trait), NOT auto-increment IDs. The `users` table also uses UUIDs.
- Database tables are defined in `database/migrations/2024_01_01_000001_create_all_tables.php` — do NOT create duplicate migrations for existing tables.
- Wallet numbers follow the format `WLT888XXXXXXX` — use `Wallet::generateWalletNumber()`.
- Roles are stored in `user_roles` table (not on users table). Use `$user->hasRole('admin')`, `$user->isAdmin()`, `$user->isSuperAdmin()`.
- PIN hashes use `Hash::make()` / `Hash::check()` — never store plain PINs.
- All money operations (transfers, reversals, deposits) MUST use `DB::transaction()` for atomicity.
- Transaction references: `TRF` for transfers, `AIR` for airtime, `DEP` for deposits, `WDR` for withdrawals, `EXC` for exchange, `REV` for reversals, `MPD` for M-Pesa deposits, `MPW` for M-Pesa withdrawals, `STM` for statements.
- API routes are prefixed with `/api/v1/` — see `routes/api.php`.
- Controllers are in `app/Http/Controllers/Api/` — don't create controllers outside this namespace.
- Multiple controllers exist in `WalletController.php` (Wallet, Notification, Profile, ExchangeRate, Fee) — keep this pattern or split carefully.
- **Never modify** the `composer.json` dependencies without asking.

## PHP Architecture Files
- `config/auth.php` — JWT guard configuration for the `api` guard
- `config/services.php` — M-Pesa, Paystack, Africa's Talking credentials (loaded from `.env`)
- `config/cors.php` — CORS settings, `FRONTEND_URL` env controls allowed origins
- `app/Http/Kernel.php` — Middleware stack with `admin` and `superadmin` aliases
- `app/Providers/RouteServiceProvider.php` — API route loading with 60 req/min rate limiting

## PHP Controllers Reference
- `AuthController` — register, login, logout, password reset, change-password
- `TransactionController` — transfer, deposit, withdraw, exchange, airtime (legacy), recipient lookup
- `AirtimeController` — airtime purchase with Africa's Talking integration (Safaricom, Airtel, Telkom)
- `MpesaController` — STK Push (C2B deposit) and B2C (withdrawal)
- `WebhookController` — Paystack & M-Pesa (C2B/B2C) callback handlers (no auth, signature-verified)
- `StatementController` — CSV statement download (50 KES fee) and preview
- `SupportController` — user-facing support ticket CRUD
- `BulkNotificationController` — admin bulk notifications and SMS via Africa's Talking
- `AdminController` — dashboard, users, KYC, transactions, withdrawals, security, super admin config
- `WalletController` — wallet info, PIN set/verify
- `NotificationController`, `ProfileController`, `ExchangeRateController`, `FeeController` — in WalletController.php

## PHP Middleware
- `AdminMiddleware` — checks `$user->isAdmin()` (admin OR superadmin)
- `SuperAdminMiddleware` — checks `$user->isSuperAdmin()` (superadmin only)
- Both are registered as route aliases in `Kernel.php`: `'admin'` and `'superadmin'`

## React Frontend (src/)
- Built with **Vite + React 18 + TypeScript + Tailwind + shadcn/ui**.
- Uses `@/` path alias mapping to `src/`.
- Supabase client at `src/integrations/supabase/client.ts` is **auto-generated — never edit it**.
- `src/integrations/supabase/types.ts` is **read-only — never edit it**.
- The frontend API service for PHP is at `php-backend/frontend-api-service/api.ts`.
- When switching to PHP backend, replace `supabase` calls with `apiClient` methods from `api.ts`.

## Edge Functions (supabase/functions/)
These are Supabase Edge Functions used while running on Lovable Cloud:
- `set-wallet-pin` — Hashes and stores wallet PIN via SQL crypt
- `process-airtime` — Airtime purchase placeholder (Africa's Talking)
- `process-mpesa` — M-Pesa STK Push / B2C placeholder
- `process-paystack` — Paystack card payment placeholder
- `send-transaction-sms` — Per-transaction SMS notifications
- `send-bulk-sms` — Admin bulk SMS broadcast

## Common Pitfalls to Avoid
- Don't use `auth.users` table directly — use the `profiles` table instead.
- Don't create `config.toml` files outside `supabase/config.toml`.
- Don't add CHECK constraints with `now()` — use validation triggers instead.
- Don't store roles on the `users` or `profiles` table.
- Ensure all API responses follow the existing JSON structure (`{success, data}` or `{error}`).
- Webhook routes MUST remain outside `auth:api` middleware — they use signature verification instead.
- Statement download charges 50 KES — always verify wallet balance first.
- M-Pesa amounts are integers (no decimals). Paystack amounts are in kobo (÷100).
- All foreign keys referencing `users` MUST use `uuid` type, NOT `foreignId()` (which creates bigint).
- The Notification model uses `notifications_custom` table (`protected $table = 'notifications_custom'`).
- `AdminMiddleware.php` and `SuperAdminMiddleware.php` are separate files — each contains ONE class only.

## Deployment Checklist (cPanel)
1. Upload `php-backend/` to server, point document root to `public/`
2. Create MySQL DB, copy `.env.example` → `.env`, fill credentials
3. Run `php artisan key:generate && php artisan jwt:secret`
4. Run `php artisan migrate --seed`
5. Run `php artisan storage:link`
6. Set permissions: `chmod -R 755 storage bootstrap/cache`
7. Build React frontend: `npm run build`, deploy `dist/` to frontend domain
8. Set `VITE_API_URL` to `https://your-api-domain.com/api/v1`
9. Set `FRONTEND_URL` in PHP `.env` for CORS
10. Configure Paystack/M-Pesa/AT webhook URLs in provider dashboards
