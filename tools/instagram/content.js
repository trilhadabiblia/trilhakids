// ============================================================
// Monta "itens de conteúdo" a partir do material do portal:
// resolve o livro, descobre imagens, versículo e tema — via source.js
// (local no disco ou remoto do host). Todas as funções são assíncronas.
// ============================================================
import { LIVROS, REMOTO, htmlDoLivro, listarImagens } from './source.js';
import { extrairVersiculo } from './versiculo.js';
import { extrairTema } from './cores.js';
import { extrairSecoes, extrairPontos, sufixoDe } from './secoes.js';

// Rótulos amigáveis por sufixo de imagem (usados como legenda do slide).
const ROTULOS = [
  { re: /-capa/, rotulo: 'O Livro' },
  { re: /-quem-e|-quem-sao|-personagem/, rotulo: 'Quem é' },
  { re: /-o-que-conta/, rotulo: 'O que conta' },
  { re: /-(por-que-)?importante/, rotulo: 'Por que importa' },
  { re: /-proposito/, rotulo: 'O propósito' },
  { re: /-curiosidade/, rotulo: 'Curiosidade' },
];

// Ordem preferida dos slides num carrossel de livro.
const ORDEM_SLIDES = ['-capa', '-o-que-conta', '-proposito', '-curiosidade', '-importante'];

function rotuloDe(arquivo) {
  const hit = ROTULOS.find((r) => r.re.test(arquivo));
  return hit ? hit.rotulo : '';
}

export function acharLivro(chave) {
  const c = String(chave).toLowerCase();
  return (
    LIVROS.find((l) => l.pasta.toLowerCase() === c) ||
    LIVROS.find((l) => l.nome.toLowerCase() === c) ||
    LIVROS.find((l) => l.nome.toLowerCase().replace(/\s+/g, '') === c.replace(/\s+/g, '')) ||
    null
  );
}

async function imagensDoLivro(livro) {
  const raw = await listarImagens(livro);
  return raw.map((i) => ({ ...i, rotulo: rotuloDe(i.arquivo) }));
}

// HTML + tema (buscados uma vez por livro).
async function contexto(livro) {
  const html = await htmlDoLivro(livro);
  return { html, tema: extrairTema(html) };
}

// Resolve o livro pela chave e garante que ele tem imagens.
async function resolver(chave) {
  const livro = acharLivro(chave);
  if (!livro) throw new Error(`Livro não encontrado: ${chave}`);
  const imgs = await imagensDoLivro(livro);
  if (!imgs.length) throw new Error(`Nenhuma imagem encontrada para ${livro.nome} — rode: node cli.js diag --livro ${livro.pasta}`);
  return { livro, imgs };
}

// Um único post (1080x1080): usa uma imagem (default: capa > o-que-conta...).
export async function buildPost(chave, sufixo) {
  const { livro, imgs } = await resolver(chave);

  let escolhida;
  if (sufixo) {
    escolhida = imgs.find((i) => i.arquivo.includes(sufixo));
    if (!escolhida) throw new Error(`Imagem "${sufixo}" não encontrada para ${livro.nome}`);
  } else {
    escolhida =
      imgs.find((i) => i.arquivo.includes('-capa')) ||
      imgs.find((i) => i.arquivo.includes('-o-que-conta')) ||
      imgs.find((i) => i.arquivo.includes('-proposito')) ||
      imgs.find((i) => /-personagem|-quem-e/.test(i.arquivo)) ||
      imgs[0];
  }
  const { html, tema } = await contexto(livro);
  // Post de capa ganha o subtítulo real da página como texto.
  if (sufixoDe(escolhida.arquivo, livro.pasta) === 'capa') {
    escolhida.texto = extrairSecoes(html).subtitulo;
  }
  return {
    tipo: 'post', livro: livro.pasta, nome: livro.nome, secao: livro.secao, tema,
    imagens: [escolhida], titulo: escolhida.rotulo || livro.nome,
  };
}

// Story vertical (1080x1920): uma imagem + CTA.
export async function buildStory(chave, sufixo) {
  const p = await buildPost(chave, sufixo);
  return { ...p, tipo: 'story' };
}

// Carrossel (versículo de abertura + várias imagens do livro).
export async function buildCarrossel(chave, max = 6) {
  const { livro, imgs } = await resolver(chave);

  const ordenadas = [];
  for (const suf of ORDEM_SLIDES) {
    const m = imgs.find((i) => i.arquivo.includes(suf));
    if (m && !ordenadas.includes(m)) ordenadas.push(m);
  }
  for (const i of imgs) if (!ordenadas.includes(i)) ordenadas.push(i);

  const { html, tema } = await contexto(livro);
  const versiculo = extrairVersiculo(html);

  // Conteúdo por slide (determinístico, sem IA): capa = subtítulo real;
  // demais = títulos-chave dos cards da seção, renderizados como bullets.
  const slides = ordenadas.slice(0, max);
  const sec = extrairSecoes(html);
  const pontos = extrairPontos(html);
  for (const img of slides) {
    const suf = sufixoDe(img.arquivo, livro.pasta);
    if (suf === 'capa') img.texto = sec.subtitulo;
    else img.pontos = pontos[suf] || [];
  }

  return {
    tipo: 'carrossel', livro: livro.pasta, nome: livro.nome, secao: livro.secao, tema,
    versiculo, imagens: slides, titulo: livro.nome,
  };
}

export async function listarLivros() {
  const out = [];
  for (const l of LIVROS) {
    if (REMOTO) {
      out.push({ pasta: l.pasta, nome: l.nome, secao: l.secao, imagens: null });
    } else {
      const imgs = await imagensDoLivro(l);
      if (imgs.length) out.push({ pasta: l.pasta, nome: l.nome, secao: l.secao, imagens: imgs.length });
    }
  }
  return out;
}
