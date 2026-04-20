<?php
// ================================================
// MIDDLEWARE DE AUTENTICAÇÃO — TRILHO KIDS
// ================================================

require_once __DIR__ . '/jwt.php';

// Extrai token do header Authorization: Bearer <token>
function _bearerToken(): ?string {
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    } else {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    }
    if (str_starts_with($auth, 'Bearer ')) {
        return trim(substr($auth, 7));
    }
    return null;
}

// Exige professor autenticado. Retorna payload do JWT.
function requireAuth(): array {
    $token = _bearerToken();
    if (!$token) {
        responder(false, null, 'Autenticação necessária.', 401);
    }
    $payload = jwt_verify($token);
    if (!$payload) {
        responder(false, null, 'Token inválido ou expirado. Faça login novamente.', 401);
    }
    return $payload;
}

// Exige is_admin = true no token.
function requireAdmin(): array {
    $payload = requireAuth();
    if (!($payload['is_admin'] ?? false)) {
        responder(false, null, 'Acesso restrito ao administrador.', 403);
    }
    return $payload;
}

// Permite is_admin OU is_responsavel (para o painel admin).
function requireAdminOrResponsavel(): array {
    $payload = requireAuth();
    if (!($payload['is_admin'] ?? false) && !($payload['is_responsavel'] ?? false)) {
        responder(false, null, 'Acesso restrito ao administrador ou responsável.', 403);
    }
    return $payload;
}

// Retorna null para admin (acesso total) ou o instituicao_id do responsável.
function scopeInstituicao(array $payload): ?int {
    if ($payload['is_admin'] ?? false) return null;
    $id = $payload['instituicao_id'] ?? null;
    return $id ? (int)$id : null;
}

// Exige que o perfil do aluno pertença a uma turma em que o professor está vinculado.
// Admin bypassa a verificação.
function requireDonoDaTurma(PDO $db, int $perfil_id): array {
    $payload = requireAuth();
    if ($payload['is_admin']) return $payload;

    $stmt = $db->prepare("
        SELECT 1
        FROM perfis pf
        JOIN turma_professores tp ON tp.turma_id = pf.turma_id
        WHERE pf.id = ? AND tp.professor_id = ?
    ");
    $stmt->execute([$perfil_id, $payload['professor_id']]);

    if (!$stmt->fetch()) {
        responder(false, null, 'Você não tem permissão sobre este aluno.', 403);
    }
    return $payload;
}
