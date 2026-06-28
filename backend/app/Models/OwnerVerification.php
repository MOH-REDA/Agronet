<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerVerification extends Model
{
    protected $fillable = [
        'user_id', 'status', 'identity_document_path', 'ownership_document_path',
        'rejection_reason', 'submitted_at', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
}
