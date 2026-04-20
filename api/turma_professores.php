<?php
// ================================================
// TURMA_PROFESSORES — TRILHO KIDS API
// ================================================
// GET    /turma_professores.php?turma_id=X  → lista professores da turma (auth)
// POST   /turma_professores.php { turma_id, professor_id, papel }  → vincula (admin)
// DELETE /turma_professores.php { turma_id, professor_id }         → desvincula (admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: lista professores da turma ──────────
if ($method === 'GET') {
    requireAuth();
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    if (!$turma_id) responder(false, null, 'turma_id obrigatório.', 422);

    $stmt = getDB()->prepare("
        SELECT p.id, p.nome, p.email, tp.papel, tp.criado_em
        FROM turma_professores tp
        JOIN professores p ON p.id = tp.professor_id
        WHERE tp.turma_id = ?
        ORDER BY tp.papel ASC, p.nome ASC
    ");
    $stmt->execute([$turma_id]);
    responder(true, $stmt->fetchAll());
}

// ── POST: vincula professor à turma ──────────
if ($method === 'POST') {
    requireAdmin();
    $body        = body();
    $turma_id    = (int)($body['turma_id']    ?? 0);
    $professor_id = (int)($body['professor_id'] ?? 0);
    $papel       = sanitize($body['papel'] ?? 'titular');

    if (!$turma_id)     responder(false, null, 'turma_id obrigatório.', 422);
    if (!$professor_id) responder(false, null, 'professor_id obrigatório.', 422);
    if (!in_array($papel, ['titular', 'auxiliar'])) $papel = 'titular';

    $stmt = getDB()->prepare("
        INSERT INTO turma_professores (turma_id, professor_id, papel) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE papel = VALUES(papel)
    ");
    $stmt->execute([$turma_id, $professor_id, $papel]);
    responder(true, ['vinculado' => true], status: 201);
}

// ── DELETE: desvincula professor da turma ─────
if ($method === 'DELETE') {
    requireAdmin();
    $body        = body();
    $turma_id    = (int)($body['turma_id']    ?? 0);
    $professor_id = (int)($body['professor_id'] ?? 0);

    if (!$turma_id || !$professor_id)
        responder(false, null, 'turma_id e professor_id obrigatórios.', 422);

    $stmt = getDB()->prepare("
        DELETE FROM turma_professores WHERE turma_id = ? AND professor_id = ?
    ");
    $stmt->execute([$turma_id, $professor_id]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Vínculo não encontrado.', 404);
    responder(true, ['desvinculado' => true]);
}

responder(false, null, 'Método não permitido.', 405);
