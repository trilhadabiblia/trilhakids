<?php
// ================================================
// UPLOAD DE ASSET DO INSTAGRAM — TRILHO KIDS API
// ================================================
// Recebe o PNG renderizado pelo pipeline (tools/instagram) e o publica
// numa pasta pública, devolvendo a URL. A Graph API do Instagram baixa a
// imagem dessa URL na hora de publicar.
//
// POST multipart/form-data:
//   header  X-IG-Token: <segredo compartilhado>   (== IG_UPLOAD_TOKEN do .env)
//   campo   file: <imagem PNG/JPEG>
// → { ok, dados: { url: 'https://.../uploads/instagram/xxxx.png' } }
//
// Segurança: protegido por segredo, NÃO por JWT (o pipeline roda headless).
// Defina o segredo abaixo (ou via variável de ambiente IG_UPLOAD_TOKEN) e use
// o MESMO valor no .env do pipeline.

require_once 'cors.php';

// Carrega o config/env.php (putenv) para ter acesso a IG_ENDPOINT_TOKEN.
$envFile = dirname(__DIR__) . '/config/env.php';
if (file_exists($envFile)) require_once $envFile;

// ── Segredo compartilhado ────────────────────
// Prefira definir a env var IG_UPLOAD_TOKEN no cPanel. Como fallback, troque
// o valor abaixo por um segredo forte e único.
$SEGREDO = getenv('IG_UPLOAD_TOKEN') ?: getenv('IG_ENDPOINT_TOKEN') ?: 'troque-por-um-segredo-forte';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, null, 'Método não permitido.', 405);
}

$enviado = $_SERVER['HTTP_X_IG_TOKEN'] ?? '';
if (!hash_equals($SEGREDO, $enviado)) {
    responder(false, null, 'Não autorizado.', 401);
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
$maxSize = 8 * 1024 * 1024; // 8 MB (posts do Instagram até 8MB)

if ($file['size'] > $maxSize) {
    responder(false, null, 'Arquivo muito grande. Máximo 8 MB.', 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);
$exts  = ['image/jpeg' => 'jpg', 'image/png' => 'png'];

if (!array_key_exists($mime, $exts)) {
    responder(false, null, 'Formato não suportado. Use JPEG ou PNG.', 422);
}

$filename = bin2hex(random_bytes(12)) . '.' . $exts[$mime];

// api/ está em /trilhokids/api/ → sobe dois níveis para /trilhokids/uploads/
$dir = rtrim(dirname(dirname(__FILE__)), '/') . '/uploads/instagram/';
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    responder(false, null, 'Não foi possível criar o diretório de uploads.', 500);
}

if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
    responder(false, null, 'Erro ao gravar o arquivo no servidor.', 500);
}

$scheme   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'cafecomhomensdedeus.com.br';
$basePath = rtrim(str_replace('/api', '', dirname($_SERVER['SCRIPT_NAME'])), '/');
$url      = "$scheme://$host$basePath/uploads/instagram/$filename";

responder(true, ['url' => $url]);
