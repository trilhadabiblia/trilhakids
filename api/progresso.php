<?php
// ============================================
// PROGRESSO — TRILHO KIDS API
// ============================================
// GET  /progresso.php?nome=João   → progresso completo do aluno
// POST /progresso.php             → salva progresso do aluno

require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── Helper: busca perfil_id pelo nome ────────
function getPerfil(PDO $db, string $nome): ?array {
    $stmt = $db->prepare("SELECT id, nome FROM perfis WHERE nome = ?");
    $stmt->execute([$nome]);
    return $stmt->fetch() ?: null;
}

// ── GET: Progresso completo ──────────────────
if ($method === 'GET') {
    $nome = sanitize($_GET['nome'] ?? '');
    if (!$nome) responder(false, null, 'Parâmetro "nome" obrigatório.', 422);

    $perfil = getPerfil($db, $nome);
    if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);

    // Progresso geral
    $stmt = $db->prepare("SELECT * FROM progresso WHERE perfil_id = ?");
    $stmt->execute([$perfil['id']]);
    $prog = $stmt->fetch();

    // Quizzes
    $stmt = $db->prepare("
        SELECT nome_quiz, acertos, total, percentual, criado_em
        FROM quizzes
        WHERE perfil_id = ?
        ORDER BY criado_em DESC
    ");
    $stmt->execute([$perfil['id']]);
    $quizzes = $stmt->fetchAll();

    responder(true, [
        'nome'            => $perfil['nome'],
        'pontos'          => (int)($prog['pontos'] ?? 0),
        'nivel'           => (int)($prog['nivel'] ?? 1),
        'nome_nivel'      => $prog['nome_nivel'] ?? 'Iniciante',
        'livros_visitados'=> json_decode($prog['livros_visitados'] ?? '[]'),
        'herois_visitados'=> json_decode($prog['herois_visitados'] ?? '[]'),
        'badges'          => json_decode($prog['badges'] ?? '[]'),
        'quizzes_completos' => $quizzes,
        'atualizado_em'   => $prog['atualizado_em'] ?? null,
    ]);
}

// ── POST: Salva progresso ────────────────────
if ($method === 'POST') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');
    if (!$nome) responder(false, null, 'Campo "nome" obrigatório.', 422);

    $perfil = getPerfil($db, $nome);
    if (!$perfil) responder(false, null, 'Perfil não encontrado.', 404);

    $pid = $perfil['id'];

    // Campos aceitos
    $pontos          = isset($body['pontos'])          ? max(0, (int)$body['pontos']) : null;
    $nivel           = isset($body['nivel'])           ? max(1, (int)$body['nivel'])  : null;
    $nomeNivel       = isset($body['nome_nivel'])      ? sanitize($body['nome_nivel']) : null;
    $livros          = isset($body['livros_visitados']) ? json_encode($body['livros_visitados']) : null;
    $herois          = isset($body['herois_visitados']) ? json_encode($body['herois_visitados']) : null;
    $badges          = isset($body['badges'])          ? json_encode($body['badges'])  : null;

    // Monta UPDATE dinâmico com apenas os campos enviados
    $sets  = [];
    $vals  = [];

    if ($pontos    !== null) { $sets[] = 'pontos = ?';          $vals[] = $pontos;    }
    if ($nivel     !== null) { $sets[] = 'nivel = ?';           $vals[] = $nivel;     }
    if ($nomeNivel !== null) { $sets[] = 'nome_nivel = ?';      $vals[] = $nomeNivel; }
    if ($livros    !== null) { $sets[] = 'livros_visitados = ?'; $vals[] = $livros;   }
    if ($herois    !== null) { $sets[] = 'herois_visitados = ?'; $vals[] = $herois;   }
    if ($badges    !== null) { $sets[] = 'badges = ?';          $vals[] = $badges;    }

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
            sanitize($q['nome']   ?? ''),
            (int)($q['acertos']   ?? 0),
            (int)($q['total']     ?? 0),
            (int)($q['percentual'] ?? 0),
        ]);
    }

    // Salva histórico se vier no body
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
            json_encode($ev['detalhes'] ?? null),
            sanitize($ev['lancado_por'] ?? 'sistema'),
        ]);
    }

    responder(true, ['salvo' => true]);
}

responder(false, null, 'Método não permitido.', 405);
