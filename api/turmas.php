<?php
// ============================================
// TURMAS — TRILHO KIDS API
// ============================================
// GET    → lista com professores e total de alunos
// POST   → cria
// PUT    → atualiza (nome, inst, idades)
// DELETE → desativa

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$prof   = autenticar();

// ── GET ──────────────────────────────────────
if ($method === 'GET') {
    $scope = scopeInstituicao($prof);
    $where = $scope !== null ? 'WHERE t.instituicao_id = ? AND t.ativo = 1' : 'WHERE t.ativo = 1';

    $stmt = $db->prepare("
        SELECT t.id, t.nome, t.instituicao_id, t.idade_inicial, t.idade_final,
               i.nome AS instituicao,
               COUNT(DISTINCT p.id) AS total_alunos
        FROM turmas t
        JOIN instituicoes i ON i.id = t.instituicao_id
        LEFT JOIN perfis p ON p.turma_id = t.id
        $where
        GROUP BY t.id
        ORDER BY i.nome, t.nome
    ");
    $scope !== null ? $stmt->execute([$scope]) : $stmt->execute();
    $turmas = $stmt->fetchAll();

    // Carrega professores de cada turma
    $ids = array_column($turmas, 'id');
    $profsMap = [];
    if ($ids) {
        $in   = implode(',', array_fill(0, count($ids), '?'));
        $stmtP = $db->prepare("
            SELECT tp.turma_id, pr.id, pr.nome, tp.papel
            FROM turma_professores tp
            JOIN professores pr ON pr.id = tp.professor_id
            WHERE tp.turma_id IN ($in)
            ORDER BY pr.nome
        ");
        $stmtP->execute($ids);
        foreach ($stmtP->fetchAll() as $row) {
            $profsMap[$row['turma_id']][] = [
                'id'    => (int)$row['id'],
                'nome'  => $row['nome'],
                'papel' => $row['papel'],
            ];
        }
    }

    foreach ($turmas as &$t) {
        $t['id']          = (int)$t['id'];
        $t['total_alunos']= (int)$t['total_alunos'];
        $t['professores'] = $profsMap[$t['id']] ?? [];
        $t['idade_inicial']= $t['idade_inicial'] !== null ? (int)$t['idade_inicial'] : null;
        $t['idade_final']  = $t['idade_final']   !== null ? (int)$t['idade_final']   : null;
    }
    responder(true, $turmas);
}

// ── POST: cria ────────────────────────────────
if ($method === 'POST') {
    $b      = body();
    $scope  = scopeInstituicao($prof);
    $nome   = sanitize($b['nome'] ?? '');
    $inst_id= $scope ?? (int)($b['instituicao_id'] ?? 0);
    $idadeI = isset($b['idade_inicial']) && $b['idade_inicial'] !== '' ? (int)$b['idade_inicial'] : null;
    $idadeF = isset($b['idade_final'])   && $b['idade_final']   !== '' ? (int)$b['idade_final']   : null;

    if (!$nome)    responder(false, null, 'Nome obrigatório.', 422);
    if (!$inst_id) responder(false, null, 'Instituição obrigatória.', 422);

    $stmt = $db->prepare("
        INSERT INTO turmas (nome, instituicao_id, idade_inicial, idade_final)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$nome, $inst_id, $idadeI, $idadeF]);
    responder(true, ['id' => (int)$db->lastInsertId(), 'nome' => $nome], status: 201);
}

// ── PUT: atualiza ─────────────────────────────
if ($method === 'PUT') {
    $b    = body();
    $id   = (int)($b['id'] ?? 0);
    $scope= scopeInstituicao($prof);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    // Responsável só pode editar turmas da própria instituição
    if ($scope !== null) {
        $chk = $db->prepare("SELECT id FROM turmas WHERE id = ? AND instituicao_id = ?");
        $chk->execute([$id, $scope]);
        if (!$chk->fetch()) responder(false, null, 'Sem permissão.', 403);
    }

    $nome   = sanitize($b['nome'] ?? '');
    $inst_id= $scope ?? (int)($b['instituicao_id'] ?? 0);
    $idadeI = isset($b['idade_inicial']) && $b['idade_inicial'] !== '' ? (int)$b['idade_inicial'] : null;
    $idadeF = isset($b['idade_final'])   && $b['idade_final']   !== '' ? (int)$b['idade_final']   : null;

    if (!$nome)    responder(false, null, 'Nome obrigatório.', 422);
    if (!$inst_id) responder(false, null, 'Instituição obrigatória.', 422);

    $stmt = $db->prepare("
        UPDATE turmas
        SET nome = ?, instituicao_id = ?, idade_inicial = ?, idade_final = ?
        WHERE id = ?
    ");
    $stmt->execute([$nome, $inst_id, $idadeI, $idadeF, $id]);

    responder(true, ['id' => $id, 'nome' => $nome]);
}

// ── DELETE: desativa ──────────────────────────
if ($method === 'DELETE') {
    $id    = (int)(body()['id'] ?? 0);
    $scope = scopeInstituicao($prof);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    if ($scope !== null) {
        $chk = $db->prepare("SELECT id FROM turmas WHERE id = ? AND instituicao_id = ?");
        $chk->execute([$id, $scope]);
        if (!$chk->fetch()) responder(false, null, 'Sem permissão.', 403);
    }

    $db->prepare("UPDATE turmas SET ativo = 0 WHERE id = ?")->execute([$id]);
    responder(true, ['desativado' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
