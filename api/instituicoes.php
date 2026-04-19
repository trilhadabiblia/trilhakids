<?php
// ============================================
// INSTITUIÇÕES — TRILHO KIDS API
// ============================================
// GET    → lista (admin: todas; responsavel: só a sua)
// POST   → cria (admin only)
// PUT    → atualiza (admin: qualquer; responsavel: só a sua)
// DELETE → remove (admin only)

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$prof   = autenticar();

// ── GET ──────────────────────────────────────
if ($method === 'GET') {
    $scope = scopeInstituicao($prof);

    if ($scope !== null) {
        // Responsável: retorna apenas a própria instituição
        $stmt = $db->prepare("
            SELECT i.*,
                   COUNT(DISTINCT t.id) AS total_turmas
            FROM instituicoes i
            LEFT JOIN turmas t ON t.instituicao_id = i.id AND t.ativo = 1
            WHERE i.id = ?
            GROUP BY i.id
        ");
        $stmt->execute([$scope]);
    } else {
        $stmt = $db->query("
            SELECT i.*,
                   COUNT(DISTINCT t.id) AS total_turmas
            FROM instituicoes i
            LEFT JOIN turmas t ON t.instituicao_id = i.id AND t.ativo = 1
            GROUP BY i.id
            ORDER BY i.nome
        ");
    }

    responder(true, $stmt->fetchAll());
}

// ── POST: cria ────────────────────────────────
if ($method === 'POST') {
    exigirAdmin($prof);

    $b      = body();
    $nome   = sanitize($b['nome']   ?? '');
    $tipo   = in_array($b['tipo'] ?? '', ['igreja','escola']) ? $b['tipo'] : 'igreja';
    $cidade = sanitize($b['cidade'] ?? '');

    if (!$nome) responder(false, null, 'Nome obrigatório.', 422);

    $stmt = $db->prepare("
        INSERT INTO instituicoes (nome, tipo, cidade) VALUES (?, ?, ?)
    ");
    $stmt->execute([$nome, $tipo, $cidade ?: null]);
    $id = $db->lastInsertId();

    responder(true, ['id' => (int)$id, 'nome' => $nome, 'tipo' => $tipo, 'cidade' => $cidade], status: 201);
}

// ── PUT: atualiza ─────────────────────────────
if ($method === 'PUT') {
    $b    = body();
    $id   = (int)($b['id'] ?? 0);
    $scope = scopeInstituicao($prof);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);
    // Responsável só pode editar a própria instituição
    if ($scope !== null && $scope !== $id) {
        responder(false, null, 'Sem permissão para editar esta instituição.', 403);
    }

    $nome       = sanitize($b['nome']        ?? '');
    $tipo       = in_array($b['tipo'] ?? '', ['igreja','escola']) ? $b['tipo'] : 'igreja';
    $cidade     = sanitize($b['cidade']      ?? '');
    $responsavel= sanitize($b['responsavel'] ?? '');
    $telefone   = sanitize($b['telefone']    ?? '');
    $email      = sanitize($b['email']       ?? '');

    if (!$nome) responder(false, null, 'Nome obrigatório.', 422);

    $stmt = $db->prepare("
        UPDATE instituicoes
        SET nome = ?, tipo = ?, cidade = ?,
            responsavel = ?, telefone = ?, email = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $nome, $tipo, $cidade ?: null,
        $responsavel ?: null, $telefone ?: null, $email ?: null,
        $id,
    ]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Instituição não encontrada.', 404);

    responder(true, ['id' => $id, 'nome' => $nome]);
}

// ── DELETE: remove ────────────────────────────
if ($method === 'DELETE') {
    exigirAdmin($prof);

    $id = (int)(body()['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $stmt = $db->prepare("DELETE FROM instituicoes WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Instituição não encontrada.', 404);

    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
