<?php
// ================================================
// SETUP — Cria o primeiro admin
// ================================================
// Acesse UMA VEZ após subir o Docker ou após o
// install.php no cPanel, depois APAGUE este arquivo.
//
// Acesso: http://localhost:8080/setup.php
// Em produção: https://seu-dominio.com/api/setup.php
//
// Admin padrão criado:
//   E-mail: admin@trilhokids.com
//   Senha:  Admin@2025
// Troque a senha imediatamente após o primeiro acesso!
// ================================================

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

// Segurança básica: só funciona se ainda não existe nenhum admin
try {
    $db = getDB();

    $jaExiste = (int) $db->query("SELECT COUNT(*) FROM professores WHERE is_admin = 1")->fetchColumn();
    if ($jaExiste > 0) {
        die('<pre style="color:orange;padding:20px;font-family:monospace">
⚠️  Já existe um administrador cadastrado.
Este script não criou nada.
Apague o arquivo setup.php do servidor.
</pre>');
    }

    $email = 'admin@trilhokids.com';
    $senha = 'Admin@2025';
    $hash  = password_hash($senha, PASSWORD_BCRYPT);

    $db->prepare("
        INSERT INTO professores (nome, email, senha_hash, is_admin)
        VALUES ('Administrador', ?, ?, 1)
    ")->execute([$email, $hash]);

    echo '<pre style="font-family:monospace;padding:20px;background:#0a0;color:#fff">';
    echo "✅ Administrador criado com sucesso!\n\n";
    echo "   E-mail: $email\n";
    echo "   Senha:  $senha\n\n";
    echo "⚠️  APAGUE este arquivo (setup.php) agora!\n";
    echo "⚠️  Troque a senha assim que fizer login!\n";
    echo '</pre>';

} catch (PDOException $e) {
    echo '<pre style="color:red;padding:20px">❌ Erro: ' . $e->getMessage() . '</pre>';
}
