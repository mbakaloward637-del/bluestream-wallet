# AbanRemit — cPanel Deployment Guide

## Architecture: Same-Domain Setup on `abanremit.com`

```
public_html/                    ← React SPA (Vite build output)
├── index.html
├── assets/                     ← JS/CSS bundles
├── icon-192.png
├── icon-512.png
├── robots.txt
├── .htaccess                   ← Routes /api → Laravel, else → React SPA
└── api/                        ← Symlink to laravel/public/
    ├── index.php
    └── .htaccess

/home/abancool/laravel/         ← Laravel app (OUTSIDE public_html)
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── routes/
├── storage/
├── vendor/
├── .env
├── artisan
└── composer.json
```

---

## Pre-requisites

| Requirement | Minimum |
|---|---|
| PHP | 8.1+ |
| MySQL | 5.7+ / MariaDB 10.3+ |
| Composer | 2.x |
| SSH Access | Recommended (or cPanel Terminal) |
| SSL | Required (Let's Encrypt via cPanel) |

---

## Step 1: Create MySQL Database

In cPanel → MySQL Databases:
1. Create database: `abancool_aban`
2. Create user: `abancool_labo` with password `Labankhisa2030`
3. Add user to database with **ALL PRIVILEGES**

---

## Step 2: Upload Laravel Backend

```bash
# SSH into server
ssh abancool@abanremit.com

# Create directory
mkdir -p /home/abancool/laravel

# Upload php-backend/ contents to /home/abancool/laravel/
# Option A: SCP
scp -r php-backend/* abancool@abanremit.com:/home/abancool/laravel/

# Option B: Zip and upload via File Manager
# Zip php-backend/, upload to /home/abancool/, extract to laravel/
```

---

## Step 3: Install Dependencies

```bash
cd /home/abancool/laravel
composer install --no-dev --optimize-autoloader
```

---

## Step 4: Configure Environment

The `.env` file is already pre-configured with your production credentials.

```bash
cd /home/abancool/laravel

# Generate app key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret

# Verify .env is correct
cat .env | head -20
```

---

## Step 5: Run Database Migration

```bash
cd /home/abancool/laravel

# Create all tables
php artisan migrate

# Seed default data (super admin, exchange rates, fees)
php artisan db:seed
```

**Seeded data:**
- Super Admin: `admin@abanremit.com` / `Admin@123456` ⚠️ **CHANGE IMMEDIATELY**
- Exchange rates: KES ↔ USD, GBP, EUR
- Fee config: 1.5% transfer fee, KES 50 withdrawal fee

---

## Step 6: Set Permissions

```bash
chmod -R 755 /home/abancool/laravel/storage
chmod -R 755 /home/abancool/laravel/bootstrap/cache
chown -R abancool:abancool /home/abancool/laravel/storage

# Create storage link for file uploads
php artisan storage:link
```

---

## Step 7: Link API to public_html

### Option A: Symlink (SSH required — preferred)
```bash
ln -s /home/abancool/laravel/public /home/abancool/public_html/api
```

### Option B: Copy (no SSH)
1. Create `public_html/api/`
2. Copy all files from `laravel/public/` into it
3. Edit `public_html/api/index.php`:
```php
<?php
require __DIR__.'/../../laravel/vendor/autoload.php';
$app = require_once __DIR__.'/../../laravel/bootstrap/app.php';
```

---

## Step 8: Create .htaccess Files

### `public_html/.htaccess`
Copy from `php-backend/deployment-files/public_html/.htaccess`

### `public_html/api/.htaccess`
Already included in `laravel/public/.htaccess` (copied or symlinked in Step 7)

---

## Step 9: Build & Upload React Frontend

On your local machine:

```bash
# Create production env
echo "VITE_API_BASE_URL=https://abanremit.com/api/v1" > .env.production

# Build
npm run build

# Upload dist/ contents to public_html/
# ⚠️ Do NOT overwrite api/ folder or .htaccess
```

---

## Step 10: Verify Deployment

| Check | Command / URL |
|---|---|
| API health | `curl https://abanremit.com/api` → should return JSON |
| API login | `curl -X POST https://abanremit.com/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@abanremit.com","password":"Admin@123456"}'` |
| Frontend | Visit `https://abanremit.com` → should see login page |
| DB status | `cd /home/abancool/laravel && php artisan migrate:status` |

---

## Step 11: Configure Webhooks

### Paystack Dashboard → Settings → Webhooks:
```
https://abanremit.com/api/v1/webhooks/paystack
```

### Safaricom Daraja Portal:
- C2B Confirmation: `https://abanremit.com/api/v1/webhooks/mpesa/c2b`
- C2B Validation: `https://abanremit.com/api/v1/webhooks/mpesa/validation`
- B2C Result: `https://abanremit.com/api/v1/webhooks/mpesa/b2c`

### Instalipa Dashboard:
```
https://abanremit.com/api/v1/webhooks/airtime
```

---

## Step 12: Set Up Cron Job

In cPanel → Cron Jobs:
```
* * * * * cd /home/abancool/laravel && php artisan schedule:run >> /dev/null 2>&1
```

---

## Step 13: Security Checklist

- [ ] Change super admin password after first login
- [ ] Ensure `APP_DEBUG=false` in `.env`
- [ ] SSL certificate active
- [ ] Remove `.env.example` from production
- [ ] Verify `FRONTEND_URL` in `.env` matches domain exactly
- [ ] Test all webhook URLs are reachable
- [ ] Set up log rotation for `storage/logs/`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| 500 error on API | Check `storage/logs/laravel.log`, fix permissions |
| CORS errors | Verify `FRONTEND_URL` in `.env` |
| JWT errors | Run `php artisan jwt:secret` then `php artisan config:clear` |
| React routes 404 | Check `public_html/.htaccess` SPA fallback |
| API returns HTML | Ensure `api/.htaccess` has Authorization header rewrite |
| "Class not found" | Run `composer dump-autoload -o` |
| Token expired | Frontend should catch 401 and redirect to login |

---

## File Locations

| Component | Path |
|---|---|
| Laravel App | `/home/abancool/laravel/` |
| Environment | `/home/abancool/laravel/.env` |
| Logs | `/home/abancool/laravel/storage/logs/laravel.log` |
| React Build | `/home/abancool/public_html/` |
| API Endpoint | `/home/abancool/public_html/api/` |
| File Uploads | `/home/abancool/laravel/storage/app/public/` |
