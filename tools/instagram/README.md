# Trilho Kids → Instagram

Pipeline que **gera** (imagem + legenda) e **publica automaticamente** posts, stories e carrosséis no Instagram a partir do conteúdo do portal Trilho Kids.

Visual **misto**: molduras novas na identidade da marca (violeta `#7c3aed` / fundo `#0a0818`) com as imagens já existentes de cada livro embutidas.

```
content.js   →  descobre livro + imagens do portal (usa livros.js)
secoes.js    →  extrai conteúdo determinístico da página (bullets, segredos, perguntas, desafios) — sem IA
caption.js   →  legenda + hashtags em pt-BR (via llm.js)
llm.js       →  cadeia de providers p/ legenda: Groq → NVIDIA → Anthropic
templates.js →  HTML da moldura (post/slide 1080x1080, story 1080x1920, card de texto)
render.js    →  HTML → PNG (Puppeteer)
host.js      →  sobe o PNG para URL pública (api/ig_upload.php)
instagram.js →  publica via Instagram Graph API
cli.js       →  orquestra tudo
```

## Por que precisa hospedar as imagens?

A Graph API do Instagram **não recebe o arquivo** — ela **baixa a imagem de um URL público** que você informa. Como o pipeline renderiza os PNGs na sua máquina, eles precisam ir para um host público antes de publicar. Usamos o endpoint `api/ig_upload.php` (no mesmo cPanel que já hospeda a API e serve `/uploads/` publicamente).

## Pré-requisitos

1. **Node 18+** (usa `fetch`, `FormData` e `Blob` globais).
2. **App na Meta** com:
   - Conta Instagram **Business ou Creator** conectada a uma Página do Facebook.
   - Permissões: `instagram_content_publish`, `instagram_basic`, `pages_read_engagement`.
   - Um **token de longa duração** (idealmente de *System User*, que não expira).
3. **Uma chave de LLM para as legendas** — na ordem `GROQ_API_KEY` (principal) →
   `NVIDIA_API_KEY` → `ANTHROPIC_API_KEY`. Basta uma; sem nenhuma, a legenda cai num
   texto offline simples (o conteúdo das imagens é determinístico, não usa IA).

## Instalação

```bash
cd tools/instagram
npm install            # baixa o Puppeteer + Chromium
cp .env.example .env   # preencha os valores
```

## Credenciais — reaproveita o `config/env.php` do projeto

O pipeline **lê as credenciais do `config/env.php`** (formato PHP `putenv('KEY=VALUE')`),
o mesmo usado pela pipeline do devocional. Não precisa duplicar nada num `.env`.

Chaves reaproveitadas: `IG_USER_ID`, `IG_ACCESS_TOKEN`, `IG_API_VERSION`,
`GROQ_API_KEY` (principal das legendas), `NVIDIA_API_KEY` / `ANTHROPIC_API_KEY`
(fallbacks), `FB_APP_ID`, `FB_APP_SECRET`, e `IG_ENDPOINT_TOKEN`
(usado como segredo do upload, se `IG_UPLOAD_TOKEN` não estiver definido).

**Legendas — cadeia de providers:** `llm.js` tenta em ordem **Groq → NVIDIA → Anthropic**
(só os que têm chave; o 1º que responder vence). Groq e NVIDIA usam API compatível com
OpenAI (retry automático em erros transitórios 429/5xx antes de passar ao próximo).
Modelos default: Groq `llama-3.3-70b-versatile`, NVIDIA `deepseek-ai/deepseek-v4-flash`,
Anthropic `claude-opus-4-8`. Sobrescreva a ordem com `CAPTION_PROVIDERS` (csv) e os
modelos/URLs com `GROQ_MODEL`/`GROQ_BASE_URL`/`NVIDIA_MODEL`/`NVIDIA_BASE_URL`.
Adicione no `config/env.php` (ou `.env`):
```php
putenv('GROQ_API_KEY=gsk_...');
```

**Onde o pipeline procura o `env.php`** (primeiro que existir):
1. variável de ambiente `TRILHO_ENV_PHP` (caminho absoluto — recomendado);
2. `<repo>/config/env.php`;
3. `<repo>/../config/env.php`;
4. `<repo>/../devocional/config/env.php`.

Se o seu `env.php` fica noutro lugar (ex: no VPS do devocional), defina:
```bash
export TRILHO_ENV_PHP=/caminho/para/config/env.php   # Linux/VPS
$env:TRILHO_ENV_PHP="C:\caminho\config\env.php"        # PowerShell
```

Confira o que foi carregado (sem expor segredos):
```bash
node cli.js config
```

**Falta só uma chave no seu `env.php`:** `IG_UPLOAD_URL`, apontando para onde o
`ig_upload.php` estiver publicado (veja abaixo). Ex:
```php
putenv('IG_UPLOAD_URL=https://cafecomhomensdedeus.com.br/trilhokids/api/ig_upload.php');
```

> O `.env` local (opcional) continua funcionando e **sobrepõe** o `env.php` — útil para testes.

## Publicar o `ig_upload.php` (uma vez)

1. Suba `api/ig_upload.php` para o cPanel junto com o resto da `api/`.
2. Defina a env var `IG_UPLOAD_TOKEN` no cPanel **ou** edite o `$SEGREDO` no topo do arquivo.
3. Use exatamente o mesmo valor em `IG_UPLOAD_TOKEN` no `.env` do pipeline.
4. Garanta que a pasta `/uploads/` seja pública (ela já é usada pelo upload de fotos).

## Uso

```bash
# Conferir credenciais carregadas do env.php (sem expor segredos)
node cli.js config

# Ver em QUAL perfil o token atual publica (confirmar antes de postar)
node cli.js whoami

# Ver os livros com imagens disponíveis
node cli.js listar

# Testar SEM publicar (só gera os PNGs em ./out e mostra a legenda)
node cli.js post --livro jonas --dry-run
node cli.js carrossel --livro genesis --dry-run
node cli.js story --livro jonas --dry-run
node cli.js segredos --livro isaias --dry-run   # carrossel dos "N Segredos" (modal da página)
node cli.js reflexao --livro isaias --dry-run    # carrossel "Perguntas para Pensar" + "Desafio da Semana"

# Publicar de verdade
node cli.js post      --livro jonas
node cli.js carrossel --livro genesis --max 5
node cli.js story     --livro jonas
node cli.js segredos  --livro isaias
node cli.js reflexao  --livro isaias

# Agenda da semana (para o cron): 1 livro/semana, formato conforme o dia
#   seg=carrossel · ter=story · qua=segredos · sex=reflexão · sáb=post+story (qui/dom folgam)
node cli.js proximo                        # publica o(s) formato(s) agendado(s) para hoje
node cli.js proximo --formato carrossel    # força um formato: carrossel | segredos | reflexao | post | story

# Campanha institucional (não é por livro — apresenta o projeto, a partir do pitch)
node cli.js campanha                       # lista as peças
node cli.js campanha --peca demonstracao   # gera/publica uma peça

# Frames de Reel (1080x1920) para montar vídeo no CapCut — NÃO publica
node cli.js reel                           # lista os roteiros
node cli.js reel --roteiro reel2           # exporta os frames para ./out
```

### Formatos

| Comando | O que gera |
|---|---|
| `post` | 1 imagem do livro (capa por padrão) |
| `story` | 1 imagem vertical (1080x1920) + CTA |
| `carrossel` | versículo + slides das seções (bullets determinísticos por seção) |
| `segredos` | capa + 1 card por "segredo" do modal (título + poema + versículo) |
| `reflexao` | capa + "Perguntas para Pensar" + "Desafio da Semana" |
| `campanha` | carrossel institucional on-brand (capa + cards), a partir do pitch |
| `reel` | frames verticais 1080x1920 para montar reels no CapCut (**não publica**) |

> `segredos` e `reflexao` são carrosséis **só de texto** (extraídos deterministicamente
> da página), abertos pela capa do livro. Se a página do livro não tiver essas seções,
> o comando avisa e não gera nada.

> **Campanha institucional** (`campanha.js`): peças de marketing fixas para quem *decide*
> (líderes de ministério, escolas cristãs), derivadas do `bio/pitch.html` — não puxam
> material de livro. Cada peça é um carrossel on-brand com legenda/hashtags prontas e CTA
> para a bio. Peças: `problema`, `solucao`, `apostila`, `gamificacao`, `instituicoes`,
> `demonstracao`. No web app aparecem no formato **Campanha** (seletor de peça).

> **Frames de Reel** (`reels.js` + `prompt/reels-fase1.md`): cartelas verticais on-brand
> (capa, "reviravolta", quiz) para montar os reels da Fase 1 no CapCut. O pipeline **não
> publica reels** (é vídeo) — os frames são exportados para `./out` (CLI) ou visualizados
> para download no web app (formato **Reel**, sem botão publicar). Roteiros: `reel1` (QR
> mágico), `reel2` (Se a Bíblia fosse série), `reel3` (Quiz em 10s). Os roteiros completos,
> com legenda/hashtags e ordem de publicação, estão em `prompt/reels-fase1.md`.

> **Publicação via `graph.instagram.com`** (Instagram Business Login), o mesmo host do
> `InstagramClient.php` do devocional — compatível com o token `IGAA…`. Ajuste com `IG_GRAPH_HOST` se precisar.

## Deploy na VPS + agendamento

Veja **[DEPLOY.md](./DEPLOY.md)** — passo a passo para rodar na VPS do WAHA/devocional
(Chromium do sistema, `env.php` compartilhado) e agendar por cron com o comando `proximo`.

Opções:
- `--livro <pasta>` — pasta do livro (ex: `jonas`, `genesis`, `1samuel`). Obrigatório.
- `--imagem <sufixo>` — escolhe a imagem do post/story (ex: `curiosidade`, `capa`, `proposito`).
- `--max <n>` — nº de slides do carrossel (2 a 10, padrão 6).
- `--dry-run` — gera e mostra, mas não hospeda nem publica.

## Dicas / limites

- **Sempre teste com `--dry-run` primeiro** e confira os PNGs em `./out`.
- Carrossel: **2 a 10** imagens.
- Stories não exibem legenda (a Graph API ignora `caption` em `STORIES`).
- O token de página expira (~60 dias) se não for de System User — renove antes de publicar.
- Não comite `.env` nem `out/` (já estão no `.gitignore`).

## Próximos passos possíveis

- Agendamento (cron) para publicar num calendário fixo.
- Fonte de conteúdo por curiosidade/versículo e por personagem (além dos livros).
- Fila de aprovação antes de publicar.
