<?php
// ============================================
// PROFESSORES — TRILHO KIDS API
// ============================================
// GET   → lista
// POST  → cria
// PATCH → ativa/desativa
// DELETE→ remove

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$prof   = autenticar();

// ── GET ──────────────────────────────────────
if ($method === 'GET') {
    $scope = scopeInstituicao($prof);

    $where = $scope !== null ? 'WHERE p.instituicao_id = ?' : '';
    $stmt  = $db->prepare("
        SELECT p.id, p.nome, p.email, p.is_admin, p.is_responsavel, p.ativo,
               p.instituicao_id,
               i.nome AS instituicao,
               COUNT(DISTINCT tp.turma_id) AS total_turmas
        FROM professores p
        LEFT JOIN instituicoes i  ON i.id = p.instituicao_id
        LEFT JOIN turma_professores tp ON tp.professor_id = p.id
        $where
        GROUP BY p.id
        ORDER BY p.nome
    ");
    $scope !== null ? $stmt->execute([$scope]) : $stmt->execute();

    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['is_admin']       = (bool)$r['is_admin'];
        $r['is_responsavel'] = (bool)$r['is_responsavel'];
        $r['ativo']          = (bool)$r['ativo'];
        $r['total_turmas']   = (int)$r['total_turmas'];
    }
    responder(true, $rows);
}

// ── POST: cria ────────────────────────────────
if ($method === 'POST') {
    $scope = scopeInstituicao($prof);
    $b     = body();

    $nome           = sanitize($b['nome']  ?? '');
    $email          = sanitize($b['email'] ?? '');
    $senha          = $b['senha'] ?? '';
    $inst_id        = $b['instituicao_id'] ? (int)$b['instituicao_id'] : null;
    $is_admin       = !empty($b['is_admin'])       && ($scope === null);
    $is_responsavel = !empty($b['is_responsavel']);

    if (!$nome)              responder(false, null, 'Nome obrigatório.', 422);
    if (!$email)             responder(false, null, 'E-mail obrigatório.', 422);
    if (strlen($senha) < 6) responder(false, null, 'Senha deve ter ao menos 6 caracteres.', 422);
    if ($is_responsavel && !$inst_id) {
        responder(false, null, 'Responsável deve ter uma instituição vinculada.', 422);
    }
    // Responsável só pode criar professores na própria instituição
    if ($scope !== null) $inst_id = $scope;

    $hash = password_hash($senha, PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare("
            INSERT INTO professores (nome, email, senha_hash, instituicao_id, is_admin, is_responsavel)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$nome, $email, $hash, $inst_id, (int)$is_admin, (int)$is_responsavel]);
        responder(true, ['id' => (int)$db->lastInsertId(), 'nome' => $nome], status: 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') responder(false, null, 'E-mail já cadastrado.', 409);
        throw $e;
    }
}

// ── PATCH: ativa / desativa ───────────────────
if ($method === 'PATCH') {
    $b    = body();
    $id   = (int)($b['id']   ?? 0);
    $ativo= isset($b['ativo']) ? (int)(bool)$b['ativo'] : null;

    if (!$id || $ativo === null) responder(false, null, 'id e ativo obrigatórios.', 422);

    $scope = scopeInstituicao($prof);
    if ($scope !== null) {
        // Responsável só pode alterar professores da própria instituição
        $check = $db->prepare("SELECT id FROM professores WHERE id = ? AND instituicao_id = ?");
        $check->execute([$id, $scope]);
        if (!$check->fetch()) responder(false, null, 'Sem permissão.', 403);
    }

    $db->prepare("UPDATE professores SET ativo = ? WHERE id = ?")->execute([$ativo, $id]);
    responder(true, ['id' => $id, 'ativo' => (bool)$ativo]);
}

// ── DELETE ────────────────────────────────────
if ($method === 'DELETE') {
    exigirAdmin($prof);

    $id = (int)(body()['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $db->prepare("DELETE FROM professores WHERE id = ?")->execute([$id]);
    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
