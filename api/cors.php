<?php
// ============================================
// CORS + HEADERS — TRILHO KIDS API
// ============================================

// Domínios permitidos (adicione o seu domínio Vercel)
$allowedOrigins = [
    'https://trilhokids.vercel.app',
    'https://www.trilhokids.com.br',
    'https://trilhokids.com.br',
    'http://localhost:3000',   // desenvolvimento local
    'http://localhost:5500',   // Live Server VS Code
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
}

header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helpers ─────────────────────────────────

function responder(bool $ok, mixed $dados = null, string $erro = '', int $status = 200): never {
    http_response_code($status);
    echo json_encode(
        $ok
            ? ['ok' => true,  'dados' => $dados]
            : ['ok' => false, 'erro'  => $erro],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

function sanitize(string $val): string {
    return trim(strip_tags($val));
}
