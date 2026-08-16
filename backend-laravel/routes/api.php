<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RecognitionController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\AlbumController;

/*
|--------------------------------------------------------------------------
| API Routes - Ngalagu Backend
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        
        // Audio Recognition
        Route::post('/recognize', [RecognitionController::class, 'recognize']);
        Route::get('/recognize/status/{jobId}', [RecognitionController::class, 'pollStatus']);
        
        // History
        Route::get('/history', [HistoryController::class, 'index']);
        Route::delete('/history/{id}', [HistoryController::class, 'destroy']);
        
        // Albums & Charts
        Route::get('/albums', [AlbumController::class, 'index']);
        Route::get('/albums/{id}/tracks', [AlbumController::class, 'tracks']);
        Route::get('/charts', [AlbumController::class, 'charts']);
    });
});
