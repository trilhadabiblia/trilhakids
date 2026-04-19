<?php
// ============================================
// AUTH — TRILHO KIDS API
// ============================================
// POST /auth.php  {email, senha}  → JWT
// GET  /auth.php  (Bearer)        → dados do professor logado

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET: retorna dados do prof autenticado ───
if ($method === 'GET') {
    $prof = autenticar();
    responder(true, ['professor' => $prof]);
}

// ── POST: login ──────────────────────────────
if ($method === 'POST') {
    $body  = body();
    $email = sanitize($body['email'] ?? '');
    $senha = $body['senha'] ?? '';

    if (!$email || !$senha) {
        responder(false, null, 'E-mail e senha obrigatórios.', 422);
    }

    $stmt = $db->prepare("
        SELECT p.id, p.nome, p.email, p.senha_hash,
               p.is_admin, p.is_responsavel, p.ativo,
               p.instituicao_id,
               i.nome AS instituicao_nome
        FROM professores p
        LEFT JOIN instituicoes i ON i.id = p.instituicao_id
        WHERE p.email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $prof = $stmt->fetch();

    if (!$prof) {
        responder(false, null, 'E-mail ou senha incorretos.', 401);
    }
    if (!$prof['ativo']) {
        responder(false, null, 'Conta desativada. Contate o administrador.', 403);
    }

    // Verifica senha (SHA2-256 ou password_hash)
    $senhaOk = ($prof['senha_hash'] === hash('sha256', $senha))
            || password_verify($senha, $prof['senha_hash']);

    if (!$senhaOk) {
        responder(false, null, 'E-mail ou senha incorretos.', 401);
    }

    // Carrega turmas do professor
    $stmtT = $db->prepare("
        SELECT t.id, t.nome, tp.papel
        FROM turma_professores tp
        JOIN turmas t ON t.id = tp.turma_id
        WHERE tp.professor_id = ?
    ");
    $stmtT->execute([$prof['id']]);
    $turmas = $stmtT->fetchAll();

    $payload = [
        'sub'            => (int)$prof['id'],
        'nome'           => $prof['nome'],
        'email'          => $prof['email'],
        'is_admin'       => (bool)$prof['is_admin'],
        'is_responsavel' => (bool)$prof['is_responsavel'],
        'instituicao_id' => $prof['instituicao_id'] ? (int)$prof['instituicao_id'] : null,
        'instituicao'    => $prof['instituicao_nome'],
        'turmas'         => $turmas,
        'iat'            => time(),
        'exp'            => time() + JWT_TTL,
    ];

    $token = jwtCriar($payload);

    // Redireciona conforme papel
    $redirect = $prof['is_admin'] || $prof['is_responsavel']
        ? '/admin/index.html'
        : '/professor/dashboard.html';

    responder(true, [
        'token'     => $token,
        'professor' => $payload,
        'redirect'  => $redirect,
    ]);
}

responder(false, null, 'Método não permitido.', 405);
