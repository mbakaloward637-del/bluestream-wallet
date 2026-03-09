<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send a single SMS via TalkSasa
     */
    public static function send(string $phone, string $message): bool
    {
        $token = config('services.talksasa.api_token');
        if (!$token) {
            Log::warning('TalkSasa not configured — SMS not sent', ['phone' => $phone]);
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(15)
            ->post(config('services.talksasa.api_url') . '/sms/send', [
                'recipient' => self::formatPhone($phone),
                'sender_id' => config('services.talksasa.sender_id', 'ABANREMIT'),
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info('SMS sent via TalkSasa', ['phone' => $phone]);
                return true;
            }

            Log::error('TalkSasa SMS failed', [
                'phone' => $phone,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('TalkSasa SMS exception: ' . $e->getMessage(), ['phone' => $phone]);
            return false;
        }
    }

    /**
     * Send bulk SMS via TalkSasa
     * Returns ['sent' => int, 'failed' => int]
     */
    public static function sendBulk(array $phones, string $message): array
    {
        $token = config('services.talksasa.api_token');
        if (!$token) {
            Log::warning('TalkSasa not configured — bulk SMS not sent');
            return ['sent' => 0, 'failed' => count($phones)];
        }

        $sent = 0;
        $failed = 0;

        try {
            $recipients = array_map(fn($p) => self::formatPhone($p), $phones);

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post(config('services.talksasa.api_url') . '/sms/send', [
                'recipient' => implode(',', $recipients),
                'sender_id' => config('services.talksasa.sender_id', 'ABANREMIT'),
                'message' => $message,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $sent = $data['data']['contacts_count'] ?? count($phones);
                $failed = count($phones) - $sent;
            } else {
                $failed = count($phones);
                Log::error('TalkSasa bulk SMS failed', ['response' => $response->json()]);
            }
        } catch (\Exception $e) {
            Log::error('TalkSasa bulk SMS exception: ' . $e->getMessage());
            $failed = count($phones);
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    /**
     * Format phone number to 254XXXXXXXXX
     */
    public static function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) $phone = '254' . substr($phone, 1);
        if (str_starts_with($phone, '+')) $phone = substr($phone, 1);
        if (!str_starts_with($phone, '254')) $phone = '254' . $phone;
        return $phone;
    }
}
