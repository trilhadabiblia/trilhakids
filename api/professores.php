<?php
// ================================================
// PROFESSORES — TRILHO KIDS API
// ================================================
// GET    /professores.php           → lista (admin)
// POST   /professores.php           → cria (admin)
// PATCH  /professores.php {id,...}  → atualiza (admin)
// DELETE /professores.php {id}      → remove (admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Lista professores ───────────────────
if ($method === 'GET') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $db      = getDB();

    $where  = $scope !== null ? 'WHERE p.instituicao_id = ?' : '';
    $stmt   = $db->prepare("
        SELECT p.id, p.nome, p.email, p.is_admin, p.is_responsavel, p.ativo,
               p.instituicao_id, i.nome AS instituicao, p.criado_em,
               (SELECT COUNT(DISTINCT tp.turma_id)
                FROM turma_professores tp
                JOIN turmas t ON t.id = tp.turma_id AND t.ativo = 1
                WHERE tp.professor_id = p.id) AS total_turmas
        FROM professores p
        LEFT JOIN instituicoes i ON i.id = p.instituicao_id
        $where
        ORDER BY p.nome
    ");
    $scope !== null ? $stmt->execute([$scope]) : $stmt->execute();

    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['is_admin']       = (bool) $r['is_admin'];
        $r['is_responsavel'] = (bool) ($r['is_responsavel'] ?? false);
        $r['ativo']          = (bool) $r['ativo'];
        $r['total_turmas']   = (int)  $r['total_turmas'];
    }
    responder(true, $rows);
}

// ── POST: Cria professor ─────────────────────
if ($method === 'POST') {
    $payload        = requireAdminOrResponsavel();
    $scope          = scopeInstituicao($payload);
    $body           = body();
    $nome           = sanitize($body['nome']  ?? '');
    $email          = sanitize($body['email'] ?? '');
    $senha          = $body['senha']           ?? '';
    $instituicao_id = $scope ?? ((int)($body['instituicao_id'] ?? 0) ?: null);
    $is_admin       = (!empty($body['is_admin']) && $scope === null) ? 1 : 0;
    $is_responsavel = !empty($body['is_responsavel']) ? 1 : 0;

    if (mb_strlen($nome) < 2)  responder(false, null, 'Nome muito curto.',       422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, null, 'E-mail inválido.', 422);
    if (mb_strlen($senha) < 6) responder(false, null, 'Senha mínima: 6 caracteres.', 422);
    if ($is_responsavel && !$instituicao_id) {
        responder(false, null, 'Responsável deve ter uma instituição vinculada.', 422);
    }

    $hash = password_hash($senha, PASSWORD_BCRYPT);

    try {
        $db   = getDB();
        $stmt = $db->prepare("
            INSERT INTO professores (nome, email, senha_hash, instituicao_id, is_admin, is_responsavel)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$nome, $email, $hash, $instituicao_id, $is_admin, $is_responsavel]);

        responder(true, [
            'id'    => (int) $db->lastInsertId(),
            'nome'  => $nome,
            'email' => $email,
        ], status: 201);

    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            responder(false, null, "Já existe um professor com o e-mail \"$email\".", 409);
        }
        throw $e;
    }
}

// ── PATCH: Atualiza professor ────────────────
if ($method === 'PATCH') {
    $payload = requireAdminOrResponsavel();
    $scope   = scopeInstituicao($payload);
    $body    = body();
    $id      = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    // Responsável só pode alterar professores da própria instituição
    if ($scope !== null) {
        $chk = getDB()->prepare("SELECT id FROM professores WHERE id = ? AND instituicao_id = ?");
        $chk->execute([$id, $scope]);
        if (!$chk->fetch()) responder(false, null, 'Sem permissão para editar este professor.', 403);
    }

    $sets = [];
    $vals = [];

    if (!empty($body['nome'])) {
        $sets[] = 'nome = ?';
        $vals[] = sanitize($body['nome']);
    }
    if (!empty($body['email'])) {
        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            responder(false, null, 'E-mail inválido.', 422);
        }
        $sets[] = 'email = ?';
        $vals[] = sanitize($body['email']);
    }
    if (!empty($body['senha'])) {
        if (mb_strlen($body['senha']) < 6) responder(false, null, 'Senha mínima: 6 caracteres.', 422);
        $sets[] = 'senha_hash = ?';
        $vals[] = password_hash($body['senha'], PASSWORD_BCRYPT);
    }
    if (isset($body['instituicao_id']) && $scope === null) {
        // Só admin pode mudar a instituição
        $sets[] = 'instituicao_id = ?';
        $vals[] = (int)$body['instituicao_id'] ?: null;
    }
    if (isset($body['is_admin']) && $scope === null) {
        // Só admin pode promover outro admin
        $sets[] = 'is_admin = ?';
        $vals[] = $body['is_admin'] ? 1 : 0;
    }
    if (isset($body['is_responsavel'])) {
        $sets[] = 'is_responsavel = ?';
        $vals[] = $body['is_responsavel'] ? 1 : 0;
    }
    if (isset($body['ativo'])) {
        $sets[] = 'ativo = ?';
        $vals[] = $body['ativo'] ? 1 : 0;
    }

    if (empty($sets)) responder(false, null, 'Nenhum campo para atualizar.', 422);

    $vals[] = $id;
    getDB()->prepare("UPDATE professores SET " . implode(', ', $sets) . " WHERE id = ?")
           ->execute($vals);

    responder(true, ['atualizado' => $id]);
}

// ── DELETE: Remove professor ─────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $body = body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM professores WHERE id = ? AND is_admin = 0");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        responder(false, null, 'Professor não encontrado ou não pode ser removido.', 404);
    }
    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
