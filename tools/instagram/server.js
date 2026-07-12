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
import { buildPost, buildStory, buildCarrossel, listarLivros } from './content.js';
import { slideHTML, storyHTML, versiculoHTML } from './templates.js';
import { renderHTML, fecharBrowser } from './render.js';
import { gerarLegenda, montarCaption } from './caption.js';
import { provedores } from './llm.js';
import { hospedar } from './host.js';
import { publicarImagem, publicarStory, publicarCarrossel } from './instagram.js';
import { proximoLivro, avancar } from './agenda.js';
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
const FORMATOS = ['post', 'story', 'carrossel'];

async function montarItem(tipo, { livro, imagem, max }) {
  if (tipo === 'post') return buildPost(livro, imagem);
  if (tipo === 'story') return buildStory(livro, imagem);
  return buildCarrossel(livro, Number(max) || 6);
}

async function renderSlides(item) {
  const out = [];
  if (item.tipo === 'story') {
    const html = storyHTML({ imagem: item.imagens[0], nome: item.nome, secao: item.secao, tema: item.tema });
    out.push({ buffer: await renderHTML(html, 1080, 1920), filename: `${item.livro}-story.png` });
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

async function gerarPreview({ tipo, livro, imagem, max, rotacao }) {
  const item = await montarItem(tipo, { livro, imagem, max });

  const [legenda, slides] = await Promise.all([
    tipo === 'story' ? Promise.resolve(null) : gerarLegenda(item),
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
    id, tipo, livro: item.livro, nome: item.nome,
    caption: legenda ? montarCaption(legenda) : '',
    slides: salvos, rotacao: rotacao || null,
    criadoEm: Date.now(), publicado: false,
  });

  return previews.get(id);
}

async function publicarPreview(p, captionFinal) {
  const buffers = p.slides.map((s) => fs.readFileSync(s.caminho));
  const urls = await Promise.all(buffers.map((b, i) => hospedar(b, p.slides[i].filename)));

  let mediaId;
  if (p.tipo === 'story') mediaId = await publicarStory({ imageUrl: urls[0] });
  else if (p.tipo === 'post') mediaId = await publicarImagem({ imageUrl: urls[0], caption: captionFinal });
  else mediaId = await publicarCarrossel({ imageUrls: urls, caption: captionFinal });

  // Se o preview veio da rotação ("proximo"), avança o agenda.json.
  if (p.rotacao) avancar(p.rotacao.indice, p.rotacao.total);

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
app.get('/api/status', exigirToken, async (_req, res) => {
  const mask = (v) => (v ? v.slice(0, 4) + '…' + v.slice(-2) : null);
  let rotacao = null;
  try {
    const { nome, indice, total } = await proximoLivro();
    rotacao = { proximo: nome, posicao: `${indice + 1}/${total}` };
  } catch { /* sem livros */ }
  res.json({
    ok: true,
    ocupado,
    assets: REMOTO ? `remoto → ${BASE}` : 'local',
    ig: { userId: cfg.ig.userId || null, token: mask(cfg.ig.token) },
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

app.post('/api/preview', exigirToken, async (req, res) => {
  const { tipo, livro, imagem, max, proximo } = req.body || {};
  try {
    let alvo = { tipo, livro, imagem, max, rotacao: null };
    if (proximo) {
      const r = await proximoLivro();
      alvo = { tipo: tipo || 'carrossel', livro: r.livro, max, rotacao: { indice: r.indice, total: r.total } };
    }
    if (!FORMATOS.includes(alvo.tipo)) return res.status(400).json({ ok: false, erro: `tipo inválido: ${alvo.tipo}` });
    if (!alvo.livro) return res.status(400).json({ ok: false, erro: 'Informe o livro.' });

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

app.listen(PORT, '172.17.0.1', () => {
  console.log(`✅ Trilho Kids → Instagram (web) em http://127.0.0.1:${PORT}`);
  console.log('   Exponha via Nginx com HTTPS; a porta não deve ser aberta no firewall.');
});
