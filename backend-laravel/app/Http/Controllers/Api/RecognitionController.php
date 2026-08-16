<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrackResource;
use App\Jobs\ProcessAudioRecognitionJob;
use App\Models\RecognizedTrack;
use App\Services\AudioFingerprintService;
use App\Services\MusicMetadataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecognitionController extends Controller
{
    protected AudioFingerprintService $fingerprintService;
    protected MusicMetadataService $metadataService;

    public function __construct(
        AudioFingerprintService $fingerprintService,
        MusicMetadataService $metadataService
    ) {
        $this->fingerprintService = $fingerprintService;
        $this->metadataService = $metadataService;
    }

    /**
     * POST /api/v1/recognize
     * Accepts audio file upload or base64 audio data.
     */
    public function recognize(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => 'nullable|file|mimes:mp3,wav,m4a,ogg|max:10240',
            'audio_base64' => 'nullable|string',
            'async' => 'nullable|boolean',
        ]);

        $audioPayload = '';

        if ($request->hasFile('audio')) {
            $file = $request->file('audio');
            $audioPayload = base64_encode(file_get_contents($file->getRealPath()));
        } elseif ($request->filled('audio_base64')) {
            $audioPayload = $request->input('audio_base64');
        } else {
            // Demo fallback payload if no audio sent in request
            $audioPayload = base64_encode('NGALAGU_SAMPLE_AUDIO_' . time() . '_' . rand(1000, 9999));
        }

        // Create initial pending track record
        $track = RecognizedTrack::create([
            'user_id' => $request->user()?->id,
            'title' => 'Mendengarkan...',
            'artist' => 'Menganalisis audio...',
            'album' => null,
            'cover' => null,
            'preview_url' => null,
            'lyrics' => null,
            'platform_id' => null,
            'status' => 'pending',
        ]);

        $isAsync = $request->boolean('async', false);

        if ($isAsync) {
            // Dispatch background queue job
            ProcessAudioRecognitionJob::dispatch($track->id, $audioPayload);

            return response()->json([
                'success' => true,
                'message' => 'Proses rekognisi audio dimulai di latar belakang.',
                'job_id' => $track->id,
                'status' => 'pending',
            ], 202);
        }

        // Synchronous immediate processing
        $recognitionResult = $this->fingerprintService->recognize($audioPayload);

        if ($recognitionResult) {
            $enriched = $this->metadataService->enrichTrackMetadata($recognitionResult);

            $track->update([
                'title' => $enriched['title'],
                'artist' => $enriched['artist'],
                'album' => $enriched['album'] ?? 'Single',
                'cover' => $enriched['cover'] ?? null,
                'preview_url' => $enriched['preview_url'] ?? null,
                'lyrics' => $enriched['lyrics'] ?? null,
                'platform_id' => $enriched['platform_id'] ?? null,
                'fingerprint_hash' => $enriched['fingerprint_hash'] ?? md5($audioPayload),
                'status' => 'completed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lagu berhasil diidentifikasi!',
                'data' => new TrackResource($track),
            ]);
        }

        $track->update(['status' => 'failed', 'title' => 'Tidak Ditemukan', 'artist' => 'Coba lagi']);

        return response()->json([
            'success' => false,
            'message' => 'Lagu tidak ditemukan dari rekaman audio.',
            'data' => new TrackResource($track),
        ], 404);
    }

    /**
     * GET /api/v1/recognize/status/{jobId}
     * Polling endpoint for background jobs.
     */
    public function pollStatus(int $jobId): JsonResponse
    {
        $track = RecognizedTrack::find($jobId);

        if (!$track) {
            return response()->json([
                'success' => false,
                'message' => 'Job ID tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'job_id' => $track->id,
            'status' => $track->status,
            'data' => $track->status === 'completed' ? new TrackResource($track) : null,
        ]);
    }

    /**
     * GET /api/v1/track/{id}
     * Retrieve single track info.
     */
    public function getTrack(int $id): JsonResponse
    {
        $track = RecognizedTrack::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new TrackResource($track),
        ]);
    }

    /**
     * GET /api/v1/track/{id}/play
     * Audio preview playback endpoint.
     */
    public function playTrack(int $id): JsonResponse
    {
        $track = RecognizedTrack::findOrFail($id);

        return response()->json([
            'success' => true,
            'track_id' => $track->id,
            'title' => $track->title,
            'artist' => $track->artist,
            'preview_url' => $track->preview_url ?? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        ]);
    }

    /**
     * GET /api/v1/history
     * Retrieve recognition history.
     */
    public function history(Request $request): JsonResponse
    {
        $tracks = RecognizedTrack::where('status', 'completed')
            ->orderBy('id', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => TrackResource::collection($tracks),
        ]);
    }
}
