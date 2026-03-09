# AbanRemit PHP Backend — Deployment Guide

## Prerequisites
- PHP 8.1+ with extensions: `pdo_mysql`, `mbstring`, `openssl`, `json`, `curl`
- Composer 2.x
- MySQL 8.0+ or MariaDB 10.5+
- cPanel, VPS, or any LAMP/LEMP hosting

---

## 1. Server Setup

### cPanel
1. Create a subdomain for the API (e.g., `api.abanremit.com`)
2. Point the document root to `public/` folder
3. Create a MySQL database and user via cPanel → MySQL Databases

### VPS (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install php8.1 php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl composer nginx mysql-server
```

---

## 2. Install Dependencies

```bash
cd php-backend
composer install --no-dev --optimize-autoloader
```

---

## 3. Environment Configuration

```bash
cp .env.example .env
```

Fill in ALL values:

| Variable | Description |
|----------|-------------|
| `APP_URL` | Your API domain (e.g., `https://api.abanremit.com`) |
| `FRONTEND_URL` | React app URL for CORS (e.g., `https://app.abanremit.com`) |
| `DB_*` | MySQL credentials |
| `JWT_SECRET` | Auto-generated (step 4) |
| `PAYSTACK_SECRET_KEY` | From Paystack dashboard → Settings → API Keys |
| `PAYSTACK_PUBLIC_KEY` | Publishable key from Paystack |
| `MPESA_CONSUMER_KEY` | From Safaricom Developer Portal → My Apps |
| `MPESA_CONSUMER_SECRET` | Same as above |
| `MPESA_SHORTCODE` | Your M-Pesa paybill/till number |
| `MPESA_PASSKEY` | From Safaricom Daraja sandbox/production |
| `MPESA_CALLBACK_URL` | `https://api.abanremit.com/api/v1/webhooks/mpesa/c2b` |
| `MPESA_B2C_RESULT_URL` | `https://api.abanremit.com/api/v1/webhooks/mpesa/b2c` |
| `MPESA_ENV` | `sandbox` for testing, `production` for live |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking app username |
| `AT_ENV` | `sandbox` or `production` |

---

## 4. Generate Keys & Migrate

```bash
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan storage:link
```

The seeder creates:
- **Super Admin**: `admin@abanremit.com` / `Admin@123456` (change immediately!)
- Default exchange rates (KES ↔ USD, GBP, EUR)
- Default fee config (1.5% transfer, KES 50 flat withdrawal)

---

## 5. Permissions

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## 6. Nginx Configuration (VPS only)

```nginx
server {
    listen 80;
    server_name api.abanremit.com;
    root /var/www/abanremit/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 7. Webhook URLs to Configure

### Paystack
Dashboard → Settings → Webhooks:
```
https://api.abanremit.com/api/v1/webhooks/paystack
```

### M-Pesa (Safaricom Daraja)
Already configured via `.env` variables — callbacks auto-registered on STK Push/B2C requests.

### Africa's Talking
No incoming webhooks needed — outbound only (SMS/Airtime).

---

## 8. React Frontend Deployment

```bash
# In the React project root
echo "VITE_API_URL=https://api.abanremit.com/api/v1" > .env.production
npm run build
```

Deploy the `dist/` folder to your frontend domain.

Copy `php-backend/frontend-api-service/api.ts` → `src/services/api.ts` and follow `MIGRATION_GUIDE.md` to replace Supabase calls.

---

## 9. Post-Deployment Verification

| Check | Command / Action |
|-------|-----------------|
| API health | `curl https://api.abanremit.com` → `{"app":"AbanRemit API","version":"1.0.0","status":"running"}` |
| Login | `POST /api/v1/auth/login` with admin credentials |
| DB connection | `php artisan migrate:status` |
| Storage link | Verify `public/storage` symlink exists |
| CORS | Frontend can call API without blocked-by-CORS errors |
| Webhooks | Test with Paystack/M-Pesa sandbox callbacks |

---

## 10. Security Hardening

- [ ] Change super admin password immediately after first login
- [ ] Set `APP_DEBUG=false` in production
- [ ] Enable HTTPS (SSL certificate via Let's Encrypt)
- [ ] Set specific `FRONTEND_URL` instead of wildcard `*` in CORS
- [ ] Enable MySQL slow query log for performance monitoring
- [ ] Set up log rotation for `storage/logs/`
- [ ] Configure fail2ban for SSH and API rate limiting

---

## API Route Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | User registration |
| POST | `/auth/login` | No | JWT login |
| POST | `/auth/logout` | Yes | Invalidate token |
| GET | `/auth/me` | Yes | Current user data |
| GET | `/wallet` | Yes | Wallet info |
| POST | `/wallet/set-pin` | Yes | Set/change PIN |
| GET | `/transactions` | Yes | List transactions |
| POST | `/transactions/transfer` | Yes | Send money |
| POST | `/transactions/deposit` | Yes | Deposit funds |
| POST | `/transactions/withdraw` | Yes | Withdraw funds |
| POST | `/transactions/exchange` | Yes | Currency exchange |
| POST | `/airtime/purchase` | Yes | Buy airtime |
| POST | `/mpesa/stk-push` | Yes | M-Pesa deposit |
| POST | `/mpesa/b2c` | Yes | M-Pesa withdrawal |
| POST | `/statements/download` | Yes | CSV statement (50 KES) |
| GET | `/statements/preview` | Yes | Statement preview |
| POST | `/webhooks/paystack` | No* | Paystack callback |
| POST | `/webhooks/mpesa/c2b` | No* | M-Pesa C2B callback |
| POST | `/webhooks/mpesa/b2c` | No* | M-Pesa B2C callback |
| GET | `/admin/dashboard` | Admin | Admin stats |
| GET | `/admin/users` | Admin | All users |
| POST | `/admin/notifications/bulk` | Admin | Bulk notifications |
| POST | `/admin/sms/bulk` | Admin | Bulk SMS |
| GET | `/admin/exchange-rates` | Super | Exchange rates CRUD |
| GET | `/admin/fees` | Super | Fee config CRUD |
| POST | `/admin/roles` | Super | Assign roles |

*Webhook routes use signature verification instead of JWT auth.

All authenticated routes require: `Authorization: Bearer <jwt_token>`
