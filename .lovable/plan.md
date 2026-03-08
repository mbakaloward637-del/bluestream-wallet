

# End-to-End Audit & PHP Backend Migration Prompt

## Current App Audit Summary

After reviewing all pages, database schema, edge functions, and auth flows, here is the status:

### What's Working (Frontend-Complete, Backend-Wired)
1. **Auth**: Register, Login, Forgot Password, Reset Password -- all wired to Supabase Auth
2. **Dashboard**: Realtime wallet balance + transaction feed via Supabase Realtime
3. **Send Money**: Server-side `transfer_funds` RPC with fee calculation, recipient lookup
4. **Load Wallet**: Card (Paystack), M-Pesa (STK Push), Bank Transfer -- edge functions created, awaiting API keys
5. **Withdraw**: Bank + Mobile Money with withdrawal request creation, M-Pesa B2C edge function
6. **Buy Airtime**: Wallet debit + `process-airtime` edge function placeholder
7. **Exchange**: Currency conversion using `exchange_rates` table
8. **KYC**: Document upload to storage bucket, non-blocking dashboard access
9. **Transactions**: Full history with receipt modal
10. **Admin Panel**: Full admin/superadmin layout with users, KYC, transactions, withdrawals, fees, exchange rates, notifications, reports, security, logs
11. **SMS**: `send-transaction-sms` + `send-bulk-sms` edge functions (provider placeholder)
12. **PWA**: Install prompt, manifest, service worker configured

### Issues Found
1. **PIN not stored**: Registration collects PIN but never saves `pin_hash` to wallets table
2. **PIN not validated**: Send Money and Withdraw accept PIN input but never verify it
3. **Admin OTP is fake**: AdminLogin accepts any 4+ digit OTP without real verification
4. **Profile actions are dead**: "Update Personal Info", "Change Password", "Change PIN", "Upload New ID" buttons do nothing
5. **Transaction INSERT RLS**: Deposit/airtime/withdraw use `sender_user_id` but deposit sets `receiver_user_id` only -- will fail RLS check (`auth.uid() = sender_user_id`)
6. **LoadWallet immediately credits wallet**: Should only credit after payment confirmation (webhook), currently simulates instant credit
7. **Exchange debits but never credits**: Deducts from wallet but doesn't add converted amount
8. **Statement Download page**: Not reviewed but likely UI-only
9. **No route protection**: Dashboard and other pages rely on `useEffect` redirect but don't block render

---

## One-Time PHP Backend Prompt for Kiro

Below is a comprehensive prompt you can give to Kiro (or any PHP backend builder) to replicate all backend logic currently in Supabase and wire it to the React frontend.

---

### Prompt for Kiro:

**Project**: AbanRemit -- Digital Wallet & Remittance Platform  
**Frontend**: React + Vite + TypeScript + Tailwind CSS (already built)  
**Task**: Build a complete PHP (Laravel) REST API backend and integrate with the existing React frontend

---

#### DATABASE SCHEMA (MySQL/PostgreSQL)

```text
TABLES:
├── users (id UUID PK, email, password_hash, email_verified_at, created_at, updated_at)
├── profiles (id, user_id FK→users, first_name, last_name, middle_name, email, phone, country, country_code, city, address, gender, date_of_birth, avatar_url, id_front_url, id_back_url, selfie_url, kyc_status ENUM(pending,approved,rejected), status ENUM(active,suspended,frozen), created_at, updated_at)
├── wallets (id, user_id FK→users, wallet_number UNIQUE, balance DECIMAL(15,2) DEFAULT 0, currency VARCHAR(3) DEFAULT 'KES', pin_hash, is_locked BOOLEAN DEFAULT false, failed_pin_attempts INT DEFAULT 0, created_at, updated_at)
├── transactions (id, reference UNIQUE, type ENUM(deposit,send,receive,withdraw,airtime,exchange), sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id, amount DECIMAL, fee DECIMAL DEFAULT 0, currency, description, status ENUM(pending,completed,failed,reversed), method, provider, metadata JSON, created_at, updated_at)
├── withdrawal_requests (id, user_id, wallet_id, amount, currency, method, destination, status ENUM(pending,approved,rejected), reviewed_by, reviewed_at, created_at)
├── notifications (id, user_id, title, message, type VARCHAR DEFAULT 'info', read BOOLEAN DEFAULT false, created_at)
├── user_roles (id, user_id, role ENUM(user,admin,superadmin), UNIQUE(user_id,role))
├── fee_config (id, name, transaction_type ENUM(send,withdraw,exchange,airtime,deposit), fee_type ENUM(flat,percentage), flat_amount, percentage, min_amount, max_amount, is_active, updated_by, updated_at)
├── exchange_rates (id, from_currency, to_currency, rate DECIMAL, margin_percent, is_active, updated_by, updated_at)
├── virtual_cards (id, user_id, card_number, expiry, cvv, cardholder_name, provider DEFAULT 'paystack', provider_ref, is_frozen DEFAULT false, created_at)
├── support_tickets (id, user_id, subject, description, category ENUM(general,transaction,kyc,technical,billing), priority ENUM(low,medium,high,critical), status ENUM(open,in_progress,resolved,closed), created_at, updated_at)
├── security_alerts (id, type, user_id, description, severity ENUM(low,medium,high,critical), resolved BOOLEAN, resolved_by, created_at)
├── activity_logs (id, actor_id, action, target, ip_address, metadata JSON, created_at)
├── payment_gateways (id, name, provider, is_enabled, mode ENUM(sandbox,live), config JSON, updated_by, updated_at)
└── platform_config (id, key UNIQUE, value JSON, updated_by, updated_at)
```

#### API ENDPOINTS NEEDED

```text
AUTH:
POST   /api/auth/register          -- Create user + profile + wallet + assign 'user' role. Wallet number format: WLT888XXXXXXX (sequential). Send verification email.
POST   /api/auth/login              -- Email/password login, return JWT token
POST   /api/auth/forgot-password    -- Send password reset email with token
POST   /api/auth/reset-password     -- Verify token, update password
GET    /api/auth/me                 -- Return user profile + wallet + roles
POST   /api/auth/logout             -- Invalidate token

WALLET:
GET    /api/wallet                  -- Get user's wallet (balance, number, currency)
POST   /api/wallet/deposit          -- Initialize deposit (Paystack card / M-Pesa STK Push / bank)
POST   /api/wallet/deposit/verify   -- Verify payment (Paystack verify / M-Pesa callback) → credit wallet + create transaction
POST   /api/wallet/withdraw         -- Create withdrawal request, debit wallet, create pending transaction
POST   /api/wallet/transfer         -- Transfer to another user by wallet number or phone. Validate PIN. Calculate fee. Debit sender, credit receiver. Create 2 transaction records (send + receive). Create notification for receiver.

TRANSACTIONS:
GET    /api/transactions            -- List user's transactions (paginated, filterable by type/status)
GET    /api/transactions/:id        -- Single transaction detail

AIRTIME:
POST   /api/airtime/purchase        -- Validate PIN, debit wallet, call airtime provider API, create transaction

EXCHANGE:
GET    /api/exchange/rates          -- List active exchange rates
POST   /api/exchange/convert        -- Convert currency: debit amount in from_currency, credit converted amount. Create transaction.

RECIPIENT LOOKUP:
POST   /api/lookup/recipient        -- Lookup by wallet number or phone, return name + wallet (for send money UI)

NOTIFICATIONS:
GET    /api/notifications           -- User's notifications
PATCH  /api/notifications/:id/read  -- Mark as read

KYC:
POST   /api/kyc/upload              -- Upload ID front, ID back, selfie to storage. Update profile URLs.

PROFILE:
GET    /api/profile                 -- Get profile
PATCH  /api/profile                 -- Update personal info
POST   /api/profile/change-password -- Change password (requires current password)
POST   /api/profile/change-pin      -- Change wallet PIN (requires current PIN)

ADMIN ENDPOINTS (require admin/superadmin role middleware):
GET    /api/admin/dashboard         -- Stats: total users, total transactions, total volume, pending KYC, pending withdrawals
GET    /api/admin/users             -- List all users with profiles, wallets, roles (paginated, searchable)
PATCH  /api/admin/users/:id/status  -- Activate/suspend/freeze user
PATCH  /api/admin/users/:id/kyc     -- Approve/reject KYC
GET    /api/admin/transactions      -- All transactions (paginated, filterable)
PATCH  /api/admin/transactions/:id  -- Update transaction status
GET    /api/admin/withdrawals       -- All withdrawal requests
PATCH  /api/admin/withdrawals/:id   -- Approve/reject withdrawal. If approved, trigger payout (M-Pesa B2C or bank transfer).
GET    /api/admin/support-tickets   -- All support tickets
PATCH  /api/admin/support-tickets/:id -- Update ticket status
POST   /api/admin/notifications/send -- Send notification to users (in-app + optional SMS bulk)
GET    /api/admin/activity-logs     -- Activity logs
GET    /api/admin/security-alerts   -- Security alerts
PATCH  /api/admin/security-alerts/:id -- Resolve alert

SUPERADMIN ENDPOINTS (require superadmin role):
GET    /api/admin/roles             -- List all user roles
POST   /api/admin/roles             -- Assign role to user
DELETE /api/admin/roles/:id         -- Remove role
CRUD   /api/admin/fee-config        -- Manage fee configuration
CRUD   /api/admin/exchange-rates    -- Manage exchange rates
CRUD   /api/admin/payment-gateways  -- Manage payment gateway configs
CRUD   /api/admin/platform-config   -- Manage platform settings
GET    /api/admin/audit-logs        -- Full audit trail

WEBHOOKS (no auth, verify signature):
POST   /api/webhooks/paystack       -- Paystack payment confirmation → credit wallet
POST   /api/webhooks/mpesa          -- M-Pesa C2B/B2C callback → credit/update wallet
```

#### PAYMENT INTEGRATIONS

```text
PAYSTACK (Card Payments):
- Initialize transaction: POST https://api.paystack.co/transaction/initialize
- Verify transaction: GET https://api.paystack.co/transaction/verify/:reference
- Webhook: verify X-Paystack-Signature header with HMAC SHA512
- On successful webhook: credit user wallet, create completed transaction, send SMS

M-PESA (Safaricom):
- C2B STK Push (deposits): POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
- B2C (withdrawals): POST https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest
- OAuth token: GET https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
- Callback URL: /api/webhooks/mpesa
- Required env: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL

AIRTIME (Africa's Talking):
- POST https://api.africastalking.com/version1/airtime/send
- Required env: AT_API_KEY, AT_USERNAME

SMS (Africa's Talking or Twilio):
- Send transactional SMS on: deposit, transfer (sender+receiver), withdrawal, airtime
- Bulk SMS for admin notifications
```

#### FRONTEND INTEGRATION CHANGES

```text
Replace all Supabase client calls with REST API calls:
1. Replace `supabase.auth.*` with `/api/auth/*` endpoints. Store JWT in httpOnly cookie or localStorage.
2. Replace `supabase.from("table").select/insert/update` with corresponding REST endpoints.
3. Replace `supabase.rpc("transfer_funds")` with `POST /api/wallet/transfer`
4. Replace `supabase.rpc("lookup_recipient")` with `POST /api/lookup/recipient`
5. Replace `supabase.functions.invoke("process-*")` with direct API calls to `/api/wallet/deposit`, `/api/airtime/purchase`, etc.
6. Replace Supabase Realtime channels with WebSocket (Laravel Echo + Pusher/Socket.io) for:
   - Wallet balance updates (broadcast on wallet table changes)
   - New transaction notifications (broadcast on transaction insert)
7. Replace Supabase storage uploads with `/api/kyc/upload` multipart form endpoint.

Create an API client helper:
- Base URL from env variable
- Auto-attach Authorization: Bearer <token> header
- Handle 401 → redirect to /login
- Handle errors consistently
```

#### SECURITY REQUIREMENTS

```text
- Hash passwords with bcrypt
- Hash wallet PINs with bcrypt, validate on every financial transaction
- Rate limit: 5 failed login attempts → lock account 15 minutes
- Rate limit API: 100 requests/minute per user
- CORS: allow only frontend origin
- Validate all inputs server-side
- Use database transactions for all financial operations (debit + credit must be atomic)
- Log all admin actions to activity_logs
- Webhook signature verification for Paystack and M-Pesa
- JWT tokens with 24h expiry, refresh token support
- Admin role check via middleware, never trust client-side role claims
```

#### ENVIRONMENT VARIABLES NEEDED

```text
DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
JWT_SECRET
PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY
MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
AT_API_KEY, AT_USERNAME (Africa's Talking)
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
APP_URL (frontend URL for CORS + email links)
PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET (for realtime via Laravel Echo)
```

This prompt covers the complete backend needed to make AbanRemit production-ready with PHP/Laravel, replacing all current Supabase infrastructure.

