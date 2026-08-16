<?php

namespace App\Services;

class ChartFetcherService
{
    /**
     * Fetch Top 50 Global/Regional charts.
     */
    public function fetchTop50(): array
    {
        // Mock data representing Top 50 charts
        return [
            [
                'id' => 1,
                'title' => 'Sial',
                'artist' => 'Mahalini',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
                'youtube_id' => 'h-2n-uE4g9I',
                'rank' => 1
            ],
            [
                'id' => 2,
                'title' => 'Komang',
                'artist' => 'Raim Laode',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
                'youtube_id' => 'T48_JcWdDxo',
                'rank' => 2
            ],
            [
                'id' => 3,
                'title' => 'Hati-Hati di Jalan',
                'artist' => 'Tulus',
                'cover' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
                'youtube_id' => 'W2ZkO0Npx1I',
                'rank' => 3
            ],
            [
                'id' => 4,
                'title' => 'Rayu',
                'artist' => 'Marion Jola',
                'cover' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
                'youtube_id' => '1y6smkh6c-0',
                'rank' => 4
            ]
        ];
    }
}
