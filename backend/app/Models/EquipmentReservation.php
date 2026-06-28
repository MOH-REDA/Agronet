<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipmentReservation extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'equipment_id',
        'start_date',
        'end_date',
        'status',
        'service_mode',
        'work_type',
        'work_location',
        'field_size',
        'notes',
        'payment_status',
        'deposit_status',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'field_size' => 'decimal:2',
    ];

    public function equipment() { return $this->belongsTo(Equipment::class); }
    public function user() { return $this->belongsTo(\App\Models\User::class); }
    public function payment() { return $this->hasOne(\App\Models\Payment::class, 'reservation_id'); }
    public function review() { return $this->hasOne(\App\Models\EquipmentReview::class, 'reservation_id'); }
}
