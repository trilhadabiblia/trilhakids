# 🏗️ TRILHOKIDS - ARQUITETURA DE SISTEMA E API

## 📋 Índice
1. [Visão Geral da Arquitetura](#visão-geral)
2. [Estrutura de Banco de Dados](#banco-de-dados)
3. [API REST em PHP](#api-rest)
4. [Integração Frontend (Vercel) com Backend (Hostinger)](#integração)
5. [Endpoints da API](#endpoints)
6. [Autenticação e Segurança](#segurança)
7. [Fluxos de Dados](#fluxos)
8. [Implementação Progressiva](#implementação)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 🌐 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│                  trilhokids.com.br                       │
│  - Site institucional (Next.js/HTML estático)           │
│  - Portal do Aluno                                       │
│  - Dashboard da Igreja                                   │
│  - Dashboard do Professor                                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS/REST API
                       │ JSON
┌──────────────────────▼──────────────────────────────────┐
│              API BACKEND (Hostinger)                     │
│               api.trilhokids.com.br                      │
│  - API REST em PHP 8.x                                   │
│  - Autenticação JWT                                      │
│  - Lógica de Negócio                                     │
│  - Validações                                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           BANCO DE DADOS MySQL (Hostinger)               │
│  - Dados das igrejas                                     │
│  - Alunos, professores, turmas                           │
│  - Presenças, pontuações, progresso                      │
│  - Logs e auditoria                                      │
└─────────────────────────────────────────────────────────┘
```

### 🔗 Domínios

- **Frontend**: `trilhokids.com.br` (Vercel)
- **API**: `api.trilhokids.com.br` (Hostinger)
- **Painel Admin**: `painel.trilhokids.com.br` (Vercel, consome API)

---

## 2. ESTRUTURA DE BANCO DE DADOS

### 📊 Diagrama ER (Entidade-Relacionamento)

```sql
-- ============================================
-- TABELA: igrejas
-- ============================================
CREATE TABLE igrejas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    telefone VARCHAR(20),
    email VARCHAR(150),
    responsavel_nome VARCHAR(150),
    responsavel_telefone VARCHAR(20),
    status ENUM('ativa', 'inativa', 'trial') DEFAULT 'trial',
    plano ENUM('basico', 'premium', 'enterprise') DEFAULT 'basico',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATE,
    logo_url VARCHAR(255),
    configuracoes JSON, -- Para armazenar configs personalizadas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    igreja_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Hash bcrypt
    tipo ENUM('admin', 'coordenador', 'professor', 'pai') NOT NULL,
    telefone VARCHAR(20),
    foto_url VARCHAR(255),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    ultimo_acesso TIMESTAMP NULL,
    token_reset VARCHAR(100),
    token_expiracao TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_igreja (email, igreja_id),
    INDEX idx_tipo (tipo),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: turmas
-- ============================================
CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    igreja_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    faixa_etaria VARCHAR(50), -- Ex: "6-8 anos", "9-11 anos"
    ano_letivo INT NOT NULL, -- Ex: 2026
    dia_semana ENUM('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'),
    horario TIME,
    professor_id INT,
    status ENUM('ativa', 'encerrada') DEFAULT 'ativa',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_ano (ano_letivo),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: alunos
-- ============================================
CREATE TABLE alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    igreja_id INT NOT NULL,
    turma_id INT,
    nome_completo VARCHAR(200) NOT NULL,
    data_nascimento DATE NOT NULL,
    idade INT GENERATED ALWAYS AS (YEAR(CURDATE()) - YEAR(data_nascimento)) STORED,
    genero ENUM('masculino', 'feminino', 'outro'),
    foto_url VARCHAR(255),
    
    -- Responsável 1
    responsavel1_nome VARCHAR(150),
    responsavel1_parentesco VARCHAR(50),
    responsavel1_telefone VARCHAR(20),
    responsavel1_email VARCHAR(150),
    responsavel1_usuario_id INT, -- Link para tabela usuarios
    
    -- Responsável 2
    responsavel2_nome VARCHAR(150),
    responsavel2_parentesco VARCHAR(50),
    responsavel2_telefone VARCHAR(20),
    responsavel2_email VARCHAR(150),
    responsavel2_usuario_id INT,
    
    observacoes_medicas TEXT,
    alergias TEXT,
    restricoes_alimentares TEXT,
    autorizacao_imagem BOOLEAN DEFAULT FALSE,
    status ENUM('ativo', 'inativo', 'transferido') DEFAULT 'ativo',
    
    -- Gamificação
    pontos_totais INT DEFAULT 0,
    selos_conquistados INT DEFAULT 0,
    nivel INT DEFAULT 1,
    
    data_matricula DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL,
    FOREIGN KEY (responsavel1_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (responsavel2_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_turma (turma_id),
    INDEX idx_status (status),
    INDEX idx_nome (nome_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: aulas (cronograma)
-- ============================================
CREATE TABLE aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    numero_aula INT NOT NULL, -- 1-45
    data_prevista DATE NOT NULL,
    data_realizada DATE,
    trimestre INT NOT NULL, -- 1-4
    livros_estudados VARCHAR(200) NOT NULL, -- Ex: "Gênesis & Êxodo"
    tipo ENUM('normal', 'especial') DEFAULT 'normal',
    tema_especial VARCHAR(200), -- Para aulas especiais
    status ENUM('agendada', 'realizada', 'cancelada') DEFAULT 'agendada',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    INDEX idx_turma_data (turma_id, data_prevista),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: presencas
-- ============================================
CREATE TABLE presencas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aula_id INT NOT NULL,
    aluno_id INT NOT NULL,
    presente BOOLEAN DEFAULT TRUE,
    justificativa TEXT,
    pontos_ganhos INT DEFAULT 10, -- Pontos por presença
    registrado_por INT, -- usuario_id do professor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_presenca (aula_id, aluno_id),
    INDEX idx_aluno (aluno_id),
    INDEX idx_aula (aula_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: atividades_realizadas
-- ============================================
CREATE TABLE atividades_realizadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aula_id INT NOT NULL,
    aluno_id INT NOT NULL,
    tipo_atividade ENUM('quiz', 'manual', 'versiculo', 'desafio', 'participacao') NOT NULL,
    pontuacao_obtida DECIMAL(5,2), -- Ex: 8.5 de 10
    pontuacao_maxima DECIMAL(5,2),
    percentual DECIMAL(5,2) GENERATED ALWAYS AS ((pontuacao_obtida / pontuacao_maxima) * 100) STORED,
    pontos_ganhos INT DEFAULT 0,
    detalhes JSON, -- Respostas, tempo, etc.
    observacoes TEXT,
    registrado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_aluno (aluno_id),
    INDEX idx_tipo (tipo_atividade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: selos
-- ============================================
CREATE TABLE selos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- Ex: "genesis", "exodo"
    nome VARCHAR(100) NOT NULL,
    livro_biblico VARCHAR(100) NOT NULL,
    trimestre INT NOT NULL,
    ordem INT NOT NULL, -- 1-66
    imagem_url VARCHAR(255),
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trimestre (trimestre),
    INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: selos_alunos (relação N:N)
-- ============================================
CREATE TABLE selos_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    selo_id INT NOT NULL,
    aula_id INT NOT NULL,
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (selo_id) REFERENCES selos(id) ON DELETE CASCADE,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_selo_aluno (aluno_id, selo_id),
    INDEX idx_aluno (aluno_id),
    INDEX idx_data (data_conquista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: badges
-- ============================================
CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo ENUM('mensal', 'especial', 'conquista') NOT NULL,
    criterios JSON, -- Critérios para ganhar o badge
    pontos_bonus INT DEFAULT 0,
    icone_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: badges_alunos (relação N:N)
-- ============================================
CREATE TABLE badges_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    badge_id INT NOT NULL,
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mes_referencia VARCHAR(7), -- Ex: "2026-03"
    observacoes TEXT,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    INDEX idx_aluno (aluno_id),
    INDEX idx_mes (mes_referencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: historico_pontos
-- ============================================
CREATE TABLE historico_pontos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    tipo ENUM('presenca', 'atividade', 'quiz', 'versiculo', 'ajuda', 'badge', 'ajuste') NOT NULL,
    pontos INT NOT NULL, -- Pode ser negativo para ajustes
    descricao VARCHAR(255),
    referencia_id INT, -- ID da presença, atividade, etc.
    registrado_por INT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_aluno_data (aluno_id, data_registro),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: relatorios_salvos
-- ============================================
CREATE TABLE relatorios_salvos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    igreja_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    parametros JSON,
    arquivo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_igreja (igreja_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: logs_sistema
-- ============================================
CREATE TABLE logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    igreja_id INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id INT,
    dados_anteriores JSON,
    dados_novos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (igreja_id) REFERENCES igrejas(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_data (created_at),
    INDEX idx_acao (acao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. API REST EM PHP

### 📁 Estrutura de Diretórios

```
api.trilhokids.com.br/
├── public/
│   └── index.php              # Entry point
├── src/
│   ├── Config/
│   │   ├── Database.php       # Conexão PDO
│   │   └── Config.php         # Configurações gerais
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── IgrejaController.php
│   │   ├── AlunoController.php
│   │   ├── TurmaController.php
│   │   ├── AulaController.php
│   │   ├── PresencaController.php
│   │   ├── AtividadeController.php
│   │   ├── SeloController.php
│   │   ├── BadgeController.php
│   │   ├── RelatorioController.php
│   │   └── DashboardController.php
│   ├── Models/
│   │   ├── Igreja.php
│   │   ├── Usuario.php
│   │   ├── Aluno.php
│   │   ├── Turma.php
│   │   ├── Aula.php
│   │   ├── Presenca.php
│   │   ├── Atividade.php
│   │   ├── Selo.php
│   │   └── Badge.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── CorsMiddleware.php
│   │   └── RateLimitMiddleware.php
│   ├── Utils/
│   │   ├── JWT.php
│   │   ├── Validator.php
│   │   ├── Response.php
│   │   └── Logger.php
│   └── Routes/
│       └── api.php            # Definição de rotas
├── .env                        # Variáveis de ambiente
├── .htaccess                   # Rewrite rules
└── composer.json               # Dependencies
```

### 🔧 Configuração Base

**composer.json**
```json
{
    "require": {
        "php": ">=8.0",
        "firebase/php-jwt": "^6.0",
        "vlucas/phpdotenv": "^5.0"
    },
    "autoload": {
        "psr-4": {
            "TrilhoKids\\": "src/"
        }
    }
}
```

**.env**
```env
# Database
DB_HOST=localhost
DB_NAME=trilhokids_db
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_CHARSET=utf8mb4

# JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRATION=86400

# CORS
ALLOWED_ORIGINS=https://trilhokids.com.br,https://painel.trilhokids.com.br

# Environment
APP_ENV=production
APP_DEBUG=false
```

---

## 4. INTEGRAÇÃO FRONTEND ↔ BACKEND

### 🔌 Exemplo de Consumo da API (JavaScript/Fetch)

```javascript
// config/api.js
const API_BASE_URL = 'https://api.trilhokids.com.br';

class TrilhoKidsAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('trilho_token');
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(email, senha) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        
        this.token = data.token;
        localStorage.setItem('trilho_token', data.token);
        return data;
    }

    async logout() {
        localStorage.removeItem('trilho_token');
        this.token = null;
    }

    // Alunos
    async getAlunos(turmaId) {
        return this.request(`/alunos?turma_id=${turmaId}`);
    }

    async getAluno(id) {
        return this.request(`/alunos/${id}`);
    }

    async criarAluno(dados) {
        return this.request('/alunos', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async atualizarAluno(id, dados) {
        return this.request(`/alunos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    // Presenças
    async registrarPresenca(aulaId, presencas) {
        return this.request('/presencas', {
            method: 'POST',
            body: JSON.stringify({ aula_id: aulaId, presencas })
        });
    }

    async getPresencas(aulaId) {
        return this.request(`/presencas?aula_id=${aulaId}`);
    }

    // Dashboard
    async getDashboard(turmaId) {
        return this.request(`/dashboard?turma_id=${turmaId}`);
    }

    // Relatórios
    async gerarRelatorio(tipo, parametros) {
        return this.request('/relatorios/gerar', {
            method: 'POST',
            body: JSON.stringify({ tipo, parametros })
        });
    }
}

// Exportar instância única
export default new TrilhoKidsAPI();
```

---

## 5. ENDPOINTS DA API

### 📍 Especificação de Endpoints

#### **Autenticação**

```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

#### **Igrejas**

```
GET    /igrejas
GET    /igrejas/{id}
POST   /igrejas
PUT    /igrejas/{id}
DELETE /igrejas/{id}
GET    /igrejas/{id}/stats
```

#### **Usuários**

```
GET    /usuarios
GET    /usuarios/{id}
POST   /usuarios
PUT    /usuarios/{id}
DELETE /usuarios/{id}
PUT    /usuarios/{id}/senha
```

#### **Turmas**

```
GET    /turmas
GET    /turmas/{id}
POST   /turmas
PUT    /turmas/{id}
DELETE /turmas/{id}
GET    /turmas/{id}/alunos
GET    /turmas/{id}/cronograma
```

#### **Alunos**

```
GET    /alunos
GET    /alunos/{id}
POST   /alunos
PUT    /alunos/{id}
DELETE /alunos/{id}
GET    /alunos/{id}/progresso
GET    /alunos/{id}/historico
GET    /alunos/{id}/selos
GET    /alunos/{id}/badges
```

#### **Aulas**

```
GET    /aulas
GET    /aulas/{id}
POST   /aulas
PUT    /aulas/{id}
DELETE /aulas/{id}
POST   /aulas/{id}/realizar
```

#### **Presenças**

```
GET    /presencas
POST   /presencas
PUT    /presencas/{id}
GET    /presencas/aula/{aula_id}
GET    /presencas/aluno/{aluno_id}
```

#### **Atividades**

```
GET    /atividades
POST   /atividades
PUT    /atividades/{id}
GET    /atividades/aula/{aula_id}
GET    /atividades/aluno/{aluno_id}
```

#### **Selos e Badges**

```
GET    /selos
POST   /selos/conceder
GET    /badges
POST   /badges/conceder
```

#### **Dashboard e Relatórios**

```
GET    /dashboard
GET    /dashboard/turma/{id}
GET    /dashboard/aluno/{id}
POST   /relatorios/gerar
GET    /relatorios/{id}
```

---

## 6. AUTENTICAÇÃO E SEGURANÇA

### 🔐 Fluxo de Autenticação JWT

1. **Login**: Cliente envia email/senha → API valida → retorna JWT
2. **Requisições**: Cliente envia JWT no header `Authorization: Bearer {token}`
3. **Validação**: Middleware valida token em cada requisição
4. **Refresh**: Token expira → cliente solicita refresh com refresh_token

### 🛡️ Medidas de Segurança

- ✅ HTTPS obrigatório
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ SQL Injection prevention (PDO prepared statements)
- ✅ XSS protection
- ✅ Senhas com bcrypt
- ✅ JWT com expiração
- ✅ Logs de auditoria

---

## 7. FLUXOS DE DADOS

### 📊 Fluxo: Registro de Presença

```
1. Professor abre tela de chamada (Frontend)
2. Frontend solicita lista de alunos: GET /turmas/{id}/alunos
3. Professor marca presenças
4. Frontend envia: POST /presencas
   {
     "aula_id": 1,
     "presencas": [
       {"aluno_id": 1, "presente": true},
       {"aluno_id": 2, "presente": false, "justificativa": "Doente"}
     ]
   }
5. API valida, registra e atualiza pontos
6. API retorna confirmação
7. Frontend atualiza interface
```

---

## 8. IMPLEMENTAÇÃO PROGRESSIVA

### 🚀 Fases de Desenvolvimento

#### **FASE 1: MVP (4-6 semanas)**
- ✅ Banco de dados completo
- ✅ API: Auth, Igrejas, Usuários, Turmas, Alunos
- ✅ Frontend: Login, Dashboard básico, Cadastros
- ✅ Integração Frontend ↔ Backend

#### **FASE 2: Core Features (4-6 semanas)**
- ✅ API: Aulas, Presenças, Atividades
- ✅ Sistema de pontuação
- ✅ Frontend: Registro de presença, Atividades

#### **FASE 3: Gamificação (3-4 semanas)**
- ✅ Selos e Badges
- ✅ Rankings
- ✅ Progresso visual

#### **FASE 4: Relatórios e Analytics (3-4 semanas)**
- ✅ Geração de relatórios
- ✅ Estatísticas avançadas
- ✅ Export PDF/Excel

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **Revisar e aprovar estrutura de BD**
2. ⬜ **Configurar ambiente Hostinger**
3. ⬜ **Implementar classes base (Database, Config)**
4. ⬜ **Criar primeiro endpoint (Auth)**
5. ⬜ **Testar integração Frontend → Backend**
6. ⬜ **Desenvolver demais endpoints progressivamente**

---

**Pronto para começar?** Posso ajudar a criar os arquivos PHP base ou configurar qualquer parte específica!