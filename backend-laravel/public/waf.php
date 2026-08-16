<?php
// WAF (Web Application Firewall) & OWASP Security Middleware

// 1. CORS Hardening
$allowed_origins = ['http://localhost:5173', 'http://localhost:5176'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5176"); // Default fallback
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security Headers (OWASP)
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// 2. IP Management & Blocking
$db = require __DIR__ . '/database.php';
$client_ip = $_SERVER['REMOTE_ADDR'];

// Check if IP is in database
$ipRecord = $db->findBy('ip_management', 'ip_address', $client_ip);
if ($ipRecord && $ipRecord['status'] === 'blocked') {
    http_response_code(403);
    echo json_encode(['error' => 'Your IP is blocked by WAF.']);
    exit();
}

// 3. XSS & Malicious Payload Blocker (Auto-ban)
$malicious_keywords = ['<script>', 'javascript:', 'eval(', 'base64_decode', 'union select', 'UNION SELECT', 'DROP TABLE', '../', 'etc/passwd', 'cmd.exe', '/bin/sh'];

function checkPayload($data, $keywords) {
    if (is_array($data)) {
        foreach ($data as $val) {
            if (checkPayload($val, $keywords)) return true;
        }
    } else {
        foreach ($keywords as $kw) {
            if (stripos($data, $kw) !== false) return true;
        }
    }
    return false;
}

$input = file_get_contents('php://input');
$json_input = json_decode($input, true) ?? [];

if (checkPayload($_GET, $malicious_keywords) || checkPayload($_POST, $malicious_keywords) || checkPayload($json_input, $malicious_keywords)) {
    // Auto ban IP
    if (!$ipRecord) {
        $db->insert('ip_management', ['ip_address' => $client_ip, 'status' => 'blocked', 'reason' => 'Malicious payload detected']);
    }
    
    http_response_code(403);
    echo json_encode(['error' => 'Malicious payload detected. IP Banned.']);
    exit();
}

// 4. Basic Sanitization function for inputs
function sanitize($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}
