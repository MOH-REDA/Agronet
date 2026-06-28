<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'subtitle', 'description', 'image_url', 'daily_rate', 'status', 'gps_ready', 'hp', 'type', 'brand', 'fuel_type',
        'transmission', 'working_width', 'machine_condition', 'crop_types', 'delivery_available', 'instant_booking',
        'insurance_included', 'recently_serviced_at', 'latitude', 'longitude',
        'license', 'country', 'year', 'isBusiness', 'contactName', 'contactPhone', 'address', 'city', 'state', 'zip', 'termsAccepted',
        'availableSeasons', 'minRentalDays', 'deposit', 'user_id', 'images', 'price',
        'lat', 'lng', 'pricingType', 'minPrice', 'price_low', 'price_medium', 'price_high', 'price_very_high'
    ];
    protected $casts = [
        'availableSeasons' => 'array',
        'images' => 'array',
        'gps_ready' => 'boolean',
        'isBusiness' => 'boolean',
        'termsAccepted' => 'boolean',
        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
        'minPrice' => 'decimal:2',
        'price_low' => 'decimal:2',
        'price_medium' => 'decimal:2',
        'price_high' => 'decimal:2',
        'price_very_high' => 'decimal:2',
        'working_width' => 'decimal:2',
        'crop_types' => 'array',
        'delivery_available' => 'boolean',
        'instant_booking' => 'boolean',
        'insurance_included' => 'boolean',
        'recently_serviced_at' => 'datetime',
    ];
    public function user() {
        return $this->belongsTo(\App\Models\User::class);
    }
    public function reservations() {
        return $this->hasMany(\App\Models\EquipmentReservation::class, 'equipment_id');
    }
    public function reviews() { return $this->hasMany(\App\Models\EquipmentReview::class, 'equipment_id'); }
    public function favoritedBy() { return $this->belongsToMany(\App\Models\User::class, 'equipment_favorites')->withTimestamps(); }
}
