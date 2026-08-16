<?php
$db = require __DIR__ . '/database.php';
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Helper function to generate token
function generateToken() {
    return bin2hex(random_bytes(32));
}

// =======================
// AUTH ENDPOINTS
// =======================
if ($method === 'POST' && $uri === '/api/v1/register') {
    $name = sanitize($input['name'] ?? '');
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $input['password'] ?? '';

    if (!$name || !$email || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Validasi gagal. Password minimal 6 karakter.']);
        exit();
    }

    if ($db->findBy('users', 'email', $email)) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar.']);
        exit();
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $userId = $db->insert('users', ['name' => $name, 'email' => $email, 'password' => $hash]);
    
    $token = generateToken();
    $db->insert('sessions', ['user_id' => $userId, 'token' => $token]);

    echo json_encode(['success' => true, 'data' => [
        'user' => ['id' => $userId, 'name' => $name, 'email' => $email],
        'token' => $token
    ]]);
    exit();
}

if ($method === 'POST' && $uri === '/api/v1/login') {
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $input['password'] ?? '';

    $user = $db->findBy('users', 'email', $email);
    
    if ($user && password_verify($password, $user['password'])) {
        $token = generateToken();
        $db->insert('sessions', ['user_id' => $user['id'], 'token' => $token]);

        echo json_encode(['success' => true, 'data' => [
            'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']],
            'token' => $token
        ]]);
        exit();
    }
    
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Kredensial salah.']);
    exit();
}

// =======================
// AUTH MIDDLEWARE FOR PROTECTED ROUTES
// =======================
$isAuthRoute = in_array($uri, ['/api/v1/recognize', '/api/v1/history', '/api/v1/profile', '/api/v1/search', '/api/v1/admin/ips']);
$currentUser = null;

if ($isAuthRoute) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $session = $db->findBy('sessions', 'token', $token);
        if ($session) {
            $currentUser = $db->findBy('users', 'id', $session['user_id']);
            if ($currentUser) {
                // Return safe user without password
                $currentUser = ['id' => $currentUser['id'], 'name' => $currentUser['name'], 'email' => $currentUser['email']];
            }
        }
    }

    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthenticated or Invalid Token']);
        exit();
    }
}

// =======================
// ADMIN IP MANAGEMENT ENDPOINTS
// =======================
if (str_starts_with($uri, '/api/v1/admin/ips')) {
    // Only allow user ID 1 (First user registered is admin)
    if (!$currentUser || $currentUser['id'] !== 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden: Admin only']);
        exit();
    }

    if ($method === 'GET') {
        $ips = $db->getTable('ip_management');
        // Sort DESC by id
        usort($ips, function($a, $b) { return $b['id'] <=> $a['id']; });
        echo json_encode(['success' => true, 'data' => $ips]);
        exit();
    }

    if ($method === 'POST') {
        $ip = sanitize($input['ip_address'] ?? '');
        $status = sanitize($input['status'] ?? 'blocked'); // 'blocked' or 'whitelist'
        $reason = sanitize($input['reason'] ?? 'Manual addition');

        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            $existing = $db->findBy('ip_management', 'ip_address', $ip);
            if ($existing) {
                $db->updateBy('ip_management', 'ip_address', $ip, ['status' => $status, 'reason' => $reason]);
            } else {
                $db->insert('ip_management', ['ip_address' => $ip, 'status' => $status, 'reason' => $reason]);
            }
            echo json_encode(['success' => true, 'message' => 'IP updated successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid IP address']);
        }
        exit();
    }

    if ($method === 'DELETE') {
        $ip = sanitize($_GET['ip'] ?? '');
        $db->deleteBy('ip_management', 'ip_address', $ip);
        echo json_encode(['success' => true, 'message' => 'IP deleted from rules']);
        exit();
    }
}

// Helper sanitize function in case it is missing (defined in waf.php usually)
if (!function_exists('sanitize')) {
    function sanitize($data) {
        return htmlspecialchars(strip_tags(trim($data)));
    }
}

// Helper to find details of a track (checks mock list and uploaded tracks)
function findTrackDetail($db, $trackId) {
    global $mockTracks;
    // Check mock first
    foreach ($mockTracks as $t) {
        if ($t['id'] == $trackId) return $t;
    }
    // Check uploaded
    $uploaded = $db->findBy('uploaded_tracks', 'id', (int)$trackId);
    if ($uploaded) {
        return [
            'id' => $uploaded['id'],
            'title' => $uploaded['title'],
            'artist' => $uploaded['artist'],
            'cover' => $uploaded['cover'],
            'audio_url' => $uploaded['audio_url'],
            'lyrics' => $uploaded['lyrics'] ?? 'Lirik belum tersedia.',
            'duration' => $uploaded['duration'] ?? 0,
            'is_uploaded' => true
        ];
    }
    return null;
}

// =======================
// AUDIO UPLOAD ENDPOINT
// =======================
if ($method === 'POST' && $uri === '/api/v1/upload') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $title = sanitize($_POST['title'] ?? '');
    $artist = sanitize($_POST['artist'] ?? '');
    $lyrics = sanitize($_POST['lyrics'] ?? '');

    if (empty($title) || empty($artist) || !isset($_FILES['audio'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Judul, artis, dan file audio wajib diisi.']);
        exit();
    }

    // Process audio upload
    $audioFile = $_FILES['audio'];
    $uploadDir = __DIR__ . '/storage/uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $audioExt = pathinfo($audioFile['name'], PATHINFO_EXTENSION);
    $audioName = uniqid('audio_') . '.' . $audioExt;
    $audioDest = $uploadDir . $audioName;

    if (!move_uploaded_file($audioFile['tmp_name'], $audioDest)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal mengunggah file audio.']);
        exit();
    }

    // Process cover image upload (optional)
    $coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'; // default
    if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
        $coverFile = $_FILES['cover'];
        $coverDir = __DIR__ . '/storage/covers/';
        if (!file_exists($coverDir)) {
            mkdir($coverDir, 0777, true);
        }
        $coverExt = pathinfo($coverFile['name'], PATHINFO_EXTENSION);
        $coverName = uniqid('cover_') . '.' . $coverExt;
        $coverDest = $coverDir . $coverName;
        if (move_uploaded_file($coverFile['tmp_name'], $coverDest)) {
            $coverUrl = '/storage/covers/' . $coverName;
        }
    }

    $trackId = rand(1000000, 9999999);
    $audioUrl = '/storage/uploads/' . $audioName;

    $newTrack = [
        'id' => $trackId,
        'user_id' => $currentUser['id'],
        'title' => $title,
        'artist' => $artist,
        'lyrics' => $lyrics,
        'cover' => $coverUrl,
        'audio_url' => $audioUrl,
        'duration' => 180, // placeholder
        'created_at' => date('Y-m-d H:i:s')
    ];

    $db->insert('uploaded_tracks', $newTrack);

    echo json_encode(['success' => true, 'message' => 'Lagu berhasil diunggah!', 'data' => $newTrack]);
    exit();
}

// =======================
// GET MY UPLOADED TRACKS
// =======================
if ($method === 'GET' && $uri === '/api/v1/my-tracks') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $allUploaded = $db->getTable('uploaded_tracks');
    $myTracks = array_values(array_filter($allUploaded, function($t) use ($currentUser) {
        return $t['user_id'] == $currentUser['id'];
    }));

    echo json_encode(['success' => true, 'data' => $myTracks]);
    exit();
}

// =======================
// TRACK LIKE ENDPOINTS
// =======================
if ($method === 'POST' && $uri === '/api/v1/tracks/like') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $trackId = $input['track_id'] ?? null;
    $trackTitle = sanitize($input['title'] ?? '');
    $trackArtist = sanitize($input['artist'] ?? '');
    $trackCover = sanitize($input['cover'] ?? '');
    $trackPreview = sanitize($input['preview_url'] ?? '');
    $trackYoutubeId = sanitize($input['youtube_id'] ?? '');

    if (!$trackId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Track ID wajib diisi.']);
        exit();
    }

    $liked = $db->getTable('liked_tracks');
    $existing = null;
    foreach ($liked as $item) {
        if ($item['user_id'] == $currentUser['id'] && $item['track_id'] == $trackId) {
            $existing = $item;
            break;
        }
    }

    if ($existing) {
        $db->deleteBy('liked_tracks', 'id', $existing['id']);
        echo json_encode(['success' => true, 'liked' => false, 'message' => 'Lagu dihapus dari favorit.']);
    } else {
        $db->insert('liked_tracks', [
            'user_id' => $currentUser['id'],
            'track_id' => $trackId,
            'title' => $trackTitle,
            'artist' => $trackArtist,
            'cover' => $trackCover,
            'preview_url' => $trackPreview,
            'youtube_id' => $trackYoutubeId
        ]);
        echo json_encode(['success' => true, 'liked' => true, 'message' => 'Lagu ditambahkan ke favorit.']);
    }
    exit();
}

if ($method === 'GET' && $uri === '/api/v1/tracks/liked') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $allLikes = $db->getTable('liked_tracks');
    $myLikes = array_values(array_filter($allLikes, function($item) use ($currentUser) {
        return $item['user_id'] == $currentUser['id'];
    }));

    echo json_encode(['success' => true, 'data' => $myLikes]);
    exit();
}

// =======================
// ALBUM LIKE ENDPOINTS
// =======================
if ($method === 'POST' && $uri === '/api/v1/albums/like') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $albumId = $input['album_id'] ?? null;
    $albumTitle = sanitize($input['title'] ?? '');
    $albumArtist = sanitize($input['artist'] ?? '');
    $albumCover = sanitize($input['cover'] ?? '');

    if (!$albumId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Album ID wajib diisi.']);
        exit();
    }

    $liked = $db->getTable('liked_albums');
    $existing = null;
    foreach ($liked as $item) {
        if ($item['user_id'] == $currentUser['id'] && $item['album_id'] == $albumId) {
            $existing = $item;
            break;
        }
    }

    if ($existing) {
        $db->deleteBy('liked_albums', 'id', $existing['id']);
        echo json_encode(['success' => true, 'liked' => false, 'message' => 'Album dihapus dari favorit.']);
    } else {
        $db->insert('liked_albums', [
            'user_id' => $currentUser['id'],
            'album_id' => $albumId,
            'title' => $albumTitle,
            'artist' => $albumArtist,
            'cover' => $albumCover
        ]);
        echo json_encode(['success' => true, 'liked' => true, 'message' => 'Album ditambahkan ke favorit.']);
    }
    exit();
}

if ($method === 'GET' && $uri === '/api/v1/albums/liked') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $allLikes = $db->getTable('liked_albums');
    $myLikes = array_values(array_filter($allLikes, function($item) use ($currentUser) {
        return $item['user_id'] == $currentUser['id'];
    }));

    echo json_encode(['success' => true, 'data' => $myLikes]);
    exit();
}

// =======================
// REAL HISTORY POST ENDPOINT
// =======================
if ($method === 'POST' && $uri === '/api/v1/history') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $trackId = $input['track_id'] ?? null;
    $trackTitle = sanitize($input['title'] ?? '');
    $trackArtist = sanitize($input['artist'] ?? '');
    $trackCover = sanitize($input['cover'] ?? '');
    $trackPreview = sanitize($input['preview_url'] ?? '');
    $trackYoutubeId = sanitize($input['youtube_id'] ?? '');

    if (!$trackId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Track ID wajib diisi.']);
        exit();
    }

    // Delete existing history for this track for this user to push it to top (keep history unique per track)
    $history = $db->getTable('history');
    foreach ($history as $item) {
        if ($item['user_id'] == $currentUser['id'] && $item['track_id'] == $trackId) {
            $db->deleteBy('history', 'id', $item['id']);
        }
    }

    $db->insert('history', [
        'user_id' => $currentUser['id'],
        'track_id' => $trackId,
        'title' => $trackTitle,
        'artist' => $trackArtist,
        'cover' => $trackCover,
        'preview_url' => $trackPreview,
        'youtube_id' => $trackYoutubeId,
        'created_at' => date('Y-m-d H:i:s')
    ]);

    echo json_encode(['success' => true, 'message' => 'History logged successfully.']);
    exit();
}

if ($method === 'GET' && $uri === '/api/v1/history') {
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $history = $db->getTable('history');
    $myHistory = array_values(array_filter($history, function($item) use ($currentUser) {
        return $item['user_id'] == $currentUser['id'];
    }));

    // Sort DESC by id to get recent first
    usort($myHistory, function($a, $b) { return $b['id'] <=> $a['id']; });

    echo json_encode(['success' => true, 'data' => $myHistory]);
    exit();
}

