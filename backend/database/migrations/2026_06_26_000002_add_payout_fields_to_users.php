<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('payout_account_holder')->nullable()->after('phone_number');
            $table->string('payout_bank_name')->nullable()->after('payout_account_holder');
            $table->string('payout_rib', 32)->nullable()->after('payout_bank_name');
            $table->string('payout_iban', 64)->nullable()->after('payout_rib');
            $table->timestamp('payout_verified_at')->nullable()->after('payout_iban');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'payout_account_holder',
                'payout_bank_name',
                'payout_rib',
                'payout_iban',
                'payout_verified_at',
            ]);
        });
    }
};
