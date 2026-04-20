<?php
// ================================================
// PROGRESSO — TRILHO KIDS API
// ================================================
// GET  /progresso.php?nome=João   → progresso completo
// POST /progresso.php             → salva/atualiza campos

require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── Helper: busca perfil pelo nome ───────────
function getPerfil(PDO $db, string $nome): ?array {
    $stmt = $db->prepare("SELECT id, nome FROM perfis WHERE nome = ?");
    $stmt->execute([$nome]);
    return $stmt->fetch() ?: null;
}

// ── GET: Progresso completo ──────────────────
if ($method === 'GET') {
    $nome = sanitize($_GET['nome'] ?? '');
    if (!$nome) responder(false, null, 'Parâmetro "nome" obrigatório.', 422);

    $db     = getDB();
    $perfil = getPerfil($db, $nome);
    if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);

    $stmt = $db->prepare("SELECT * FROM progresso WHERE perfil_id = ?");
    $stmt->execute([$perfil['id']]);
    $prog = $stmt->fetch();

    $stmt = $db->prepare("
        SELECT nome_quiz, acertos, total, percentual, criado_em
        FROM quizzes
        WHERE perfil_id = ?
        ORDER BY criado_em DESC
    ");
    $stmt->execute([$perfil['id']]);
    $quizzes = $stmt->fetchAll();

    // Converte campos numéricos dos quizzes
    foreach ($quizzes as &$q) {
        $q['acertos']   = (int) $q['acertos'];
        $q['total']     = (int) $q['total'];
        $q['percentual']= (int) $q['percentual'];
    }

    responder(true, [
        'nome'              => $perfil['nome'],
        'pontos'            => (int)  ($prog['pontos']    ?? 0),
        'nivel'             => (int)  ($prog['nivel']     ?? 1),
        'nome_nivel'        => $prog['nome_nivel']         ?? 'Iniciante',
        'livros_visitados'  => json_decode($prog['livros_visitados'] ?? '[]'),
        'herois_visitados'  => json_decode($prog['herois_visitados'] ?? '[]'),
        'badges'            => json_decode($prog['badges']           ?? '[]'),
        'quizzes_completos' => $quizzes,
        'atualizado_em'     => $prog['atualizado_em'] ?? null,
    ]);
}

// ── POST: Salva progresso (campos opcionais) ─
if ($method === 'POST') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');
    if (!$nome) responder(false, null, 'Campo "nome" obrigatório.', 422);

    $db     = getDB();
    $perfil = getPerfil($db, $nome);
    if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);
    $pid = $perfil['id'];

    // Monta UPDATE dinâmico — só altera campos enviados
    $sets = [];
    $vals = [];

    if (isset($body['pontos'])) {
        $sets[] = 'pontos = ?';
        $vals[] = max(0, (int) $body['pontos']);
    }
    if (isset($body['nivel'])) {
        $sets[] = 'nivel = ?';
        $vals[] = max(1, (int) $body['nivel']);
    }
    if (isset($body['nome_nivel'])) {
        $sets[] = 'nome_nivel = ?';
        $vals[] = sanitize($body['nome_nivel']);
    }
    if (isset($body['livros_visitados'])) {
        $sets[] = 'livros_visitados = ?';
        $vals[] = json_encode($body['livros_visitados'], JSON_UNESCAPED_UNICODE);
    }
    if (isset($body['herois_visitados'])) {
        $sets[] = 'herois_visitados = ?';
        $vals[] = json_encode($body['herois_visitados'], JSON_UNESCAPED_UNICODE);
    }
    if (isset($body['badges'])) {
        $sets[] = 'badges = ?';
        $vals[] = json_encode($body['badges'], JSON_UNESCAPED_UNICODE);
    }

    if (!empty($sets)) {
        $vals[] = $pid;
        $db->prepare("UPDATE progresso SET " . implode(', ', $sets) . " WHERE perfil_id = ?")
           ->execute($vals);
    }

    // Salva quiz se vier no body
    if (!empty($body['quiz'])) {
        $q = $body['quiz'];
        $db->prepare("
            INSERT INTO quizzes (perfil_id, nome_quiz, acertos, total, percentual)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([
            $pid,
            sanitize($q['nome']       ?? ''),
            max(0, (int)($q['acertos']    ?? 0)),
            max(1, (int)($q['total']      ?? 1)),
            max(0, (int)($q['percentual'] ?? 0)),
        ]);
    }

    // Salva evento no histórico se vier no body
    if (!empty($body['evento'])) {
        $ev = $body['evento'];
        $db->prepare("
            INSERT INTO historia (perfil_id, tipo, quantidade, motivo, detalhes, lancado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ")->execute([
            $pid,
            sanitize($ev['tipo']       ?? 'pontos'),
            (int)($ev['quantidade']    ?? 0),
            sanitize($ev['motivo']     ?? ''),
            isset($ev['detalhes']) ? json_encode($ev['detalhes']) : null,
            sanitize($ev['lancado_por'] ?? 'sistema'),
        ]);
    }

    responder(true, ['salvo' => true]);
}

responder(false, null, 'Método não permitido.', 405);
