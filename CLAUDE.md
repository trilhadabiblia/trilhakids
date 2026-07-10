# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

```bash
npm start        # serves the project at localhost:3000 using `serve . -c ./serve.json`
```

No build step — this is a static site deployed to Vercel (`vercel.json` configures static serving + clean-URL rewrites). `serve.json` sets `directoryListing: false`; `serve` (v14) applies `cleanUrls` by default, mapping `/livro` → `livro.html`. The student auth token uses a fragment hash (`#token=`) so it survives those redirects.

`jimp` is a dev dependency used for one-off image processing scripts (not part of serving).

## Architecture Overview

**Trilho Kids** is a children's Bible learning portal (in Portuguese/pt-BR) for IBP church. It is a static HTML/CSS/JS frontend using Tailwind CSS via CDN (no compilation step), backed by an **external PHP + MySQL API**. Students access it by scanning a personal QR code on their phone.

There is also a full **README.md** (in Portuguese) and `docs/system_architecture.md` — cross-reference them for deeper detail; keep both and this file in sync when the architecture changes.

### Page Structure

- `index.html` — Home portal with navigation cards
- `menu.html` — Shared sidebar component (hamburger menu with Bible book navigation)
- `menu.js` — Dynamically injects `menu.html` into every page via `fetch('../menu.html')` and re-executes inline scripts; included at the bottom of every page's `<body>`
- `gamificacao.js` — Global gamification system (`TrilhoKidsGame` class), exposes `window.trilhoGame`; included on every content page
- `perfil.js` — Profile selector, auto-injected by `menu.js`
- `acesso.js` — Progressive book-access guard (see below)
- `livros.js` — Exposes `window.LIVROS_CANONICOS`, the canonical ordering of all 66 books (`{ordem, nome, pasta, secao}`); consumed by `acesso.js` and the admin unlock-calendar selector
- `entrar.html` — Student QR-code authentication page
- `progresso.html` — Student progress dashboard (stats, badges, level, history)

### PWA (installable + offline)

- `manifest.json` — Web app manifest (standalone, portrait, theme `#7c3aed`, 192/512 maskable icons)
- `sw.js` — Service worker (`trilhokids-v1` cache), network-first with offline fallback to `/index.html`

### Book Pages Pattern

Each Bible book has its own folder (e.g., `genesis/`, `exodo/`, `jonas/`). Inside:
- `index.html` — Book landing/hub page (links to sub-pages)
- `[book].html` — Visual summary with print support, images, modals
- Image assets: `[book]-capa.png`, `-quem-e.png`, `-o-que-conta.png`, `-por-que-importante.png`, `-proposito.png`, `-curiosidade.png` (plus `_old` legacy variants)

Old Testament book folders live at root (~41 folders across the five OT sections). Category hub pages at root: `pentateuco.html`, `historicos.html`, `poeticos.html`, `profetas-maiores.html`, `profetas-menores.html`.

New Testament lives under `novotestamento/` — 27 book subfolders + 5 category hubs (`evangelhos.html`, `historico.html`, `cartasdepaulo.html`, `outrascartas.html`, `profetico.html`) + its own `index.html` and `menu.html`.

### Gamification System (`gamificacao.js`)

`TrilhoKidsGame` (v3.0) is a client-side class exposing `window.trilhoGame`. It talks to the remote PHP API, with a **local-dev API switch**: `http://localhost:8080` on localhost, else `https://cafecomhomensdedeus.com.br/trilhokids/api`.

It manages:
- **Profiles** — two types via `_perfilTipo`:
  - `'qr'` — authenticated student; all progress is saved to the API
  - `'local'` — anonymous visitor; no server progress, profile kept in `localStorage`
- **Points & Levels** — 10 levels from Iniciante (0pts) to Lenda (10000pts)
- **Badges** — 30+ badges across categories: section, performance, points, special
- **Tracking** — `visitarLivro(name)`, `visitarHeroi(name)`, `completarQuiz(name, acertos, total)`
- **Admin** — `adicionarPontosManual(aluno, qty, motivo, senha)`

Call gamification methods from each book/character/quiz page to award points automatically. `visitarLivro` respects `window.acessoLiberadoPromise` so points are **not** awarded for a locked book.

### Progressive Access Control (`acesso.js` + `livros.js`)

Books can be gated by a release schedule so content unlocks over time:
- `acesso.js` injects a blocking overlay immediately on a book page, then removes it after an async check against `api/acesso.php` (schedule defined via `api/calendario.php`).
- It exposes `window.acessoLiberadoPromise`, created synchronously by `menu.js` before its first `await`, and consumed by `gamificacao.js` to avoid awarding points on locked books.

### Authentication

- **Student (QR code)** — Admin generates a unique hex token per student. The printed QR points to `/entrar#token=<TOKEN>`. `entrar.html` validates via `GET /api/entrar.php?token=...`, then `setPerfilAtivo(nome)` and redirects home. Session persists in `localStorage`.
- **Teacher/Admin (JWT)** — `POST /api/auth.php` returns an HS256 JWT (24h) stored in `localStorage`. `professor/auth.js` exposes a shared `Auth` object (`tk_prof_token`) that protects the teacher and admin pages.

### Teacher & Admin Subsystem

- `professor/` — Teacher area: `login.html`, `dashboard.html` (class ranking, per-student progress modal, manual points, QR printing, on-duty rota), and `auth.js` (shared JWT helper used by login, dashboard, and admin)
- `admin/` — Admin console (`index.html`, large single-page app): institutions, classes, teachers (with role titular/auxiliar), student QR-token generation, and per-class unlock/duty calendar (uses `calendario.php` + `livros.js`)

### Backend API (`api/` folder — PHP, hosted externally)

PHP files communicating with a MySQL database (PHP 8.2 + MySQL 8; Docker in dev on `:8080`, cPanel in production). **Not served by Vercel.**

- Auth/JWT: `entrar.php`, `auth.php`, `auth_middleware.php`, `jwt.php`, `cors.php`, `acesso.php`
- Student data: `perfis.php`, `progresso.php`, `pontos.php`, `historia.php`
- Teacher/admin: `professores.php`, `turmas.php`, `turma_professores.php`, `instituicoes.php`, `dashboard.php`, `calendario.php`
- Media/leads/setup: `img.php`, `upload.php`, `leads.php`, `config.php`, `install.php`, `setup.php`, `migrate.php`

Key DB tables: `professores`, `turmas`, `turma_professores`, `perfis`, `progresso`, `quizzes`, `historia`, `calendario_turmas`, `instituicoes`.

### Quiz System

- Per-book quiz library: `quiz/antigo-testamento/` (~40 JSON files + matching `quiz-[book].html` players) and `quiz/novo-testamento/` (~27 JSON + players). Each JSON holds ~10 multiple-choice questions with biblical justification.
- On finishing, a quiz page calls `trilhoGame.completarQuiz(nome, acertos, total)`.
- `quiz/quizbuilder.html` — AI-powered quiz generator tool (for teachers/admins)
- `tools/agent_quiz.js` — Node/Express proxy that calls the Anthropic API to generate quiz questions; requires `ANTHROPIC_API_KEY` (verify the model id in the file before relying on it)
- `quiz.html` — legacy single-page player (`quiz_old.html` is older still)

### Characters (`personagens/`)

- `origens.html`, `patriarcas.html`, `herois.html`, `ancestrais.html` — Character group pages
- Visiting a character calls `trilhoGame.visitarHeroi(name)` for gamification points
- `personagens/ar/` — **WebAR** (image-tracking augmented reality) experience, e.g. `sansao.html` with `models/` and `targets/`

### Other Feature Areas

- `games/` — Mini-games / interactive pages (`aura_quest_rpg_game.html`, `bibleemojis.html`, `missao-patmos.html`, etc.)
- `kidiscipulos/` — Discipleship module with its own `quiz/` (themed JSONs: carnaval, halloween, reforma, missões, etc.) and `quizbuilder.js`
- `planner/` — Curriculum/lesson planner
- `aulas/projeto.js` — A React/JSX slide deck ("TrilhoKids 2026") using `lucide-react`; **not wired into any build** (the rest of the site is vanilla JS)
- `bio/`, `oferta/`, `arduino-landing/` — Marketing/link-in-bio, offering/donation, and a separate hardware/digital-book landing (own `README.md`)
- `docs/` — Project documentation (`system_architecture.md`, pitch deck, presentation)

## Profile Selector System (`perfil.js`)

`perfil.js` is auto-injected by `menu.js` into every page. It:
- Shows a "Quem está jogando?" modal on first load if no profile is active
- Renders a fixed bottom-right button `🎮 [nome]` to switch profiles at any time
- Exposes `window.abrirModalPerfil()` and `window.fecharModalPerfil()` globally

**Dependency chain**: `gamificacao.js` → `menu.js` → `perfil.js` (injected dynamically). Pages that don't include `gamificacao.js` must add it manually (e.g., `quiz.html`).

## Adding a New Book

1. Create a folder `/{bookname}/` with `index.html` and `[bookname].html`
2. Add images following the naming convention: `[bookname]-capa.png`, `[bookname]-curiosidade.png`, etc.
3. Include `<script src="../gamificacao.js"></script>` and `<script src="../menu.js"></script>` at the bottom of `<body>`
4. Call `await trilhoGame.visitarLivro('Nome do Livro')` on page load (after profile is active)
5. Add the book to `livros.js` (`LIVROS_CANONICOS`) if it should participate in ordering/unlock scheduling
6. Link the book from the appropriate category hub page (e.g., `pentateuco.html`)
7. Add a quiz at `quiz/[antigo-testamento|novo-testamento]/quiz-[bookname].html` (+ JSON) if applicable
