<?php
// ============================================
// CONFIGURAÇÃO DO BANCO — TRILHO KIDS API
// ============================================
// Preencha com os dados do seu cPanel MySQL

define('DB_HOST', 'localhost');
define('DB_NAME', 'SEU_BANCO');       // ex: cafecom_trilhokids
define('DB_USER', 'SEU_USUARIO');     // ex: cafecom_trilho
define('DB_PASS', 'SUA_SENHA');
define('DB_CHARSET', 'utf8mb4');

define('SENHA_ADMIN', 'trilho2025');  // troque antes de publicar!

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
    ]);
    return $pdo;
}
