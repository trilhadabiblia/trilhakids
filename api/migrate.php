<?php
// ================================================
// MIGRATE v2 — TRILHO KIDS API
// ================================================
// Cria novas tabelas e adiciona colunas às existentes.
// SEGURO rodar mais de uma vez — todas as operações são idempotentes.
// Acesse: cafecomhomensdedeus.com.br/trilhokids/api/migrate.php

require_once 'config.php';

$log = [];

function addColIfMissing(PDO $db, string $table, string $column, string $def, array &$log): void {
    $stmt = $db->prepare("
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);
    if ($stmt->fetchColumn() == 0) {
        $db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $def");
        $log[] = "  ✅ ALTER $table ADD $column";
    } else {
        $log[] = "  ⏭  $table.$column já existe";
    }
}

try {
    $db = getDB();

    // ── 1. Instituições ────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS instituicoes (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome        VARCHAR(150) NOT NULL,
            tipo        ENUM('igreja','escola') DEFAULT 'igreja',
            cidade      VARCHAR(100),
            responsavel VARCHAR(100),
            telefone    VARCHAR(20),
            email       VARCHAR(150),
            criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela instituicoes criada/verificada";

    // Colunas novas em instituicoes (caso a tabela já existisse sem elas)
    addColIfMissing($db, 'instituicoes', 'responsavel', 'VARCHAR(100) NULL AFTER cidade', $log);
    addColIfMissing($db, 'instituicoes', 'telefone',    'VARCHAR(20)  NULL AFTER responsavel', $log);
    addColIfMissing($db, 'instituicoes', 'email',       'VARCHAR(150) NULL AFTER telefone', $log);

    // ── 2. Professores ─────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS professores (
            id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome           VARCHAR(100) NOT NULL,
            email          VARCHAR(150) NOT NULL UNIQUE,
            senha_hash     VARCHAR(255) NOT NULL,
            instituicao_id INT UNSIGNED NULL,
            is_admin       TINYINT(1) DEFAULT 0,
            is_responsavel TINYINT(1) DEFAULT 0,
            ativo          TINYINT(1) DEFAULT 1,
            criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela professores criada/verificada";
    addColIfMissing($db, 'professores', 'is_responsavel', 'TINYINT(1) DEFAULT 0 AFTER is_admin', $log);

    // ── 3. Turmas ──────────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS turmas (
            id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome           VARCHAR(100) NOT NULL,
            instituicao_id INT UNSIGNED NOT NULL,
            idade_inicial  TINYINT UNSIGNED NULL,
            idade_final    TINYINT UNSIGNED NULL,
            ativo          TINYINT(1) DEFAULT 1,
            criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela turmas criada/verificada";
    addColIfMissing($db, 'turmas', 'idade_inicial', 'TINYINT UNSIGNED NULL AFTER nome', $log);
    addColIfMissing($db, 'turmas', 'idade_final',   'TINYINT UNSIGNED NULL AFTER idade_inicial', $log);

    // ── 4. Turma × Professores ─────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS turma_professores (
            id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            turma_id     INT UNSIGNED NOT NULL,
            professor_id INT UNSIGNED NOT NULL,
            papel        ENUM('titular','auxiliar') DEFAULT 'titular',
            criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_turma_prof (turma_id, professor_id),
            FOREIGN KEY (turma_id)     REFERENCES turmas(id)      ON DELETE CASCADE,
            FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela turma_professores criada/verificada";

    // ── 5. Calendário das turmas ───────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS calendario_turmas (
            id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            turma_id     INT UNSIGNED NOT NULL,
            professor_id INT UNSIGNED NOT NULL,
            data         DATE NOT NULL,
            hora_inicio  TIME NULL,
            hora_fim     TIME NULL,
            observacao   VARCHAR(100),
            livro_ordem  TINYINT UNSIGNED NULL,
            criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (turma_id)     REFERENCES turmas(id)      ON DELETE CASCADE,
            FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela calendario_turmas criada/verificada";
    addColIfMissing($db, 'calendario_turmas', 'livro_ordem', 'TINYINT UNSIGNED NULL', $log);

    // ── 6. Leads ───────────────────────────────
    $db->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nome              VARCHAR(150) NOT NULL,
            email             VARCHAR(150) NOT NULL UNIQUE,
            tipo              ENUM('igreja','escola') DEFAULT 'igreja',
            mensagem          TEXT,
            data_preferencial DATE NULL,
            status            ENUM('novo','contatado','convertido','descartado') DEFAULT 'novo',
            criado_em         DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    $log[] = "✅ Tabela leads criada/verificada";

    // ── 7. Colunas novas em perfis ─────────────
    $log[] = "Verificando colunas novas em perfis...";
    addColIfMissing($db, 'perfis', 'turma_id',             'INT UNSIGNED NULL', $log);
    addColIfMissing($db, 'perfis', 'token_qr',             'VARCHAR(16) NULL',  $log);
    addColIfMissing($db, 'perfis', 'data_nascimento',       'DATE NULL',         $log);
    addColIfMissing($db, 'perfis', 'nome_responsavel',      'VARCHAR(100) NULL', $log);
    addColIfMissing($db, 'perfis', 'telefone_responsavel',  'VARCHAR(20) NULL',  $log);
    addColIfMissing($db, 'perfis', 'email_responsavel',     'VARCHAR(150) NULL', $log);

    // Índice único token_qr (silencia se já existir)
    try {
        $db->exec("ALTER TABLE perfis ADD UNIQUE INDEX uq_token_qr (token_qr)");
        $log[] = "  ✅ Índice único token_qr adicionado";
    } catch (PDOException) {
        $log[] = "  ⏭  Índice token_qr já existe";
    }

    // FK perfis → turmas (silencia se já existir)
    try {
        $db->exec("ALTER TABLE perfis ADD CONSTRAINT fk_perfis_turma
                   FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL");
        $log[] = "  ✅ FK perfis.turma_id adicionada";
    } catch (PDOException) {
        $log[] = "  ⏭  FK perfis.turma_id já existe";
    }

    // ── Resultado ──────────────────────────────
    echo '<pre style="font-family:monospace;padding:20px;background:#1e1b4b;color:#c4b5fd;line-height:1.6">';
    echo "🚀 MIGRATE v2 — Trilho Kids\n\n";
    foreach ($log as $linha) echo "$linha\n";
    echo "\n✅ Migração concluída com sucesso!\n\n";
    echo "⚠️  Próximos passos:\n";
    echo "   1. Crie o primeiro admin via SQL no seu cPanel:\n\n";
    echo "      INSERT INTO professores (nome, email, senha_hash, is_admin)\n";
    echo "      VALUES ('Seu Nome', 'seu@email.com', '$2y\$10\$...' , 1);\n\n";
    echo "   2. Ou use o PHP para gerar o hash:\n\n";
    echo "      php -r \"echo password_hash('sua_senha', PASSWORD_BCRYPT);\"\n\n";
    echo "   3. Depois de criar o admin, APAGUE ou bloqueie este arquivo!\n";
    echo '</pre>';

} catch (PDOException $e) {
    echo '<pre style="color:red;padding:20px">';
    echo "❌ Erro na migração:\n" . $e->getMessage();
    echo '</pre>';
}
