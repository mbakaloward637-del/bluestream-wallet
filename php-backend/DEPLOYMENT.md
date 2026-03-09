# AbanRemit — cPanel Deployment Guide (Same Domain)

## Architecture: Frontend + Backend on `abanremit.com`

```
public_html/
├── index.html          ← React app (Vite build)
├── assets/             ← React JS/CSS bundles
├── icon-192.png
├── icon-512.png
├── robots.txt
├── .htaccess           ← Routes /api to Laravel, everything else to React
└── api/                ← Symlink OR copy of Laravel's public/ folder
    ├── index.php
    └── .htaccess

/home/abancool/laravel/     ← Laravel app (OUTSIDE public_html)
├── app/
├── config/
├── database/
├── routes/
├── storage/
├── vendor/
├── .env                    ← YOUR REAL CREDENTIALS HERE
├── artisan
└── composer.json
```

---

## Step 1: Upload Laravel Backend

### Via File Manager or SSH:

```bash
# Create Laravel directory OUTSIDE public_html
mkdir -p /home/abancool/laravel

# Upload the entire php-backend/ contents to /home/abancool/laravel/
# You can zip the php-backend folder, upload via File Manager, and extract
```

### Install Dependencies (SSH):
```bash
cd /home/abancool/laravel
composer install --no-dev --optimize-autoloader
```

### If no SSH access (cPanel Terminal):
Use cPanel → Terminal (if available) or contact hosting to run composer.

---

## Step 2: Configure Environment

```bash
cd /home/abancool/laravel
cp .env.example .env
```

**Edit `.env` with your REAL credentials:**

```env
APP_NAME=AbanRemit
APP_ENV=production
APP_URL=https://abanremit.com
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=abancool_aban
DB_USERNAME=abancool_labo
DB_PASSWORD=YOUR_DB_PASSWORD

JWT_SECRET=   (generate in step 3)

FRONTEND_URL=https://abanremit.com,https://www.abanremit.com

MPESA_API_URL=https://api.safaricom.co.ke
MPESA_CONSUMER_KEY=YOUR_KEY
MPESA_CONSUMER_SECRET=YOUR_SECRET
MPESA_SHORTCODE=000772
MPESA_PASSKEY=YOUR_PASSKEY
MPESA_SECURITY_CREDENTIAL=YOUR_CREDENTIAL
MPESA_ENV=production

PAYSTACK_PUBLIC_KEY=pk_live_YOUR_KEY
PAYSTACK_SECRET_KEY=sk_live_YOUR_KEY

INSTALIPA_CONSUMER_KEY=YOUR_KEY
INSTALIPA_CONSUMER_SECRET=YOUR_SECRET

TALKSASA_API_TOKEN=YOUR_TOKEN

EXCHANGE_RATE_API_KEY=YOUR_KEY

MAIL_HOST=mail.abanremit.com
MAIL_PORT=465
MAIL_USERNAME=support@abanremit.com
MAIL_PASSWORD=YOUR_MAIL_PASSWORD
MAIL_ENCRYPTION=ssl
```

---

## Step 3: Generate Keys & Migrate

```bash
cd /home/abancool/laravel

php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan storage:link
```

The seeder creates:
- **Super Admin**: `admin@abanremit.com` / `Admin@123456` ⚠️ CHANGE IMMEDIATELY
- Default exchange rates (KES ↔ USD, GBP, EUR)
- Default fee config (1.5% transfer, KES 50 withdrawal)

---

## Step 4: Set Permissions

```bash
chmod -R 755 /home/abancool/laravel/storage
chmod -R 755 /home/abancool/laravel/bootstrap/cache
```

---

## Step 5: Link Laravel to public_html/api/

### Option A: Symlink (Preferred — SSH required)
```bash
ln -s /home/abancool/laravel/public /home/abancool/public_html/api
```

### Option B: Copy + Edit index.php (No SSH)
1. Create folder `public_html/api/`
2. Copy ALL files from `laravel/public/` into `public_html/api/`
3. Edit `public_html/api/index.php` — change the paths:

```php
<?php
// Change these two lines to point to the laravel directory:
require __DIR__.'/../../laravel/vendor/autoload.php';
$app = require_once __DIR__.'/../../laravel/bootstrap/app.php';
```

---

## Step 6: Configure .htaccess Files

### `public_html/.htaccess` (Root — serves React + routes /api)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # If requesting /api, let it pass through to the api/ folder
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
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### `public_html/api/.htaccess` (Laravel)

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)/$ /$1 [L,R=301]

    # Send Requests To Front Controller
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## Step 7: Build & Upload React Frontend

On your **local machine** (or in Lovable):

```bash
# Set the API URL for production build
echo "VITE_API_BASE_URL=https://abanremit.com/api/v1" > .env.production

npm run build
```

Upload the contents of the `dist/` folder to `public_html/`:
- `index.html` → `public_html/index.html`
- `assets/` → `public_html/assets/`
- All other files (icons, robots.txt, etc.)

⚠️ Do NOT overwrite the `api/` folder or `.htaccess` when uploading!

---

## Step 8: Verify Deployment

| Check | How |
|-------|-----|
| Frontend loads | Visit `https://abanremit.com` — should see login page |
| API health | Visit `https://abanremit.com/api` — should see JSON health response |
| API login | `POST https://abanremit.com/api/v1/auth/login` with admin credentials |
| DB connected | `php artisan migrate:status` (SSH) |
| CORS working | Frontend can call API without blocked-by-CORS errors |
| M-Pesa callbacks | Test STK Push with sandbox first |

---

## Step 9: Configure Webhook URLs

### Paystack Dashboard → Settings → Webhooks:
```
https://abanremit.com/api/v1/webhooks/paystack
```

### M-Pesa (Safaricom Daraja):
Already configured in `.env`:
- C2B Callback: `https://abanremit.com/api/v1/webhooks/mpesa/c2b`
- B2C Result: `https://abanremit.com/api/v1/webhooks/mpesa/b2c`
- Validation: `https://abanremit.com/api/v1/webhooks/mpesa/validation`

### Instalipa → Settings → Webhooks:
```
https://abanremit.com/api/v1/webhooks/airtime
```

---

## Step 10: Security Hardening

- [ ] Change super admin password immediately after first login
- [ ] Ensure `APP_DEBUG=false` in `.env`
- [ ] SSL certificate active (Let's Encrypt via cPanel)
- [ ] Set specific `FRONTEND_URL` in `.env` (no wildcard `*`)
- [ ] Remove default Laravel routes that expose app info
- [ ] Set up cron for Laravel scheduler (if using queues):
  ```
  * * * * * cd /home/abancool/laravel && php artisan schedule:run >> /dev/null 2>&1
  ```
- [ ] Set up queue worker (if using database queue):
  ```
  cd /home/abancool/laravel && php artisan queue:work --daemon
  ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 error on API | Check `storage/logs/laravel.log`, ensure permissions on `storage/` |
| CORS errors | Verify `FRONTEND_URL` in `.env` matches your domain exactly |
| JWT errors | Run `php artisan jwt:secret` and clear config cache |
| M-Pesa callbacks not working | Ensure callback IPs are whitelisted, check `MPESA_CALLBACK_ALLOWED_IPS` |
| React routes return 404 | Check `.htaccess` in `public_html/` has the SPA fallback rule |
| API returns HTML instead of JSON | Ensure `public_html/api/.htaccess` has the Authorization header fix |
| "Class not found" errors | Run `composer dump-autoload -o` in laravel directory |

---

## File Locations Summary

| Component | Location |
|-----------|----------|
| Laravel App | `/home/abancool/laravel/` |
| Laravel .env | `/home/abancool/laravel/.env` |
| Laravel Logs | `/home/abancool/laravel/storage/logs/laravel.log` |
| React Build | `/home/abancool/public_html/` |
| API Endpoint | `/home/abancool/public_html/api/` → symlink to laravel/public |
| Uploads | `/home/abancool/laravel/storage/app/public/` |
