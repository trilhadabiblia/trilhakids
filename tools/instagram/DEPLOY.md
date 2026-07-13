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
# GROQ_API_KEY        = <chave do Groq — provider principal das legendas>
# NVIDIA_API_KEY      = <chave da NVIDIA — fallback (opcional)>
# ANTHROPIC_API_KEY   = <chave da Anthropic — fallback (opcional)>
# IG_UPLOAD_TOKEN     = <o mesmo IG_ENDPOINT_TOKEN do env.php do host>
```

> Legendas: `llm.js` usa **Groq → NVIDIA → Anthropic** (o primeiro que responder vence).
> Basta uma das chaves; sem nenhuma, a legenda cai no texto offline. Reordene com
> `CAPTION_PROVIDERS` (csv, ex.: `groq,anthropic`).

Conferir (sem expor segredos):
```bash
source .vps-env && node cli.js config
```

## 3.1. Em QUAL perfil o pipeline publica (e como trocar)

O perfil de destino é definido por **`IG_USER_ID` + `IG_ACCESS_TOKEN`** (o token do
Instagram Login pertence a UMA conta). O host de upload (`IG_UPLOAD_URL`,
`cafecomhomensdedeus.com.br`) é só onde os PNGs ficam hospedados para a Graph API
baixar — **não** tem relação com o perfil publicado.

Confirme a conta do token atual:
```bash
source .vps-env && node cli.js whoami   # 👤 @usuario (user_id: ...) + checa se bate com IG_USER_ID
```

**Trocar de perfil** (ex.: de `@cafecomhomensdedeus` para `@portaltrilhokids`):
1. A conta destino precisa ser **Profissional** (Business/Creator) e estar autorizada no
   mesmo app Meta (login via Instagram Business Login **como a conta destino**).
2. Gere o **token longo (60d)** dessa conta (mesmo processo do token atual, autorizando a
   conta destino) e descubra o id:
   `curl "https://graph.instagram.com/me?fields=user_id,username&access_token=SEU_TOKEN"`.
3. Atualize `IG_USER_ID` e `IG_ACCESS_TOKEN` no `.vps-env` (no host: `config/env.php`).
4. **Apague o `.ig-token.json`** — ele SOBREPÕE o `IG_ACCESS_TOKEN`; se tiver o token
   antigo, você continuaria publicando na conta antiga:
   ```bash
   rm -f .ig-token.json
   source .vps-env && node cli.js refresh-token   # recria já com o token novo
   ```
5. Confirme: `node cli.js whoami` deve mostrar a conta destino e `✅ IG_USER_ID confere`.

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

# Agenda editorial: um cron só, todos os dias às 09:00. O `proximo` já sabe o
# livro da semana e o(s) formato(s) do dia (seg=carrossel, ter=story, qua=segredos,
# sex=reflexão, sáb=post+story; qui/dom folgam e o comando sai sem publicar).
0 9 * * * /home/USUARIO/trilhakids/tools/instagram/publicar.sh proximo >> /var/log/trilho-ig.log 2>&1
```

O `publicar.sh` carrega o `.vps-env` sozinho. `proximo` trabalha **um livro por
semana** (rotação determinística pela data, âncora em `agenda.json`) e publica o
formato agendado para o dia. Force um formato pontual com `--formato <tipo>`.

## Solução de problemas

- **`Failed to launch the browser process`** → falta dependência do Chromium (rode o
  `setup-vps.sh` de novo) ou `PUPPETEER_EXECUTABLE_PATH` errado no `.vps-env`.
- **`IG API erro 190 / token`** → rode `node cli.js refresh-token`; se falhar, o token
  expirou (>60 dias sem renovar) — gere um novo no painel da Meta.
- **`Falha ao hospedar imagem`** → `IG_UPLOAD_TOKEN` diferente do `IG_ENDPOINT_TOKEN`
  do host, ou `api/ig_upload.php` desatualizada no host (precisa carregar o `env.php`).
- **Scripts com erro de fim de linha** (`\r`) → `sed -i 's/\r$//' *.sh` na VPS.
- **RAM apertada** → publique um formato por vez (o render já é sequencial).
