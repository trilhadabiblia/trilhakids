<?php
// ================================================
// AUTENTICAÇÃO — TRILHO KIDS API
// ================================================
// POST /auth.php  { email, senha }  → { token, professor }
// GET  /auth.php?me                 → { professor }  (requer Bearer)

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET /auth.php?me — Dados do professor logado
if ($method === 'GET' && isset($_GET['me'])) {
    $payload = requireAuth();
    $db      = getDB();

    $stmt = $db->prepare("
        SELECT p.id, p.nome, p.email, p.is_admin, p.ativo,
               i.nome AS instituicao
        FROM professores p
        LEFT JOIN instituicoes i ON i.id = p.instituicao_id
        WHERE p.id = ? AND p.ativo = 1
    ");
    $stmt->execute([$payload['professor_id']]);
    $prof = $stmt->fetch();

    if (!$prof) responder(false, null, 'Professor não encontrado.', 404);

    // Turmas via turma_professores
    $stmt = $db->prepare("
        SELECT t.id, t.nome, tp.papel
        FROM turmas t
        JOIN turma_professores tp ON tp.turma_id = t.id
        WHERE tp.professor_id = ? AND t.ativo = 1
        ORDER BY t.nome
    ");
    $stmt->execute([$prof['id']]);
    $prof['turmas']   = $stmt->fetchAll();
    $prof['is_admin'] = (bool) $prof['is_admin'];

    responder(true, $prof);
}

// ── POST /auth.php — Login
if ($method === 'POST') {
    $body  = body();
    $email = sanitize($body['email'] ?? '');
    $senha = $body['senha'] ?? '';

    if (!$email || !$senha) {
        responder(false, null, 'E-mail e senha são obrigatórios.', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare("
        SELECT p.id, p.nome, p.email, p.senha_hash, p.is_admin, p.is_responsavel, p.ativo,
               p.instituicao_id, i.nome AS instituicao
        FROM professores p
        LEFT JOIN instituicoes i ON i.id = p.instituicao_id
        WHERE p.email = ?
    ");
    $stmt->execute([$email]);
    $prof = $stmt->fetch();

    if (!$prof || !password_verify($senha, $prof['senha_hash'])) {
        responder(false, null, 'E-mail ou senha incorretos.', 401);
    }
    if (!$prof['ativo']) {
        responder(false, null, 'Conta desativada. Fale com o administrador.', 403);
    }

    // Turmas via turma_professores
    $stmt = $db->prepare("
        SELECT t.id, t.nome, tp.papel
        FROM turmas t
        JOIN turma_professores tp ON tp.turma_id = t.id
        WHERE tp.professor_id = ? AND t.ativo = 1
        ORDER BY t.nome
    ");
    $stmt->execute([$prof['id']]);
    $turmas = $stmt->fetchAll();

    $isAdmin       = (bool) $prof['is_admin'];
    $isResponsavel = (bool) ($prof['is_responsavel'] ?? false);
    $instituicaoId = $prof['instituicao_id'] ? (int) $prof['instituicao_id'] : null;

    $token = jwt_create([
        'professor_id'   => (int) $prof['id'],
        'nome'           => $prof['nome'],
        'is_admin'       => $isAdmin,
        'is_responsavel' => $isResponsavel,
        'instituicao_id' => $instituicaoId,
    ]);

    $redirect = ($isAdmin || $isResponsavel)
        ? '/admin/index.html'
        : '/professor/dashboard.html';

    responder(true, [
        'token'    => $token,
        'redirect' => $redirect,
        'professor' => [
            'id'             => (int) $prof['id'],
            'nome'           => $prof['nome'],
            'email'          => $prof['email'],
            'is_admin'       => $isAdmin,
            'is_responsavel' => $isResponsavel,
            'instituicao_id' => $instituicaoId,
            'instituicao'    => $prof['instituicao'],
            'turmas'         => $turmas,
        ],
    ]);
}

responder(false, null, 'Método não permitido.', 405);
