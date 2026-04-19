<?php
// ============================================
// LEADS — TRILHO KIDS API (admin only)
// ============================================
// GET  ?status=X → lista leads (filtro opcional)
// POST {nome, email, tipo, data_preferencial, mensagem} → cria lead (público)
// PUT  {id, status} → atualiza status (admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// POST é público (formulário do site)
if ($method === 'POST') {
    $b    = body();
    $nome = sanitize($b['nome']  ?? '');
    $email= sanitize($b['email'] ?? '');
    $tipo = in_array($b['tipo'] ?? '', ['igreja','escola']) ? $b['tipo'] : 'igreja';
    $data = $b['data_preferencial'] ?? null;
    $msg  = sanitize($b['mensagem'] ?? '');

    if (!$nome || !$email) responder(false, null, 'Nome e e-mail obrigatórios.', 422);

    $db->prepare("
        INSERT INTO leads (nome, email, tipo, data_preferencial, mensagem)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([$nome, $email, $tipo, $data ?: null, $msg ?: null]);

    responder(true, ['ok' => true], status: 201);
}

// Demais métodos exigem autenticação admin
$prof = autenticar();
exigirAdmin($prof);

if ($method === 'GET') {
    $status = $_GET['status'] ?? '';
    $validos = ['novo','contatado','convertido','descartado'];

    if ($status && in_array($status, $validos)) {
        $stmt = $db->prepare("
            SELECT *, COUNT(*) OVER() AS total
            FROM leads WHERE status = ? ORDER BY criado_em DESC
        ");
        $stmt->execute([$status]);
    } else {
        $stmt = $db->query("SELECT * FROM leads ORDER BY criado_em DESC");
    }

    $leads = $stmt->fetchAll();
    $total = count($leads);

    responder(true, ['leads' => $leads, 'total' => $total]);
}

if ($method === 'PUT') {
    $b      = body();
    $id     = (int)($b['id']     ?? 0);
    $status = $b['status'] ?? '';
    $validos= ['novo','contatado','convertido','descartado'];

    if (!$id || !in_array($status, $validos)) responder(false, null, 'id e status válido obrigatórios.', 422);

    $db->prepare("UPDATE leads SET status = ? WHERE id = ?")->execute([$status, $id]);
    responder(true, ['id' => $id, 'status' => $status]);
}

responder(false, null, 'Método não permitido.', 405);
