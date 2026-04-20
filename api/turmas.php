<?php
// ================================================
// TURMAS — TRILHO KIDS API
// ================================================
// GET    /turmas.php              → lista com professores e total de alunos
// POST   /turmas.php              → cria (admin ou responsável)
// PUT    /turmas.php {id,...}     → atualiza nome/idades/inst (admin ou responsável)
// PATCH  /turmas.php {id,ativo}   → ativa/desativa (admin)
// DELETE /turmas.php {id}         → soft-delete (admin ou responsável)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Lista turmas ────────────────────────
if ($method === 'GET') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $db      = getDB();

    $where  = 't.ativo = 1';
    $params = [];

    if ($scope !== null) {
        $where   .= ' AND t.instituicao_id = ?';
        $params[] = $scope;
    } elseif (!$payload['is_admin']) {
        // Professor regular: só as turmas em que está vinculado
        $where   .= ' AND t.id IN (SELECT turma_id FROM turma_professores WHERE professor_id = ?)';
        $params[] = $payload['professor_id'];
    }

    $stmt = $db->prepare("
        SELECT t.id, t.nome, t.instituicao_id, t.idade_inicial, t.idade_final,
               t.ativo, t.criado_em, i.nome AS instituicao,
               COUNT(DISTINCT pf.id) AS total_alunos,
               (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', p2.id, 'nome', p2.nome, 'papel', tp2.papel))
                FROM turma_professores tp2
                JOIN professores p2 ON p2.id = tp2.professor_id
                WHERE tp2.turma_id = t.id) AS professores
        FROM turmas t
        JOIN instituicoes i ON i.id = t.instituicao_id
        LEFT JOIN perfis pf ON pf.turma_id = t.id
        WHERE $where
        GROUP BY t.id
        ORDER BY i.nome, t.nome
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id']           = (int) $r['id'];
        $r['total_alunos'] = (int) $r['total_alunos'];
        $r['ativo']        = (bool) $r['ativo'];
        $r['professores']  = $r['professores'] ? json_decode($r['professores'], true) : [];
        $r['idade_inicial']= $r['idade_inicial'] !== null ? (int)$r['idade_inicial'] : null;
        $r['idade_final']  = $r['idade_final']   !== null ? (int)$r['idade_final']   : null;
    }
    responder(true, $rows);
}

// ── POST: Cria turma ─────────────────────────
if ($method === 'POST') {
    $payload        = requireAdminOrResponsavel();
    $scope          = scopeInstituicao($payload);
    $body           = body();
    $nome           = sanitize($body['nome'] ?? '');
    $instituicao_id = $scope ?? (int)($body['instituicao_id'] ?? 0);
    $idadeI         = isset($body['idade_inicial']) && $body['idade_inicial'] !== '' ? (int)$body['idade_inicial'] : null;
    $idadeF         = isset($body['idade_final'])   && $body['idade_final']   !== '' ? (int)$body['idade_final']   : null;

    if (mb_strlen($nome) < 3) responder(false, null, 'Nome deve ter pelo menos 3 caracteres.', 422);
    if (!$instituicao_id)     responder(false, null, 'instituicao_id obrigatório.', 422);

    $db   = getDB();
    $stmt = $db->prepare("INSERT INTO turmas (nome, instituicao_id, idade_inicial, idade_final) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nome, $instituicao_id, $idadeI, $idadeF]);

    responder(true, ['id' => (int) $db->lastInsertId(), 'nome' => $nome], status: 201);
}

// ── PUT: Atualiza turma ──────────────────────
if ($method === 'PUT') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $body    = body();
    $id      = (int)($body['id'] ?? 0);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    if ($scope !== null) {
        $chk = getDB()->prepare("SELECT id FROM turmas WHERE id = ? AND instituicao_id = ?");
        $chk->execute([$id, $scope]);
        if (!$chk->fetch()) responder(false, null, 'Sem permissão para editar esta turma.', 403);
    }

    $nome           = sanitize($body['nome'] ?? '');
    $instituicao_id = $scope ?? (int)($body['instituicao_id'] ?? 0);
    $idadeI         = isset($body['idade_inicial']) && $body['idade_inicial'] !== '' ? (int)$body['idade_inicial'] : null;
    $idadeF         = isset($body['idade_final'])   && $body['idade_final']   !== '' ? (int)$body['idade_final']   : null;

    if (mb_strlen($nome) < 3) responder(false, null, 'Nome deve ter pelo menos 3 caracteres.', 422);
    if (!$instituicao_id)     responder(false, null, 'instituicao_id obrigatório.', 422);

    getDB()->prepare("
        UPDATE turmas SET nome = ?, instituicao_id = ?, idade_inicial = ?, idade_final = ?
        WHERE id = ?
    ")->execute([$nome, $instituicao_id, $idadeI, $idadeF, $id]);

    responder(true, ['atualizado' => $id]);
}

// ── PATCH: Ativa/desativa ───────��─────────────
if ($method === 'PATCH') {
    requireAdmin();
    $body = body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $sets = [];
    $vals = [];
    if (!empty($body['nome']))  { $sets[] = 'nome = ?';  $vals[] = sanitize($body['nome']); }
    if (isset($body['ativo']))  { $sets[] = 'ativo = ?'; $vals[] = $body['ativo'] ? 1 : 0; }
    if (empty($sets)) responder(false, null, 'Nenhum campo para atualizar.', 422);

    $vals[] = $id;
    getDB()->prepare("UPDATE turmas SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    responder(true, ['atualizado' => $id]);
}

// ── DELETE: Soft-delete ────────────────────────
if ($method === 'DELETE') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $body    = body();
    $id      = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    if ($scope !== null) {
        $chk = getDB()->prepare("SELECT id FROM turmas WHERE id = ? AND instituicao_id = ?");
        $chk->execute([$id, $scope]);
        if (!$chk->fetch()) responder(false, null, 'Sem permissão.', 403);
    }

    $stmt = getDB()->prepare("UPDATE turmas SET ativo = 0 WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) responder(false, null, 'Turma não encontrada.', 404);
    responder(true, ['desativado' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
