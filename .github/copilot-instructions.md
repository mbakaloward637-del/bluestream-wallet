# Project Instructions for GitHub Copilot

## PHP Backend (php-backend/)
- This is a **Laravel 10** REST API using **tymon/jwt-auth** for authentication.
- All models use **UUIDs** (HasUuids trait), NOT auto-increment IDs.
- Database tables are defined in `database/migrations/2024_01_01_000001_create_all_tables.php` — do NOT create duplicate migrations for existing tables.
- Wallet numbers follow the format `WLT888XXXXXXX` — use `Wallet::generateWalletNumber()`.
- Roles are stored in `user_roles` table (not on users table). Use `$user->hasRole('admin')`, `$user->isAdmin()`, `$user->isSuperAdmin()`.
- PIN hashes use `Hash::make()` / `Hash::check()` — never store plain PINs.
- All money operations (transfers, reversals, deposits) MUST use `DB::transaction()` for atomicity.
- Transaction references: `TXN` prefix for sends, `RCV` for receives, `REV` for reversals, `DEP` for deposits, `WDR` for withdrawals.
- API routes are prefixed with `/api/v1/` — see `routes/api.php`.
- Controllers are in `app/Http/Controllers/Api/` — don't create controllers outside this namespace.
- Multiple controllers exist in `WalletController.php` (Wallet, Notification, Profile, ExchangeRate, Fee) — keep this pattern or split carefully.
- **Never modify** the `composer.json` dependencies without asking.

## React Frontend (src/)
- Built with **Vite + React 18 + TypeScript + Tailwind + shadcn/ui**.
- Uses `@/` path alias mapping to `src/`.
- Supabase client at `src/integrations/supabase/client.ts` is **auto-generated — never edit it**.
- `src/integrations/supabase/types.ts` is **read-only — never edit it**.
- The frontend API service for PHP is at `php-backend/frontend-api-service/api.ts`.
- When switching to PHP backend, replace `supabase` calls with `apiClient` methods from `api.ts`.

## PHP Controllers Reference
- `AuthController` — register, login, logout, password reset
- `TransactionController` — transfer, deposit, withdraw, exchange, recipient lookup
- `AirtimeController` — airtime purchase with Africa's Talking integration (Safaricom, Airtel, Telkom)
- `MpesaController` — STK Push (C2B deposit) and B2C (withdrawal)
- `WebhookController` — Paystack & M-Pesa callback handlers (no auth, signature-verified)
- `StatementController` — CSV statement download (50 KES fee) and preview
- `SupportController` — user-facing support ticket CRUD
- `BulkNotificationController` — admin bulk notifications and SMS via Africa's Talking
- `AdminController` — dashboard, users, KYC, transactions, withdrawals, security, super admin config
- `WalletController` — wallet info, PIN set/verify
- `NotificationController`, `ProfileController`, `ExchangeRateController`, `FeeController` — in WalletController.php

## Common Pitfalls to Avoid
- Don't use `auth.users` table directly — use the `profiles` table instead.
- Don't create `config.toml` files outside `supabase/config.toml`.
- Don't add CHECK constraints with `now()` — use validation triggers instead.
- Don't store roles on the `users` or `profiles` table.
- Ensure all API responses follow the existing JSON structure (`{success, data}` or `{error}`).
- Webhook routes MUST remain outside `auth:api` middleware — they use signature verification instead.
- Statement download charges 50 KES — always verify wallet balance first.
- M-Pesa amounts are integers (no decimals). Paystack amounts are in kobo (÷100).
