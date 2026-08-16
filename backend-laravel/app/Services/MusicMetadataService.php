<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MusicMetadataService
{
    protected string $spotifyClientId;
    protected string $spotifyClientSecret;
    protected ?string $accessToken = null;

    public function __construct()
    {
        $this->spotifyClientId = config('music.spotify.client_id', '');
        $this->spotifyClientSecret = config('music.spotify.client_secret', '');
    }

    /**
     * Get Spotify Access Token via Client Credentials Grant.
     */
    private function getSpotifyToken(): ?string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        if (empty($this->spotifyClientId) || empty($this->spotifyClientSecret)) {
            return null;
        }

        try {
            $response = Http::asForm()->withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->spotifyClientId . ':' . $this->spotifyClientSecret),
            ])->post(config('music.spotify.auth_url'), [
                'grant_type' => 'client_credentials',
            ]);

            if ($response->successful()) {
                $this->accessToken = $response->json()['access_token'] ?? null;
                return $this->accessToken;
            }
        } catch (\Throwable $e) {
            Log::error('Spotify Token Error: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Enrich track details with high-res cover art and audio preview url.
     */
    public function enrichTrackMetadata(array $trackData): array
    {
        $token = $this->getSpotifyToken();

        if ($token) {
            try {
                $query = urlencode($trackData['title'] . ' ' . $trackData['artist']);
                $response = Http::withToken($token)->get(config('music.spotify.api_url') . "/search?q={$query}&type=track&limit=1");

                if ($response->successful() && !empty($response->json()['tracks']['items'])) {
                    $item = $response->json()['tracks']['items'][0];
                    $trackData['cover'] = $item['album']['images'][0]['url'] ?? $trackData['cover'];
                    $trackData['preview_url'] = $item['preview_url'] ?? $trackData['preview_url'];
                    $trackData['album'] = $item['album']['name'] ?? $trackData['album'];
                    $trackData['platform_id'] = $item['id'] ?? $trackData['platform_id'];
                }
            } catch (\Throwable $e) {
                Log::error('Spotify Search Metadata Error: ' . $e->getMessage());
            }
        }

        // Default cover image if missing
        if (empty($trackData['cover'])) {
            $trackData['cover'] = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
        }

        // Default preview URL if missing
        if (empty($trackData['preview_url'])) {
            $trackData['preview_url'] = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        }

        return $trackData;
    }
}
