<?php
// ============================================
// PERFIS (Alunos) — TRILHO KIDS API
// ============================================
// GET    /perfis.php [?turma_id=X]       → lista perfis
// POST   /perfis.php {nome, ...}         → cria aluno
// PUT    /perfis.php {id, ...}           → atualiza aluno
// DELETE /perfis.php {nome}              → remove aluno

require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET: lista ────────────────────────────────
if ($method === 'GET') {
    $turmaId = $_GET['turma_id'] ?? null;

    $where = $turmaId ? 'WHERE p.turma_id = ?' : '';
    $stmt  = $db->prepare("
        SELECT p.id, p.nome, p.criado_em, p.turma_id, p.token_qr,
               p.data_nascimento, p.nome_responsavel,
               p.telefone_responsavel, p.email_responsavel,
               COALESCE(pr.pontos, 0)               AS pontos,
               COALESCE(pr.nivel, 1)                AS nivel,
               COALESCE(pr.nome_nivel, 'Iniciante') AS nome_nivel
        FROM perfis p
        LEFT JOIN progresso pr ON pr.perfil_id = p.id
        $where
        ORDER BY pr.pontos DESC, p.nome ASC
    ");
    $turmaId ? $stmt->execute([(int)$turmaId]) : $stmt->execute();
    responder(true, $stmt->fetchAll());
}

// ── POST: cria ────────────────────────────────
if ($method === 'POST') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');

    if (strlen($nome) < 2 || strlen($nome) > 100) {
        responder(false, null, 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }

    $turma_id            = isset($body['turma_id'])           ? (int)$body['turma_id'] : null;
    $data_nascimento     = $body['data_nascimento']           ?? null;
    $nome_responsavel    = sanitize($body['nome_responsavel']    ?? '');
    $telefone_responsavel= sanitize($body['telefone_responsavel'] ?? '');
    $email_responsavel   = sanitize($body['email_responsavel']   ?? '');

    // Gera token QR único (16 chars hex)
    $token_qr = bin2hex(random_bytes(8));

    try {
        $stmt = $db->prepare("
            INSERT INTO perfis
                (nome, turma_id, token_qr, data_nascimento,
                 nome_responsavel, telefone_responsavel, email_responsavel)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nome,
            $turma_id,
            $token_qr,
            $data_nascimento  ?: null,
            $nome_responsavel ?: null,
            $telefone_responsavel ?: null,
            $email_responsavel    ?: null,
        ]);
        $perfilId = $db->lastInsertId();

        // Cria progresso zerado
        $db->prepare("
            INSERT INTO progresso (perfil_id, livros_visitados, herois_visitados, badges)
            VALUES (?, '[]', '[]', '[]')
        ")->execute([$perfilId]);

        responder(true, ['nome' => $nome, 'id' => (int)$perfilId, 'token_qr' => $token_qr], status: 201);

    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            responder(false, null, "Já existe um perfil com o nome \"$nome\".", 409);
        }
        throw $e;
    }
}

// ── PUT: atualiza aluno ───────────────────────
if ($method === 'PUT') {
    $body = body();
    $id   = (int)($body['id'] ?? 0);

    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $nome                = sanitize($body['nome'] ?? '');
    $turma_id            = isset($body['turma_id']) && $body['turma_id'] !== '' ? (int)$body['turma_id'] : null;
    $data_nascimento     = $body['data_nascimento']            ?? null;
    $nome_responsavel    = sanitize($body['nome_responsavel']    ?? '');
    $telefone_responsavel= sanitize($body['telefone_responsavel'] ?? '');
    $email_responsavel   = sanitize($body['email_responsavel']   ?? '');

    if (strlen($nome) < 2) responder(false, null, 'Nome obrigatório.', 422);

    $stmt = $db->prepare("
        UPDATE perfis
        SET nome = ?, turma_id = ?, data_nascimento = ?,
            nome_responsavel = ?, telefone_responsavel = ?, email_responsavel = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $nome,
        $turma_id,
        $data_nascimento  ?: null,
        $nome_responsavel ?: null,
        $telefone_responsavel ?: null,
        $email_responsavel    ?: null,
        $id,
    ]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Aluno não encontrado.', 404);

    responder(true, ['id' => $id, 'nome' => $nome]);
}

// ── DELETE: remove ────────────────────────────
if ($method === 'DELETE') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');

    // Aceita remoção por ID (admin panel) ou por nome+senha (gamificacao.js legado)
    if (isset($body['id'])) {
        $id = (int)$body['id'];
        if (!$id) responder(false, null, 'ID inválido.', 422);
        $db->prepare("DELETE FROM perfis WHERE id = ?")->execute([$id]);
        responder(true, ['removido' => $id]);
    }

    // Legado: remoção por nome + SENHA_ADMIN
    $senha = $body['senha'] ?? '';
    if ($senha !== SENHA_ADMIN) responder(false, null, 'Senha incorreta.', 403);
    if (!$nome) responder(false, null, 'Nome obrigatório.', 422);

    $stmt = $db->prepare("DELETE FROM perfis WHERE nome = ?");
    $stmt->execute([$nome]);
    if ($stmt->rowCount() === 0) responder(false, null, 'Perfil não encontrado.', 404);

    responder(true, ['removido' => $nome]);
}

responder(false, null, 'Método não permitido.', 405);
