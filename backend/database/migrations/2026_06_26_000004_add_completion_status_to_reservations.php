<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE equipment_reservations MODIFY status ENUM('pending','requested','owner_accepted','awaiting_payment','payment_submitted','scheduled','in_progress','owner_completed','paid','active','completed','cancelled','disputed','rejected') DEFAULT 'requested'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE equipment_reservations MODIFY status ENUM('pending','requested','owner_accepted','awaiting_payment','payment_submitted','scheduled','in_progress','paid','active','completed','cancelled','disputed','rejected') DEFAULT 'requested'");
    }
};
