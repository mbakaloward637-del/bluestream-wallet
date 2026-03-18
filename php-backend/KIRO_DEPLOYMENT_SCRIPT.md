# Kiro AI Assistant Script — AbanRemit Clean Production Deployment

## How to Use

1. Open **Kiro** in VS Code
2. Start a new chat session
3. Copy everything inside the code block below and paste it into Kiro
4. Kiro will walk you through each step sequentially
5. Confirm each step before it moves to the next

---

## Paste This Into Kiro

```text
You are acting as a senior DevOps and Laravel engineer for the AbanRemit fintech platform. This is a CLEAN deployment — the previous server files will be deleted and replaced.

## PROJECT ARCHITECTURE

Frontend: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui (PWA-enabled)
Backend: Laravel 10 REST API with JWT auth (tymon/jwt-auth), UUID models, M-Pesa, Paystack, Instalipa integrations
Database: MySQL 5.7+ with UUID primary keys (CHAR(36)) on ALL tables
Hosting: cPanel shared hosting at abanremit.com (or subdomain abanremit.abancool.com)
Domain: Same-domain setup — React SPA at public_html/, Laravel API at public_html/api/

## DIRECTORY STRUCTURE ON SERVER

/home/abancool/
├── laravel/                    ← Laravel app (OUTSIDE public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                 ← Will be symlinked to public_html/api/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── artisan
└── public_html/                ← React SPA build output
    ├── index.html
    ├── assets/
    ├── .htaccess               ← Routes /api → Laravel, else → React SPA
    └── api/ → symlink to /home/abancool/laravel/public/

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
11. Wallets are NOT created at registration. A wallet is created ONLY when admin approves KYC.
12. The user's chosen currency during registration becomes the wallet default currency.
13. Balance shows as "0.00 KES" or "0.00 USD" (amount then currency code).

## IMPORTANT: KYC → WALLET FLOW

The registration flow works like this:
1. User registers → Profile + User created, NO wallet
2. User uploads KYC documents (ID front, ID back, selfie)
3. Admin reviews and approves/rejects KYC
4. On KYC APPROVAL → Wallet is created with the currency the user chose at registration
5. User gets notified via in-app notification + SMS with their new wallet number
6. On KYC REJECTION → Admin provides reason, user is notified and can re-upload

## TASK LIST — EXECUTE IN ORDER

### Task 1: Upload Laravel Backend
1. Delete everything in /home/abancool/laravel/ (if exists)
2. Upload the entire php-backend/ directory contents to /home/abancool/laravel/
3. Make sure the file structure is correct:
   - /home/abancool/laravel/artisan
   - /home/abancool/laravel/composer.json
   - /home/abancool/laravel/app/
   - /home/abancool/laravel/routes/
   - etc.

### Task 2: Install Composer Dependencies
```bash
cd /home/abancool/laravel
composer install --no-dev --optimize-autoloader
```
If composer is not in PATH, use: `/usr/local/bin/composer install --no-dev --optimize-autoloader`
Or via cPanel Terminal: `php composer.phar install --no-dev --optimize-autoloader`

### Task 3: Configure .env File
Create/edit /home/abancool/laravel/.env with these values:

```env
APP_NAME=AbanRemit
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://abanremit.abancool.com
FRONTEND_URL=https://abanremit.abancool.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=abancool_aban
DB_USERNAME=abancool_labo
DB_PASSWORD=Labankhisa2030

CACHE_DRIVER=file
QUEUE_CONNECTION=database
SESSION_DRIVER=file

JWT_SECRET=
JWT_TTL=60
JWT_REFRESH_TTL=20160

MPESA_API_URL=https://api.safaricom.co.ke
MPESA_CONSUMER_KEY=QwzCGC1fTPluVAXeNjxFTTDXsjklVKeL
MPESA_CONSUMER_SECRET=6Uc2GeVcZBUGWHGT
MPESA_SHORTCODE=000772
MPESA_PASSKEY=b309881157d87125c7f87ffffde6448ab10f90e3dce7c4d8efab190482896018
MPESA_INITIATOR_NAME=apiuser
MPESA_SECURITY_CREDENTIAL=QiHDv6Xqs1Ar/2ARMEqsHcide3ZluYbGxcrWdAPFoPZaG/NYuDU1vdkWBwgB3cHb7ltnL+ILmLk7oHBWywAiXWzypPoCPMPC8iQtYq/lhHwFDwz0ZnLyR/zW+naBtizbjSSDRrv9r1CBbn6jjq7lx+drMXfVTqJ7R8IhKCVPjFk/PZ0KXf1/3Tmr3cCO5gbbe7PdmAWY7mTIiaDDY4UydJqP3nGho7EgEUvciEmkNgMTmMWfSwaXIB8uCmRyP7CXIbIyoJ2CBOzoOupKGmVuPBgubYPHvcocULtgnVAzOlWYFiOIXqSd59KSfcGMytr1MLhOyEncS9epwFNEfgJhTQ==
MPESA_CALLBACK_ALLOWED_IPS=41.90.115.0,41.223.34.0
MPESA_VALIDATION_URL=https://abanremit.abancool.com/api/v1/webhooks/mpesa/validation
MPESA_CONFIRMATION_URL=https://abanremit.abancool.com/api/v1/webhooks/mpesa/c2b
MPESA_B2C_RESULT_URL=https://abanremit.abancool.com/api/v1/webhooks/mpesa/b2c
MPESA_B2C_TIMEOUT_URL=https://abanremit.abancool.com/api/v1/webhooks/mpesa/b2c
MPESA_ENV=production

PAYSTACK_PUBLIC_KEY=pk_live_5e40405f290dee664d1bd2e2a670b565531207d7
PAYSTACK_SECRET_KEY=sk_live_c47a63d9012435787d4cc20fda8e7e8970739112
PAYSTACK_CALLBACK_URL=https://abanremit.abancool.com/api/v1/webhooks/paystack

INSTALIPA_API_URL=https://api.instalipa.com
INSTALIPA_CONSUMER_KEY=mxbn7EPCk_wMfr1_mlVQagmZoSS2RVJSkZ3YyuF8iW
INSTALIPA_CONSUMER_SECRET=lIVlbDRXcIrxu6Oq0pA_UnowcsPujP5jvxQdEn1Th2hyoexpkypvZU0VPrc1QXHEqNVV_yRqiKACmaTvtKk5qw
INSTALIPA_CALLBACK_URL=https://abanremit.abancool.com/api/v1/webhooks/airtime
INSTALIPA_TIMEOUT=30000

TALKSASA_API_URL=https://bulksms.talksasa.com/api/v3
TALKSASA_API_TOKEN=1956|W7r0b7vuSgcT2UqiYvFcKIodUOkSPlabpVtcVh4u7c347b80
TALKSASA_SENDER_ID=ABANREMIT
TALKSASA_TIMEOUT=15000

EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
EXCHANGE_RATE_API_KEY=6e90421765ab03889d5ea89d

MAIL_MAILER=smtp
MAIL_HOST=mail.abanremit.com
MAIL_PORT=465
MAIL_USERNAME=support@abanremit.com
MAIL_PASSWORD=Labankhisa2030
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=support@abanremit.com
MAIL_FROM_NAME="AbanRemit"

BCRYPT_ROUNDS=12
SESSION_LIFETIME=120
```

Then generate keys:
```bash
cd /home/abancool/laravel
php artisan key:generate
php artisan jwt:secret --force
```

### Task 4: Set Permissions
```bash
chmod -R 755 /home/abancool/laravel/storage
chmod -R 755 /home/abancool/laravel/bootstrap/cache
chmod -R 644 /home/abancool/laravel/.env
```

### Task 5: Create Symlink
```bash
# Remove old api directory if exists
rm -rf /home/abancool/public_html/api

# Create symlink
ln -s /home/abancool/laravel/public /home/abancool/public_html/api
```

Verify: `ls -la /home/abancool/public_html/api` should show → `/home/abancool/laravel/public`

### Task 6: Configure .htaccess for public_html
Create/replace /home/abancool/public_html/.htaccess:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Pass Authorization header to PHP
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Route /api/* requests to Laravel's public/index.php
    RewriteCond %{REQUEST_URI} ^/api(/.*)?$
    RewriteRule ^api(/.*)?$ api/index.php [QSA,L]

    # If the requested file or directory exists, serve it
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Otherwise, serve React's index.html (SPA routing)
    RewriteRule ^ index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

### Task 7: Run Database Migration
```bash
cd /home/abancool/laravel
php artisan migrate --force
```

Verify ALL these tables exist:
- users, profiles, wallets, user_roles, transactions
- withdrawal_requests, notifications_custom, exchange_rates
- fee_config, virtual_cards, activity_logs, security_alerts
- support_tickets, payment_gateways, platform_config
- password_reset_tokens

If migration fails with "table already exists", the database might have leftover tables. You can:
```bash
php artisan migrate:fresh --force
```
⚠️ WARNING: This drops ALL tables. Only do this on first clean deploy.

### Task 8: Seed Database
```bash
php artisan db:seed --force
```

This creates:
- Super Admin: admin@abanremit.com / Admin@123456 (with approved KYC + wallet)
- Default exchange rates (KES ↔ USD, GBP, EUR, USD ↔ GBP)
- Default fee config (1.5% transfer, KES 50 withdrawal)

### Task 9: Create Storage Link & Cache Config
```bash
cd /home/abancool/laravel
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Task 10: Build and Deploy React Frontend
On local machine:
1. Create `.env.production` in the project root:
```
VITE_API_BASE_URL=https://abanremit.abancool.com/api/v1
```

2. Build:
```bash
npm run build
```

3. Upload the contents of `dist/` to `/home/abancool/public_html/`
   - DO NOT overwrite the `api/` symlink
   - Upload: index.html, assets/, icon-192.png, icon-512.png, manifest.webmanifest, etc.

### Task 11: Post-Deploy Verification
Test these endpoints:

```bash
# 1. API health check — should return JSON (not HTML)
curl -s https://abanremit.abancool.com/api/v1/exchange-rates | head -100

# 2. Public fees
curl -s https://abanremit.abancool.com/api/v1/fees

# 3. Test login
curl -s -X POST https://abanremit.abancool.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abanremit.com","password":"Admin@123456"}'

# Should return: {"success":true,"token":"eyJ...","user":{...}}

# 4. Test auth/me with the token from step 3
curl -s https://abanremit.abancool.com/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. Visit the frontend
# https://abanremit.abancool.com → should show login page
# Login with admin@abanremit.com / Admin@123456
```

### Task 12: Set Up Cron Job
In cPanel → Cron Jobs, add:
```
* * * * * cd /home/abancool/laravel && php artisan schedule:run >> /dev/null 2>&1
```

### Task 13: Configure Payment Webhooks
Set these URLs in your payment provider dashboards:

**Paystack Dashboard:**
- Webhook URL: `https://abanremit.abancool.com/api/v1/webhooks/paystack`

**M-Pesa (Safaricom):**
- C2B Confirmation: `https://abanremit.abancool.com/api/v1/webhooks/mpesa/c2b`
- C2B Validation: `https://abanremit.abancool.com/api/v1/webhooks/mpesa/validation`
- B2C Result: `https://abanremit.abancool.com/api/v1/webhooks/mpesa/b2c`

**Instalipa (Airtime):**
- Callback: `https://abanremit.abancool.com/api/v1/webhooks/airtime`

### Task 14: Security Hardening
```bash
cd /home/abancool/laravel

# 1. Change super admin password immediately after first login
# 2. Remove example files
rm -f .env.example

# 3. Verify debug is off
grep APP_DEBUG .env
# Should show: APP_DEBUG=false

# 4. Set proper log rotation
# In config/logging.php, daily channel is recommended

# 5. Final cache
php artisan config:cache
php artisan route:cache
```

## TROUBLESHOOTING

### If API returns 404:
- Check symlink: `ls -la /home/abancool/public_html/api`
- Check .htaccess RewriteRule points to `api/index.php`
- Check Laravel's public/index.php exists
- Run: `php artisan route:list` to verify routes are registered

### If API returns 500:
- Check logs: `tail -50 /home/abancool/laravel/storage/logs/laravel.log`
- Verify .env has APP_KEY and JWT_SECRET set
- Run: `php artisan config:clear && php artisan config:cache`

### If CORS errors:
- Verify FRONTEND_URL in .env matches your actual domain
- Clear config cache: `php artisan config:cache`

### If login fails:
- Verify JWT_SECRET is generated: `php artisan jwt:secret`
- Clear cache: `php artisan config:cache`
- Check database connection: `php artisan migrate:status`

### If "table not found" errors:
- Run: `php artisan migrate:status` to see which migrations ran
- Run: `php artisan migrate --force` to run pending migrations

## HOW TO HELP ME

Walk me through each task one at a time. After each task, ask me to confirm completion before moving to the next. If I encounter errors, help me debug using `storage/logs/laravel.log` output. Always prioritize data safety — never suggest dropping tables with existing data unless I explicitly confirm it's a clean install.

IMPORTANT: The domain might be abanremit.abancool.com OR abanremit.com — adjust all URLs accordingly based on what I tell you.
```