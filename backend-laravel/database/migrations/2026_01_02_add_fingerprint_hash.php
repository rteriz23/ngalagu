<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('recognized_tracks', function (Blueprint $table) {
            $table->string('fingerprint_hash')->nullable()->after('platform_id')->index();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('completed')->after('fingerprint_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recognized_tracks', function (Blueprint $table) {
            $table->dropColumn(['fingerprint_hash', 'status']);
        });
    }
};
