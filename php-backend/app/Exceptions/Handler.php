<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Always return JSON for API requests
     */
    public function render($request, Throwable $e)
    {
        if ($request->expectsJson() || $request->is('api/*') || $request->is('v1/*')) {
            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            return response()->json([
                'error' => $e->getMessage() ?: 'Server Error',
            ], $status);
        }

        return parent::render($request, $e);
    }
}
