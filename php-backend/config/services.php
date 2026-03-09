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
        'callback_url' => env('PAYSTACK_CALLBACK_URL'),
    ],

    // ─── M-Pesa (Safaricom Daraja API) ───
    'mpesa' => [
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_SHORTCODE'),
        'passkey' => env('MPESA_PASSKEY'),
        'initiator_name' => env('MPESA_INITIATOR_NAME', 'apiuser'),
        'security_credential' => env('MPESA_SECURITY_CREDENTIAL'),
        'callback_url' => env('MPESA_CONFIRMATION_URL', 'https://abanremit.com/api/v1/webhooks/mpesa/c2b'),
        'validation_url' => env('MPESA_VALIDATION_URL'),
        'b2c_result_url' => env('MPESA_B2C_RESULT_URL'),
        'b2c_timeout_url' => env('MPESA_B2C_TIMEOUT_URL'),
        'callback_allowed_ips' => env('MPESA_CALLBACK_ALLOWED_IPS', ''),
        'env' => env('MPESA_ENV', 'production'),
        'base_url' => env('MPESA_API_URL', env('MPESA_ENV', 'production') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke'),
    ],

    // ─── Instalipa (Airtime API) ───
    'instalipa' => [
        'api_url' => env('INSTALIPA_API_URL', 'https://api.instalipa.com'),
        'consumer_key' => env('INSTALIPA_CONSUMER_KEY'),
        'consumer_secret' => env('INSTALIPA_CONSUMER_SECRET'),
        'callback_url' => env('INSTALIPA_CALLBACK_URL'),
        'timeout' => (int) env('INSTALIPA_TIMEOUT', 30000),
    ],

    // ─── TalkSasa (SMS API) ───
    'talksasa' => [
        'api_url' => env('TALKSASA_API_URL', 'https://bulksms.talksasa.com/api/v3'),
        'api_token' => env('TALKSASA_API_TOKEN'),
        'sender_id' => env('TALKSASA_SENDER_ID', 'ABANREMIT'),
        'timeout' => (int) env('TALKSASA_TIMEOUT', 15000),
    ],

    // ─── Exchange Rate API ───
    'exchange_rate' => [
        'api_url' => env('EXCHANGE_RATE_API_URL', 'https://v6.exchangerate-api.com/v6'),
        'api_key' => env('EXCHANGE_RATE_API_KEY'),
    ],
];
