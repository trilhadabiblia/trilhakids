document.addEventListener("DOMContentLoaded", async () => {
  // Cria a promise de controle de acesso ANTES do primeiro await,
  // garantindo que gamificacao.js a encontre antes de qualquer visitarLivro().
  if (window.acessoLiberadoPromise === undefined) {
    window.acessoLiberadoPromise = new Promise(function (resolve) {
      window._resolveAcessoKids = resolve;
    });
  }

  try {
    // Caminho relativo: uma pasta acima do HTML (ex: /juizes/index.html → /menu.html)
    const response = await fetch("../menu.html");
    const menuHTML = await response.text();

    // Cria container e injeta o HTML
    const menuContainer = document.createElement("div");
    menuContainer.innerHTML = menuHTML;
    document.body.insertBefore(menuContainer, document.body.firstChild);

    // Garante posição fixa
    const style = document.createElement("style");
    style.textContent = `
      button[onclick="toggleMenu()"] {
        position: fixed;
        top: 1.5rem;
        left: 1.5rem;
        z-index: 9999;
      }
      #sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 9998;
      }
      #overlay {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9997;
      }
    `;
    document.head.appendChild(style);

    // ⚙️ Executa os <script> do menu.html manualmente
    menuContainer.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      if (oldScript.src) {
        newScript.src = oldScript.src; // caso tenha src externo
      } else {
        newScript.textContent = oldScript.textContent; // executa inline
      }
      document.body.appendChild(newScript);
    });

    // Injeta seletor de perfil (gamificacao.js deve estar carregado antes)
    if (!document.getElementById('perfil-sistema')) {
      const perfilScript = document.createElement('script');
      perfilScript.src = '/perfil.js';
      document.body.appendChild(perfilScript);
    }

    // Injeta livros.js → acesso.js (guard de acesso progressivo)
    if (!document.getElementById('livros-canonicos')) {
      const livrosScript = document.createElement('script');
      livrosScript.id  = 'livros-canonicos';
      livrosScript.src = '/livros.js';
      livrosScript.onload = function () {
        if (!document.getElementById('acesso-sistema')) {
          const acessoScript = document.createElement('script');
          acessoScript.id  = 'acesso-sistema';
          acessoScript.src = '/acesso.js';
          document.body.appendChild(acessoScript);
        }
      };
      document.body.appendChild(livrosScript);
    }

    // ── PWA: manifest + favicons + meta tags ─
    if (!document.querySelector('link[rel="manifest"]')) {
      const links = [
        { rel: 'manifest',           href: '/manifest.json' },
        { rel: 'icon',               href: '/favicon.ico',        type: 'image/x-icon' },
        { rel: 'icon',               href: '/favicon.svg',        type: 'image/svg+xml' },
        { rel: 'icon',               href: '/favicon-96x96.png',  type: 'image/png', sizes: '96x96' },
        { rel: 'apple-touch-icon',   href: '/apple-touch-icon.png' },
      ];
      links.forEach(l => {
        const el = document.createElement('link');
        Object.entries(l).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
      });
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name    = 'theme-color';
      meta.content = '#7c3aed';
      document.head.appendChild(meta);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const tags = [
        { name: 'apple-mobile-web-app-capable',          content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title',            content: 'Trilho Kids' },
      ];
      tags.forEach(t => {
        const m = document.createElement('meta');
        m.name = t.name; m.content = t.content;
        document.head.appendChild(m);
      });
    }

    // ── PWA: registra Service Worker ────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

  } catch (error) {
    console.error("Erro ao carregar o menu:", error);
  }
});
