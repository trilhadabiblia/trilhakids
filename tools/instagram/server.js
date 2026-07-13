// ============================================================
// Servidor web do pipeline Trilho Kids → Instagram.
//
// Expõe o pipeline (cli.js) como aplicação web com fila de aprovação:
//   1. Gerar preview (equivale ao --dry-run): renderiza PNGs + legenda
//   2. Revisar no navegador (slides + legenda editável)
//   3. Publicar (hospeda no ig_upload.php e publica via Graph API)
//
// Segurança: exige WEB_TOKEN (defina no .vps-env). Sem ele, não sobe.
// RAM: uma geração por vez (fila serializada) — Chromium + WAHA na KVM.
//
// Uso:
//   npm install express
//   echo 'WEB_TOKEN=um-segredo-forte' >> .vps-env
//   source .vps-env && node server.js          # ou via PM2 (ver DEPLOY-WEB.md)
// ============================================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { fileURLToPath } from 'url';

import { OUT_DIR, cfg } from './config.js';
import { buildPost, buildStory, buildCarrossel, buildSegredos, buildReflexao, listarLivros } from './content.js';
import { slideHTML, storyHTML, versiculoHTML, cartaoHTML, campanhaCapaHTML, campanhaCartaoHTML, reelCapaHTML, reelTwistHTML, reelQuizHTML } from './templates.js';
import { renderHTML, fecharBrowser } from './render.js';
import { gerarLegenda, montarCaption } from './caption.js';
import { provedores } from './llm.js';
import { hospedar } from './host.js';
import { publicarImagem, publicarStory, publicarCarrossel, quemSou } from './instagram.js';
import { agendaDoDia } from './agenda.js';
import { buildCampanha, listarCampanha } from './campanha.js';
import { buildReel, listarReels } from './reels.js';
import { REMOTO, BASE } from './source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.WEB_PORT || 3000);
const TOKEN = process.env.WEB_TOKEN || '';

if (!TOKEN) {
  console.error('❌ WEB_TOKEN não definido. Adicione ao .vps-env: WEB_TOKEN=um-segredo-forte');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// ---------- Autenticação (token único, estilo IG_UPLOAD_TOKEN) ----------
function tokenDaRequisicao(req) {
  const h = req.get('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return req.get('x-web-token') || req.query.t || '';
}

function exigirToken(req, res, next) {
  const t = tokenDaRequisicao(req);
  if (t && seguroIgual(t, TOKEN)) return next();
  res.status(401).json({ ok: false, erro: 'Token inválido ou ausente.' });
}

function seguroIgual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------- Fila: uma geração/publicação por vez (RAM da KVM) ----------
let fila = Promise.resolve();
let ocupado = false;
function enfileirar(job) {
  const executar = async () => {
    ocupado = true;
    try { return await job(); } finally { ocupado = false; }
  };
  const p = fila.then(executar, executar);
  fila = p.catch(() => {}); // não propaga erro para o próximo da fila
  return p;
}

// ---------- Previews em memória (id → job aprovável) ----------
const previews = new Map();
const PREVIEW_TTL_MS = 60 * 60 * 1000; // 1 hora

function limparPreviewsAntigos() {
  const agora = Date.now();
  for (const [id, p] of previews) {
    if (agora - p.criadoEm > PREVIEW_TTL_MS) {
      p.slides.forEach((s) => fs.existsSync(s.caminho) && fs.unlinkSync(s.caminho));
      previews.delete(id);
    }
  }
}
setInterval(limparPreviewsAntigos, 10 * 60 * 1000).unref();

// ---------- Núcleo: montar item + renderizar (mesma lógica do cli.js) ----------
const FORMATOS = ['post', 'story', 'carrossel', 'segredos', 'reflexao', 'campanha', 'reel'];

async function montarItem(tipo, { livro, imagem, max, peca }) {
  if (tipo === 'post') return buildPost(livro, imagem);
  if (tipo === 'story') return buildStory(livro, imagem);
  if (tipo === 'segredos') return buildSegredos(livro);
  if (tipo === 'reflexao') return buildReflexao(livro);
  if (tipo === 'campanha') return buildCampanha(peca);
  if (tipo === 'reel') return buildReel(peca);
  return buildCarrossel(livro, Number(max) || 6);
}

async function renderSlides(item) {
  const out = [];
  if (item.tipo === 'story') {
    const html = storyHTML({ imagem: item.imagens[0], nome: item.nome, secao: item.secao, tema: item.tema });
    out.push({ buffer: await renderHTML(html, 1080, 1920), filename: `${item.livro}-story.png` });
  } else if (item.tipo === 'reel') {
    // Frames verticais (1080x1920) para montar o reel no CapCut. Não publica.
    let n = 0;
    for (const f of item.frames) {
      const tema = f.tema || item.tema;
      const html = f.template === 'twist' ? reelTwistHTML({ ...f, tema })
        : f.template === 'quiz' ? reelQuizHTML({ ...f, tema })
        : reelCapaHTML({ ...f, tema });
      out.push({ buffer: await renderHTML(html, 1080, 1920), filename: `reel-${item.id}-${String(++n).padStart(2, '0')}.png` });
    }
  } else if (item.tipo === 'campanha') {
    // Peça institucional: capa + cards, sem imagem de livro (só templates da marca).
    const cards = item.slides.filter((s) => s.template !== 'capa').length;
    let n = 0, c = 0;
    for (const s of item.slides) {
      const html = s.template === 'capa'
        ? campanhaCapaHTML({ ...s, tema: item.tema })
        : campanhaCartaoHTML({ ...s, tema: item.tema, contador: `${++c}/${cards}` });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `campanha-${item.id}-${++n}.png` });
    }
  } else if (item.tipo === 'segredos' || item.tipo === 'reflexao') {
    // Carrossel só de texto: capa (imagem do livro) + 1 card de texto por item.
    let n = 0;
    const capaHtml = slideHTML({
      imagem: item.capa, nome: item.nome, secao: item.secao,
      label: '', texto: item.titulo, tema: item.tema,
    });
    out.push({ buffer: await renderHTML(capaHtml, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}-capa.png` });
    for (const c of item.cartoes) {
      const html = cartaoHTML({
        ...c, nome: item.nome, secao: item.secao, tema: item.tema,
        contador: `${n}/${item.cartoes.length}`,
      });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}.png` });
    }
  } else {
    let n = 0;
    if (item.tipo === 'carrossel' && item.versiculo) {
      const html = versiculoHTML({ ...item.versiculo, nome: item.nome, secao: item.secao, tema: item.tema });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-carrossel-${++n}-versiculo.png` });
    }
    for (const imagem of item.imagens) {
      const html = slideHTML({
        imagem, nome: item.nome, secao: item.secao,
        label: imagem.rotulo || item.titulo, texto: imagem.texto,
        pontos: imagem.pontos, tema: item.tema,
      });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}.png` });
    }
  }
  return out;
}

async function gerarPreview({ tipo, livro, imagem, max, peca, rotacao }) {
  const item = await montarItem(tipo, { livro, imagem, max, peca });

  const [legenda, slides] = await Promise.all([
    (tipo === 'story' || tipo === 'reel') ? Promise.resolve(null) : gerarLegenda(item),
    renderSlides(item),
  ]);
  await fecharBrowser(); // libera a RAM do Chromium entre jobs

  const id = crypto.randomBytes(8).toString('hex');
  const salvos = slides.map((s) => {
    const caminho = path.join(OUT_DIR, `${id}-${s.filename}`);
    fs.writeFileSync(caminho, s.buffer);
    return { filename: s.filename, caminho };
  });

  previews.set(id, {
    id, tipo, livro: item.livro, nome: (tipo === 'campanha' || tipo === 'reel') ? item.titulo : item.nome,
    caption: legenda ? montarCaption(legenda, item) : '',
    slides: salvos, rotacao: rotacao || null,
    criadoEm: Date.now(), publicado: false,
  });

  return previews.get(id);
}

async function publicarPreview(p, captionFinal) {
  if (p.tipo === 'reel') throw new Error('Frames de reel são só para download — monte o vídeo no CapCut.');
  const buffers = p.slides.map((s) => fs.readFileSync(s.caminho));
  const urls = await Promise.all(buffers.map((b, i) => hospedar(b, p.slides[i].filename)));

  let mediaId;
  if (p.tipo === 'story') mediaId = await publicarStory({ imageUrl: urls[0] });
  else if (p.tipo === 'post') mediaId = await publicarImagem({ imageUrl: urls[0], caption: captionFinal });
  else mediaId = await publicarCarrossel({ imageUrls: urls, caption: captionFinal });

  // A rotação de livro é semanal e determinística por data (agenda.js) —
  // não há estado a "avançar" ao publicar.
  p.publicado = true;
  p.mediaId = mediaId;
  return mediaId;
}

function resumoPreview(p) {
  return {
    id: p.id, tipo: p.tipo, livro: p.livro, nome: p.nome,
    caption: p.caption, publicado: p.publicado, mediaId: p.mediaId || null,
    rotacao: p.rotacao ? { indice: p.rotacao.indice + 1, total: p.rotacao.total } : null,
    slides: p.slides.map((s, i) => ({
      nome: s.filename,
      url: `/api/preview/${p.id}/slide/${i}`,
    })),
  };
}

// ---------- Rotas ----------
// Cache do whoami (1 chamada à Graph API a cada 10 min, não a cada status).
let contaCache = { valor: null, em: 0 };
async function contaDoToken() {
  if (Date.now() - contaCache.em < 10 * 60 * 1000) return contaCache.valor;
  try {
    const eu = await quemSou();
    contaCache = {
      em: Date.now(),
      valor: {
        username: eu.username,
        userId: String(eu.user_id),
        confere: !cfg.ig.userId || String(eu.user_id) === String(cfg.ig.userId),
      },
    };
  } catch (e) {
    contaCache = { em: Date.now(), valor: { erro: e.message } };
  }
  return contaCache.valor;
}

app.get('/api/status', exigirToken, async (_req, res) => {
  const mask = (v) => (v ? v.slice(0, 4) + '…' + v.slice(-2) : null);
  let rotacao = null;
  try {
    const ag = await agendaDoDia();
    rotacao = { proximo: ag.nome, posicao: `${ag.indice + 1}/${ag.total}`, dia: ag.dia, formatos: ag.formatos };
  } catch { /* sem livros */ }
  res.json({
    ok: true,
    ocupado,
    assets: REMOTO ? `remoto → ${BASE}` : 'local',
    ig: { userId: cfg.ig.userId || null, token: mask(cfg.ig.token) },
    conta: await contaDoToken(),
    legendas: provedores(),
    upload: !!(cfg.upload.url && cfg.upload.token),
    rotacao,
  });
});

app.get('/api/livros', exigirToken, async (_req, res) => {
  try {
    res.json({ ok: true, livros: await listarLivros() });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.get('/api/campanha', exigirToken, (_req, res) => {
  res.json({ ok: true, pecas: listarCampanha() });
});

app.get('/api/reels', exigirToken, (_req, res) => {
  res.json({ ok: true, roteiros: listarReels() });
});

app.post('/api/preview', exigirToken, async (req, res) => {
  const { tipo, livro, imagem, max, proximo, peca } = req.body || {};
  try {
    let alvo = { tipo, livro, imagem, max, peca, rotacao: null };
    if (proximo) {
      const ag = await agendaDoDia();
      alvo = { tipo: tipo || ag.formatos[0] || 'carrossel', livro: ag.livro, max, rotacao: { indice: ag.indice, total: ag.total } };
    }
    if (!FORMATOS.includes(alvo.tipo)) return res.status(400).json({ ok: false, erro: `tipo inválido: ${alvo.tipo}` });
    if (alvo.tipo === 'campanha' || alvo.tipo === 'reel') {
      if (!alvo.peca) return res.status(400).json({ ok: false, erro: alvo.tipo === 'reel' ? 'Informe o roteiro do reel.' : 'Informe a peça da campanha.' });
    } else if (!alvo.livro) {
      return res.status(400).json({ ok: false, erro: 'Informe o livro.' });
    }

    const p = await enfileirar(() => gerarPreview(alvo));
    res.json({ ok: true, preview: resumoPreview(p) });
  } catch (e) {
    await fecharBrowser().catch(() => {});
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.get('/api/preview/:id/slide/:n', exigirToken, (req, res) => {
  const p = previews.get(req.params.id);
  const s = p?.slides[Number(req.params.n)];
  if (!s || !fs.existsSync(s.caminho)) return res.status(404).end();
  res.type('png').send(fs.readFileSync(s.caminho));
});

app.post('/api/publicar', exigirToken, async (req, res) => {
  const { id, caption } = req.body || {};
  const p = previews.get(id);
  if (!p) return res.status(404).json({ ok: false, erro: 'Preview não encontrado (pode ter expirado — gere de novo).' });
  if (p.publicado) return res.status(409).json({ ok: false, erro: 'Este preview já foi publicado.' });
  try {
    const captionFinal = p.tipo === 'story' ? '' : String(caption ?? p.caption);
    const mediaId = await enfileirar(() => publicarPreview(p, captionFinal));
    res.json({ ok: true, mediaId });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.delete('/api/preview/:id', exigirToken, (req, res) => {
  const p = previews.get(req.params.id);
  if (p) {
    p.slides.forEach((s) => fs.existsSync(s.caminho) && fs.unlinkSync(s.caminho));
    previews.delete(p.id);
  }
  res.json({ ok: true });
});

// UI estática (a página pede o token e guarda no navegador).
app.use(express.static(path.join(here, 'public')));

const BIND = process.env.WEB_BIND || '127.0.0.1';
app.listen(PORT, BIND, () => {
  console.log(`✅ Trilho Kids → Instagram (web) em http://${BIND}:${PORT}`);
});
