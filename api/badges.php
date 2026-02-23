<?php
// ============================================
// BADGES — TRILHO KIDS API
// ============================================
// GET /badges.php?nome=João   → badges conquistadas

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$nome = sanitize($_GET['nome'] ?? '');
if (!$nome) responder(false, null, 'Parâmetro "nome" obrigatório.', 422);

$db   = getDB();
$stmt = $db->prepare("SELECT id FROM perfis WHERE nome = ?");
$stmt->execute([$nome]);
$perfil = $stmt->fetch();

if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);

$stmt = $db->prepare("SELECT badges FROM progresso WHERE perfil_id = ?");
$stmt->execute([$perfil['id']]);
$row = $stmt->fetch();

$badges = json_decode($row['badges'] ?? '[]', true) ?: [];

responder(true, [
    'aluno'  => $nome,
    'total'  => count($badges),
    'badges' => $badges,
]);
