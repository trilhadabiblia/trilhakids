<?php
// ============================================
// JWT HELPER — TRILHO KIDS API
// ============================================

define('JWT_SECRET', 'trilhokids_jwt_2025_mude_isto');  // troque antes de publicar!
define('JWT_TTL',    86400);  // 24 horas

function _b64e(string $d): string {
    return rtrim(strtr(base64_encode($d), '+/', '-_'), '=');
}
function _b64d(string $d): string {
    return base64_decode(strtr($d, '-_', '+/') . str_repeat('=', 3 - (strlen($d) + 3) % 4));
}

function jwtCriar(array $payload): string {
    $h = _b64e(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $p = _b64e(json_encode($payload));
    $s = _b64e(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    return "$h.$p.$s";
}

function jwtVerificar(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    if (!hash_equals(_b64e(hash_hmac('sha256', "$h.$p", JWT_SECRET, true)), $s)) return null;
    $payload = json_decode(_b64d($p), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

// Extrai e valida o Bearer token da requisição; encerra com 401 se inválido.
function autenticar(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token  = str_starts_with($header, 'Bearer ') ? substr($header, 7) : '';
    if (!$token) responder(false, null, 'Não autenticado.', 401);
    $prof = jwtVerificar($token);
    if (!$prof) responder(false, null, 'Token inválido ou expirado.', 401);
    return $prof;
}

// Encerra com 403 se o usuário não for admin.
function exigirAdmin(array $prof): void {
    if (!($prof['is_admin'] ?? false)) responder(false, null, 'Acesso restrito ao administrador.', 403);
}

// Retorna o filtro de instituição: null para admin (vê tudo), int para responsável.
function scopeInstituicao(array $prof): ?int {
    if ($prof['is_admin'] ?? false) return null;
    return ($prof['instituicao_id'] ?? null) ? (int)$prof['instituicao_id'] : null;
}
