<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecognizedTrack extends Model
{
    use HasFactory;

    protected $table = 'recognized_tracks';

    protected $fillable = [
        'user_id',
        'title',
        'artist',
        'album',
        'cover',
        'preview_url',
        'lyrics',
        'platform_id',
        'fingerprint_hash',
        'status',
    ];

    /**
     * Get the user that owns the recognized track.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
