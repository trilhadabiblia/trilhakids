// ============================================================
// Configuração central + resolução de caminhos do projeto.
//
// Credenciais: reaproveita o config/env.php do projeto (formato PHP
// `putenv('KEY=VALUE')`) — o mesmo usado pela pipeline do devocional
// (IG_USER_ID, IG_ACCESS_TOKEN, ANTHROPIC_API_KEY, FB_APP_ID/SECRET...).
// Ordem de precedência para achar o env.php:
//   1) variável de ambiente TRILHO_ENV_PHP
//   2) primeiro caminho existente na lista CANDIDATOS_ENV_PHP
// Um .env local (opcional) SOBREPÕE valores do env.php, útil para testes.
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..'); // raiz do portal
export const OUT_DIR = path.join(here, 'out');

// .env local é opcional e serve apenas como override para desenvolvimento.
dotenv.config({ path: path.join(here, '.env') });

// Token renovado automaticamente (node cli.js refresh-token) fica aqui e
// tem prioridade sobre o IG_ACCESS_TOKEN do env.
export const TOKEN_FILE = path.join(here, '.ig-token.json');

function tokenAtivo(base) {
  try {
    const j = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    if (j && j.access_token) return j.access_token;
  } catch { /* sem arquivo → usa o do env */ }
  return base;
}

// Caminhos candidatos para o config/env.php (ajuste se o seu ficar noutro lugar).
const CANDIDATOS_ENV_PHP = [
  process.env.TRILHO_ENV_PHP,               // override explícito
  path.join(ROOT, 'config', 'env.php'),     // <repo>/config/env.php
  path.join(ROOT, '..', 'config', 'env.php'),
  path.join(ROOT, '..', 'devocional', 'config', 'env.php'),
].filter(Boolean);

// Lê um env.php e extrai os pares de putenv('KEY=VALUE') / putenv("KEY=VALUE").
function lerEnvPhp(arquivo) {
  const txt = fs.readFileSync(arquivo, 'utf8');
  const re = /putenv\(\s*(['"])([A-Z0-9_]+)=([\s\S]*?)\1\s*\)/g;
  const out = {};
  let m;
  while ((m = re.exec(txt)) !== null) out[m[2]] = m[3];
  return out;
}

function carregarEnvPhp() {
  for (const p of CANDIDATOS_ENV_PHP) {
    try {
      if (p && fs.existsSync(p)) return { valores: lerEnvPhp(p), caminho: p };
    } catch { /* ignora e tenta o próximo */ }
  }
  return { valores: {}, caminho: null };
}

const envPhp = carregarEnvPhp();
export const ENV_PHP_PATH = envPhp.caminho;

// process.env (.env local) vence; senão usa o env.php do projeto.
function val(chave) {
  return process.env[chave] || envPhp.valores[chave] || '';
}

export const cfg = {
  envPhpPath: envPhp.caminho,
  anthropicKey: val('ANTHROPIC_API_KEY'),
  captionModel: val('CAPTION_MODEL') || 'claude-opus-4-8',
  // Origem dos assets dos livros (HTML + imagens). Na VPS (sem repo local) o
  // pipeline puxa deste host; localmente usa o disco. Force com TRILHO_SOURCE_BASE.
  sourceBase: val('TRILHO_SOURCE_BASE') || 'https://trilhokids.com.br',
  sourceForce: !!val('TRILHO_SOURCE_BASE'),
  ig: {
    userId: val('IG_USER_ID'),
    token: tokenAtivo(val('IG_ACCESS_TOKEN')),
    version: val('IG_API_VERSION') || 'v21.0',
    // Host da Graph API. O devocional usa graph.instagram.com (Instagram
    // Business Login, token IGAA...), NÃO graph.facebook.com. Casa com o token.
    graphHost: val('IG_GRAPH_HOST') || 'graph.instagram.com',
    fbAppId: val('FB_APP_ID'),
    fbAppSecret: val('FB_APP_SECRET'),
  },
  upload: {
    // Endpoint que hospeda os PNGs num URL público (api/ig_upload.php).
    // Mesmo rodando o Node local, sempre hospeda no host cafecomhomensdedeus.com.br.
    url: val('IG_UPLOAD_URL') || 'https://cafecomhomensdedeus.com.br/api/ig_upload.php',
    token: val('IG_UPLOAD_TOKEN') || val('IG_ENDPOINT_TOKEN'),
  },
};

// Carrega window.LIVROS_CANONICOS do livros.js do portal sem duplicar dados.
export function carregarLivros() {
  const code = fs.readFileSync(path.join(ROOT, 'livros.js'), 'utf8');
  const window = {}; // shim para o script do browser
  // eslint-disable-next-line no-eval
  eval(code); // popula window.LIVROS_CANONICOS
  return window.LIVROS_CANONICOS || [];
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
