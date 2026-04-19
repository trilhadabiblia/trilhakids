<?php
// ============================================
// TURMA × PROFESSORES — TRILHO KIDS API
// ============================================
// GET    ?turma_id=X → professores vinculados
// POST   {turma_id, professor_id, papel} → vincula
// DELETE {turma_id, professor_id}        → desvincula

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
autenticar();  // apenas verifica autenticação; qualquer perfil pode consultar

if ($method === 'GET') {
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    if (!$turma_id) responder(false, null, 'turma_id obrigatório.', 422);

    $stmt = $db->prepare("
        SELECT pr.id, pr.nome, tp.papel
        FROM turma_professores tp
        JOIN professores pr ON pr.id = tp.professor_id
        WHERE tp.turma_id = ?
        ORDER BY pr.nome
    ");
    $stmt->execute([$turma_id]);
    responder(true, $stmt->fetchAll());
}

if ($method === 'POST') {
    $b            = body();
    $turma_id     = (int)($b['turma_id']     ?? 0);
    $professor_id = (int)($b['professor_id'] ?? 0);
    $papel        = in_array($b['papel'] ?? '', ['titular','auxiliar']) ? $b['papel'] : 'titular';

    if (!$turma_id || !$professor_id) responder(false, null, 'turma_id e professor_id obrigatórios.', 422);

    try {
        $db->prepare("
            INSERT INTO turma_professores (turma_id, professor_id, papel) VALUES (?, ?, ?)
        ")->execute([$turma_id, $professor_id, $papel]);
        responder(true, ['turma_id' => $turma_id, 'professor_id' => $professor_id, 'papel' => $papel], status: 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') responder(false, null, 'Professor já vinculado a esta turma.', 409);
        throw $e;
    }
}

if ($method === 'DELETE') {
    $b            = body();
    $turma_id     = (int)($b['turma_id']     ?? 0);
    $professor_id = (int)($b['professor_id'] ?? 0);

    if (!$turma_id || !$professor_id) responder(false, null, 'turma_id e professor_id obrigatórios.', 422);

    $db->prepare("
        DELETE FROM turma_professores WHERE turma_id = ? AND professor_id = ?
    ")->execute([$turma_id, $professor_id]);

    responder(true, ['desvinculado' => true]);
}

responder(false, null, 'Método não permitido.', 405);
