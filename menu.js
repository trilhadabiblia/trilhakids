document.addEventListener("DOMContentLoaded", async () => {
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

  } catch (error) {
    console.error("Erro ao carregar o menu:", error);
  }
});
