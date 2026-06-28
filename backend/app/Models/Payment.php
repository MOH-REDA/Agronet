<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'reservation_id',
        'user_id',
        'amount',
        'service_fee',
        'deposit_amount',
        'currency',
        'status',
        'method',
        'transaction_id',
        'transfer_reference',
        'verification_notes',
        'paid_at',
        'verified_at',
        'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(\App\Models\EquipmentReservation::class, 'reservation_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
