<?php
// ================================================
// JWT HS256 — Implementação sem dependências
// ================================================

function _b64u_enc(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function _b64u_dec(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_create(array $payload, int $ttl_horas = 8): string {
    $secret  = getenv('JWT_SECRET') ?: 'Fun1l@nd1@N0ss0R@nch0';
    $payload['iat'] = time();
    $payload['exp'] = time() + ($ttl_horas * 3600);

    $header  = _b64u_enc(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body    = _b64u_enc(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig     = _b64u_enc(hash_hmac('sha256', "$header.$body", $secret, true));

    return "$header.$body.$sig";
}

function jwt_verify(string $token): ?array {
    $secret = getenv('JWT_SECRET') ?: 'Fun1l@nd1@N0ss0R@nch0';
    $parts  = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $sig] = $parts;
    $expected = _b64u_enc(hash_hmac('sha256', "$header.$body", $secret, true));

    if (!hash_equals($expected, $sig)) return null;

    $data = json_decode(_b64u_dec($body), true);
    if (!is_array($data) || ($data['exp'] ?? 0) < time()) return null;

    return $data;
}
