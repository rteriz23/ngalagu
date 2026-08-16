<?php

require_once __DIR__ . '/waf.php';

// Serve static assets natively if file exists (for local mock server)
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($uri, '/assets/')) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mime = 'image/png';
        if ($ext === 'jpg' || $ext === 'jpeg') $mime = 'image/jpeg';
        if ($ext === 'svg') $mime = 'image/svg+xml';
        header("Content-Type: $mime");
        readfile($filePath);
        exit();
    }
}

$autoloadPath = __DIR__ . '/../vendor/autoload.php';

if (file_exists($autoloadPath)) {
    require $autoloadPath;
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );
    $response->send();
    $kernel->terminate($request, $response);
    exit();
}

// ==========================================
// Native PHP Server Core
// ==========================================
header('Content-Type: application/json');

// Mock Data for Tracks (Used as fallback)
$mockTracks = [
    [
        'id' => 101,
        'title' => 'Rayu',
        'artist' => 'Marion Jola, Laleilmanino',
        'album' => ['id' => 1, 'title' => 'MARION'],
        'cover' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        'youtube_id' => '1y6smkh6c-0', // Actual YT ID
        'lyrics' => "[00:00.00] (Instrumental)\n[00:10.00] Jangan datang lagi jika hanya membuat luka\n[00:15.00] Haruskah aku terus menanti rayuanmu yang tak kunjung pasti...\n[00:22.00] Kau buatku makin terbawa perasaan ini.",
        'genre' => 'Pop',
        'duration' => 227
    ],
    [
        'id' => 102,
        'title' => 'Hati-Hati di Jalan',
        'artist' => 'Tulus',
        'album' => ['id' => 2, 'title' => 'Manusia'],
        'cover' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        'youtube_id' => 'W2ZkO0Npx1I',
        'lyrics' => "[00:00.00] (Intro)\n[00:12.00] Perjalanan membawamu\n[00:18.00] Kini kau telah di sana\n[00:25.00] Semoga kita bertemu lagi di ujung jalan yang indah...",
        'genre' => 'Acoustic',
        'duration' => 242
    ]
];

// Include Auth & Security Endpoints
require_once __DIR__ . '/api_endpoints.php';

if ($method === 'POST' && $uri === '/api/v1/recognize') {
    // ACRCloud Credentials (from the user's screenshot, though likely Console API, we'll put them here for now)
    $host = 'identify-ap-southeast-1.acrcloud.com';
    $access_key = 'b133b59899860a045d2d1543c65cacf0';
    $access_secret = 'Z55FkXKKnfik1ygBzyHrFw7K0wTzftF8A8pAIPSO';

    error_reporting(0); // Suppress warnings from corrupting JSON output
    ini_set('display_errors', 0);

    $input = json_decode(file_get_contents('php://input'), true);
    $audioData = $input['audio_data'] ?? '';

    if (empty($audioData) || $audioData === 'continuous_stream') {
        echo json_encode(['success' => false, 'message' => 'Tolong muat ulang (refresh) halaman ini. Browser Anda masih menggunakan versi lama.']);
        exit();
    }

    // Process real audio base64
    // Usually prefixed with 'data:audio/webm;codecs=opus;base64,'
    if (strpos($audioData, 'base64,') !== false) {
        $audioData = explode('base64,', $audioData)[1];
    }
    
    $fileData = base64_decode($audioData);
    $fileSize = strlen($fileData);

    $http_method = "POST";
    $http_uri = "/v1/identify";
    $data_type = "audio";
    $signature_version = "1";
    $timestamp = time();

    $string_to_sign = $http_method . "\n" .
                      $http_uri ."\n" .
                      $access_key . "\n" .
                      $data_type . "\n" .
                      $signature_version . "\n" .
                      $timestamp;
    $signature = base64_encode(hash_hmac("sha1", $string_to_sign, $access_secret, true));

    // Prepare multipart payload manually since cURL is not available
    $boundary = uniqid();
    $delimiter = '-------------' . $boundary;
    $post_data = '';
    
    $fields = array(
        'sample_bytes' => $fileSize,
        'access_key' => $access_key,
        'data_type' => $data_type,
        'signature' => $signature,
        'signature_version' => $signature_version,
        'timestamp' => $timestamp
    );

    foreach ($fields as $name => $content) {
        $post_data .= "--" . $delimiter . "\r\n";
        $post_data .= 'Content-Disposition: form-data; name="' . $name . "\"\r\n\r\n";
        $post_data .= $content . "\r\n";
    }

    $post_data .= "--" . $delimiter . "\r\n";
    $post_data .= 'Content-Disposition: form-data; name="sample"; filename="sample.webm"' . "\r\n";
    $post_data .= "Content-Type: audio/webm\r\n\r\n";
    $post_data .= $fileData . "\r\n";
    $post_data .= "--" . $delimiter . "--\r\n";

    $options = array(
        'http' => array(
            'header'  => "Content-Type: multipart/form-data; boundary=" . $delimiter . "\r\n" . 
                         "Content-Length: " . strlen($post_data) . "\r\n",
            'method'  => 'POST',
            'content' => $post_data,
            'ignore_errors' => true
        )
    );

    $context  = stream_context_create($options);
    $result = file_get_contents("https://".$host.$http_uri, false, $context);

    if ($result === false) {
        echo json_encode(['success' => false, 'message' => 'Gagal menghubungi server ACRCloud.']);
        exit();
    }

    $acrRes = json_decode($result, true);

    if (isset($acrRes['status']['code']) && $acrRes['status']['code'] == 0 && isset($acrRes['metadata']['music'][0])) {
        $music = $acrRes['metadata']['music'][0];
        
        $trackData = [
            'id' => crc32($music['acrid']),
            'title' => $music['title'],
            'artist' => isset($music['artists']) ? implode(', ', array_column($music['artists'], 'name')) : 'Unknown Artist',
            'album' => ['id' => crc32($music['album']['name'] ?? 'Single'), 'title' => $music['album']['name'] ?? 'Single'],
            'cover' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', // Mock cover
            'youtube_id' => $music['external_metadata']['youtube']['vid'] ?? 'W2ZkO0Npx1I', // Fallback to Tulus if no YT ID
            'lyrics' => "[00:00.00] (Lirik otomatis belum tersedia untuk lagu ini...)",
            'genre' => $music['genres'][0]['name'] ?? 'Pop',
            'duration' => isset($music['duration_ms']) ? (int)($music['duration_ms'] / 1000) : 180
        ];

        echo json_encode(['success' => true, 'message' => 'Lagu berhasil diidentifikasi (ACRCloud)!', 'data' => $trackData]);
    } else {
        // Failed recognition or wrong API keys
        echo json_encode([
            'success' => false, 
            'message' => 'Tidak dapat mengenali lagu. Error ACRCloud: ' . ($acrRes['status']['msg'] ?? 'Unknown Error'),
            'acr_response' => $acrRes
        ]);
    }
    exit();
}

if ($method === 'GET' && $uri === '/api/v1/history') {
    $histories = array_map(function($track) {
        return ['id' => rand(1000, 9999), 'user_id' => 1, 'track_id' => $track['id'], 'track' => $track, 'created_at' => date('c', strtotime('-' . rand(1, 10) . ' hours'))];
    }, array_slice($mockTracks, 0, 3));
    echo json_encode(['success' => true, 'data' => $histories]);
    exit();
}

if ($method === 'GET' && $uri === '/api/v1/charts') {
    // Use Deezer API for real charts
    $deezerResult = file_get_contents('https://api.deezer.com/chart/0/tracks?limit=50');
    if ($deezerResult !== false) {
        $deezerData = json_decode($deezerResult, true);
        $charts = [];
        if (isset($deezerData['data'])) {
            foreach ($deezerData['data'] as $index => $track) {
                $charts[] = [
                    'id' => $track['id'],
                    'title' => $track['title'],
                    'artist' => $track['artist']['name'] ?? 'Unknown',
                    'album' => ['id' => $track['album']['id'] ?? 0, 'title' => $track['album']['title'] ?? 'Single'],
                    'cover' => $track['album']['cover_medium'] ?? $track['album']['cover'] ?? '',
                    'youtube_id' => 'dQw4w9WgXcQ',
                    'preview_url' => $track['preview'] ?? '',
                    'lyrics' => "[00:00.00] (Lirik belum tersedia...)",
                    'genre' => 'Pop',
                    'rank' => $index + 1,
                    'duration' => $track['duration'] ?? 0
                ];
            }
        }
        echo json_encode(['success' => true, 'data' => $charts]);
    } else {
        // Fallback to mock
        $charts = array_map(function($track, $index) { return array_merge($track, ['rank' => $index + 1]); }, $mockTracks, array_keys($mockTracks));
        echo json_encode(['success' => true, 'data' => $charts]);
    }
    exit();
}

// NEW: Search API using Deezer
if ($method === 'GET' && str_starts_with($uri, '/api/v1/search')) {
    $query = $_GET['q'] ?? '';
    $genre = $_GET['genre'] ?? '';
    
    // Deezer genre ID mapping
    $genreMap = [
        'Pop' => 132,
        'Acoustic' => 466,   // Folk (closest to Acoustic)
        '80s' => 132,        // Will add "80s" to search query
        'Rock' => 152,
        'Jazz' => 129,
        'Hip-Hop' => 116,
        'R&B' => 165,
        'Dance' => 113,
        'Electro' => 106,
        'Classical' => 98,
        'Reggae' => 144,
        'Metal' => 464,
        'Country' => 84,
        'K-Pop' => 16,
        'Dangdut' => 2,
        'Indo Pop' => 2,
    ];
    
    // Helper function to map Deezer track to our format
    $mapTrack = function($track) {
        return [
            'id' => $track['id'],
            'title' => $track['title'] ?? $track['title_short'] ?? 'Unknown',
            'artist' => $track['artist']['name'] ?? 'Unknown',
            'album' => ['id' => $track['album']['id'] ?? 0, 'title' => $track['album']['title'] ?? 'Single'],
            'cover' => $track['album']['cover_medium'] ?? $track['album']['cover'] ?? '',
            'youtube_id' => 'dQw4w9WgXcQ',
            'preview_url' => $track['preview'] ?? '',
            'lyrics' => "[00:00.00] (Lirik belum tersedia...)",
            'genre' => 'Pop',
            'duration' => $track['duration'] ?? 0
        ];
    };
    
    // CASE 1: No query, no genre → trending tracks
    if (empty($query) && empty($genre)) {
        $deezerResult = file_get_contents('https://api.deezer.com/chart/0/tracks?limit=50');
        if ($deezerResult !== false) {
            $deezerData = json_decode($deezerResult, true);
            $results = array_map($mapTrack, $deezerData['data'] ?? []);
            echo json_encode(['success' => true, 'data' => $results]);
        } else {
            echo json_encode(['success' => true, 'data' => array_values($mockTracks)]);
        }
        exit();
    }
    
    // CASE 2: Genre selected (with or without query)
    if (!empty($genre)) {
        $genreId = $genreMap[$genre] ?? null;
        
        if (!empty($query)) {
            // Search with query, then we use Deezer search
            $searchTerm = $query;
            if ($genre === '80s') $searchTerm .= ' 80s';
            $deezerUrl = "https://api.deezer.com/search?q=" . urlencode($searchTerm) . "&limit=50";
        } elseif ($genreId) {
            // Genre only: use editorial charts for that genre (returns proper genre-specific tracks)
            $editorialUrl = "https://api.deezer.com/editorial/{$genreId}/charts";
            $editorialResult = file_get_contents($editorialUrl);
            
            if ($editorialResult !== false) {
                $editorialData = json_decode($editorialResult, true);
                $results = [];
                
                // Get tracks from editorial charts
                $chartTracks = $editorialData['tracks']['data'] ?? [];
                foreach ($chartTracks as $track) {
                    $results[] = $mapTrack($track);
                }
                
                // Also get top albums and fetch their tracks for more variety
                $chartAlbums = array_slice($editorialData['albums']['data'] ?? [], 0, 5);
                foreach ($chartAlbums as $album) {
                    $albumUrl = "https://api.deezer.com/album/{$album['id']}/tracks?limit=5";
                    $albumResult = file_get_contents($albumUrl);
                    if ($albumResult !== false) {
                        $albumData = json_decode($albumResult, true);
                        foreach ($albumData['data'] ?? [] as $aTrack) {
                            // Album tracks don't have album info in them, so we add it
                            $aTrack['album'] = ['id' => $album['id'], 'title' => $album['title'] ?? 'Album', 'cover_medium' => $album['cover_medium'] ?? '', 'cover' => $album['cover'] ?? ''];
                            $aTrack['artist'] = ['name' => $album['artist']['name'] ?? 'Unknown'];
                            $results[] = $mapTrack($aTrack);
                        }
                    }
                }
                
                // Also get top artists and fetch their top tracks
                $chartArtists = array_slice($editorialData['artists']['data'] ?? [], 0, 5);
                foreach ($chartArtists as $artist) {
                    $topUrl = "https://api.deezer.com/artist/{$artist['id']}/top?limit=5";
                    $topResult = file_get_contents($topUrl);
                    if ($topResult !== false) {
                        $topData = json_decode($topResult, true);
                        foreach ($topData['data'] ?? [] as $track) {
                            $results[] = $mapTrack($track);
                        }
                    }
                }
                
                // Remove duplicates by track ID
                $seen = [];
                $uniqueResults = [];
                foreach ($results as $r) {
                    if (!in_array($r['id'], $seen)) {
                        $seen[] = $r['id'];
                        $uniqueResults[] = $r;
                    }
                }
                
                echo json_encode(['success' => true, 'data' => $uniqueResults]);
                exit();
            }
            // Fallback if artist fetch fails
            $searchTerm = $genre === '80s' ? '80s hits' : $genre;
            $deezerUrl = "https://api.deezer.com/search?q=" . urlencode($searchTerm) . "&limit=50";
        } else {
            // Unknown genre, just search by genre name
            $searchTerm = $genre;
            $deezerUrl = "https://api.deezer.com/search?q=" . urlencode($searchTerm) . "&limit=50";
        }
        
        $deezerResult = file_get_contents($deezerUrl);
        if ($deezerResult !== false) {
            $deezerData = json_decode($deezerResult, true);
            $results = array_map($mapTrack, $deezerData['data'] ?? []);
            echo json_encode(['success' => true, 'data' => $results]);
        } else {
            echo json_encode(['success' => true, 'data' => []]);
        }
        exit();
    }
    
    // CASE 3: Query only, no genre
    $deezerUrl = "https://api.deezer.com/search?q=" . urlencode($query) . "&limit=50";
    $deezerResult = file_get_contents($deezerUrl);
    if ($deezerResult !== false) {
        $deezerData = json_decode($deezerResult, true);
        $results = array_map($mapTrack, $deezerData['data'] ?? []);
        echo json_encode(['success' => true, 'data' => $results]);
    } else {
        echo json_encode(['success' => true, 'data' => []]);
    }
    exit();
}

// Default fallback response
echo json_encode(['app' => 'Ngalagu API Server (MOCK MODE)', 'status' => 'running']);
