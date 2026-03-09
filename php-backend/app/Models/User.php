<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable, HasUuids;

    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime', 'password' => 'hashed'];

    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }

    public function profile() { return $this->hasOne(Profile::class); }
    public function wallet() { return $this->hasOne(Wallet::class); }
    public function roles() { return $this->hasMany(UserRole::class); }
    public function transactions() { return $this->hasMany(Transaction::class, 'sender_user_id'); }
    public function receivedTransactions() { return $this->hasMany(Transaction::class, 'receiver_user_id'); }
    public function notifications() { return $this->hasMany(Notification::class); }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('role', $role)->exists();
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('superadmin');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('superadmin');
    }

    public function highestRole(): string
    {
        if ($this->isSuperAdmin()) return 'superadmin';
        if ($this->hasRole('admin')) return 'admin';
        return 'user';
    }
}
