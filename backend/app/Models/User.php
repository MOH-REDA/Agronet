<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'prenom',
        'email',
        'email_verified_at',
        'google_id',
        'facebook_id',
        'password',
        'is_admin',
        'address',
        'phone_number',
        'avatar_path',
        'social_avatar_url',
        'payout_account_holder',
        'payout_bank_name',
        'payout_rib',
        'payout_iban',
        'payout_verified_at',
        'owner_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url', 'is_verified_owner'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'prenom' => 'string',
            'is_admin' => 'boolean',
            'payout_verified_at' => 'datetime',
            'owner_verified_at' => 'datetime',
        ];
    }

    public function ownerVerification() { return $this->hasOne(OwnerVerification::class); }
    public function equipment() { return $this->hasMany(\App\Models\Equipment::class); }
    public function favoriteEquipment() { return $this->belongsToMany(\App\Models\Equipment::class, 'equipment_favorites')->withTimestamps(); }
    public function reviewsReceived() { return $this->hasMany(\App\Models\EquipmentReview::class, 'owner_id'); }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_path) return '/storage/' . ltrim($this->avatar_path, '/');
        return $this->social_avatar_url;
    }

    public function getIsVerifiedOwnerAttribute(): bool
    {
        return $this->owner_verified_at !== null;
    }
}
