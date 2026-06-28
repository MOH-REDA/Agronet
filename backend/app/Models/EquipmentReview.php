<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentReview extends Model
{
    protected $fillable = ['reservation_id', 'equipment_id', 'reviewer_id', 'owner_id', 'rating', 'comment'];
    protected $casts = ['rating' => 'integer'];
    public function reservation() { return $this->belongsTo(EquipmentReservation::class); }
    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewer_id'); }
}
