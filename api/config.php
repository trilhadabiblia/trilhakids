<?php
// ================================================
// CONFIGURAÇÃO — TRILHO KIDS API
// ================================================
// Em Docker: variáveis vêm do docker-compose (env).
// Em produção (cPanel): substitua os valores padrão
// pelos dados reais do seu MySQL, ou defina as
// variáveis de ambiente no painel da hospedagem.
// ================================================

define('DB_HOST',    getenv('DB_HOST')     ?: 'localhost');
define('DB_NAME',    getenv('DB_NAME')     ?: 'SEU_BANCO');
define('DB_USER',    getenv('DB_USER')     ?: 'SEU_USUARIO');
define('DB_PASS',    getenv('DB_PASS')     ?: 'SUA_SENHA');
define('DB_CHARSET', 'utf8mb4');

define('SENHA_ADMIN', getenv('SENHA_ADMIN') ?: 'trilho2025');

// ── Conexão PDO (singleton) ──────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST, DB_NAME, DB_CHARSET
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        PDO::MYSQL_ATTR_FOUND_ROWS   => true, // rowCount() retorna linhas encontradas, não apenas alteradas
    ]);

    return $pdo;
}
