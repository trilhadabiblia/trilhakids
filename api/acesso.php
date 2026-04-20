<?php
// ============================================
// ACESSO PROGRESSIVO — TRILHO KIDS API
// ============================================
// GET ?nome=X&livro_ordem=N
// → { ok, dados: { acesso: bool, proximo_em: 'YYYY-MM-DD'|null } }
//
// Regra: livro acessível somente se houver entrada explícita em
// calendario_turmas com livro_ordem=N e data <= CURDATE() para a turma do aluno.
// Sem agenda (zero entradas): libera apenas Gênesis (ordem=1).
// Sem turma / visitante local: tudo liberado (tratado no frontend).

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$nome        = sanitize($_GET['nome']        ?? '');
$livroOrdem  = (int)($_GET['livro_ordem']   ?? 0);

if (!$nome || $livroOrdem < 1) {
    responder(false, null, 'Parâmetros nome e livro_ordem são obrigatórios.', 422);
}

$db = getDB();

// 1. Busca turma do aluno
$stmt = $db->prepare("SELECT turma_id FROM perfis WHERE nome = ? LIMIT 1");
$stmt->execute([$nome]);
$perfil = $stmt->fetch();

if (!$perfil || !$perfil['turma_id']) {
    // Sem turma → acesso livre
    responder(true, ['acesso' => true, 'proximo_em' => null]);
}

$turmaId = (int)$perfil['turma_id'];

// 2. Conta entradas da turma (para detectar "sem agenda")
$stmtTotal = $db->prepare("SELECT COUNT(*) FROM calendario_turmas WHERE turma_id = ? AND livro_ordem IS NOT NULL");
$stmtTotal->execute([$turmaId]);
$totalEntradas = (int)$stmtTotal->fetchColumn();

if ($totalEntradas === 0) {
    // Sem agenda → só Gênesis (ordem 1)
    responder(true, ['acesso' => $livroOrdem === 1, 'proximo_em' => null]);
}

// 3. Verifica se este livro foi explicitamente agendado com data <= hoje
$stmtAcesso = $db->prepare("
    SELECT COUNT(*) FROM calendario_turmas
    WHERE turma_id = ? AND livro_ordem = ? AND data <= CURDATE()
");
$stmtAcesso->execute([$turmaId, $livroOrdem]);
$liberado = (int)$stmtAcesso->fetchColumn() > 0;

if ($liberado) {
    responder(true, ['acesso' => true, 'proximo_em' => null]);
}

// 4. Bloqueado — busca próxima data agendada (pode ser futuro)
$stmtProximo = $db->prepare("
    SELECT MIN(data) AS proximo_em FROM calendario_turmas
    WHERE turma_id = ? AND livro_ordem = ? AND data > CURDATE()
");
$stmtProximo->execute([$turmaId, $livroOrdem]);
$row = $stmtProximo->fetch();

responder(true, [
    'acesso'     => false,
    'proximo_em' => $row['proximo_em'] ?? null,
]);
