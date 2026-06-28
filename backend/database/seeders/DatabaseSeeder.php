<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\EquipmentReservation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@agronet.test'], [
            'name' => 'Admin',
            'prenom' => 'Super',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
            'address' => 'AgroNet HQ, Casablanca',
            'phone_number' => '+212 600 000 000',
        ]);

        User::updateOrCreate(['email' => 'admin@admin'], [
            'name' => 'Admin',
            'prenom' => 'Super',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
            'address' => 'AgroNet HQ, Casablanca',
            'phone_number' => '+212 600 000 000',
        ]);

        $owner = User::updateOrCreate(['email' => 'owner@agronet.test'], [
            'name' => 'Bennani',
            'prenom' => 'Youssef',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'address' => 'Route de Settat, Casablanca',
            'phone_number' => '+212 600 000 001',
            'payout_account_holder' => 'Youssef Bennani',
            'payout_bank_name' => 'Attijariwafa Bank',
            'payout_rib' => '007780000123456789012345',
            'payout_iban' => null,
        ]);

        $renter = User::updateOrCreate(['email' => 'renter@agronet.test'], [
            'name' => 'Alaoui',
            'prenom' => 'Salma',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'address' => 'Marrakech, Morocco',
            'phone_number' => '+212 600 000 002',
        ]);

        $equipment = collect([
            [
                'name' => 'John Deere 5075E Tractor',
                'subtitle' => 'Reliable field tractor',
                'description' => '75 HP tractor ready for plowing, hauling, and field preparation.',
                'type' => 'Tractor',
                'gps_ready' => true,
                'hp' => 75,
                'year' => 2021,
                'city' => 'Casablanca',
                'state' => 'Casablanca-Settat',
                'address' => 'Route de Settat',
                'country' => 'Morocco',
                'minPrice' => 650,
                'price' => 650,
                'deposit' => 2000,
                'lat' => 33.3675,
                'lng' => -7.5898,
                'images' => [],
            ],
            [
                'name' => 'Kubota Combine Harvester',
                'subtitle' => 'Grain harvesting machine',
                'description' => 'Efficient harvester for wheat, barley, and similar grain crops.',
                'type' => 'Harvester',
                'gps_ready' => false,
                'hp' => 110,
                'year' => 2020,
                'city' => 'Marrakech',
                'state' => 'Marrakech-Safi',
                'address' => 'Sidi Ghanem',
                'country' => 'Morocco',
                'minPrice' => 1200,
                'price' => 1200,
                'deposit' => 4000,
                'lat' => 31.6697,
                'lng' => -8.0206,
                'images' => [],
            ],
            [
                'name' => 'Field Sprayer 1200L',
                'subtitle' => 'Mounted crop sprayer',
                'description' => 'Large-capacity sprayer suitable for orchards and open fields.',
                'type' => 'Sprayer',
                'gps_ready' => true,
                'hp' => null,
                'year' => 2022,
                'city' => 'Fes',
                'state' => 'Fes-Meknes',
                'address' => 'Ain Cheggag',
                'country' => 'Morocco',
                'minPrice' => 350,
                'price' => 350,
                'deposit' => 1000,
                'lat' => 33.9302,
                'lng' => -4.9983,
                'images' => [],
            ],
        ])->map(fn (array $data) => Equipment::updateOrCreate(['name' => $data['name']], array_merge($data, [
            'user_id' => $owner->id,
            'status' => 'active',
            'isBusiness' => true,
            'contactName' => 'Youssef Bennani',
            'contactPhone' => '+212 600 000 001',
            'termsAccepted' => true,
            'availableSeasons' => ['spring', 'summer', 'autumn'],
            'minRentalDays' => 1,
            'pricingType' => 'fixed',
        ])));

        $reservationStart = now()->addDays(5)->startOfDay();
        $reservationEnd = now()->addDays(8)->startOfDay();

        EquipmentReservation::updateOrCreate([
            'user_id' => $renter->id,
            'equipment_id' => $equipment->first()->id,
        ], [
            'start_date' => $reservationStart,
            'end_date' => $reservationEnd,
            'status' => 'pending',
        ]);
    }
}
