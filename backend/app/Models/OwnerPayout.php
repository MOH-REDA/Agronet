<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerPayout extends Model
{
    protected $fillable = [
        'reservation_id',
        'payment_id',
        'owner_id',
        'amount',
        'currency',
        'status',
        'account_holder',
        'bank_name',
        'rib',
        'iban',
        'transfer_reference',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(EquipmentReservation::class, 'reservation_id');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
