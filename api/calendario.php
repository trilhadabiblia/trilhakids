<?php
// ============================================
// CALENDÁRIO DAS TURMAS — TRILHO KIDS API
// ============================================
// GET    ?turma_id=X&mes=YYYY-MM → escalas do mês
// POST   {turma_id, professor_id, data, hora_inicio, hora_fim, observacao}
// DELETE {id}

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
autenticar();

if ($method === 'GET') {
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    $mes      = preg_match('/^\d{4}-\d{2}$/', $_GET['mes'] ?? '') ? $_GET['mes'] : date('Y-m');

    if (!$turma_id) responder(false, null, 'turma_id obrigatório.', 422);

    $stmt = $db->prepare("
        SELECT c.id, c.data, c.hora_inicio, c.hora_fim, c.observacao,
               pr.id AS professor_id, pr.nome AS professor_nome,
               tp.papel
        FROM calendario_turmas c
        JOIN professores pr ON pr.id = c.professor_id
        LEFT JOIN turma_professores tp ON tp.turma_id = c.turma_id AND tp.professor_id = c.professor_id
        WHERE c.turma_id = ? AND DATE_FORMAT(c.data, '%Y-%m') = ?
        ORDER BY c.data, c.hora_inicio
    ");
    $stmt->execute([$turma_id, $mes]);
    responder(true, $stmt->fetchAll());
}

if ($method === 'POST') {
    $b            = body();
    $turma_id     = (int)($b['turma_id']     ?? 0);
    $professor_id = (int)($b['professor_id'] ?? 0);
    $data         = $b['data']        ?? '';
    $hora_inicio  = $b['hora_inicio'] ?? null;
    $hora_fim     = $b['hora_fim']    ?? null;
    $observacao   = sanitize($b['observacao'] ?? '');

    if (!$turma_id)     responder(false, null, 'turma_id obrigatório.', 422);
    if (!$professor_id) responder(false, null, 'professor_id obrigatório.', 422);
    if (!$data)         responder(false, null, 'Data obrigatória.', 422);

    $stmt = $db->prepare("
        INSERT INTO calendario_turmas (turma_id, professor_id, data, hora_inicio, hora_fim, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $turma_id, $professor_id, $data,
        $hora_inicio ?: null, $hora_fim ?: null, $observacao ?: null,
    ]);
    responder(true, ['id' => (int)$db->lastInsertId()], status: 201);
}

if ($method === 'DELETE') {
    $id = (int)(body()['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $db->prepare("DELETE FROM calendario_turmas WHERE id = ?")->execute([$id]);
    responder(true, ['removido' => $id]);
}

responder(false, null, 'Método não permitido.', 405);
