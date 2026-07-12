# Deploy da versão web — Trilho Kids → Instagram

Complementa o **DEPLOY.md** (o pipeline já deve estar funcionando via `cli.js` na VPS).
Adiciona `server.js` + `public/index.html`, que expõem o pipeline como aplicação web
com **fila de aprovação**: gerar preview → revisar slides e legenda no navegador → publicar.

## 1. Copiar os arquivos

Coloque `server.js` e a pasta `public/` dentro de `tools/instagram/` (mesmo nível do `cli.js`):

```
tools/instagram/
├── cli.js
├── server.js        ← novo
├── public/
│   └── index.html   ← novo
└── ...
```

## 2. Instalar o Express e definir o token da web

```bash
cd /home/USUARIO/trilhakids/tools/instagram
npm install express
echo "export WEB_TOKEN=$(openssl rand -hex 24)" >> .vps-env
grep WEB_TOKEN .vps-env   # anote: é a senha de acesso pela web
```

> O `WEB_TOKEN` protege todos os endpoints. Sem ele o servidor **não sobe**.

## 3. Rodar com PM2

```bash
npm install -g pm2
bash -c 'source .vps-env && pm2 start server.js --name trilho-ig-web --update-env'
pm2 save && pm2 startup
```

Teste local: `curl -H "Authorization: Bearer $WEB_TOKEN" http://127.0.0.1:3001/api/status`

## 4. DNS + Nginx + HTTPS

1. **DNS**: no painel do domínio, crie um registro `A`:
   `ig.trilhokids.com.br → IP da VPS` (TTL 3600). Aguarde propagar (`dig ig.trilhokids.com.br`).
2. **Nginx** (`/etc/nginx/sites-available/trilho-ig`):

```nginx
server {
    listen 80;
    server_name ig.trilhokids.com.br;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;   # render + publicação podem demorar
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/trilho-ig /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ig.trilhokids.com.br
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp   # a 3001 fica fechada
```

## 5. Usar

Abra `https://ig.trilhokids.com.br`, informe o `WEB_TOKEN` e:

1. **Gerar preview** — escolha formato + livro (ou "Próximo da rotação"). Equivale ao
   `--dry-run`: renderiza os PNGs e a legenda, nada é publicado.
2. **Revisar** — os slides aparecem lado a lado; a legenda é **editável**.
3. **Publicar** — hospeda no `ig_upload.php` e publica via Graph API. Se o preview
   veio da rotação, o `agenda.json` avança automaticamente (o cron continua em dia).

## Notas de operação

- **Fila**: o servidor processa **um job por vez** (render/publicação) para não
  disputar RAM com o WAHA na KVM. Requisições simultâneas aguardam na fila.
- **Chromium**: fecha ao fim de cada geração (mesmo padrão do `cli.js`).
- **Previews expiram em 1 h** (PNGs temporários em `out/` são apagados).
- **Cron continua funcionando** normalmente — a web usa o mesmo `agenda.json`,
  então rotação manual e agendada não se atropelam (mas evite publicar pela web
  no exato horário do cron).
- **Proteção anti-duplicidade**: um preview só pode ser publicado uma vez.
