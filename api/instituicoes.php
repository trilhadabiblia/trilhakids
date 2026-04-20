<?php
// ================================================
// INSTITUIÇÕES — TRILHO KIDS API
// ================================================
// GET    /instituicoes.php          → lista (admin: todas; responsável: só a sua)
// POST   /instituicoes.php          → cria (admin)
// PUT    /instituicoes.php {id,...} → atualiza (admin: qualquer; responsável: só a sua)
// DELETE /instituicoes.php {id}     → remove (admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Lista ───────────────────────────────
if ($method === 'GET') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $db      = getDB();

    if ($scope !== null) {
        $stmt = $db->prepare("
            SELECT i.id, i.nome, i.tipo, i.cidade,
                   i.responsavel, i.telefone, i.email, i.criado_em,
                   COUNT(DISTINCT t.id) AS total_turmas
            FROM instituicoes i
            LEFT JOIN turmas t ON t.instituicao_id = i.id AND t.ativo = 1
            WHERE i.id = ?
            GROUP BY i.id
        ");
        $stmt->execute([$scope]);
    } else {
        $stmt = $db->query("
            SELECT i.id, i.nome, i.tipo, i.cidade,
                   i.responsavel, i.telefone, i.email, i.criado_em,
                   COUNT(DISTINCT t.id) AS total_turmas
            FROM instituicoes i
            LEFT JOIN turmas t ON t.instituicao_id = i.id AND t.ativo = 1
            GROUP BY i.id
            ORDER BY i.nome
        ");
    }
    responder(true, $stmt->fetchAll());
}

// ── POST: Cria ───────────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $body   = body();
    $nome   = sanitize($body['nome']   ?? '');
    $tipo   = in_array($body['tipo'] ?? '', ['igreja','escola']) ? $body['tipo'] : 'igreja';
    $cidade = sanitize($body['cidade'] ?? '');

    if (mb_strlen($nome) < 3) {
        responder(false, null, 'Nome deve ter pelo menos 3 caracteres.', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare("INSERT INTO instituicoes (nome, tipo, cidade) VALUES (?, ?, ?)");
    $stmt->execute([$nome, $tipo, $cidade ?: null]);

    responder(true, [
        'id'     => (int) $db->lastInsertId(),
        'nome'   => $nome,
        'tipo'   => $tipo,
        'cidade' => $cidade,
    ], status: 201);
}

// ── PUT: Atualiza ────────────────────────────
if ($method === 'PUT') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $body    = body();
    $id      = (int)($body['id'] ?? 0);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);
    if ($scope !== null && $scope !== $id) {
        responder(false, null, 'Sem permissão para editar esta instituição.', 403);
    }

    $nome        = sanitize($body['nome']        ?? '');
    $tipo        = in_array($body['tipo'] ?? '', ['igreja','escola']) ? $body['tipo'] : 'igreja';
    $cidade      = sanitize($body['cidade']      ?? '');
    $responsavel = sanitize($body['responsavel'] ?? '');
    $telefone    = sanitize($body['telefone']    ?? '');
    $email       = sanitize($body['email']       ?? '');

    if (mb_strlen($nome) < 3) responder(false, null, 'Nome deve ter pelo menos 3 caracteres.', 422);

    $db = getDB();
    $db->prepare("
        UPDATE instituicoes
        SET nome = ?, tipo = ?, cidade = ?,
            responsavel = ?, telefone = ?, email = ?
        WHERE id = ?
    ")->execute([
        $nome, $tipo, $cidade ?: null,
        $responsavel ?: null, $telefone ?: null, $email ?: null,
        $id,
    ]);

    responder(true, ['atualizado' => $id]);
}

// ── DELETE: Remove ───────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $body = body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM instituicoes WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Instituição não encontrada.', 404);
    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
