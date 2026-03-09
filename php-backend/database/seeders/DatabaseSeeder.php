<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use App\Models\Wallet;
use App\Models\UserRole;
use App\Models\ExchangeRate;
use App\Models\FeeConfig;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Super Admin ───
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@abanremit.com',
            'password' => Hash::make('Admin@123456'),
        ]);
        Profile::create([
            'user_id' => $admin->id,
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@abanremit.com',
            'country' => 'Kenya',
            'country_code' => 'KE',
            'kyc_status' => 'approved',
            'status' => 'active',
        ]);
        $adminWallet = Wallet::create([
            'user_id' => $admin->id,
            'wallet_number' => Wallet::generateWalletNumber(),
            'currency' => 'KES',
        ]);
        $adminWallet->setPin('1234');
        UserRole::create(['user_id' => $admin->id, 'role' => 'user']);
        UserRole::create(['user_id' => $admin->id, 'role' => 'admin']);
        UserRole::create(['user_id' => $admin->id, 'role' => 'superadmin']);

        // ─── Default Exchange Rates ───
        $rates = [
            ['from_currency' => 'KES', 'to_currency' => 'USD', 'rate' => 0.0077],
            ['from_currency' => 'USD', 'to_currency' => 'KES', 'rate' => 129.50],
            ['from_currency' => 'KES', 'to_currency' => 'GBP', 'rate' => 0.0061],
            ['from_currency' => 'GBP', 'to_currency' => 'KES', 'rate' => 163.80],
            ['from_currency' => 'KES', 'to_currency' => 'EUR', 'rate' => 0.0071],
            ['from_currency' => 'EUR', 'to_currency' => 'KES', 'rate' => 140.20],
            ['from_currency' => 'USD', 'to_currency' => 'GBP', 'rate' => 0.79],
            ['from_currency' => 'GBP', 'to_currency' => 'USD', 'rate' => 1.27],
        ];
        foreach ($rates as $r) {
            ExchangeRate::create(array_merge($r, ['updated_by' => $admin->id]));
        }

        // ─── Default Fee Config ───
        FeeConfig::create([
            'name' => 'Transfer Fee',
            'transaction_type' => 'send',
            'fee_type' => 'percentage',
            'percentage' => 1.5,
            'min_amount' => 10,
            'updated_by' => $admin->id,
        ]);
        FeeConfig::create([
            'name' => 'Withdrawal Fee',
            'transaction_type' => 'withdraw',
            'fee_type' => 'flat',
            'flat_amount' => 50,
            'updated_by' => $admin->id,
        ]);

        echo "✅ Seeded: Super Admin (admin@abanremit.com / Admin@123456)\n";
        echo "✅ Seeded: Exchange rates & fee config\n";
    }
}
