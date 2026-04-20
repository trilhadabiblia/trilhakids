<?php
// ================================================
// INSTALL — TRILHO KIDS API
// ================================================
// Use este arquivo APENAS em produção (cPanel).
// Em Docker, o banco é criado automaticamente
// pelo arquivo mysql/init.sql.
//
// ⚠️  APAGUE este arquivo após executar!
// Acesse: https://seu-dominio.com/trilhokids/api/install.php

require_once 'config.php';

// Bloqueia acesso em ambiente Docker (DB_HOST = db)
if (getenv('DB_HOST') === 'db') {
    die('<pre style="color:orange;padding:20px">
⚠️  Este script é para produção (cPanel).
Em Docker, o banco já é criado automaticamente pelo init.sql.
</pre>');
}

try {
    $db = getDB();

    $db->exec("
        CREATE TABLE IF NOT EXISTS perfis (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome       VARCHAR(100) NOT NULL UNIQUE,
            criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo '<pre style="font-family:monospace;padding:20px;background:#0f0;color:#000">';
    echo "✅ Tabelas criadas com sucesso!\n\n";
    echo "  • perfis\n  • progresso\n  • quizzes\n  • historia\n\n";
    echo "⚠️  APAGUE este arquivo (install.php) agora!\n";
    echo '</pre>';

} catch (PDOException $e) {
    echo '<pre style="color:red;padding:20px">❌ Erro: ' . $e->getMessage() . '</pre>';
}
