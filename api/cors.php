<?php
// ================================================
// CORS + HELPERS — TRILHO KIDS API
// ================================================

$allowedOrigins = [
    'https://trilhokids.vercel.app',
    'https://www.trilhokids.com.br',
    'https://trilhokids.com.br',
    'https://cafecomhomensdedeus.com.br',
    'http://localhost:3000',   // npm start (frontend local)
    'http://localhost:5500',   // Live Server VS Code
    'http://127.0.0.1:5500',
    'http://localhost:5173',   // Vite (caso use)
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback para domínio de produção
    header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Responde preflight OPTIONS e encerra
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helpers globais ──────────────────────────

function responder(bool $ok, mixed $dados = null, string $erro = '', int $status = 200): never {
    http_response_code($status);
    echo json_encode(
        $ok
            ? ['ok' => true,  'dados' => $dados]
            : ['ok' => false, 'erro'  => $erro],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sanitize(string $val): string {
    return trim(strip_tags($val));
}
