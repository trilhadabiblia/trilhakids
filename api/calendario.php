<?php
// ================================================
// CALENDÁRIO DE TURMAS — TRILHO KIDS API
// ================================================
// GET    /calendario.php?turma_id=X&mes=YYYY-MM  → escala do mês (auth)
// GET    /calendario.php?turma_id=X&hoje=1       → escala de hoje (auth)
// POST   /calendario.php { turma_id, professor_id, data, hora_inicio?, hora_fim?, observacao? } (admin)
// DELETE /calendario.php { id } (admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: escala do mês ou de hoje ────────────
if ($method === 'GET') {
    requireAuth();
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    if (!$turma_id) responder(false, null, 'turma_id obrigatório.', 422);

    $db = getDB();

    // Modo livros: retorna todos os livros agendados da turma sem filtro de mês
    if (!empty($_GET['apenas_livros'])) {
        $stmt = $db->prepare("
            SELECT ct.id, ct.data, ct.livro_ordem,
                   p.id AS professor_id, p.nome AS professor_nome
            FROM calendario_turmas ct
            LEFT JOIN professores p ON p.id = ct.professor_id
            WHERE ct.turma_id = ? AND ct.livro_ordem IS NOT NULL
            ORDER BY ct.data ASC, ct.id ASC
        ");
        $stmt->execute([$turma_id]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['livro_ordem']   = (int)$r['livro_ordem'];
            $r['professor_id']  = $r['professor_id'] !== null ? (int)$r['professor_id'] : null;
        }
        responder(true, $rows);
    }

    $params = [$turma_id];
    $where  = 'ct.turma_id = ?';

    if (!empty($_GET['hoje'])) {
        $where .= ' AND ct.data = CURDATE()';
    } elseif (!empty($_GET['mes'])) {
        $mes = sanitize($_GET['mes']);
        if (!preg_match('/^\d{4}-\d{2}$/', $mes))
            responder(false, null, 'Formato de mês inválido. Use YYYY-MM.', 422);
        $where   .= ' AND DATE_FORMAT(ct.data, "%Y-%m") = ?';
        $params[] = $mes;
    }

    $stmt = $db->prepare("
        SELECT ct.id, ct.data, ct.hora_inicio, ct.hora_fim, ct.observacao,
               ct.livro_ordem,
               p.id   AS professor_id,
               p.nome AS professor_nome,
               tp.papel
        FROM calendario_turmas ct
        JOIN professores p ON p.id = ct.professor_id
        LEFT JOIN turma_professores tp
               ON tp.turma_id = ct.turma_id AND tp.professor_id = ct.professor_id
        WHERE {$where}
        ORDER BY ct.data ASC, ct.hora_inicio ASC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['livro_ordem'] = $r['livro_ordem'] !== null ? (int)$r['livro_ordem'] : null;
    }
    responder(true, $rows);
}

// ── POST: cria entrada no calendário ─────────
if ($method === 'POST') {
    requireAdminOrResponsavel();
    $body         = body();
    $turma_id     = (int)($body['turma_id']    ?? 0);
    $professor_id = (int)($body['professor_id'] ?? 0);
    $data         = sanitize($body['data']        ?? '');
    $hora_inicio  = sanitize($body['hora_inicio'] ?? '') ?: null;
    $hora_fim     = sanitize($body['hora_fim']    ?? '') ?: null;
    $observacao   = sanitize($body['observacao']  ?? '') ?: null;
    $livro_ordem  = isset($body['livro_ordem']) && $body['livro_ordem'] !== ''
                    ? (int)$body['livro_ordem'] : null;

    if (!$turma_id)     responder(false, null, 'turma_id obrigatório.', 422);
    if (!$professor_id) responder(false, null, 'professor_id obrigatório.', 422);
    if (!$data || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data))
        responder(false, null, 'Data inválida. Use YYYY-MM-DD.', 422);
    if ($livro_ordem !== null && ($livro_ordem < 1 || $livro_ordem > 66))
        responder(false, null, 'livro_ordem deve ser entre 1 e 66.', 422);

    $db   = getDB();
    $stmt = $db->prepare("
        INSERT INTO calendario_turmas (turma_id, professor_id, data, hora_inicio, hora_fim, observacao, livro_ordem)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$turma_id, $professor_id, $data, $hora_inicio, $hora_fim, $observacao, $livro_ordem]);
    responder(true, ['id' => (int) $db->lastInsertId()], status: 201);
}

// ── PATCH: atualiza data e/ou professor de uma entrada ───────────────────
if ($method === 'PATCH') {
    requireAdminOrResponsavel();
    $body         = body();
    $id           = (int)($body['id'] ?? 0);
    $data         = isset($body['data'])         ? sanitize($body['data'])    : null;
    $professor_id = isset($body['professor_id']) ? (int)$body['professor_id'] : null;

    if (!$id) responder(false, null, 'ID obrigatório.', 422);
    if ($data === null && $professor_id === null)
        responder(false, null, 'Informe data ou professor_id.', 422);
    if ($data !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data))
        responder(false, null, 'Data inválida. Use YYYY-MM-DD.', 422);

    $sets = [];
    $vals = [];
    if ($data !== null)         { $sets[] = 'data = ?';         $vals[] = $data; }
    if ($professor_id !== null) { $sets[] = 'professor_id = ?'; $vals[] = $professor_id; }
    $vals[] = $id;

    getDB()->prepare("UPDATE calendario_turmas SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    responder(true, ['id' => $id]);
}

// ── DELETE: remove entrada ────────────────────
if ($method === 'DELETE') {
    requireAdminOrResponsavel();
    $body = body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $stmt = getDB()->prepare("DELETE FROM calendario_turmas WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Entrada não encontrada.', 404);
    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
