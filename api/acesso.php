<?php
// ================================================
// ACESSO — TRILHO KIDS API
// ================================================
// GET /acesso.php?nome=X&livro_ordem=N
//   → Verifica se o aluno tem acesso ao livro com base na agenda da turma.
//   → Sem turma (visitante): acesso total.
//   → Sem agenda cadastrada: somente Gênesis (ordem 1).
//   → Whitelist explícita: livro liberado somente se houver entrada com
//     livro_ordem=N e data <= CURDATE() para a turma do aluno.

require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$nome        = sanitize($_GET['nome']        ?? '');
$livro_ordem = (int)($_GET['livro_ordem']    ?? 0);

if (!$nome || !$livro_ordem) {
    responder(false, null, 'nome e livro_ordem obrigatórios.', 422);
}

$db = getDB();

// Busca a turma do perfil pelo nome
$stmt = $db->prepare("SELECT id, turma_id FROM perfis WHERE nome = ?");
$stmt->execute([$nome]);
$perfil = $stmt->fetch();

if (!$perfil) {
    // Perfil não encontrado → libera (modo visitante, perfil local ainda não sincronizado)
    responder(true, ['acesso' => true, 'teto' => 66, 'proximo_em' => null]);
}

// Sem turma = visitante = acesso total
if (!$perfil['turma_id']) {
    responder(true, ['acesso' => true, 'teto' => 66, 'proximo_em' => null]);
}

$turma_id = (int)$perfil['turma_id'];

// Turma sem nenhuma entrada de livro → só Gênesis (ordem 1)
$stmtTotal = $db->prepare("
    SELECT COUNT(*) FROM calendario_turmas
    WHERE turma_id = ? AND livro_ordem IS NOT NULL
");
$stmtTotal->execute([$turma_id]);
if ((int)$stmtTotal->fetchColumn() === 0) {
    responder(true, ['acesso' => $livro_ordem === 1, 'proximo_em' => null]);
}

// Whitelist: livro acessível somente se agendado explicitamente com data <= hoje
$stmtAcesso = $db->prepare("
    SELECT COUNT(*) FROM calendario_turmas
    WHERE turma_id = ? AND livro_ordem = ? AND data <= CURDATE()
");
$stmtAcesso->execute([$turma_id, $livro_ordem]);
$acesso = (int)$stmtAcesso->fetchColumn() > 0;

// Se bloqueado: busca próxima data agendada (futura) para este livro
$proximo_em = null;
if (!$acesso) {
    $stmtProximo = $db->prepare("
        SELECT MIN(data) AS proximo_em FROM calendario_turmas
        WHERE turma_id = ? AND livro_ordem = ? AND data > CURDATE()
    ");
    $stmtProximo->execute([$turma_id, $livro_ordem]);
    $r = $stmtProximo->fetch();
    $proximo_em = $r['proximo_em'] ?? null;
}

responder(true, ['acesso' => $acesso, 'proximo_em' => $proximo_em]);
