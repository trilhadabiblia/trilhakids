// ============================================================
// Fonte dos assets dos livros — abstrai LOCAL (disco) x REMOTO (host).
// Local: usa o repositório em ROOT. Remoto (ex: VPS sem o repo): puxa
// o HTML e as imagens de cada livro de cfg.sourceBase (trilhokids.com.br).
// ============================================================
import fs from 'fs';
import path from 'path';
import { ROOT, cfg, SECOES_NT, evalLivros, carregarLivros as carregarLivrosLocal } from './config.js';

// Caminho relativo da pasta do livro (NT fica sob novotestamento/).
export function relativo(livro) {
  return SECOES_NT.has(livro.secao) ? `novotestamento/${livro.pasta}` : livro.pasta;
}

// Livros do livros.js local, se presente no disco (existe até em sparse-checkout).
const livrosLocais = fs.existsSync(path.join(ROOT, 'livros.js')) ? carregarLivrosLocal() : [];

// Local só quando o repositório COMPLETO está no disco: além do livros.js, a
// pasta de algum livro precisa existir (num sparse-checkout de tools/ elas não vêm).
const LOCAL_OK = livrosLocais.some((l) => fs.existsSync(path.join(ROOT, relativo(l))));

// Remoto quando não há repo local (VPS) ou quando TRILHO_SOURCE_BASE força.
export const REMOTO = cfg.sourceForce || !LOCAL_OK;
export const BASE = cfg.sourceBase.replace(/\/+$/, '');

async function carregarRemoto() {
  const resp = await fetch(`${BASE}/livros.js`);
  return evalLivros(await resp.text());
}

// Lista canônica dos livros, carregada uma vez.
export const LIVROS = REMOTO ? await carregarRemoto() : livrosLocais;

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
