<?php
// ================================================
// LEADS — TRILHO KIDS API
// ================================================
// POST /leads.php          → cadastra lead (público)
// GET  /leads.php          → lista leads (admin JWT)
// PUT  /leads.php          → atualiza status (admin JWT)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── POST: Cadastrar lead ─────────────────────
if ($method === 'POST') {
    $body = body();

    $nome            = sanitize($body['nome']            ?? '');
    $email           = sanitize($body['email']           ?? '');
    $tipo            = sanitize($body['tipo']            ?? '');
    $mensagem        = sanitize($body['mensagem']        ?? '');
    $data_preferencial = sanitize($body['data_preferencial'] ?? '');

    if (!$nome)  responder(false, null, 'Nome é obrigatório.', 422);
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL))
        responder(false, null, 'E-mail inválido.', 422);
    if (!in_array($tipo, ['igreja', 'escola'], true))
        responder(false, null, 'Tipo deve ser "igreja" ou "escola".', 422);

    $data = $data_preferencial ?: null;
    if ($data && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) $data = null;

    $db = getDB();

    // Evita duplicata pelo mesmo e-mail
    $stmt = $db->prepare("SELECT id, status FROM leads WHERE email = ?");
    $stmt->execute([$email]);
    $existente = $stmt->fetch();
    if ($existente) {
        responder(true, ['id' => (int)$existente['id'], 'ja_cadastrado' => true],
            'E-mail já registrado.');
    }

    $stmt = $db->prepare("
        INSERT INTO leads (nome, email, tipo, mensagem, data_preferencial)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$nome, $email, $tipo, $mensagem ?: null, $data]);

    responder(true, ['id' => (int)$db->lastInsertId()]);
}

// ── GET: Listar leads (admin) ────────────────
if ($method === 'GET') {
    requireAdmin();

    $status = sanitize($_GET['status'] ?? '');
    $db = getDB();

    $where = $status ? "WHERE status = ?" : "";
    $params = $status ? [$status] : [];

    $stmt = $db->prepare("
        SELECT id, nome, email, tipo, mensagem, data_preferencial, status, criado_em
        FROM leads
        $where
        ORDER BY criado_em DESC
    ");
    $stmt->execute($params);
    $leads = $stmt->fetchAll();

    foreach ($leads as &$l) $l['id'] = (int)$l['id'];

    responder(true, ['leads' => $leads, 'total' => count($leads)]);
}

// ── PUT: Atualizar status ────────────────────
if ($method === 'PUT') {
    requireAdmin();

    $body   = body();
    $id     = (int)($body['id']     ?? 0);
    $status = sanitize($body['status'] ?? '');

    if (!$id) responder(false, null, 'ID obrigatório.', 422);
    if (!in_array($status, ['novo','contatado','convertido','descartado'], true))
        responder(false, null, 'Status inválido.', 422);

    $db = getDB();
    $db->prepare("UPDATE leads SET status = ? WHERE id = ?")->execute([$status, $id]);

    responder(true, ['atualizado' => true]);
}

responder(false, null, 'Método não permitido.', 405);
