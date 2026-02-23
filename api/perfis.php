<?php
// ============================================
// PERFIS — TRILHO KIDS API
// ============================================
// GET    /perfis.php              → lista todos os perfis
// POST   /perfis.php  {nome}      → cria novo perfil
// DELETE /perfis.php  {nome,senha}→ remove perfil (admin)

require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET: Lista perfis ────────────────────────
if ($method === 'GET') {
    $stmt = $db->query("
        SELECT p.nome, p.criado_em,
               COALESCE(pr.pontos, 0)      AS pontos,
               COALESCE(pr.nivel, 1)       AS nivel,
               COALESCE(pr.nome_nivel, 'Iniciante') AS nome_nivel
        FROM perfis p
        LEFT JOIN progresso pr ON pr.perfil_id = p.id
        ORDER BY pr.pontos DESC, p.nome ASC
    ");
    responder(true, $stmt->fetchAll());
}

// ── POST: Cria perfil ────────────────────────
if ($method === 'POST') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');

    if (strlen($nome) < 2 || strlen($nome) > 100) {
        responder(false, null, 'Nome deve ter entre 2 e 100 caracteres.', 422);
    }

    try {
        // Cria perfil
        $stmt = $db->prepare("INSERT INTO perfis (nome) VALUES (?)");
        $stmt->execute([$nome]);
        $perfilId = $db->lastInsertId();

        // Cria progresso zerado
        $stmt = $db->prepare("
            INSERT INTO progresso (perfil_id, livros_visitados, herois_visitados, badges)
            VALUES (?, '[]', '[]', '[]')
        ");
        $stmt->execute([$perfilId]);

        responder(true, ['nome' => $nome, 'id' => $perfilId], status: 201);

    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            responder(false, null, "Já existe um perfil com o nome \"$nome\".", 409);
        }
        throw $e;
    }
}

// ── DELETE: Remove perfil (admin) ────────────
if ($method === 'DELETE') {
    $body = body();
    $nome = sanitize($body['nome'] ?? '');
    $senha = $body['senha'] ?? '';

    if ($senha !== SENHA_ADMIN) {
        responder(false, null, 'Senha incorreta.', 403);
    }
    if (!$nome) {
        responder(false, null, 'Nome obrigatório.', 422);
    }

    $stmt = $db->prepare("DELETE FROM perfis WHERE nome = ?");
    $stmt->execute([$nome]);

    if ($stmt->rowCount() === 0) {
        responder(false, null, 'Perfil não encontrado.', 404);
    }

    responder(true, ['removido' => $nome]);
}

responder(false, null, 'Método não permitido.', 405);
