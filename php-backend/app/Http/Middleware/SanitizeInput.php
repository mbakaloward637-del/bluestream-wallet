<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    /**
     * Strip script tags and dangerous HTML from all string inputs.
     */
    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Strip script/iframe/object tags
                $value = preg_replace('/<\s*(script|iframe|object|embed|form|input|button)[^>]*>.*?<\/\s*\1\s*>/is', '', $value);
                $value = preg_replace('/<\s*(script|iframe|object|embed|form|input|button)[^>]*\/?>/is', '', $value);
                // Remove javascript: protocol
                $value = preg_replace('/javascript\s*:/i', '', $value);
                // Remove on* event handlers
                $value = preg_replace('/\bon\w+\s*=\s*["\'][^"\']*["\']/i', '', $value);
            }
        });
        $request->merge($input);

        return $next($request);
    }
}
