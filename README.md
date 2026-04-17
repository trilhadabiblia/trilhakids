# Trilho Kids — Portal Bíblico Gamificado para Crianças

Portal de ensino bíblico interativo desenvolvido para a IBP (Igreja Batista do Parque) e ministérios infantis. Combina navegação pelos 66 livros da Bíblia, quizzes, personagens bíblicos e um sistema completo de gamificação — tudo acessível via QR Code pelo celular da criança.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Gamificação](#gamificação)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Área Administrativa](#área-administrativa)
- [Área do Professor](#área-do-professor)
- [Backend API](#backend-api)
- [Rodando Localmente](#rodando-localmente)
- [Deploy (Vercel)](#deploy-vercel)

---

## Visão Geral

O Trilho Kids é um site estático (HTML/CSS/JS) com backend PHP + MySQL hospedado externamente. Não há etapa de compilação — o frontend é servido diretamente pelo Vercel. A integração com gamificação acontece via chamadas REST ao backend.

**Stack:**
- Frontend: HTML5 + Tailwind CSS (CDN) + JavaScript puro
- Backend: PHP 8.2 + MySQL 8 (Docker em dev, cPanel em produção)
- Deploy frontend: Vercel
- Deploy backend: `https://cafecomhomensdedeus.com.br/trilhokids/api`

---

## Funcionalidades

### Para a Criança
- Navegar pelos **66 livros da Bíblia** organizados por seções (Pentateuco, Históricos, Poéticos, Profetas Maiores/Menores, Evangelhos, Cartas de Paulo, etc.)
- Cada livro tem resumo visual com imagens, versículos, curiosidades e lições
- **Quizzes por livro** — 10 perguntas com feedback imediato e justificativa bíblica
- **Personagens bíblicos** — Origens da Humanidade, Patriarcas, Heróis/Juízes com cards detalhados
- **Progresso pessoal** — página `/progresso` com pontos, nível, badges conquistadas, histórico de atividades
- Acesso via **QR Code** pessoal: escaneou → entrou → progresso salvo automaticamente

### Para o Professor
- **Dashboard** (`/professor/dashboard`) com:
  - Ranking da turma em tempo real
  - Progresso individual detalhado por aluno (📊)
  - Dar pontos manuais (presença, participação, versículo decorado, etc.)
  - Gerar e imprimir QR Code de cada aluno
  - Visualizar atividades recentes da turma
  - Calendário de plantão (qual professor em qual data)
- **Login seguro** com JWT — `/professor/login`

### Para o Administrador
- **Painel admin** (`/admin`) com:
  - Cadastro de instituições e turmas
  - Cadastro de professores com vinculação por turma e papel (titular/auxiliar)
  - Cadastro de alunos com geração de token QR único
  - Gestão de equipe por turma (múltiplos professores por turma)
  - Calendário de escalas por turma

---

## Arquitetura

```
trilhakids/                  ← Frontend estático (Vercel)
├── index.html               ← Portal principal
├── menu.html / menu.js      ← Menu lateral injetado em todas as páginas
├── gamificacao.js           ← Sistema de gamificação global (TrilhoKidsGame)
├── perfil.js                ← Seletor de perfil (injetado pelo menu.js)
├── progresso.html           ← Painel de progresso do aluno
├── entrar.html              ← Página de autenticação via QR Code
├── quiz.html                ← Portal de quizzes
│
├── [livro]/                 ← Pasta por livro bíblico (ex: genesis/, jonas/)
│   ├── index.html           ← Hub do livro
│   └── [livro].html         ← Conteúdo visual do livro
│
├── personagens/             ← Personagens bíblicos
│   ├── origens.html         ← Adão, Eva, Caim, Abel, Sete
│   ├── patriarcas.html      ← Abraão, Isaque, Jacó
│   └── herois.html          ← 14 Juízes (Otniel a Samuel)
│
├── quiz/
│   ├── antigo-testamento/   ← Quiz por livro do AT
│   └── novo-testamento/     ← Quiz por livro do NT
│
├── professor/               ← Área do professor (auth JWT)
│   ├── login.html
│   ├── dashboard.html
│   └── auth.js
│
├── admin/                   ← Área administrativa
│   └── index.html
│
└── api/                     ← Backend PHP (NÃO servido pelo Vercel)
```

**Cadeia de dependências por página:**
```
gamificacao.js → menu.js → perfil.js (auto-injetado)
```
Toda página de conteúdo inclui `gamificacao.js` e `menu.js` no final do `<body>`.

---

## Estrutura de Pastas

### Livros Bíblicos
Cada livro tem sua própria pasta com o padrão:

```
genesis/
├── index.html          ← Landing do livro (link para conteúdo e quiz)
└── genesis.html        ← Conteúdo completo com imagens e modais
```

Categorias hub no root:
- `pentateuco.html` — 5 livros
- `historicos.html` — 12 livros
- `poeticos.html` — 5 livros
- `profetas-maiores.html` — 5 livros
- `profetas-menores.html` — 12 livros
- `novotestamento/` — Evangelhos, Atos, Cartas de Paulo, Outras Cartas, Apocalipse

### Quizzes
- Cada livro tem um quiz com 10 questões de múltipla escolha em `quiz/antigo-testamento/quiz-[livro].html`
- Ao finalizar, chama `trilhoGame.completarQuiz(nome, acertos, total)` automaticamente
- Gerador de quizzes com IA em `quiz/quizbuilder.html` (usa Claude via proxy Node.js)

---

## Gamificação

Implementada em `gamificacao.js` — classe `TrilhoKidsGame` exposta como `window.trilhoGame`.

### Pontuação
| Ação | Pontos |
|---|---|
| Visitar um livro (novo) | +10 pts |
| Descobrir um personagem (novo) | +5 pts |
| Completar quiz | +10 pts por acerto |
| Quiz com ≥ 70% | bônus +10 pts |
| Quiz perfeito (100%) | bônus +50 pts |
| Pontos manuais (professor) | variável |

### Níveis (10 no total)
| Nível | Nome | Pontos |
|---|---|---|
| 1 | Iniciante | 0 |
| 2 | Explorador | 100 |
| 3 | Aventureiro | 300 |
| 4 | Discípulo | 600 |
| 5 | Herói da Fé | 1.000 |
| 6 | Guardião | 1.500 |
| 7 | Sábio | 2.500 |
| 8 | Profeta | 4.000 |
| 9 | Apóstolo | 6.000 |
| 10 | Lenda | 10.000 |

### Badges (30+)
Distribuídas em 4 categorias:
- **Seção Bíblica** — completar todos os livros de uma seção (ex: Pentateuco, Evangelhos)
- **Desempenho** — livros visitados, quizzes completados, 100% em quizzes
- **Pontuação** — marcos de pontos (100, 500, 1000 pts)
- **Especial** — eventos temáticos (Amigo de Jonas, Coração de Davi, etc.)

### Modos de Perfil
- **Modo QR (`_perfilTipo = 'qr'`)** — aluno autenticado, todo progresso salvo na API
- **Modo Visitante (`_perfilTipo = 'local'`)** — sem conta, sem acesso à API, perfil no localStorage

---

## Sistema de Autenticação

### Aluno (QR Code)
1. Admin gera token hexadecimal único (16 chars) por aluno
2. QR Code impresso aponta para `/entrar#token=<TOKEN>`
3. `entrar.html` valida o token via `GET /api/entrar.php?token=...`
4. Sucesso: `trilhoGame.setPerfilAtivo(nome)` → redireciona para home em 3s
5. Sessão persiste via `localStorage`; "Encerrar sessão" limpa e redireciona para `/`

### Professor (JWT)
- `POST /api/auth.php` → retorna JWT HS256 (24h)
- Token salvo em `localStorage`; `auth.js` protege as páginas professor/admin
- Payload inclui: `id`, `nome`, `turmas[]` (com papel: titular/auxiliar)

---

## Área Administrativa

Rota: `/admin`

### Instituições
- Cadastro de igrejas/escolas com nome e identificador

### Turmas
- Vinculadas a uma instituição
- Suporte a múltiplos professores por turma com papel (titular/auxiliar)
- Calendário de escalas: qual professor em qual data/horário

### Professores
- Cadastro com email e senha
- Vinculação a uma ou mais turmas

### Alunos (Perfis)
- Vinculados a uma turma
- Token QR gerado automaticamente
- QR Code imprimível diretamente do painel

---

## Área do Professor

Rota: `/professor/dashboard`

- Seleciona a turma ativa
- **Ranking** — todos os alunos ordenados por pontos com medalhas (🥇🥈🥉)
- **Progresso individual (📊)** — modal com stats completos, badges, histórico de atividades
- **+pts** — dar pontos manuais com motivo predefinido ou personalizado
- **QR** — visualizar e imprimir QR Code do aluno
- **Plantão de hoje** — banner mostrando quem está escalado na data atual
- **Atividades recentes** — feed da turma

---

## Backend API

Localização em desenvolvimento: `http://localhost:8080`
Produção: `https://cafecomhomensdedeus.com.br/trilhokids/api`

| Endpoint | Método | Descrição |
|---|---|---|
| `entrar.php` | GET | Valida token QR do aluno |
| `auth.php` | POST | Login professor → JWT |
| `auth.php?me` | GET | Dados do professor logado |
| `progresso.php` | GET/POST | Progresso completo do aluno |
| `historia.php` | GET | Histórico de atividades |
| `pontos.php` | POST | Adicionar pontos manuais |
| `dashboard.php` | GET | Dados da turma para professor |
| `turmas.php` | GET/POST/PUT/DELETE | CRUD de turmas |
| `perfis.php` | GET/POST/PUT/DELETE | CRUD de alunos |
| `professores.php` | GET/POST/PUT/DELETE | CRUD de professores |
| `turma_professores.php` | GET/POST/DELETE | Vínculo professor ↔ turma |
| `calendario.php` | GET/POST/DELETE | Escalas/calendário da turma |
| `install.php` | GET | Setup inicial do banco |

### Banco de Dados (MySQL 8)
Tabelas: `professores`, `turmas`, `turma_professores`, `perfis`, `progresso`, `quizzes`, `historia`, `calendario_turmas`, `instituicoes`

---

## Rodando Localmente

### Pré-requisitos
- Node.js 18+
- Docker + Docker Compose

### Frontend
```bash
cd trilhakids
npm install
npm start          # serve em http://localhost:3000
```

### Backend
```bash
cd api
docker compose up  # MySQL em :3306, PHP em :8080
# Primeira vez: acessar http://localhost:8080/install.php
```

### Variáveis de ambiente (backend)
Configuradas em `api/src/config.php`:
```php
DB_HOST, DB_NAME, DB_USER, DB_PASS
```

---

## Deploy (Vercel)

O frontend é deploy automático via Vercel apontado para o repositório. O arquivo `vercel.json` configura o serving estático de todos os arquivos.

O backend PHP não é servido pelo Vercel — fica no servidor cPanel separado.

### serve.json (desenvolvimento local)
```json
{ "directoryListing": false }
```
O `serve` (v14) usa `cleanUrls` por padrão, mapeando `/livro` → `livro.html`. O token de autenticação do aluno usa fragment hash (`#token=`) para não ser stripped pelos redirects.

---

## Adicionando um Novo Livro

1. Criar pasta `/{livro}/` com `index.html` e `[livro].html`
2. Adicionar imagens: `[livro]-capa.png`, `[livro]-curiosidade.png`, etc.
3. Incluir no final do `<body>`:
   ```html
   <script src="../gamificacao.js"></script>
   <script src="../menu.js"></script>
   ```
4. Chamar na abertura da página:
   ```js
   await trilhoGame.visitarLivro('Nome do Livro')
   ```
5. Linkar na página de categoria correspondente
6. Criar quiz em `quiz/[secao]/quiz-[livro].html`
