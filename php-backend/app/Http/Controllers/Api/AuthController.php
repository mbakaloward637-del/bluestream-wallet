<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profile;
use App\Models\Wallet;
use App\Models\UserRole;
use App\Models\ActivityLog;
use App\Models\SecurityAlert;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request)
    {
        // Rate limit: 5 registrations per IP per hour
        $key = 'register_rate:' . $request->ip();
        if ((int) Cache::get($key, 0) >= 5) {
            return response()->json(['error' => 'Too many registration attempts. Try again later.'], 429);
        }

        $v = Validator::make($request->all(), [
            'email'        => 'required|email:rfc,dns|unique:users|max:255',
            'password'     => 'required|min:8|max:128|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
            'first_name'   => 'required|string|max:100|regex:/^[\pL\s\'\-]+$/u',
            'last_name'    => 'required|string|max:100|regex:/^[\pL\s\'\-]+$/u',
            'middle_name'  => 'nullable|string|max:100',
            'phone'        => 'nullable|string|max:20|regex:/^[\+0-9\s\-]+$/',
            'country'      => 'nullable|string|max:100',
            'country_code' => 'nullable|string|max:5',
            'currency'     => 'nullable|string|max:5|in:KES,USD,GBP,EUR',
            'pin'          => 'nullable|string|min:4|max:6|regex:/^\d+$/',
            'city'         => 'nullable|string|max:100',
            'address'      => 'nullable|string|max:255',
            'gender'       => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date|before:today',
        ], [
            'password.regex' => 'Password must contain uppercase, lowercase, number and special character.',
        ]);

        if ($v->fails()) return response()->json(['error' => $v->errors()->first()], 422);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => trim($request->first_name . ' ' . $request->last_name),
                'email' => strtolower(trim($request->email)),
                'password' => Hash::make($request->password),
            ]);

            Profile::create([
                'user_id'      => $user->id,
                'first_name'   => trim($request->first_name),
                'last_name'    => trim($request->last_name),
                'middle_name'  => $request->middle_name ? trim($request->middle_name) : null,
                'email'        => strtolower(trim($request->email)),
                'phone'        => $request->phone,
                'country'      => $request->country ?? 'Kenya',
                'country_code' => $request->country_code ?? 'KE',
                'city'         => $request->city,
                'address'      => $request->address,
                'gender'       => $request->gender,
                'date_of_birth' => $request->date_of_birth,
            ]);

            $wallet = Wallet::create([
                'user_id'       => $user->id,
                'wallet_number' => Wallet::generateWalletNumber(),
                'currency'      => $request->currency ?? 'KES',
            ]);

            if ($request->pin) {
                $wallet->setPin($request->pin);
            }

            UserRole::create(['user_id' => $user->id, 'role' => 'user']);

            // Welcome notification
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title'   => 'Welcome to AbanRemit!',
                'message' => 'Your account has been created. Complete KYC verification to access all features.',
                'type'    => 'info',
            ]);

            // Welcome SMS
            if ($request->phone) {
                SmsService::send($request->phone, 'Welcome to AbanRemit! Your wallet number is ' . $wallet->wallet_number . '. Complete KYC to unlock all features.');
            }

            ActivityLog::create([
                'actor_id'   => $user->id,
                'action'     => 'user_registered',
                'target'     => $user->id,
                'ip_address' => request()->ip(),
            ]);

            return $user;
        });

        Cache::increment($key);
        if (!Cache::has($key)) Cache::put($key, 1, now()->addHour());

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->buildUserData($user),
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|max:255',
            'password' => 'required|string|max:128',
        ]);

        // Rate limit: 10 login attempts per email per 15 minutes
        $rateLimitKey = 'login_rate:' . strtolower($request->email);
        $attempts = (int) Cache::get($rateLimitKey, 0);

        if ($attempts >= 10) {
            return response()->json(['error' => 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.'], 429);
        }

        $credentials = [
            'email'    => strtolower($request->email),
            'password' => $request->password,
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            Cache::put($rateLimitKey, $attempts + 1, now()->addMinutes(15));

            $user = User::where('email', strtolower($request->email))->first();
            if ($user) {
                SecurityAlert::create([
                    'type'        => 'failed_login',
                    'user_id'     => $user->id,
                    'description' => 'Failed login attempt from IP: ' . $request->ip() . '. Attempt ' . ($attempts + 1) . '/10.',
                    'severity'    => $attempts >= 7 ? 'high' : ($attempts >= 4 ? 'medium' : 'low'),
                ]);
            }

            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        // Clear rate limit on success
        Cache::forget($rateLimitKey);

        $user = auth()->user();
        $profile = $user->profile;

        if ($profile && in_array($profile->status, ['suspended', 'banned', 'frozen'])) {
            JWTAuth::invalidate($token);
            return response()->json(['error' => "Your account is {$profile->status}. Contact support."], 403);
        }

        ActivityLog::create([
            'actor_id'   => $user->id,
            'action'     => 'user_login',
            'ip_address' => $request->ip(),
            'metadata'   => ['user_agent' => substr($request->userAgent(), 0, 200)],
        ]);

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->buildUserData($user),
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request)
    {
        try {
            ActivityLog::create([
                'actor_id'   => $request->user()->id,
                'action'     => 'user_logout',
                'ip_address' => $request->ip(),
            ]);
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            // Token may already be invalid
        }
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request)
    {
        return response()->json($this->buildUserData($request->user()));
    }

    /**
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|max:255']);

        // Rate limit: 3 per email per hour
        $key = 'forgot_pw:' . strtolower($request->email);
        if ((int) Cache::get($key, 0) >= 3) {
            return response()->json(['success' => true, 'message' => 'If an account exists, a reset link has been sent.']);
        }

        $user = User::where('email', strtolower($request->email))->first();
        if ($user) {
            // Generate a secure token
            $token = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => strtolower($request->email)],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            $profile = $user->profile;
            $resetUrl = config('app.frontend_url', config('app.url')) . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

            // Send SMS if phone available
            if ($profile && $profile->phone) {
                SmsService::send($profile->phone, "Your AbanRemit password reset code: {$token}. This expires in 60 minutes.");
            }

            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title'   => 'Password Reset Requested',
                'message' => 'A password reset was requested for your account. If this was not you, please contact support.',
                'type'    => 'security',
            ]);
        }

        Cache::put($key, (int) Cache::get($key, 0) + 1, now()->addHour());

        // Always return success to prevent email enumeration
        return response()->json(['success' => true, 'message' => 'If an account exists, a reset link has been sent.']);
    }

    /**
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required|string|max:128',
            'email'    => 'required|email|max:255',
            'password' => 'required|min:8|max:128|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', strtolower($request->email))
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['error' => 'Invalid or expired reset token'], 400);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', strtolower($request->email))->delete();
            return response()->json(['error' => 'Reset token has expired. Please request a new one.'], 400);
        }

        $user = User::where('email', strtolower($request->email))->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);
        DB::table('password_reset_tokens')->where('email', strtolower($request->email))->delete();

        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title'   => 'Password Changed',
            'message' => 'Your password has been successfully reset.',
            'type'    => 'security',
        ]);

        ActivityLog::create([
            'actor_id'   => $user->id,
            'action'     => 'password_reset',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Password has been reset successfully.']);
    }

    /**
     * PUT /api/v1/auth/change-password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|min:8|max:128|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 403);
        }

        if (Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'New password must be different from current password'], 400);
        }

        $user->update(['password' => Hash::make($request->password)]);

        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title'   => 'Password Changed',
            'message' => 'Your password was changed successfully. If this was not you, contact support immediately.',
            'type'    => 'security',
        ]);

        ActivityLog::create([
            'actor_id'   => $user->id,
            'action'     => 'password_changed',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Build standardized user response data
     */
    private function buildUserData(User $user): array
    {
        $user->load(['profile', 'wallet', 'roles']);
        $profile = $user->profile;
        $wallet  = $user->wallet;

        $initials = strtoupper(
            substr($profile->first_name ?? '', 0, 1) . substr($profile->last_name ?? '', 0, 1)
        ) ?: '??';

        return [
            'id'             => $user->id,
            'firstName'      => $profile->first_name ?? '',
            'lastName'       => $profile->last_name ?? '',
            'email'          => $profile->email ?? $user->email,
            'phone'          => $profile->phone ?? '',
            'walletNumber'   => $wallet->wallet_number ?? '',
            'walletBalance'  => (float)($wallet->balance ?? 0),
            'currency'       => $wallet->currency ?? 'KES',
            'avatarInitials' => $initials,
            'avatarUrl'      => $profile->avatar_url ?? null,
            'role'           => $user->highestRole(),
            'status'         => $profile->status ?? 'active',
            'kycStatus'      => $profile->kyc_status ?? 'pending',
            'country'        => $profile->country ?? 'Kenya',
            'countryCode'    => $profile->country_code ?? 'KE',
            'pinSet'         => !empty($wallet->pin_hash),
            'createdAt'      => $profile->created_at ?? $user->created_at,
        ];
    }
}
