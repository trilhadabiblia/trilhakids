<?php
// ================================================
// PERFIS — TRILHO KIDS API
// ================================================
// GET  /perfis.php                → público: lista nomes+pts (seletor frontend)
// GET  /perfis.php?turma_id=X     → auth: alunos detalhados da turma
// POST /perfis.php                → admin/responsável: cria perfil, gera token_qr
// PUT  /perfis.php {id,...}       → admin/responsável: atualiza aluno
// DELETE /perfis.php {nome}       → admin: remove perfil

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────
if ($method === 'GET') {
    $db = getDB();

    // Painel admin: ?admin=1 ou ?turma_id=X — requer autenticação
    if (isset($_GET['admin']) || isset($_GET['turma_id'])) {
        $payload  = requireAdminOrResponsavel();
        $scope    = scopeInstituicao($payload);

        $select = "
            SELECT p.id, p.nome, p.token_qr, p.turma_id, p.criado_em,
                   p.data_nascimento, p.nome_responsavel,
                   p.telefone_responsavel, p.email_responsavel,
                   COALESCE(pr.pontos,     0)           AS pontos,
                   COALESCE(pr.nivel,      1)           AS nivel,
                   COALESCE(pr.nome_nivel, 'Iniciante') AS nome_nivel,
                   COALESCE(JSON_LENGTH(pr.livros_visitados), 0) AS livros_visitados,
                   COALESCE(JSON_LENGTH(pr.herois_visitados), 0) AS herois_visitados,
                   COALESCE(JSON_LENGTH(pr.badges), 0)           AS badges,
                   (SELECT COUNT(*) FROM quizzes q WHERE q.perfil_id = p.id) AS quizzes_completos,
                   (SELECT MAX(h.criado_em) FROM historia h WHERE h.perfil_id = p.id) AS ultima_atividade
            FROM perfis p
            LEFT JOIN progresso pr ON pr.perfil_id = p.id
        ";

        if (isset($_GET['turma_id'])) {
            // Filtra por turma específica — responsável só acessa turmas da própria instituição
            $turma_id = (int)$_GET['turma_id'];
            if ($scope !== null) {
                // Garante que a turma pertence à instituição do responsável
                $chk = $db->prepare("SELECT id FROM turmas WHERE id = ? AND instituicao_id = ?");
                $chk->execute([$turma_id, $scope]);
                if (!$chk->fetch()) responder(false, null, 'Sem permissão para esta turma.', 403);
            }
            $stmt = $db->prepare($select . " WHERE p.turma_id = ? ORDER BY pr.pontos DESC, p.nome ASC");
            $stmt->execute([$turma_id]);
        } elseif ($scope !== null) {
            // Responsável: apenas alunos das turmas da sua instituição
            $stmt = $db->prepare($select . "
                JOIN turmas t ON t.id = p.turma_id AND t.instituicao_id = ?
                ORDER BY pr.pontos DESC, p.nome ASC
            ");
            $stmt->execute([$scope]);
        } else {
            // Admin: todos os alunos
            $stmt = $db->prepare($select . " ORDER BY pr.pontos DESC, p.nome ASC");
            $stmt->execute();
        }

        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['pontos']            = (int) $r['pontos'];
            $r['nivel']             = (int) $r['nivel'];
            $r['livros_visitados']  = (int) $r['livros_visitados'];
            $r['herois_visitados']  = (int) $r['herois_visitados'];
            $r['badges']            = (int) $r['badges'];
            $r['quizzes_completos'] = (int) $r['quizzes_completos'];
        }
        responder(true, $rows);
    }

    // Sem filtro → lista pública para o seletor de perfil (sem token_qr)
    $stmt = $db->query("
        SELECT p.nome, p.criado_em,
               COALESCE(pr.pontos,     0)          AS pontos,
               COALESCE(pr.nivel,      1)          AS nivel,
               COALESCE(pr.nome_nivel, 'Iniciante') AS nome_nivel
        FROM perfis p
        LEFT JOIN progresso pr ON pr.perfil_id = p.id
        ORDER BY pr.pontos DESC, p.nome ASC
    ");
    responder(true, $stmt->fetchAll());
}

// ── POST: Cria perfil ────────────────────────
if ($method === 'POST') {
    requireAdminOrResponsavel();
    $body     = body();
    $nome     = sanitize($body['nome']     ?? '');
    $turma_id = (int)($body['turma_id']    ?? 0) ?: null;

    $data_nascimento      = $body['data_nascimento']             ?? null;
    $nome_responsavel     = sanitize($body['nome_responsavel']    ?? '');
    $telefone_responsavel = sanitize($body['telefone_responsavel'] ?? '');
    $email_responsavel    = sanitize($body['email_responsavel']   ?? '');

    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
        responder(false, null, 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }

    $token_qr = bin2hex(random_bytes(8)); // 16 chars hex únicos

    try {
        $db = getDB();

        $db->prepare("
            INSERT INTO perfis
                (nome, token_qr, turma_id, data_nascimento,
                 nome_responsavel, telefone_responsavel, email_responsavel)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ")->execute([
            $nome, $token_qr, $turma_id,
            $data_nascimento      ?: null,
            $nome_responsavel     ?: null,
            $telefone_responsavel ?: null,
            $email_responsavel    ?: null,
        ]);

        $perfilId = (int) $db->lastInsertId();

        $db->prepare("
            INSERT INTO progresso (perfil_id, livros_visitados, herois_visitados, badges)
            VALUES (?, '[]', '[]', '[]')
        ")->execute([$perfilId]);

        responder(true, [
            'id'       => $perfilId,
            'nome'     => $nome,
            'token_qr' => $token_qr,
            'turma_id' => $turma_id,
        ], status: 201);

    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            responder(false, null, "Já existe um perfil com o nome \"$nome\".", 409);
        }
        throw $e;
    }
}

// ── PUT: Atualiza aluno ──────────────────────
if ($method === 'PUT') {
    requireAdminOrResponsavel();
    $body = body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) responder(false, null, 'ID obrigatório.', 422);

    $nome                 = sanitize($body['nome'] ?? '');
    $turma_id             = isset($body['turma_id']) && $body['turma_id'] !== '' ? (int)$body['turma_id'] : null;
    $data_nascimento      = $body['data_nascimento']             ?? null;
    $nome_responsavel     = sanitize($body['nome_responsavel']    ?? '');
    $telefone_responsavel = sanitize($body['telefone_responsavel'] ?? '');
    $email_responsavel    = sanitize($body['email_responsavel']   ?? '');

    if (mb_strlen($nome) < 2) responder(false, null, 'Nome deve ter pelo menos 2 caracteres.', 422);

    $db   = getDB();
    $stmt = $db->prepare("
        UPDATE perfis
        SET nome = ?, turma_id = ?, data_nascimento = ?,
            nome_responsavel = ?, telefone_responsavel = ?, email_responsavel = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $nome, $turma_id,
        $data_nascimento      ?: null,
        $nome_responsavel     ?: null,
        $telefone_responsavel ?: null,
        $email_responsavel    ?: null,
        $id,
    ]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Perfil não encontrado.', 404);
    responder(true, ['atualizado' => $id]);
}

// ── DELETE: Remove perfil (admin) ────────────
if ($method === 'DELETE') {
    requireAdmin();
    $body = body();

    // Aceita remoção por ID ou por nome (legado gamificacao.js)
    if (isset($body['id'])) {
        $id = (int)$body['id'];
        if (!$id) responder(false, null, 'ID inválido.', 422);
        getDB()->prepare("DELETE FROM perfis WHERE id = ?")->execute([$id]);
        responder(true, ['removido' => $id]);
    }

    $nome = sanitize($body['nome'] ?? '');
    if (!$nome) responder(false, null, 'Nome obrigatório.', 422);

    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM perfis WHERE nome = ?");
    $stmt->execute([$nome]);

    if ($stmt->rowCount() === 0) responder(false, null, 'Perfil não encontrado.', 404);
    responder(true, ['removido' => $nome]);
}

responder(false, null, 'Método não permitido.', 405);
