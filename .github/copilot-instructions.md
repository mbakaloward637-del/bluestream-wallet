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
- **Each controller is a separate file** — one class per file (PSR-4 autoloading).
- **Never modify** the `composer.json` dependencies without asking.

## Production Domain & Architecture
- **Domain**: `https://abanremit.com`
- **Frontend**: React SPA served from `public_html/` (Vite build output)
- **Backend API**: Laravel served from `public_html/api/` (symlink to `laravel/public/`)
- **API Base URL**: `https://abanremit.com/api/v1`
- **Same-domain setup** — no CORS subdomain issues, frontend and backend share `abanremit.com`

## Laravel File Structure (REQUIRED)
```
php-backend/
├── app/
│   ├── Console/Kernel.php
│   ├── Exceptions/Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php           ← Base controller
│   │   │   └── Api/
│   │   │       ├── AdminController.php
│   │   │       ├── AirtimeController.php
│   │   │       ├── AuthController.php
│   │   │       ├── BulkNotificationController.php
│   │   │       ├── ExchangeRateController.php
│   │   │       ├── FeeController.php
│   │   │       ├── MpesaController.php
│   │   │       ├── NotificationController.php
│   │   │       ├── ProfileController.php
│   │   │       ├── StatementController.php
│   │   │       ├── SupportController.php
│   │   │       ├── TransactionController.php
│   │   │       ├── WalletController.php
│   │   │       └── WebhookController.php
│   │   ├── Kernel.php
│   │   └── Middleware/
│   │       ├── AdminMiddleware.php
│   │       └── SuperAdminMiddleware.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Profile.php
│   │   ├── Wallet.php
│   │   ├── Transaction.php
│   │   ├── WithdrawalRequest.php
│   │   ├── Notification.php         ← uses `notifications_custom` table
│   │   ├── UserRole.php
│   │   └── OtherModels.php          ← ExchangeRate, FeeConfig, VirtualCard, etc.
│   ├── Providers/RouteServiceProvider.php
│   └── Services/SmsService.php
├── bootstrap/app.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── database.php
│   ├── filesystems.php
│   ├── mail.php
│   ├── queue.php
│   └── services.php
├── database/
│   ├── migrations/
│   └── seeders/DatabaseSeeder.php
├── public/
│   ├── index.php
│   └── .htaccess
├── routes/
│   ├── api.php
│   └── web.php
├── artisan
├── composer.json
├── .env
└── .env.example
```

## Third-Party Providers (PRODUCTION)
| Service | Provider | Config Key |
|---------|----------|------------|
| Payments | **Paystack** (live) | `services.paystack` |
| Mobile Money | **M-Pesa** (Safaricom Daraja, production) | `services.mpesa` |
| Airtime | **Instalipa** | `services.instalipa` |
| SMS | **TalkSasa** | `services.talksasa` |
| Exchange Rates | **ExchangeRate-API** | `services.exchange_rate` |
| Email | **SMTP** (mail.abanremit.com:465/SSL) | `config/mail.php` |

## PHP Controllers Reference
- `AuthController` — register, login, logout, password reset, change-password
- `TransactionController` — transfer, deposit, withdraw, exchange, airtime (legacy), recipient lookup
- `AirtimeController` — airtime purchase via **Instalipa** API (Safaricom, Airtel, Telkom)
- `MpesaController` — STK Push (C2B deposit) and B2C (withdrawal) via Safaricom Daraja
- `WebhookController` — Paystack, M-Pesa (C2B/B2C), M-Pesa validation, Instalipa airtime callbacks
- `StatementController` — CSV statement download (50 KES fee) and preview
- `SupportController` — user-facing support ticket CRUD
- `BulkNotificationController` — admin bulk notifications and SMS via **TalkSasa**
- `AdminController` — dashboard, users, KYC, transactions, withdrawals, security, super admin config
- `WalletController` — wallet info, PIN set/verify
- `NotificationController` — user notification list, mark as read
- `ProfileController` — user profile CRUD, KYC document upload
- `ExchangeRateController` — public exchange rates listing
- `FeeController` — public fee config listing

## PHP Middleware
- `AdminMiddleware` — checks `$user->isAdmin()` (admin OR superadmin)
- `SuperAdminMiddleware` — checks `$user->isSuperAdmin()` (superadmin only)
- Both registered as route aliases in `Kernel.php`: `'admin'` and `'superadmin'`

## Services
- `app/Services/SmsService.php` — TalkSasa SMS wrapper (single + bulk send, phone formatting to 254XXXXXXXXX)

## React Frontend (src/)
- Built with **Vite + React 18 + TypeScript + Tailwind + shadcn/ui**.
- Uses `@/` path alias mapping to `src/`.
- Supabase client at `src/integrations/supabase/client.ts` is **auto-generated — never edit it**.
- `src/integrations/supabase/types.ts` is **read-only — never edit it**.
- The frontend API service for PHP is at `php-backend/frontend-api-service/api.ts`.
- When switching to PHP backend, copy `api.ts` to `src/services/api.ts` and replace `supabase` calls with `api` methods.
- Frontend env: `VITE_API_BASE_URL=https://abanremit.com/api/v1`

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
- **Each API controller is a separate file** — never put multiple controller classes in one file.
- SMS notifications are sent via `SmsService::send()` — never call TalkSasa API directly from controllers.

## Deployment (cPanel — Same Domain)
See `php-backend/DEPLOYMENT.md` for full step-by-step guide.

1. Upload `php-backend/` to `/home/abancool/laravel/` (OUTSIDE public_html)
2. Symlink: `ln -s /home/abancool/laravel/public /home/abancool/public_html/api`
3. `.env` is pre-configured — just run `php artisan key:generate` and `php artisan jwt:secret`
4. Run: `composer install --no-dev`, `php artisan migrate --seed`
5. Build React: `npm run build`, upload `dist/` contents to `public_html/`
6. Copy `deployment-files/public_html/.htaccess` to `public_html/.htaccess`
7. Configure webhook URLs in Paystack dashboard + Safaricom Daraja portal
8. Set up cron: `* * * * * cd /home/abancool/laravel && php artisan schedule:run`

## Webhook URLs (Production)
- Paystack: `https://abanremit.com/api/v1/webhooks/paystack`
- M-Pesa C2B: `https://abanremit.com/api/v1/webhooks/mpesa/c2b`
- M-Pesa B2C: `https://abanremit.com/api/v1/webhooks/mpesa/b2c`
- M-Pesa Validation: `https://abanremit.com/api/v1/webhooks/mpesa/validation`
- Instalipa Airtime: `https://abanremit.com/api/v1/webhooks/airtime`
