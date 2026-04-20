<?php
// ================================================
// DASHBOARD DA TURMA — TRILHO KIDS API
// ================================================
// GET /dashboard.php?turma_id=5
// Requer: Bearer token de professor (ou admin)

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(false, null, 'Método não permitido.', 405);
}

$payload  = requireAuth();
$turma_id = (int)($_GET['turma_id'] ?? 0);
if (!$turma_id) responder(false, null, 'turma_id obrigatório.', 422);

$db = getDB();

// Verifica que o professor está vinculado à turma (admin bypassa)
if (!$payload['is_admin']) {
    $stmt = $db->prepare("
        SELECT 1 FROM turma_professores WHERE turma_id = ? AND professor_id = ?
    ");
    $stmt->execute([$turma_id, $payload['professor_id']]);
    if (!$stmt->fetch()) {
        responder(false, null, 'Acesso negado a esta turma.', 403);
    }
}

// ── Dados básicos da turma ────────────────────
$stmt = $db->prepare("
    SELECT t.id, t.nome AS turma, t.criado_em,
           i.nome AS instituicao, i.tipo AS tipo_instituicao
    FROM turmas t
    JOIN instituicoes i ON i.id = t.instituicao_id
    WHERE t.id = ? AND t.ativo = 1
");
$stmt->execute([$turma_id]);
$info = $stmt->fetch();
if (!$info) responder(false, null, 'Turma não encontrada.', 404);

// ── Professores da turma ──────────────────────
$stmt = $db->prepare("
    SELECT p.id, p.nome, tp.papel
    FROM turma_professores tp
    JOIN professores p ON p.id = tp.professor_id
    WHERE tp.turma_id = ?
    ORDER BY tp.papel ASC, p.nome ASC
");
$stmt->execute([$turma_id]);
$info['professores'] = $stmt->fetchAll();

// ── Plantão de hoje ───────────────────────────
$stmt = $db->prepare("
    SELECT ct.id, ct.hora_inicio, ct.hora_fim, ct.observacao,
           p.id AS professor_id, p.nome AS professor_nome, tp.papel
    FROM calendario_turmas ct
    JOIN professores p ON p.id = ct.professor_id
    LEFT JOIN turma_professores tp
           ON tp.turma_id = ct.turma_id AND tp.professor_id = ct.professor_id
    WHERE ct.turma_id = ? AND ct.data = CURDATE()
    ORDER BY ct.hora_inicio ASC
");
$stmt->execute([$turma_id]);
$plantao_hoje = $stmt->fetchAll();

// ── Alunos com estatísticas ───────────────────
$stmt = $db->prepare("
    SELECT
        pf.id,
        pf.nome,
        pf.token_qr,
        pf.criado_em,
        COALESCE(pr.pontos,      0)          AS pontos,
        COALESCE(pr.nivel,       1)          AS nivel,
        COALESCE(pr.nome_nivel, 'Iniciante') AS nome_nivel,
        COALESCE(JSON_LENGTH(pr.livros_visitados), 0) AS livros_visitados,
        COALESCE(JSON_LENGTH(pr.herois_visitados), 0) AS herois_visitados,
        COALESCE(JSON_LENGTH(pr.badges),            0) AS badges,
        (SELECT COUNT(*)        FROM quizzes q WHERE q.perfil_id = pf.id) AS quizzes_completos,
        (SELECT MAX(percentual) FROM quizzes q WHERE q.perfil_id = pf.id) AS melhor_quiz,
        (SELECT MAX(h.criado_em) FROM historia h WHERE h.perfil_id = pf.id) AS ultima_atividade
    FROM perfis pf
    LEFT JOIN progresso pr ON pr.perfil_id = pf.id
    WHERE pf.turma_id = ?
    ORDER BY pr.pontos DESC, pf.nome ASC
");
$stmt->execute([$turma_id]);
$alunos = $stmt->fetchAll();

foreach ($alunos as &$a) {
    $a['pontos']            = (int)  $a['pontos'];
    $a['nivel']             = (int)  $a['nivel'];
    $a['livros_visitados']  = (int)  $a['livros_visitados'];
    $a['herois_visitados']  = (int)  $a['herois_visitados'];
    $a['badges']            = (int)  $a['badges'];
    $a['quizzes_completos'] = (int)  $a['quizzes_completos'];
    $a['melhor_quiz']       = $a['melhor_quiz'] !== null ? (int)$a['melhor_quiz'] : null;
}

// ── Agregados da turma ────────────────────────
$total        = count($alunos);
$media_pontos = $total ? round(array_sum(array_column($alunos, 'pontos')) / $total) : 0;
$total_quizzes= array_sum(array_column($alunos, 'quizzes_completos'));
$total_livros = array_sum(array_column($alunos, 'livros_visitados'));
$total_badges = array_sum(array_column($alunos, 'badges'));

// ── Atividades recentes (últimas 20 da turma) ─
$stmt = $db->prepare("
    SELECT pf.nome AS aluno, h.tipo, h.quantidade, h.motivo, h.criado_em
    FROM historia h
    JOIN perfis pf ON pf.id = h.perfil_id
    WHERE pf.turma_id = ?
    ORDER BY h.criado_em DESC
    LIMIT 20
");
$stmt->execute([$turma_id]);
$atividades = $stmt->fetchAll();
foreach ($atividades as &$ev) {
    $ev['quantidade'] = (int) $ev['quantidade'];
}

responder(true, [
    'turma'        => $info,
    'plantao_hoje' => $plantao_hoje,
    'resumo'       => [
        'total_alunos'  => $total,
        'media_pontos'  => $media_pontos,
        'total_quizzes' => $total_quizzes,
        'total_livros'  => $total_livros,
        'total_badges'  => $total_badges,
    ],
    'alunos'       => $alunos,
    'atividades'   => $atividades,
]);
