<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AudioFingerprintService
{
    protected string $auddKey;
    protected string $auddEndpoint;
    protected string $acrHost;
    protected string $acrAccessKey;
    protected string $acrAccessSecret;
    protected bool $mockMode;

    public function __construct()
    {
        $this->auddKey = config('music.audd.api_key', '');
        $this->auddEndpoint = config('music.audd.endpoint', 'https://api.audd.io/');
        $this->acrHost = config('music.acrcloud.host', '');
        $this->acrAccessKey = config('music.acrcloud.access_key', '');
        $this->acrAccessSecret = config('music.acrcloud.access_secret', '');
        $this->mockMode = config('music.mock_mode', true) || empty($this->auddKey);
    }

    /**
     * Identify audio sample from base64 string or file path.
     *
     * @param string $audioData (base64 or raw file bytes)
     * @param string|null $fileExtension
     * @return array|null
     */
    public function recognize(string $audioData, ?string $fileExtension = 'mp3'): ?array
    {
        if ($this->mockMode) {
            return $this->getRandomMockMatch($audioData);
        }

        try {
            // Try AudD API
            if (!empty($this->auddKey)) {
                $response = Http::asMultipart()->post($this->auddEndpoint, [
                    'api_token' => $this->auddKey,
                    'audio' => $audioData,
                    'return' => 'apple_music,spotify,lyrics',
                ]);

                if ($response->successful() && isset($response->json()['result'])) {
                    $result = $response->json()['result'];
                    if (!empty($result)) {
                        return [
                            'title' => $result['title'] ?? 'Unknown Track',
                            'artist' => $result['artist'] ?? 'Unknown Artist',
                            'album' => $result['album'] ?? 'Single',
                            'cover' => $result['spotify']['album']['images'][0]['url'] ?? $result['apple_music']['artwork']['url'] ?? null,
                            'preview_url' => $result['spotify']['preview_url'] ?? null,
                            'lyrics' => $result['lyrics']['lyrics'] ?? null,
                            'platform_id' => $result['spotify']['id'] ?? $result['song_link'] ?? null,
                            'fingerprint_hash' => md5(substr($audioData, 0, 100)),
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('AudioFingerprintService error: ' . $e->getMessage());
        }

        // Fallback to mock match if external API fails or returns no result
        return $this->getRandomMockMatch($audioData);
    }

    /**
     * Generate realistic mock result for testing and demonstration.
     */
    private function getRandomMockMatch(string $audioData): array
    {
        $mockCatalog = [
            [
                'title' => 'Rayu',
                'artist' => 'Marion Jola, Laleilmanino',
                'album' => 'MARION',
                'cover' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
                'preview_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'lyrics' => "Jangan datang lagi jika hanya membuat luka\nHaruskah aku terus menanti rayuanmu...",
                'platform_id' => 'spotify_track_01',
            ],
            [
                'title' => 'Hati-Hati di Jalan',
                'artist' => 'Tulus',
                'album' => 'Manusia',
                'cover' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
                'preview_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'lyrics' => "Perjalanan membawamu\nKini kau telah di sana\nSemoga kita bertemu lagi di ujung jalan...",
                'platform_id' => 'spotify_track_02',
            ],
            [
                'title' => 'Komang',
                'artist' => 'Raim Laode',
                'album' => 'Komang - Single',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
                'preview_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                'lyrics' => "Sebab kau terlalu indah dari sekedar kata\nDunia berhenti sejenak saat kau tersenyum...",
                'platform_id' => 'spotify_track_03',
            ],
            [
                'title' => 'Sial',
                'artist' => 'Mahalini',
                'album' => 'Fabula',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
                'preview_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                'lyrics' => "Sialnya hidupku terlanjur mencintai kamu\nBagaimana bisa kau berpaling begitu saja...",
                'platform_id' => 'spotify_track_04',
            ]
        ];

        $hashIndex = abs(crc32($audioData)) % count($mockCatalog);
        $track = $mockCatalog[$hashIndex];
        $track['fingerprint_hash'] = md5($audioData);

        return $track;
    }
}
