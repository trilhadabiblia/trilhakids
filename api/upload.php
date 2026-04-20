<?php
// ================================================
// UPLOAD DE FOTO — TRILHO KIDS API
// ================================================
// POST multipart/form-data: file (imagem) + tipo ('aluno'|'professor')
// → { ok, dados: { url: 'https://...' } }
// Salva em /uploads/fotos/{tipo}/ relativo à raiz do site.
// CORS para a pasta uploads: adicione .htaccess com Header set Access-Control-Allow-Origin "*"

require_once 'cors.php';
require_once 'config.php';
require_once 'auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, null, 'Método não permitido.', 405);
}

requireAuth();

$tipo = sanitize($_POST['tipo'] ?? '');
if (!in_array($tipo, ['aluno', 'professor'])) {
    responder(false, null, 'tipo deve ser "aluno" ou "professor".', 422);
}

$errCodes = [
    UPLOAD_ERR_INI_SIZE   => 'arquivo excede o limite do servidor',
    UPLOAD_ERR_FORM_SIZE  => 'arquivo excede o limite do formulário',
    UPLOAD_ERR_PARTIAL    => 'upload incompleto',
    UPLOAD_ERR_NO_FILE    => 'nenhum arquivo enviado',
    UPLOAD_ERR_NO_TMP_DIR => 'diretório temporário ausente',
    UPLOAD_ERR_CANT_WRITE => 'não foi possível gravar no disco',
    UPLOAD_ERR_EXTENSION  => 'extensão PHP bloqueou o upload',
];

$errCode = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
if ($errCode !== UPLOAD_ERR_OK) {
    responder(false, null, 'Erro no upload: ' . ($errCodes[$errCode] ?? 'desconhecido') . '.', 422);
}

$file    = $_FILES['file'];
$maxSize = 2 * 1024 * 1024; // 2 MB

if ($file['size'] > $maxSize) {
    responder(false, null, 'Arquivo muito grande. Máximo 2 MB.', 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);
$exts  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

if (!array_key_exists($mime, $exts)) {
    responder(false, null, 'Formato não suportado. Use JPEG, PNG ou WebP.', 422);
}

$filename = bin2hex(random_bytes(12)) . '.' . $exts[$mime];

// api/ está em /trilhokids/api/ → sobe dois níveis para /trilhokids/uploads/
$dir = rtrim(dirname(dirname(__FILE__)), '/') . '/uploads/fotos/' . $tipo . '/';
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    responder(false, null, 'Não foi possível criar o diretório de uploads.', 500);
}

if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
    responder(false, null, 'Erro ao gravar o arquivo no servidor.', 500);
}

$scheme   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'cafecomhomensdedeus.com.br';
$basePath = rtrim(str_replace('/api', '', dirname($_SERVER['SCRIPT_NAME'])), '/');
$url      = "$scheme://$host$basePath/uploads/fotos/$tipo/$filename";

responder(true, ['url' => $url]);
