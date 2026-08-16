<?php

namespace App\Jobs;

use App\Models\RecognizedTrack;
use App\Services\AudioFingerprintService;
use App\Services\MusicMetadataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAudioRecognitionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $trackId;
    public string $audioPayload;

    /**
     * Create a new job instance.
     */
    public function __construct(int $trackId, string $audioPayload)
    {
        $this->trackId = $trackId;
        $this->audioPayload = $audioPayload;
    }

    /**
     * Execute the job.
     */
    public function handle(
        AudioFingerprintService $fingerprintService,
        MusicMetadataService $metadataService
    ): void {
        $track = RecognizedTrack::find($this->trackId);

        if (!$track) {
            Log::warning("Job ProcessAudioRecognitionJob: Track ID {$this->trackId} not found.");
            return;
        }

        try {
            $track->update(['status' => 'processing']);

            // 1. Perform Audio Fingerprinting
            $recognitionResult = $fingerprintService->recognize($this->audioPayload);

            if ($recognitionResult) {
                // 2. Enrich with Spotify / LastFM Metadata
                $enrichedData = $metadataService->enrichTrackMetadata($recognitionResult);

                // 3. Save details to database
                $track->update([
                    'title' => $enrichedData['title'],
                    'artist' => $enrichedData['artist'],
                    'album' => $enrichedData['album'] ?? 'Single',
                    'cover' => $enrichedData['cover'] ?? null,
                    'preview_url' => $enrichedData['preview_url'] ?? null,
                    'lyrics' => $enrichedData['lyrics'] ?? null,
                    'platform_id' => $enrichedData['platform_id'] ?? null,
                    'fingerprint_hash' => $enrichedData['fingerprint_hash'] ?? md5($this->audioPayload),
                    'status' => 'completed',
                ]);

                Log::info("ProcessAudioRecognitionJob completed successfully for Track ID: {$this->trackId}");
            } else {
                $track->update(['status' => 'failed']);
            }
        } catch (\Throwable $e) {
            Log::error("ProcessAudioRecognitionJob Failed: " . $e->getMessage());
            $track->update(['status' => 'failed']);
        }
    }
}
