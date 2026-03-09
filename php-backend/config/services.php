<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    // ─── Paystack ───
    'paystack' => [
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
    ],

    // ─── M-Pesa (Safaricom Daraja API) ───
    'mpesa' => [
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_SHORTCODE'),
        'passkey' => env('MPESA_PASSKEY'),
        'initiator_name' => env('MPESA_INITIATOR_NAME', 'apiuser'),
        'security_credential' => env('MPESA_SECURITY_CREDENTIAL'),
        'callback_url' => env('MPESA_CALLBACK_URL'),
        'b2c_result_url' => env('MPESA_B2C_RESULT_URL'),
        'b2c_timeout_url' => env('MPESA_B2C_TIMEOUT_URL'),
        'env' => env('MPESA_ENV', 'sandbox'), // 'sandbox' or 'production'
        'base_url' => env('MPESA_ENV', 'sandbox') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke',
    ],

    // ─── Africa's Talking (SMS + Airtime) ───
    'africastalking' => [
        'api_key' => env('AT_API_KEY'),
        'username' => env('AT_USERNAME'),
        'sender_id' => env('AT_SENDER_ID'),
        'env' => env('AT_ENV', 'sandbox'), // 'sandbox' or 'production'
    ],
];
