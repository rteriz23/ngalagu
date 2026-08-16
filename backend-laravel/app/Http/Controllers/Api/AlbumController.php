<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Album;
use App\Models\Track;
use App\Services\ChartFetcherService;

class AlbumController extends Controller
{
    protected ChartFetcherService $chartService;

    public function __construct(ChartFetcherService $chartService)
    {
        $this->chartService = $chartService;
    }

    public function index()
    {
        // For demonstration, return 10 random albums or mock data
        $albums = Album::latest()->take(10)->get();

        return response()->json([
            'success' => true,
            'data' => $albums
        ]);
    }

    public function tracks($id)
    {
        $album = Album::with('tracks')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $album
        ]);
    }

    public function charts()
    {
        // Fetch top 50 tracks from LastFM via service
        $charts = $this->chartService->fetchTop50();

        return response()->json([
            'success' => true,
            'data' => $charts
        ]);
    }
}
