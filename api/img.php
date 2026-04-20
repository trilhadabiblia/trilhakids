<?php
// ================================================
// IMG — TRILHO KIDS API
// ================================================
// GET /img.php?path=fotos/aluno/xxx.jpg
// Retorna imagem como base64 para uso em PDF (evita CORS em canvas).

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

requireAuth();

$path = $_GET['path'] ?? '';

// Aceita apenas fotos/aluno/... ou fotos/professor/... com extensão válida
if (!preg_match('#^fotos/(aluno|professor)/[a-f0-9]+\.(jpg|png|webp)$#i', $path)) {
    responder(false, null, 'Caminho inválido.', 400);
}

$file = realpath(dirname(dirname(__FILE__)) . '/uploads/' . $path);
$base = realpath(dirname(dirname(__FILE__)) . '/uploads/fotos');

// Garante que o arquivo está dentro da pasta uploads/fotos
if (!$file || !$base || strpos($file, $base) !== 0 || !file_exists($file)) {
    responder(false, null, 'Arquivo não encontrado.', 404);
}

$mime = mime_content_type($file);
$b64  = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($file));
responder(true, ['b64' => $b64]);
