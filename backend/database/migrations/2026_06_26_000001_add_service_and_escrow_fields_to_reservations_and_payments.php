<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment_reservations', function (Blueprint $table) {
            $table->string('service_mode')->default('equipment_only')->after('status');
            $table->string('work_type')->nullable()->after('service_mode');
            $table->string('work_location')->nullable()->after('work_type');
            $table->decimal('field_size', 8, 2)->nullable()->after('work_location');
            $table->text('notes')->nullable()->after('field_size');
            $table->string('payment_status')->default('unpaid')->after('notes');
            $table->string('deposit_status')->default('pending')->after('payment_status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('service_fee', 10, 2)->default(0)->after('amount');
            $table->decimal('deposit_amount', 10, 2)->default(0)->after('service_fee');
            $table->string('transfer_reference')->nullable()->after('transaction_id');
            $table->text('verification_notes')->nullable()->after('transfer_reference');
            $table->timestamp('verified_at')->nullable()->after('paid_at');
            $table->timestamp('released_at')->nullable()->after('verified_at');
        });

        DB::statement("ALTER TABLE equipment_reservations MODIFY status ENUM('pending','requested','owner_accepted','awaiting_payment','payment_submitted','scheduled','in_progress','paid','active','completed','cancelled','disputed','rejected') DEFAULT 'requested'");
        DB::statement("ALTER TABLE payments MODIFY status ENUM('pending','pending_verification','held','completed','released','failed','refunded') DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'service_fee',
                'deposit_amount',
                'transfer_reference',
                'verification_notes',
                'verified_at',
                'released_at',
            ]);
        });

        Schema::table('equipment_reservations', function (Blueprint $table) {
            $table->dropColumn([
                'service_mode',
                'work_type',
                'work_location',
                'field_size',
                'notes',
                'payment_status',
                'deposit_status',
            ]);
        });

        DB::statement("ALTER TABLE equipment_reservations MODIFY status ENUM('pending','requested','reserved','paid','active','cancelled','completed') DEFAULT 'pending'");
        DB::statement("ALTER TABLE payments MODIFY status ENUM('pending','completed','failed','refunded') DEFAULT 'pending'");
    }
};
