// ============================================================
// Templates HTML (visual "misto": moldura nova da marca +
// imagem existente do portal embutida como base64).
// Cada livro é tematizado com sua própria cor (from/to do <h1>).
// ============================================================
import fs from 'fs';
import { TEMA_PADRAO } from './cores.js';
import { cfg, SECOES } from './config.js';

// @ exibido no rodapé (cfg.handle, default @portaltrilhokids).
const HANDLE = cfg.handle;

// Imagem local → base64 (self-contained); imagem remota → URL (Puppeteer baixa).
function srcDe(imagem) {
  if (imagem.url) return imagem.url;
  return `data:image/png;base64,${fs.readFileSync(imagem.caminho).toString('base64')}`;
}

function truncar(txt, max) {
  if (!txt) return '';
  return txt.length > max ? txt.slice(0, max - 1).trim() + '…' : txt;
}

// Escapa texto vindo do HTML da página para uso seguro como nó de texto
// (preserva \n, que o CSS `white-space: pre-line` transforma em quebra).
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
// label = rótulo curto da seção; texto = subtítulo (capa) OU pontos = bullets
// determinísticos com os títulos-chave dos cards da seção.
export function slideHTML({ imagem, nome, secao, label, texto, pontos, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const pequeno = label ? `${nome} · ${label}` : nome;
  const bullets = Array.isArray(pontos) ? pontos.filter(Boolean) : [];

  // Fonte dos bullets: encolhe conforme a quantidade para caber acima da imagem.
  const fontePonto = bullets.length >= 4 ? 26 : bullets.length === 3 ? 30 : 34;

  const conteudo = bullets.length
    ? `<div class="cabecalho"><small>${pequeno}</small></div>
       <ul class="pontos" style="font-size:${fontePonto}px">
         ${bullets.map((p) => `<li>${p}</li>`).join('')}
       </ul>`
    : `<div class="title" style="font-size:${texto ? 46 : 60}px"><small>${pequeno}</small>${texto || label || nome}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .title { z-index: 2; font-weight: 900; line-height: 1.15; margin: 18px 0 16px; }
    .title small { display: block; font-size: 30px; font-weight: 700; color: ${t.light}; margin-bottom: 8px; }
    .cabecalho { z-index: 2; margin: 14px 0 2px; }
    .cabecalho small { font-size: 28px; font-weight: 800; color: ${t.light}; }
    .pontos { z-index: 2; list-style: none; display: flex; flex-direction: column;
      gap: 8px; margin: 6px 0 8px; }
    .pontos li { font-weight: 700; line-height: 1.15; color: #fff;
      background: ${hexA(t.to, 0.20)}; border-left: 5px solid ${t.light};
      padding: 10px 18px; border-radius: 12px; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      <div class="badge">${escBadge(secao)}</div>
      ${conteudo}
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
  // Cap de segurança bem folgado (só corta casos extremos); o encaixe normal
  // vem do dimensionamento dinâmico da fonte conforme o tamanho do texto.
  const explic = truncar(texto, 360);
  const vLen = (versiculo || '').length;
  const fVerse = vLen > 150 ? 40 : vLen > 100 ? 46 : vLen > 60 ? 52 : 58;
  const fExplic = explic.length > 280 ? 22 : explic.length > 230 ? 23 : explic.length > 180 ? 24 : 26;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .frame { justify-content: flex-start; }
    .label { z-index: 2; margin-top: 26px; font-size: 30px; font-weight: 800; color: #fcd34d; }
    .livro { z-index: 2; font-size: 34px; font-weight: 800; color: ${t.light}; margin-top: 4px; }
    .quote { z-index: 2; flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; }
    .mark { font-family: Georgia, 'Times New Roman', serif; font-size: 160px; line-height: .5;
      color: ${hexA(t.light, 0.35)}; height: 70px; }
    .verse { font-family: Georgia, 'Times New Roman', serif; font-style: italic;
      font-size: ${fVerse}px; font-weight: 700; line-height: 1.25; color: #fff; max-width: 900px; }
    .ref { margin-top: 28px; font-size: 34px; font-weight: 800; color: #f9a8d4; }
    .explic { margin-top: 26px; font-size: ${fExplic}px; line-height: 1.45; color: #e5e0f5; max-width: 860px; }
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

// ============================================================
// Campanha institucional (a partir do pitch): cards on-brand SEM imagem de
// livro. Badge com texto livre (não a seção bíblica) e rodapé/CTA próprio.
// ============================================================

// Rodapé compartilhado das peças de campanha (CTA à esquerda + @ à direita).
function rodapeCampanha(rodape) {
  return `<div class="foot">
    <div class="cta">${esc(rodape || 'Conheça o Trilho Kids')}</div>
    <div class="pill">${HANDLE}</div>
  </div>`;
}

// Capa da peça (1080x1080): badge + título grande + subtítulo + números.
export function campanhaCapaHTML({ pill, titulo, subtitulo, stats, rodape, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const chips = Array.isArray(stats) ? stats : [];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .hero { z-index: 2; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .htitle { font-size: 72px; font-weight: 900; line-height: 1.1; margin: 20px 0 18px; }
    .hsub { font-size: 34px; font-weight: 600; line-height: 1.35; color: #e5e0f5; max-width: 900px; }
    .stats { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 40px; }
    .stat { background: ${hexA(t.to, 0.18)}; border: 1px solid ${hexA(t.light, 0.5)};
      border-radius: 18px; padding: 18px 26px; text-align: center; min-width: 150px; }
    .stat .v { font-size: 52px; font-weight: 900; color: ${t.light}; line-height: 1; }
    .stat .l { font-size: 24px; font-weight: 600; color: #cfc6ee; margin-top: 6px; }
    .foot .cta { font-size: 30px; font-weight: 800; color: #fff; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      <div class="hero">
        <div class="badge" style="align-self:flex-start">${esc(pill)}</div>
        <div class="htitle">${esc(titulo)}</div>
        ${subtitulo ? `<div class="hsub">${esc(subtitulo)}</div>` : ''}
        ${chips.length ? `<div class="stats">${chips.map((s) =>
          `<div class="stat"><div class="v">${esc(s.valor)}</div><div class="l">${esc(s.rotulo)}</div></div>`).join('')}</div>` : ''}
      </div>
      ${rodapeCampanha(rodape)}
    </div>
  </body></html>`;
}

// Card de conteúdo da peça (1080x1080): badge + título + corpo OU bullets.
export function campanhaCartaoHTML({ pill, titulo, corpo, pontos, rodape, contador, tema }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const bullets = Array.isArray(pontos) ? pontos.filter(Boolean) : [];
  const len = (corpo || '').length;
  const fCorpo = len > 340 ? 38 : len > 220 ? 44 : 50;
  const fPonto = bullets.length >= 4 ? 32 : bullets.length === 3 ? 36 : 40;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .frame { justify-content: flex-start; }
    .cardtitle { z-index: 2; margin-top: 22px; font-size: 56px; font-weight: 900;
      line-height: 1.12; color: #fff; }
    .body { z-index: 2; flex: 1; display: flex; align-items: center; }
    .body p { font-size: ${fCorpo}px; line-height: 1.4; color: #f3f0ff;
      white-space: pre-line; font-weight: 600; }
    .pontos { z-index: 2; flex: 1; list-style: none; display: flex; flex-direction: column;
      justify-content: center; gap: 14px; }
    .pontos li { font-size: ${fPonto}px; font-weight: 700; line-height: 1.2; color: #fff;
      background: ${hexA(t.to, 0.20)}; border-left: 6px solid ${t.light};
      padding: 16px 22px; border-radius: 14px; }
    .foot .cta { font-size: 28px; font-weight: 800; color: #fff; }
    .count { z-index: 2; position: absolute; top: 64px; right: 64px;
      font-size: 26px; font-weight: 800; color: ${hexA(t.light, 0.9)}; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      ${contador ? `<div class="count">${contador}</div>` : ''}
      <div class="badge">${esc(pill)}</div>
      ${titulo ? `<div class="cardtitle">${esc(titulo)}</div>` : ''}
      ${bullets.length
        ? `<ul class="pontos">${bullets.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`
        : `<div class="body"><p>${esc(corpo)}</p></div>`}
      ${rodapeCampanha(rodape)}
    </div>
  </body></html>`;
}

// Card de texto genérico (1080x1080) para carrosséis extras (segredos,
// perguntas, desafios). Estrutura: sobrancelha + título + corpo (multilinha)
// + rodapé opcional (versículo). Fonte do corpo escala com o tamanho do texto.
export function cartaoHTML({ eyebrow, titulo, corpo, versiculo, nome, secao, tema, contador }) {
  const t = tema || TEMA_PADRAO;
  const w = 1080, h = 1080;
  const len = (corpo || '').length;
  const fCorpo = len > 340 ? 36 : len > 220 ? 42 : 48;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCSS(w, h, t)}
    .frame { justify-content: flex-start; }
    .eyebrow { z-index: 2; margin-top: 26px; font-size: 30px; font-weight: 800;
      letter-spacing: 1px; text-transform: uppercase; color: #fcd34d; }
    .livro { z-index: 2; font-size: 30px; font-weight: 800; color: ${t.light}; margin-top: 2px; }
    .cardtitle { z-index: 2; margin-top: 16px; font-size: 52px; font-weight: 900;
      line-height: 1.1; color: #fff; }
    .body { z-index: 2; flex: 1; display: flex; align-items: center; }
    .body p { font-size: ${fCorpo}px; line-height: 1.4; color: #f3f0ff;
      white-space: pre-line; font-weight: 600; }
    .ref { z-index: 2; margin: 8px 0 4px; font-size: 26px; font-weight: 700;
      font-style: italic; color: #f9a8d4; line-height: 1.35; }
    .foot .cta { font-size: 26px; }
    .count { z-index: 2; position: absolute; top: 64px; right: 64px;
      font-size: 26px; font-weight: 800; color: ${hexA(t.light, 0.9)}; }
  </style></head><body>
    <div class="frame">
      <div class="glow"></div>
      ${marca()}
      ${contador ? `<div class="count">${contador}</div>` : ''}
      <div class="badge">${escBadge(secao)}</div>
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      <div class="livro">${esc(nome)}</div>
      ${titulo ? `<div class="cardtitle">${esc(titulo)}</div>` : ''}
      <div class="body"><p>${esc(corpo)}</p></div>
      ${versiculo ? `<div class="ref">${esc(versiculo)}</div>` : ''}
      <div class="foot">
        <div class="cta">Aprenda a Bíblia <b>brincando</b></div>
        <div class="pill">${HANDLE}</div>
      </div>
    </div>
  </body></html>`;
}
