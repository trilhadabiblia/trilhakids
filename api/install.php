<?php
// ============================================
// INSTALL — TRILHO KIDS API
// ============================================
// ⚠️  Rode UMA VEZ após o deploy e depois APAGUE este arquivo!
// Acesse: cafecomhomensdedeus.com.br/trilhokids/api/install.php

require_once 'config.php';

try {
    $db = getDB();

    // ── 1. Perfis ────────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS perfis (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome       VARCHAR(100) NOT NULL UNIQUE,
            criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // ── 2. Progresso ─────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS progresso (
            id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            perfil_id        INT UNSIGNED NOT NULL UNIQUE,
            pontos           INT UNSIGNED DEFAULT 0,
            nivel            TINYINT UNSIGNED DEFAULT 1,
            nome_nivel       VARCHAR(50) DEFAULT 'Iniciante',
            livros_visitados JSON,
            herois_visitados JSON,
            badges           JSON,
            atualizado_em    DATETIME DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // ── 3. Quizzes ───────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS quizzes (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            perfil_id  INT UNSIGNED NOT NULL,
            nome_quiz  VARCHAR(150) NOT NULL,
            acertos    TINYINT UNSIGNED NOT NULL,
            total      TINYINT UNSIGNED NOT NULL,
            percentual TINYINT UNSIGNED NOT NULL,
            criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // ── 4. Histórico ─────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS historia (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            perfil_id   INT UNSIGNED NOT NULL,
            tipo        ENUM('pontos','livro','heroi','quiz','manual') NOT NULL,
            quantidade  SMALLINT DEFAULT 0,
            motivo      VARCHAR(255),
            detalhes    JSON,
            lancado_por VARCHAR(50) DEFAULT 'sistema',
            criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo '<pre style="font-family:monospace;padding:20px">';
    echo "✅ Tabelas criadas com sucesso!\n\n";
    echo "  • perfis\n";
    echo "  • progresso\n";
    echo "  • quizzes\n";
    echo "  • historia\n\n";
    echo "⚠️  APAGUE este arquivo (install.php) agora!\n";
    echo '</pre>';

} catch (PDOException $e) {
    echo '<pre style="color:red;padding:20px">';
    echo "❌ Erro ao criar tabelas:\n";
    echo $e->getMessage();
    echo '</pre>';
}
