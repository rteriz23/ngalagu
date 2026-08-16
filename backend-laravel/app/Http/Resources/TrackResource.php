<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'artist' => $this->artist,
            'album' => $this->album ?? 'Single',
            'cover' => $this->cover,
            'preview_url' => $this->preview_url,
            'lyrics' => $this->lyrics,
            'platform_id' => $this->platform_id,
            'fingerprint_hash' => $this->fingerprint_hash,
            'status' => $this->status ?? 'completed',
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : now()->toIso8601String(),
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : now()->toIso8601String(),
        ];
    }
}
