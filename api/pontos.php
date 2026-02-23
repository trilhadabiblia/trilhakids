<?php
// ============================================
// PONTOS MANUAIS (PROFESSOR) — TRILHO KIDS API
// ============================================
// POST /pontos.php
// Body: { nome, quantidade, motivo, senha }
//
// Motivos válidos (sistema oficial TrilhoKids):
//   Presença              +10
//   Participação          +5
//   Realizou o quiz       +10
//   Acertou 70%+ no quiz  +10
//   Trouxe a Bíblia       +5
//   Versículo decorado    +10
//   Ajudou um colega      +5
//   Atividade especial    +20
//   Explorador do Mês     +30  (badge mensal)
//   Leitor Consistente    +20  (badge mensal)
//   Coragem               +10  (badge mensal)
//   Destaque da Bondade   +10  (badge mensal)

require_once 'cors.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, null, 'Método não permitido.', 405);
}

$body = body();

// ── Validações ───────────────────────────────
$nome      = sanitize($body['nome']      ?? '');
$motivo    = sanitize($body['motivo']    ?? '');
$senha     = $body['senha']              ?? '';
$quantidade= (int)($body['quantidade']   ?? 0);

if ($senha !== SENHA_ADMIN) {
    responder(false, null, 'Senha incorreta.', 403);
}
if (!$nome) {
    responder(false, null, 'Campo "nome" obrigatório.', 422);
}
if ($quantidade <= 0 || $quantidade > 200) {
    responder(false, null, 'Quantidade deve ser entre 1 e 200.', 422);
}
if (!$motivo) {
    responder(false, null, 'Campo "motivo" obrigatório.', 422);
}

// ── Busca perfil ─────────────────────────────
$db   = getDB();
$stmt = $db->prepare("SELECT id FROM perfis WHERE nome = ?");
$stmt->execute([$nome]);
$perfil = $stmt->fetch();

if (!$perfil) {
    responder(false, null, "Aluno \"$nome\" não encontrado.", 404);
}
$pid = $perfil['id'];

// ── Atualiza pontos ──────────────────────────
$db->prepare("UPDATE progresso SET pontos = pontos + ? WHERE perfil_id = ?")
   ->execute([$quantidade, $pid]);

// ── Verifica novo nível ──────────────────────
$stmt = $db->prepare("SELECT pontos FROM progresso WHERE perfil_id = ?");
$stmt->execute([$pid]);
$pontosAtuais = (int)$stmt->fetchColumn();

$niveis = [
    [1,'Iniciante',0],[2,'Explorador',100],[3,'Aventureiro',300],
    [4,'Discípulo',600],[5,'Herói da Fé',1000],[6,'Guardião',1500],
    [7,'Sábio',2500],[8,'Profeta',4000],[9,'Apóstolo',6000],[10,'Lenda',10000]
];
$nivelAtual = [1,'Iniciante'];
foreach ($niveis as $n) {
    if ($pontosAtuais >= $n[2]) $nivelAtual = $n;
}
$db->prepare("UPDATE progresso SET nivel = ?, nome_nivel = ? WHERE perfil_id = ?")
   ->execute([$nivelAtual[0], $nivelAtual[1], $pid]);

// ── Registra no histórico ────────────────────
$db->prepare("
    INSERT INTO historia (perfil_id, tipo, quantidade, motivo, lancado_por)
    VALUES (?, 'manual', ?, ?, 'professor')
")->execute([$pid, $quantidade, $motivo]);

// ── Retorna progresso atualizado ─────────────
responder(true, [
    'aluno'         => $nome,
    'pontos_ganhos' => $quantidade,
    'motivo'        => $motivo,
    'pontos_total'  => $pontosAtuais,
    'nivel'         => $nivelAtual[0],
    'nome_nivel'    => $nivelAtual[1],
]);
