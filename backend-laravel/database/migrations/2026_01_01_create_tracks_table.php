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
        Schema::create('recognized_tracks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('title');
            $table->string('artist');
            $table->string('album')->nullable();
            $table->text('cover')->nullable();
            $table->text('preview_url')->nullable();
            $table->text('lyrics')->nullable();
            $table->string('platform_id')->nullable()->comment('Spotify/Apple/AudD track ID');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recognized_tracks');
    }
};
