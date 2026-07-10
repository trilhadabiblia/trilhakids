# Deploy na VPS (Hostinger KVM) — Trilho Kids → Instagram

Roda na mesma VPS do WAHA como um **worker leve**: só a pasta `tools/instagram`.
As imagens e o conteúdo dos livros são puxados em tempo real do host público
`https://trilhokids.com.br` (modo remoto, ativado automaticamente quando não há o
repositório local). Publica via `graph.instagram.com` e hospeda os PNGs
renderizados no `cafecomhomensdedeus.com.br` (`api/ig_upload.php`).

> Assume Debian/Ubuntu (apt). KVM 1 = 1 vCPU / 4 GB — o render usa Chromium por
> pouco tempo, um slide por vez. **Não precisa** dos 2.8 GB de imagens na VPS.

## 1. Levar só a pasta tools/instagram para a VPS

Como não precisamos das imagens, baixamos apenas a pasta do pipeline.

**Opção A — git com clone parcial (recomendado; só uns KB, dá `git pull` depois):**
```bash
sudo apt-get install -y git
cd /home/USUARIO
git clone --depth 1 --filter=blob:none --sparse https://github.com/trilhadabiblia/trilhakids.git
cd trilhakids
git sparse-checkout set tools/instagram
```
> Repositório privado: use `https://<TOKEN>@github.com/...`.
> Atualizar depois: `git pull`.

**Opção B — copiar do seu PC (rsync, sem node_modules):**
```bash
rsync -av --exclude node_modules --exclude out --exclude '.env' --exclude '.vps-env' \
  ./tools/instagram/  USUARIO@SEU_VPS:/home/USUARIO/trilhakids/tools/instagram/
```

Nos dois casos o pipeline fica em `/home/USUARIO/trilhakids/tools/instagram`.

## 2. Preparar o ambiente (script)

```bash
cd /home/USUARIO/trilhakids/tools/instagram
bash setup-vps.sh
```

O script instala Node 20, Chromium + dependências de headless, roda `npm install`
(reusando o Chromium do sistema) e cria o `.vps-env`.

## 3. Credenciais (`.vps-env`)

Não há `env.php` na VPS, então as credenciais ficam no `.vps-env` (gitignored).
Preencha com os valores do `config/env.php` do host:

```bash
nano .vps-env
# IG_USER_ID          = 17841471595196388
# IG_ACCESS_TOKEN     = <token longo IGAA...>
# ANTHROPIC_API_KEY   = <chave da Anthropic>
# IG_UPLOAD_TOKEN     = <o mesmo IG_ENDPOINT_TOKEN do env.php do host>
```

Conferir (sem expor segredos):
```bash
source .vps-env && node cli.js config
```

## 4. Renovação automática do token (60 dias)

O token do Instagram Login expira em 60 dias, mas se renova sozinho (sem app secret):

```bash
source .vps-env && node cli.js refresh-token
```

Isso grava um `.ig-token.json` que o pipeline passa a usar (tem prioridade sobre o
`.vps-env`). Rode uma vez agora e agende no cron (item 6) para nunca expirar.

## 5. Testar

```bash
source .vps-env
node cli.js carrossel --livro jonas --dry-run   # gera em ./out, não publica
node cli.js carrossel --livro jonas             # publica de verdade
```

Antes de subir a `api/ig_upload.php` atualizada (que carrega o `env.php`) para o host,
confirme que `IG_UPLOAD_TOKEN` == `IG_ENDPOINT_TOKEN` do host.

## 6. Agendar (cron)

```bash
chmod +x /home/USUARIO/trilhakids/tools/instagram/publicar.sh
crontab -e
```

```cron
# Renova o token todo dia 1º às 03:00 (mantém sempre válido)
0 3 1 * * /home/USUARIO/trilhakids/tools/instagram/publicar.sh refresh-token >> /var/log/trilho-ig.log 2>&1

# Carrossel do próximo livro da rotação — seg/qua/sex às 09:00
0 9 * * 1,3,5 /home/USUARIO/trilhakids/tools/instagram/publicar.sh proximo --formato carrossel >> /var/log/trilho-ig.log 2>&1

# Story do próximo livro — ter/qui às 18:00
0 18 * * 2,4 /home/USUARIO/trilhakids/tools/instagram/publicar.sh proximo --formato story >> /var/log/trilho-ig.log 2>&1
```

O `publicar.sh` carrega o `.vps-env` sozinho. `proximo` percorre os livros na ordem
canônica (estado em `agenda.json`) e só avança quando publica com sucesso.

## Solução de problemas

- **`Failed to launch the browser process`** → falta dependência do Chromium (rode o
  `setup-vps.sh` de novo) ou `PUPPETEER_EXECUTABLE_PATH` errado no `.vps-env`.
- **`IG API erro 190 / token`** → rode `node cli.js refresh-token`; se falhar, o token
  expirou (>60 dias sem renovar) — gere um novo no painel da Meta.
- **`Falha ao hospedar imagem`** → `IG_UPLOAD_TOKEN` diferente do `IG_ENDPOINT_TOKEN`
  do host, ou `api/ig_upload.php` desatualizada no host (precisa carregar o `env.php`).
- **Scripts com erro de fim de linha** (`\r`) → `sed -i 's/\r$//' *.sh` na VPS.
- **RAM apertada** → publique um formato por vez (o render já é sequencial).
