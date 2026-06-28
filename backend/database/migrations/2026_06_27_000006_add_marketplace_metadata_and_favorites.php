<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('type');
            $table->string('fuel_type')->nullable()->after('hp');
            $table->string('transmission')->nullable()->after('fuel_type');
            $table->decimal('working_width', 8, 2)->nullable()->after('transmission');
            $table->string('machine_condition')->nullable()->after('working_width');
            $table->json('crop_types')->nullable()->after('availableSeasons');
            $table->boolean('delivery_available')->default(false)->after('deposit');
            $table->boolean('instant_booking')->default(false)->after('delivery_available');
            $table->boolean('insurance_included')->default(false)->after('instant_booking');
            $table->timestamp('recently_serviced_at')->nullable()->after('insurance_included');
        });

        Schema::create('equipment_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'equipment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_favorites');
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn([
                'brand', 'fuel_type', 'transmission', 'working_width', 'machine_condition',
                'crop_types', 'delivery_available', 'instant_booking', 'insurance_included',
                'recently_serviced_at',
            ]);
        });
    }
};
