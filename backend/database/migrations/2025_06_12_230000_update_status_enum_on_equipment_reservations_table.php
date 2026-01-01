<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment_reservations', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 'requested', 'reserved', 'paid', 'active', 'cancelled', 'completed'
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('equipment_reservations', function (Blueprint $table) {
            $table->enum('status', ['active', 'cancelled', 'completed'])->default('active')->change();
        });
    }
};
