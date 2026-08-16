<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Audio Fingerprint Services Configuration
    |--------------------------------------------------------------------------
    */
    'audd' => [
        'api_key' => env('AUDD_API_KEY', ''),
        'endpoint' => env('AUDD_ENDPOINT', 'https://api.audd.io/'),
    ],

    'acrcloud' => [
        'host' => env('ACR_HOST', ''),
        'access_key' => env('ACR_ACCESS_KEY', ''),
        'access_secret' => env('ACR_ACCESS_SECRET', ''),
        'timeout' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Music Metadata Services (Spotify & LastFM)
    |--------------------------------------------------------------------------
    */
    'spotify' => [
        'client_id' => env('SPOTIFY_CLIENT_ID', ''),
        'client_secret' => env('SPOTIFY_CLIENT_SECRET', ''),
        'api_url' => 'https://api.spotify.com/v1',
        'auth_url' => 'https://accounts.spotify.com/api/token',
    ],

    'lastfm' => [
        'api_key' => env('LASTFM_API_KEY', ''),
        'api_url' => 'https://ws.audioscrobbler.com/2.0/',
    ],

    /*
    |--------------------------------------------------------------------------
    | Recognition Settings
    |--------------------------------------------------------------------------
    */
    'mock_mode' => env('MUSIC_RECOGNITION_MOCK', true), // Default true for testing without API keys
];
