# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

```bash
npm start        # serves the project at localhost:3000 using the `serve` package
```

No build step — this is a static site deployed to Vercel (`vercel.json` configures static serving of all files).

## Architecture Overview

**Trilho Kids** is a children's Bible learning portal (in Portuguese/pt-BR) for IBP church. It is a static HTML/CSS/JS site using Tailwind CSS via CDN (no compilation step).

### Page Structure

- `index.html` — Home portal with navigation cards
- `menu.html` — Shared sidebar component (hamburger menu with Bible book navigation)
- `menu.js` — Dynamically injects `menu.html` into every page via `fetch('../menu.html')` and re-executes inline scripts; included at the bottom of every page's `<body>`
- `gamificacao.js` — Global gamification system (`TrilhoKidsGame` class), exposes `window.trilhoGame`; included on every page

### Book Pages Pattern

Each Bible book has its own folder (e.g., `genesis/`, `exodo/`, `jonas/`). Inside:
- `index.html` — Book landing/hub page (links to sub-pages)
- `genesis.html` / `[book].html` — Visual summary with print support, images, modals
- Image assets (`*-capa.png`, `*-curiosidade.png`, etc.) used in the visual summaries

Category hub pages at root: `pentateuco.html`, `historicos.html`, `poeticos.html`, `profetas-maiores.html`, `profetas-menores.html`

New Testament lives under `novotestamento/` with subfolders (`evangelhos/`, `historico/`, `cartasdepaulo/`, `outrascartas/`, `profetico/`).

### Gamification System (`gamificacao.js`)

`TrilhoKidsGame` is a client-side class that communicates with a remote PHP API at `https://cafecomhomensdedeus.com.br/trilhokids/api`. It manages:
- **Profiles** — multi-student profiles per device (stored in `sessionStorage`)
- **Points & Levels** — 10 levels from Iniciante (0pts) to Lenda (10000pts)
- **Badges** — 30+ badges across categories: section, performance, points, special
- **Tracking** — `visitarLivro(name)`, `visitarHeroi(name)`, `completarQuiz(name, acertos, total)`
- **Admin** — `adicionarPontosManual(aluno, qty, motivo, senha)` with password `trilho2025`

Call gamification methods from each book/character/quiz page to award points automatically.

### Backend API (`api/` folder — PHP, hosted externally)

PHP files that communicate with a MySQL database on cPanel hosting:
- `perfis.php` — CRUD for student profiles
- `progresso.php` — Read/write student progress data
- `pontos.php` — Manual point awards by teachers
- `historia.php` — Activity history log
- `config.php` — Database credentials (not committed with real values)
- `install.php` — Database setup script

The `api/` folder is for the remote PHP backend, **not** served by Vercel.

### Quiz System

- `quiz.html` — Student-facing quiz player
- `quiz/quizbuilder.html` — AI-powered quiz generator tool (for teachers/admins)
- `tools/agent_quiz.js` — Node.js/Express proxy server that calls the Anthropic API (`claude-sonnet-4-20250514`) to generate quiz questions; requires `ANTHROPIC_API_KEY` env var

### Characters (`personagens/`)

- `origens.html`, `patriarcas.html`, `herois.html`, `ancestrais.html` — Character group pages
- Visiting a character calls `trilhoGame.visitarHeroi(name)` for gamification points

### Progress Dashboard

`progresso.html` — Shows the active student's stats, badges, level, and history by calling `trilhoGame.getEstatisticas()` and `trilhoGame.getBadgesConquistadas()`

## Profile Selector System (`perfil.js`)

`perfil.js` is auto-injected by `menu.js` into every page. It:
- Shows a "Quem está jogando?" modal on first load if no profile is active (`sessionStorage`)
- Renders a fixed bottom-right button `🎮 [nome]` to switch profiles at any time
- Exposes `window.abrirModalPerfil()` and `window.fecharModalPerfil()` globally

**Dependency chain**: `gamificacao.js` → `menu.js` → `perfil.js` (injected dynamically). Pages that don't include `gamificacao.js` must add it manually (e.g., `quiz.html`).

## Adding a New Book

1. Create a folder `/{bookname}/` with `index.html` and `[bookname].html`
2. Add images following the naming convention: `[bookname]-capa.png`, `[bookname]-curiosidade.png`, etc.
3. Include `<script src="../gamificacao.js"></script>` and `<script src="../menu.js"></script>` at the bottom of `<body>`
4. Call `await trilhoGame.visitarLivro('Nome do Livro')` on page load (after profile is active)
5. Link the book from the appropriate category hub page (e.g., `pentateuco.html`)
6. Add quiz questions to `quiz/` if applicable
