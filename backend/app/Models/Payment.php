<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'reservation_id', 'user_id', 'amount', 'currency', 'status', 'method', 'transaction_id', 'paid_at'
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
