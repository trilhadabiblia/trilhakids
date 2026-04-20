<?php
// ================================================
// PONTOS MANUAIS (PROFESSOR) — TRILHO KIDS API
// ================================================
// POST /pontos.php
// Body: { perfil_id, quantidade, motivo }
// Requer: Bearer token de professor ou admin
//
// O professor só pode pontuar alunos da sua turma.
// O admin pode pontuar qualquer aluno.
//
// Motivos sugeridos:
//   Presença           +10   Participação         +5
//   Trouxe a Bíblia    +5    Versículo decorado   +10
//   Ajudou um colega   +5    Atividade especial   +20
//   Explorador do Mês  +30   Coragem              +10

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, null, 'Método não permitido.', 405);
}

$body      = body();
$perfil_id = (int)($body['perfil_id'] ?? 0);
$motivo    = sanitize($body['motivo']  ?? '');
$quantidade= (int)($body['quantidade'] ?? 0);

if (!$perfil_id)               responder(false, null, 'perfil_id obrigatório.', 422);
if ($quantidade < 1 || $quantidade > 200) responder(false, null, 'Quantidade: 1 a 200.', 422);
if (!$motivo)                  responder(false, null, 'Motivo obrigatório.', 422);

// Valida autenticação e permissão sobre o aluno
$payload = requireDonoDaTurma(getDB(), $perfil_id);

$db  = getDB();

// ── Busca nome do aluno ──────────────────────
$stmt = $db->prepare("SELECT nome FROM perfis WHERE id = ?");
$stmt->execute([$perfil_id]);
$aluno = $stmt->fetch();
if (!$aluno) responder(false, null, 'Aluno não encontrado.', 404);

// ── Adiciona pontos ──────────────────────────
$db->prepare("UPDATE progresso SET pontos = pontos + ? WHERE perfil_id = ?")
   ->execute([$quantidade, $perfil_id]);

// ── Recalcula nível ──────────────────────────
$stmt = $db->prepare("SELECT pontos FROM progresso WHERE perfil_id = ?");
$stmt->execute([$perfil_id]);
$pontosAtuais = (int) $stmt->fetchColumn();

$niveis = [
    [1,'Iniciante',0],    [2,'Explorador',100],
    [3,'Aventureiro',300],[4,'Discípulo',600],
    [5,'Herói da Fé',1000],[6,'Guardião',1500],
    [7,'Sábio',2500],     [8,'Profeta',4000],
    [9,'Apóstolo',6000],  [10,'Lenda',10000],
];
$nivelAtual = $niveis[0];
foreach ($niveis as $n) {
    if ($pontosAtuais >= $n[2]) $nivelAtual = $n;
}

$db->prepare("UPDATE progresso SET nivel = ?, nome_nivel = ? WHERE perfil_id = ?")
   ->execute([$nivelAtual[0], $nivelAtual[1], $perfil_id]);

// ── Registra no histórico ────────────────────
$db->prepare("
    INSERT INTO historia (perfil_id, tipo, quantidade, motivo, lancado_por)
    VALUES (?, 'manual', ?, ?, ?)
")->execute([
    $perfil_id,
    $quantidade,
    $motivo,
    $payload['nome'] ?? 'professor',
]);

responder(true, [
    'aluno'         => $aluno['nome'],
    'pontos_ganhos' => $quantidade,
    'motivo'        => $motivo,
    'pontos_total'  => $pontosAtuais,
    'nivel'         => $nivelAtual[0],
    'nome_nivel'    => $nivelAtual[1],
]);
