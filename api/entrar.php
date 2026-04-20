<?php
// ================================================
// QR CODE LOGIN — TRILHO KIDS API
// ================================================
// GET /entrar.php?token=xxx
// → Retorna dados do aluno para auto-login no frontend

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$token = sanitize($_GET['token'] ?? '');
if (!$token) responder(false, null, 'Token obrigatório.', 422);

$db   = getDB();
$stmt = $db->prepare("
    SELECT p.nome, p.token_qr, t.nome AS turma, i.nome AS instituicao
    FROM perfis p
    LEFT JOIN turmas t    ON t.id = p.turma_id
    LEFT JOIN instituicoes i ON i.id = t.instituicao_id
    WHERE p.token_qr = ?
");
$stmt->execute([$token]);
$aluno = $stmt->fetch();

if (!$aluno) {
    responder(false, null, 'QR Code inválido ou expirado.', 404);
}

responder(true, [
    'nome'         => $aluno['nome'],
    'turma'        => $aluno['turma'],
    'instituicao'  => $aluno['instituicao'],
]);
