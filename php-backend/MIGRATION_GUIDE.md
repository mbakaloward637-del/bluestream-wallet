# Migration Guide: Supabase → PHP API

## Step-by-step instructions to switch the React frontend to use the PHP backend

### 1. Set API URL
Add to your `.env`:
```
VITE_API_URL=https://your-php-api-domain.com/api/v1
```

### 2. Copy the API service
Copy `php-backend/frontend-api-service/api.ts` → `src/services/api.ts`

### 3. Replace AuthContext.tsx

Replace all Supabase auth calls with `api.auth.*`:

```tsx
// BEFORE (Supabase)
import { supabase } from "@/integrations/supabase/client";
const { error } = await supabase.auth.signInWithPassword({ email, password });

// AFTER (PHP API)
import { api } from "@/services/api";
const result = await api.auth.login(email, password);
// result contains { token, user }
```

### 4. Key replacements per file

| File | Supabase Call | PHP API Replacement |
|------|--------------|---------------------|
| `AuthContext.tsx` | `supabase.auth.signInWithPassword()` | `api.auth.login()` |
| `AuthContext.tsx` | `supabase.auth.signUp()` | `api.auth.register()` |
| `AuthContext.tsx` | `supabase.auth.signOut()` | `api.auth.logout()` |
| `AuthContext.tsx` | `supabase.from('profiles').select()` | `api.auth.me()` (returns all data) |
| `AuthContext.tsx` | `supabase.from('wallets').select()` | Included in `api.auth.me()` |
| `AuthContext.tsx` | `supabase.from('user_roles').select()` | Included in `api.auth.me()` |
| `Dashboard.tsx` | `supabase.from('transactions').select()` | `api.transactions.list()` |
| `SendMoney.tsx` | `supabase.rpc('lookup_recipient')` | `api.recipients.lookup()` |
| `SendMoney.tsx` | `supabase.rpc('transfer_funds')` | `api.transactions.transfer()` |
| `LoadWallet.tsx` | `supabase.from('wallets').update()` | `api.transactions.deposit()` |
| `Withdraw.tsx` | Direct wallet/tx inserts | `api.transactions.withdraw()` |
| `BuyAirtime.tsx` | Direct wallet/tx inserts | `api.transactions.airtime()` |
| `Exchange.tsx` | Direct wallet/tx updates | `api.transactions.exchange()` |
| `Profile.tsx` | `supabase.from('profiles').update()` | `api.profile.update()` |
| `Profile.tsx` | `supabase.auth.updateUser()` | `api.auth.changePassword()` |
| `Profile.tsx` | `supabase.functions.invoke('set-wallet-pin')` | `api.wallet.setPin()` |
| `Notifications.tsx` | `supabase.from('notifications').select()` | `api.notifications.list()` |
| `Transactions.tsx` | `supabase.from('transactions').select()` | `api.transactions.list()` |
| `Exchange.tsx` | `supabase.from('exchange_rates').select()` | `api.exchangeRates.list()` |
| Admin pages | `supabase.from(...)` | `api.admin.*` methods |

### 5. Remove Supabase dependency (optional)
```bash
npm uninstall @supabase/supabase-js
```

### 6. Handle realtime
The PHP backend doesn't include WebSocket/realtime.
Options:
- Poll with `setInterval` + `react-query` `refetchInterval`
- Add Laravel Broadcasting (Pusher/Soketi) for WebSocket support
- Use Server-Sent Events (SSE)

### 7. File Storage (KYC uploads)
PHP uses Laravel's built-in file storage. Uploads go to `storage/app/public/kyc/`.
Replace:
```tsx
// BEFORE
await supabase.storage.from('kyc-documents').upload(path, file);

// AFTER
const formData = new FormData();
formData.append('id_front', file);
await api.profile.uploadKyc(formData);
```

### 8. cPanel Deployment Checklist
1. ✅ Upload `php-backend/` contents to cPanel
2. ✅ Point document root to `public/` folder
3. ✅ Create MySQL database, update `.env`
4. ✅ Run `php artisan migrate --seed` via terminal
5. ✅ Run `php artisan storage:link`
6. ✅ Set proper file permissions (755 folders, 644 files)
7. ✅ Deploy React frontend (built with `npm run build`) to subdomain or same domain
8. ✅ Set `VITE_API_URL` in frontend `.env` to PHP API URL
9. ✅ Enable CORS on PHP side (already configured)
