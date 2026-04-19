// ============================================
// ACESSO — TRILHO KIDS
// Guard de acesso progressivo para páginas de livros.
// Injeta overlay imediatamente; remove após verificação assíncrona.
// Expõe window.acessoLiberadoPromise para gamificacao.js não pontuar livros bloqueados.
// ============================================
(function () {
  'use strict';

  // Usa a promise criada sincronicamente pelo menu.js.
  // Fallback: cria aqui caso acesso.js seja carregado fora do menu.js.
  if (window.acessoLiberadoPromise === undefined) {
    window.acessoLiberadoPromise = new Promise(function (resolve) {
      window._resolveAcessoKids = resolve;
    });
  }
  var _resolveAcesso = window._resolveAcessoKids || function () {};

  const TRILHO_API = (function () {
    const h = location.hostname;
    return (h === 'localhost' || h === '127.0.0.1')
      ? 'http://localhost:8080'
      : 'https://cafecomhomensdedeus.com.br/trilhokids/api';
  })();

  // Overlay cobre a página enquanto verificação acontece
  const overlay = document.createElement('div');
  overlay.id = 'acesso-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:#0f172a',
    'display:flex', 'align-items:center', 'justify-content:center',
    'flex-direction:column', 'gap:1rem',
  ].join(';');
  overlay.innerHTML = '<div style="width:2.5rem;height:2.5rem;border:3px solid #7c3aed;border-top-color:transparent;border-radius:50%;animation:acesso-spin .7s linear infinite"></div>';

  const styleTag = document.createElement('style');
  styleTag.textContent = '@keyframes acesso-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(styleTag);

  function injetar() {
    if (document.body) {
      document.body.appendChild(overlay);
      verificar();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(overlay);
        verificar();
      });
    }
  }

  // Detecta pasta do livro atual na URL
  // Exemplos: /genesis/genesis.html → 'genesis'
  //           /novotestamento/mateus/mateus.html → 'mateus'
  function detectarPasta() {
    const segs = location.pathname.split('/').filter(Boolean);
    const livros = window.LIVROS_CANONICOS;
    if (!livros) return null;
    for (let i = segs.length - 1; i >= 0; i--) {
      if (livros.find(function (l) { return l.pasta === segs[i]; })) {
        return segs[i];
      }
    }
    return null;
  }

  function liberar() {
    _resolveAcesso(true);
    overlay.remove();
  }

  function bloquear(nomeLivro, proximoEm) {
    _resolveAcesso(false);
    mostrarBloqueio(nomeLivro, proximoEm);
  }

  async function verificar() {
    // Aguarda LIVROS_CANONICOS (carregado por livros.js via menu.js)
    const livros = await esperarLivros();
    if (!livros) { liberar(); return; }

    const pasta = detectarPasta();
    if (!pasta) { liberar(); return; } // não é página de livro

    const livro = livros.find(function (l) { return l.pasta === pasta; });
    if (!livro) { liberar(); return; }

    // Visitante local = sem restrição
    const tipo = localStorage.getItem('trilho_perfil_tipo');
    if (tipo === 'local' || tipo === null) { liberar(); return; }

    const nome = localStorage.getItem('trilho_perfil');
    if (!nome) { liberar(); return; }

    try {
      const url = TRILHO_API + '/acesso.php?nome=' + encodeURIComponent(nome) +
                  '&livro_ordem=' + livro.ordem;
      const resp = await fetch(url, { cache: 'no-store' });
      const data = await resp.json();

      if (!data.ok || data.dados.acesso) {
        liberar();
      } else {
        bloquear(livro.nome, data.dados.proximo_em);
      }
    } catch (_) {
      liberar(); // falha de rede → fail open
    }
  }

  function mostrarBloqueio(nomeLivro, proximoEm) {
    let dataStr = '';
    if (proximoEm) {
      const d = new Date(proximoEm + 'T12:00:00');
      dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    overlay.innerHTML =
      '<div style="text-align:center;padding:2rem 1.5rem;max-width:420px;">' +
        '<div style="font-size:4rem;margin-bottom:1rem;">🔒</div>' +
        '<h2 style="color:white;font-size:1.4rem;font-weight:900;margin:0 0 .5rem">' + nomeLivro + '</h2>' +
        '<p style="color:#a78bfa;margin:0 0 .75rem;font-size:.95rem;">Este livro ainda não foi liberado para sua turma.</p>' +
        (dataStr
          ? '<p style="color:#6b7280;font-size:.85rem;margin:0 0 1.5rem;">Disponível em <strong style="color:#c4b5fd">' + dataStr + '</strong></p>'
          : '<p style="color:#6b7280;font-size:.85rem;margin:0 0 1.5rem;">Aguarde seu professor liberar este conteúdo.</p>') +
        '<a href="/index.html" style="display:inline-block;background:#7c3aed;color:white;padding:.7rem 1.5rem;border-radius:.75rem;font-weight:700;text-decoration:none;font-size:.95rem;">' +
          '← Voltar ao início' +
        '</a>' +
      '</div>';
  }

  // Tenta obter LIVROS_CANONICOS por até 1 segundo (livros.js pode estar carregando)
  function esperarLivros() {
    return new Promise(function (resolve) {
      if (window.LIVROS_CANONICOS) { resolve(window.LIVROS_CANONICOS); return; }
      let n = 0;
      const t = setInterval(function () {
        n++;
        if (window.LIVROS_CANONICOS) { clearInterval(t); resolve(window.LIVROS_CANONICOS); }
        else if (n >= 20) { clearInterval(t); resolve(null); }
      }, 50);
    });
  }

  injetar();
})();
