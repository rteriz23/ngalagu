<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Album;
use App\Models\History;

class Track extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'artist',
        'album_id',
        'cover',
        'preview_url',
        'youtube_id',
        'lyrics',
        'platform_id',
        'fingerprint_hash',
    ];

    public function album()
    {
        return $this->belongsTo(Album::class);
    }
    
    public function histories()
    {
        return $this->hasMany(History::class);
    }
}
