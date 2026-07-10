// ============================================================
// Fonte dos assets dos livros — abstrai LOCAL (disco) x REMOTO (host).
// Local: usa o repositório em ROOT. Remoto (ex: VPS sem o repo): puxa
// o HTML e as imagens de cada livro de cfg.sourceBase (trilhokids.com.br).
// ============================================================
import fs from 'fs';
import path from 'path';
import { ROOT, cfg, carregarLivros as carregarLivrosLocal } from './config.js';

const NT = new Set(['evangelhos', 'historico-nt', 'cartas-paulo', 'outras-cartas', 'profetico-nt']);

// Local só quando o repositório COMPLETO está presente (as pastas dos livros).
// Ter apenas o livros.js (ex: sparse-checkout de tools/instagram na VPS, que
// traz os arquivos da raiz mas não as pastas dos livros) NÃO conta como local.
const LOCAL_OK = ['genesis', 'jonas', 'salmos'].some((p) => fs.existsSync(path.join(ROOT, p)));

// Remoto quando não há repo local (VPS) ou quando TRILHO_SOURCE_BASE força.
export const REMOTO = cfg.sourceForce || !LOCAL_OK;
export const BASE = cfg.sourceBase.replace(/\/+$/, '');

// Caminho relativo da pasta do livro (NT fica sob novotestamento/).
export function relativo(livro) {
  return NT.has(livro.secao) ? `novotestamento/${livro.pasta}` : livro.pasta;
}

async function carregarRemoto() {
  const resp = await fetch(`${BASE}/livros.js`);
  const txt = await resp.text();
  const window = {}; // shim do browser
  // eslint-disable-next-line no-eval
  eval(txt);
  return window.LIVROS_CANONICOS || [];
}

// Lista canônica dos livros, carregada uma vez.
export const LIVROS = REMOTO ? await carregarRemoto() : carregarLivrosLocal();

// HTML da página do livro (para versículo + tema + descoberta de imagens).
const htmlCache = new Map();
export async function htmlDoLivro(livro) {
  if (htmlCache.has(livro.pasta)) return htmlCache.get(livro.pasta);
  const rel = relativo(livro);
  let html = '';
  if (!REMOTO) {
    const p = path.join(ROOT, rel, `${livro.pasta}.html`);
    if (fs.existsSync(p)) html = fs.readFileSync(p, 'utf8');
  } else {
    const resp = await fetch(`${BASE}/${rel}/${livro.pasta}.html`);
    if (resp.ok) html = await resp.text();
  }
  htmlCache.set(livro.pasta, html);
  return html;
}

// Imagens do livro: [{ arquivo, caminho? (local) | url? (remoto) }]
export async function listarImagens(livro) {
  const rel = relativo(livro);
  if (!REMOTO) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => /\.png$/i.test(f) && !/_old/i.test(f) && f.startsWith(livro.pasta))
      .map((f) => ({ arquivo: f, caminho: path.join(dir, f) }));
  }
  // Remoto: descobre as imagens lendo o HTML do livro (robusto, sem HEAD).
  const html = await htmlDoLivro(livro);
  const nomes = [...new Set(
    [...html.matchAll(/src="([^"]+\.png)"/gi)].map((m) => m[1].split('/').pop())
  )].filter((f) => f.startsWith(`${livro.pasta}-`) && !/_old/i.test(f));
  return nomes.map((arquivo) => ({ arquivo, url: `${BASE}/${rel}/${arquivo}` }));
}
