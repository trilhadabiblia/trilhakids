// ============================================================
// Templates HTML (visual "misto": moldura nova da marca +
// imagem existente do portal embutida como base64).
// Cada livro é tematizado com sua própria cor (from/to do <h1>).
// ============================================================
import fs from 'fs';
import { TEMA_PADRAO } from './cores.js';

const SECOES = {
  pentateuco: 'Pentateuco',
  historicos: 'Históricos',
  poeticos: 'Poéticos',
  'profetas-maiores': 'Profetas Maiores',
  'profetas-menores': 'Profetas Menores',
  evangelhos: 'Evangelhos',
  'historico-nt': 'Histórico',
  'cartas-paulo': 'Cartas de Paulo',
  'outras-cartas': 'Outras Cartas',
  'profetico-nt': 'Apocalipse',
};

// @ exibido no rodapé. Defina IG_HANDLE no ambiente para trocar sem editar código.
const HANDLE = process.env.IG_HANDLE || '@portaltrilhokids';

// Imagem local → base64 (self-contained); imagem remota → URL (Puppeteer baixa).
function srcDe(imagem) {
  if (imagem.url) return imagem.url;
  return `data:image/png;base64,${fs.readFileSync(imagem.caminho).toString('base64')}`;
}

function truncar(txt, max) {
  if (!txt) return '';
  return txt.length > max ? txt.slice(0, max - 1).trim() + '…' : txt;
}

function escBadge(secao) {
  return SECOES[secao] || 'Bíblia';
}

// hex (#rrggbb) → rgba(r,g,b,a)
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// CSS base compartilhado, tematizado pela cor do livro.
function baseCSS(w, h, t) {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${w}px; height: ${h}px; }
    body {
      font-family: 'Segoe UI', 'Nunito', system-ui, -apple-system, sans-serif;
      background: radial-gradient(120% 120% at 50% 0%, ${t.from} 0%, #0a0818 62%);
      color: #fff; overflow: hidden;
    }
    .frame { width: ${w}px; height: ${h}px; padding: 64px; display: flex;
      flex-direction: column; position: relative; }
    .glow { position: absolute; inset: 0; background:
      radial-gradient(60% 40% at 80% 15%, ${hexA(t.to, 0.40)}, transparent 70%),
      radial-gradient(50% 40% at 10% 90%, rgba(236,72,153,.18), transparent 70%); }
    .brand { display: flex; align-items: center; gap: 16px; z-index: 2; }
    .brand .dot { width: 46px; height: 46px; border-radius: 14px;
      background: linear-gradient(135deg,#7c3aed,#ec4899);
      display: flex; align-items: center; justify-content: center; font-size: 26px; }
    .brand .name { font-size: 30px; font-weight: 800; letter-spacing: .5px; }
    .brand .name span { color: ${t.light}; }
    .badge { align-self: flex-start; margin-top: 8px; z-index: 2;
      background: ${hexA(t.to, 0.28)}; border: 1px solid ${hexA(t.light, 0.5)};
      color: ${t.badgeText}; font-weight: 700; font-size: 26px; padding: 10px 24px;
      border-radius: 999px; }
    .media { z-index: 2; flex: 1; min-height: 0; margin: 14px 0;
      display: flex; align-items: center; justify-content: center; }
    .media img { max-width: 100%; max-height: 100%; object-fit: contain;
      border-radius: 20px; display: block;
      filter: drop-shadow(0 20px 45px rgba(0,0,0,.45)); }
    .foot { z-index: 2; display: flex; align-items: center; justify-content: space-between; }
    .foot .cta { font-size: 30px; font-weight: 800; color: #fff; }
    .foot .cta b { color: #f9a8d4; }
    .pill { background: #fff; color: #2a1055; font-weight: 800; font-size: 26px;
      padding: 12px 26px; border-radius: 999px; }
  `;
}

function marca() {
  return `<div class="brand">
    <div class="dot">📖</div>
    <div class="name">Trilho <span>Kids</span></div>
  </div>`;
}

// Slide quadrado 1080x1080 (post e cada item do carrossel).
export function slideHTML({ imagem, nome, secao, kicker, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const titulo = kicker || nome;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .title { z-index: 2; font-size: 60px; font-weight: 900; line-height: 1.05; margin: 22px 0 20px; }
    .title small { display: block; font-size: 32px; font-weight: 700; color: ${t.light}; margin-bottom: 6px; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      <div class="badge">${escBadge(secao)}</div>
      <div class="title"><small>${nome}</small>${titulo}</div>
      <div class="media"><img src="${srcDe(imagem)}"></div>
      <div class="foot">
        <div class="cta">Aprenda a Bíblia <b>brincando</b></div>
        <div class="pill">${HANDLE}</div>
      </div>
    </div>
  </body></html>`;
}

// Story vertical 1080x1920.
export function storyHTML({ imagem, nome, secao, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1920;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .frame { padding: 90px 64px; }
    .title { z-index: 2; font-size: 76px; font-weight: 900; line-height: 1.05; margin: 30px 0 26px; }
    .title small { display: block; font-size: 36px; font-weight: 700; color: ${t.light}; margin-bottom: 8px; }
    .foot { flex-direction: column; gap: 26px; margin-top: 20px; }
    .foot .cta { font-size: 44px; text-align: center; }
    .pill { font-size: 34px; padding: 18px 40px; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      <div class="badge">${escBadge(secao)}</div>
      <div class="title"><small>Descubra o livro de</small>${nome}</div>
      <div class="media"><img src="${srcDe(imagem)}"></div>
      <div class="foot">
        <div class="cta">📲 Escaneie o <b>QR Code</b> e comece a jogar!</div>
        <div class="pill">${HANDLE}</div>
      </div>
    </div>
  </body></html>`;
}

// Card do "Versículo para guardar no coração" — 1º slide do carrossel (1080x1080).
export function versiculoHTML({ versiculo, referencia, texto, nome, secao, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const explic = truncar(texto, 220);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .frame { justify-content: flex-start; }
    .label { z-index: 2; margin-top: 26px; font-size: 30px; font-weight: 800; color: #fcd34d; }
    .livro { z-index: 2; font-size: 34px; font-weight: 800; color: ${t.light}; margin-top: 4px; }
    .quote { z-index: 2; flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; }
    .mark { font-family: Georgia, 'Times New Roman', serif; font-size: 160px; line-height: .5;
      color: ${hexA(t.light, 0.35)}; height: 70px; }
    .verse { font-family: Georgia, 'Times New Roman', serif; font-style: italic;
      font-size: 58px; font-weight: 700; line-height: 1.25; color: #fff; max-width: 900px; }
    .ref { margin-top: 28px; font-size: 34px; font-weight: 800; color: #f9a8d4; }
    .explic { margin-top: 26px; font-size: 26px; line-height: 1.45; color: #e5e0f5; max-width: 860px; }
    .foot { margin-top: 10px; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      <div class="badge">${escBadge(secao)}</div>
      <div class="label">💛 Versículo para guardar no coração</div>
      <div class="livro">${nome}</div>
      <div class="quote">
        <div class="mark">“</div>
        <div class="verse">${versiculo}</div>
        ${referencia ? `<div class="ref">— ${referencia}</div>` : ''}
        ${explic ? `<div class="explic">${explic}</div>` : ''}
      </div>
      <div class="foot">
        <div class="cta">Aprenda a Bíblia <b>brincando</b></div>
        <div class="pill">${HANDLE}</div>
      </div>
    </div>
  </body></html>`;
}
