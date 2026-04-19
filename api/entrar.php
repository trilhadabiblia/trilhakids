<?php
// ============================================
// ENTRAR (QR Code) — TRILHO KIDS API
// ============================================
// GET ?token=XXXX → valida token e retorna dados do aluno

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$token = sanitize($_GET['token'] ?? '');
if (strlen($token) < 8) {
    responder(false, null, 'Token inválido.', 422);
}

$db   = getDB();
$stmt = $db->prepare("
    SELECT p.id, p.nome, p.token_qr,
           t.id AS turma_id, t.nome AS turma_nome,
           i.nome AS instituicao_nome
    FROM perfis p
    LEFT JOIN turmas t      ON t.id = p.turma_id
    LEFT JOIN instituicoes i ON i.id = t.instituicao_id
    WHERE p.token_qr = ?
    LIMIT 1
");
$stmt->execute([$token]);
$aluno = $stmt->fetch();

if (!$aluno) {
    responder(false, null, 'Token não encontrado. Contate o professor.', 404);
}

responder(true, [
    'nome'        => $aluno['nome'],
    'turma'       => $aluno['turma_nome'],
    'instituicao' => $aluno['instituicao_nome'],
]);
