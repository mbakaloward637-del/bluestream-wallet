

## Kiro AI Assistant Script for AbanRemit Production Deployment

Below is a complete instruction script you can paste into **Kiro** (Amazon's AI coding assistant) to guide it through your project's production deployment. Copy the entire block below.

---

### Kiro Prompt Script

```text
You are acting as a senior DevOps and Laravel engineer for the AbanRemit fintech platform. This is a full-stack application with a React (Vite) frontend and a Laravel 10 PHP backend using JWT authentication and UUID primary keys.

## PROJECT ARCHITECTURE

Frontend: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui (PWA-enabled)
Backend: Laravel 10 REST API with JWT auth (tymon/jwt-auth), UUID models, M-Pesa, Paystack, Instalipa integrations
Database: MySQL 5.7+ with UUID primary keys on ALL tables
Hosting: cPanel shared hosting at abanremit.com
Domain: Same-domain setup — React SPA at public_html/, Laravel API symlinked at public_html/api/

## DIRECTORY STRUCTURE ON SERVER

/home/abancool/
├── laravel/                    ← Laravel app (OUTSIDE public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                 ← Symlinked to public_html/api/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── artisan
└── public_html/                ← React SPA build output
    ├── index.html
    ├── assets/
    ├── .htaccess               ← Routes /api → Laravel, else → React SPA
    └── api/                    ← Symlink → /home/abancool/laravel/public/

## CRITICAL RULES — DO NOT VIOLATE

1. ALL database tables use UUID primary keys (CHAR(36)), never BIGINT auto-increment
2. The Notification model uses table name `notifications_custom` (not `notifications`)
3. User roles are stored in a separate `user_roles` table, NEVER on the users table
4. Transaction reference prefixes: TRF (transfer), AIR (airtime), DEP (deposit), WDR (withdrawal), EXC (exchange), REV (reversal), MPD (mpesa deposit), MPW (mpesa withdrawal), STM (statement)
5. M-Pesa amounts are integers (no decimals)
6. Paystack amounts are in kobo (multiply by 100 when sending, divide by 100 when receiving)
7. Webhook routes MUST stay OUTSIDE auth:api middleware group
8. APP_DEBUG must be false in production
9. The fee_config table name is `fee_config` (singular), not `fee_configs`
10. Never store sensitive keys in frontend code — all API keys go in Laravel .env only

## TASK LIST — EXECUTE IN ORDER

### Task 1: Validate Laravel .env for Production
Review the .env file and ensure these are set correctly:
- APP_ENV=production
- APP_DEBUG=false
- APP_URL=https://abanremit.com
- FRONTEND_URL=https://abanremit.com
- DB_CONNECTION=mysql
- DB_HOST=localhost
- DB_DATABASE=abancool_aban
- DB_USERNAME=abancool_labo
- JWT_SECRET must be generated (php artisan jwt:secret)
- CORS_ALLOWED_ORIGINS=https://abanremit.com
- All payment gateway keys (PAYSTACK_SECRET_KEY, MPESA_CONSUMER_KEY, etc.)

### Task 2: Verify Database Migration
Run: php artisan migrate:status
Ensure ALL tables exist:
- users, profiles, wallets, user_roles, transactions
- withdrawal_requests, notifications_custom, exchange_rates
- fee_config, virtual_cards, activity_logs, security_alerts
- support_tickets, payment_gateways, platform_config
- personal_access_tokens

If any are missing, run: php artisan migrate

### Task 3: Verify Seeder Data
Run: php artisan db:seed (only on first deploy)
This creates:
- Super Admin: admin@abanremit.com / Admin@123456
- Default exchange rates (KES ↔ USD, GBP, EUR)
- Default fee config (1.5% transfer, KES 50 withdrawal)

### Task 4: Build React Frontend
On local machine:
1. Create .env.production:
   VITE_API_BASE_URL=https://abanremit.com/api/v1
2. Run: npm run build
3. Upload dist/ contents to public_html/ (preserve api/ symlink)

### Task 5: Configure .htaccess
Ensure public_html/.htaccess has:
- RewriteRule ^api/(.*)$ api/index.php [L]
- SPA fallback: all non-file routes → index.html

### Task 6: Set File Permissions
chmod -R 755 /home/abancool/laravel/storage
chmod -R 755 /home/abancool/laravel/bootstrap/cache
php artisan storage:link
php artisan config:cache
php artisan route:cache

### Task 7: Set Up Cron Job
In cPanel → Cron Jobs:
* * * * * cd /home/abancool/laravel && php artisan schedule:run >> /dev/null 2>&1

### Task 8: Configure Webhooks
Paystack: https://abanremit.com/api/v1/webhooks/paystack
M-Pesa C2B Confirm: https://abanremit.com/api/v1/webhooks/mpesa/c2b
M-Pesa C2B Validate: https://abanremit.com/api/v1/webhooks/mpesa/validation
M-Pesa B2C Result: https://abanremit.com/api/v1/webhooks/mpesa/b2c
Instalipa: https://abanremit.com/api/v1/webhooks/airtime

### Task 9: Post-Deploy Verification
Test these endpoints:
- curl https://abanremit.com/api → should return JSON
- curl https://abanremit.com/api/v1/exchange-rates → should return rates
- Visit https://abanremit.com → should show login page
- Login with admin@abanremit.com / Admin@123456 → should work

### Task 10: Security Hardening
- Change super admin password immediately
- Verify SSL is active (Let's Encrypt)
- Delete .env.example from server
- Ensure storage/logs/ has log rotation
- Run: php artisan config:cache && php artisan route:cache

## HOW TO HELP ME

Walk me through each task one at a time. After each task, ask me to confirm completion before moving to the next. If I encounter errors, help me debug using storage/logs/laravel.log output. Always prioritize data safety — never suggest dropping tables with existing data.
```

---

### How to Use This

1. Open **Kiro** in VS Code
2. Start a new chat session
3. Paste the entire script above
4. Kiro will walk you through each step sequentially
5. Confirm each step before it moves to the next

The script covers the same deployment flow as your Copilot prompt but is structured specifically for Kiro's task-oriented workflow, with explicit rules to prevent common mistakes with your UUID-based schema and payment integrations.

