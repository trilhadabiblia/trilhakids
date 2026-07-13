// ============================================================
// Agenda editorial: 1 livro por semana, formatos espalhados pelos dias como
// uma mini-campanha (em vez de 5 posts do mesmo livro no mesmo dia, que se
// canibalizam e esgotam o acervo em 66 dias). Cada livro é trabalhado em
// profundidade ao longo da semana:
//
//   Segunda  Carrossel    abre a semana: a história em capítulos
//   Terça    Story        teaser efêmero, mantém presença
//   Quarta   Segredos     curiosidades — formato de maior compartilhamento
//   Sexta    Reflexão     perguntas + desafio — engajamento nos comentários
//   Sábado   Post+Story   fecho: imagem forte + convite ao portal
//
// O livro roda semanalmente e de forma DETERMINÍSTICA pela data: a agenda.json
// guarda só uma âncora { inicio (segunda da 1ª semana), base (índice inicial) }.
// Assim o cron continua um só (`node cli.js proximo`) e NÃO precisa "avançar"
// estado a cada publicação — o livro da semana é uma função pura da data de hoje.
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listarLivros } from './content.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(here, 'agenda.json');
const DIA = 24 * 60 * 60 * 1000;

// Dia da semana (0=dom … 6=sáb) → formatos daquele dia. Quinta e domingo folgam.
export const GRADE_SEMANAL = {
  1: ['carrossel'],
  2: ['story'],
  3: ['segredos'],
  5: ['reflexao'],
  6: ['post', 'story'],
};

export const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function lerEstado() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }
  catch { return {}; }
}

function salvarEstado(estado) {
  fs.writeFileSync(STATE, JSON.stringify(estado, null, 2));
}

// Segunda-feira 00:00 (hora local) da semana que contém `d`.
function segundaDaSemana(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // 0 = segunda … 6 = domingo
  x.setDate(x.getDate() - offset);
  return x;
}

// Garante a âncora { inicio, base } na agenda.json (migra o antigo { indice }).
function ancora(hoje) {
  const estado = lerEstado();
  if (estado.inicio == null) {
    estado.inicio = segundaDaSemana(hoje).toISOString();
    estado.base = Number(estado.indice) || 0; // preserva a posição atual da rotação
    delete estado.indice;
    estado.atualizado = hoje.toISOString();
    salvarEstado(estado);
  }
  return estado;
}

// Nº de semanas cheias entre a âncora e hoje (>= 0).
function semanasDesde(inicioISO, hoje) {
  const a = segundaDaSemana(new Date(inicioISO)).getTime();
  const b = segundaDaSemana(hoje).getTime();
  return Math.max(0, Math.round((b - a) / (7 * DIA)));
}

// Formatos agendados para uma data (array — vazio em quinta/domingo).
export function formatosDoDia(hoje = new Date()) {
  const g = GRADE_SEMANAL[hoje.getDay()];
  return g ? [...g] : [];
}

// Livro da semana + formatos de hoje. Não muta estado (salvo a migração inicial).
export async function agendaDoDia(hoje = new Date()) {
  const livros = await listarLivros();
  if (!livros.length) throw new Error('Nenhum livro disponível.');
  const est = ancora(hoje);
  const indice = (est.base + semanasDesde(est.inicio, hoje)) % livros.length;
  return {
    livro: livros[indice].pasta,
    nome: livros[indice].nome,
    indice, total: livros.length,
    diaSemana: hoje.getDay(),
    dia: DIAS_SEMANA[hoje.getDay()],
    formatos: formatosDoDia(hoje),
  };
}

// Compat: o livro da semana (consumido pelo status/preview da web).
export async function proximoLivro(hoje = new Date()) {
  const ag = await agendaDoDia(hoje);
  return { livro: ag.livro, nome: ag.nome, indice: ag.indice, total: ag.total, formatos: ag.formatos };
}

// Pular manualmente para o próximo livro AGORA (re-ancora nesta semana, base+1).
// Uso opcional (comando/admin) — a rotação normal é automática por data.
export async function pularLivro(hoje = new Date()) {
  const livros = await listarLivros();
  const total = livros.length || 1;
  const est = ancora(hoje);
  const atual = (est.base + semanasDesde(est.inicio, hoje)) % total;
  const estado = { inicio: segundaDaSemana(hoje).toISOString(), base: (atual + 1) % total, atualizado: hoje.toISOString() };
  salvarEstado(estado);
  return estado.base;
}
