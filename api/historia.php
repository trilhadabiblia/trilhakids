<?php
// ================================================
// HISTÓRICO DE EVENTOS — TRILHO KIDS API
// ================================================
// GET /historia.php?nome=João
// GET /historia.php?nome=João&limit=20   (máx. 100)

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$nome  = sanitize($_GET['nome']  ?? '');
$limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));

if (!$nome) responder(false, null, 'Parâmetro "nome" obrigatório.', 422);

$db   = getDB();
$stmt = $db->prepare("SELECT id FROM perfis WHERE nome = ?");
$stmt->execute([$nome]);
$perfil = $stmt->fetch();

if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);

$stmt = $db->prepare("
    SELECT tipo, quantidade, motivo, detalhes, lancado_por, criado_em
    FROM historia
    WHERE perfil_id = ?
    ORDER BY criado_em DESC
    LIMIT ?
");
$stmt->execute([$perfil['id'], $limit]);
$eventos = $stmt->fetchAll();

foreach ($eventos as &$ev) {
    $ev['quantidade'] = (int) $ev['quantidade'];
    $ev['detalhes']   = $ev['detalhes'] ? json_decode($ev['detalhes']) : null;
}

responder(true, [
    'aluno'   => $nome,
    'total'   => count($eventos),
    'eventos' => $eventos,
]);
