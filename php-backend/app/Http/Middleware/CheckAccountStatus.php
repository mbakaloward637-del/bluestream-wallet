<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAccountStatus
{
    /**
     * Reject requests from suspended/banned/frozen accounts.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) return $next($request);

        $profile = $user->profile;
        if ($profile && in_array($profile->status, ['suspended', 'banned', 'frozen'])) {
            return response()->json([
                'error' => "Your account is {$profile->status}. Please contact support.",
            ], 403);
        }

        return $next($request);
    }
}
