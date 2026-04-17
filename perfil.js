// ============================================
// SELETOR DE PERFIL — TRILHO KIDS
// Injeta automaticamente em todas as páginas
// via menu.js. Depende de gamificacao.js.
//
// Modos:
//   'local'  — visitante sem QR, sem API, perfil genérico no localStorage
//   'qr'     — aluno autenticado, pode trocar perfil via modal com API
// ============================================

(function iniciarSeletorPerfil() {
  function aguardarTrilhoGame(cb) {
    if (typeof trilhoGame !== 'undefined') return cb();
    let tentativas = 0;
    const id = setInterval(() => {
      if (typeof trilhoGame !== 'undefined') { clearInterval(id); cb(); return; }
      if (++tentativas > 60) clearInterval(id);
    }, 100);
  }

  function init() {
    injetarHTML();

    const ativo = trilhoGame.getPerfilAtivo();

    if (!ativo) {
      // Sem perfil nenhum → cria visitante local silenciosamente
      trilhoGame.setPerfilLocal('Visitante');
    }

    atualizarBotao(trilhoGame.getPerfilAtivo());
    // Modal NÃO abre automaticamente em nenhum caso
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => aguardarTrilhoGame(init));
  } else {
    aguardarTrilhoGame(init);
  }
})();

// ── HTML do sistema de perfil ────────────────
function injetarHTML() {
  if (document.getElementById('perfil-sistema')) return;

  const div = document.createElement('div');
  div.id = 'perfil-sistema';
  div.innerHTML = `
    <!-- Botão fixo do explorador ativo -->
    <button id="perfil-btn" onclick="abrirModalPerfil()" title="Meu perfil"
      style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:8000;
             background:linear-gradient(135deg,#6d28d9,#7c3aed);
             color:white;border:none;border-radius:9999px;
             padding:.6rem 1rem .6rem .75rem;
             font-weight:700;font-size:.85rem;cursor:pointer;
             box-shadow:0 4px 20px rgba(109,40,217,.5);
             display:flex;align-items:center;gap:.5rem;
             transition:transform .15s,box-shadow .15s;"
      onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 24px rgba(109,40,217,.7)'"
      onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 20px rgba(109,40,217,.5)'">
      <span id="perfil-btn-icone" style="font-size:1.1rem;">🗺️</span>
      <span id="perfil-btn-nome">...</span>
      <span style="color:#c4b5fd;font-size:.7rem;">▾</span>
    </button>

    <!-- Modal -->
    <div id="perfil-modal" style="display:none;position:fixed;inset:0;
         background:rgba(10,8,30,.93);z-index:9900;overflow-y:auto;">
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);
                    border:2px solid rgba(139,92,246,.5);border-radius:1.5rem;
                    padding:2rem;width:100%;max-width:540px;box-shadow:0 25px 60px rgba(0,0,0,.7);">

          <!-- Conteúdo: muda conforme o modo -->
          <div id="pk-conteudo"></div>

          <!-- Fechar -->
          <div style="text-align:center;margin-top:1.5rem;">
            <button onclick="fecharModalPerfil()"
              style="background:none;border:none;color:#6b7280;font-size:.9rem;cursor:pointer;"
              onmouseover="this.style.color='#9ca3af'" onmouseout="this.style.color='#6b7280'">
              ✕ Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

// ── Atualiza botão fixo ──────────────────────
function atualizarBotao(nome) {
  const btnNome  = document.getElementById('perfil-btn-nome');
  const btnIcone = document.getElementById('perfil-btn-icone');
  if (!btnNome) return;
  const isQR = trilhoGame.isPerfilQR();
  btnNome.textContent  = nome || '...';
  btnIcone.textContent = isQR ? '⚔️' : '🗺️';
}

// ── Abre modal ────────────────────────────────
async function abrirModal() {
  const modal    = document.getElementById('perfil-modal');
  const conteudo = document.getElementById('pk-conteudo');
  if (!modal || !conteudo) return;

  if (trilhoGame.isPerfilQR()) {
    // Aluno QR: mostra opções de sessão (progresso ou encerrar)
    conteudo.innerHTML = renderConteudoSessao();
    modal.style.display = 'block';
  } else {
    // Visitante local: mostra instrução para usar QR
    conteudo.innerHTML = renderConteudoVisitante();
    modal.style.display = 'block';
  }
}

window.abrirModalPerfil = abrirModal;

// ── Conteúdo do modal para aluno QR (sessão) ─
function renderConteudoSessao() {
  const nome = trilhoGame.getPerfilAtivo();
  return `
    <div style="text-align:center;padding:1rem 0;">
      <div style="font-size:3.5rem;margin-bottom:.75rem;">⚔️</div>
      <h2 style="color:white;font-size:1.5rem;font-weight:900;margin:0 0 .25rem;">
        Olá, ${nome}!
      </h2>
      <p style="color:#9ca3af;font-size:.9rem;margin:0 0 2rem;">O que deseja fazer?</p>
      <div style="display:flex;flex-direction:column;gap:.75rem;">
        <a href="/progresso.html"
          style="display:block;background:linear-gradient(135deg,#5b21b6,#4c1d95);
                 color:white;font-weight:700;font-size:1rem;padding:.9rem;
                 border-radius:1rem;text-decoration:none;transition:opacity .2s;"
          onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          📊 Ver meu progresso
        </a>
        <button onclick="encerrarSessao()"
          style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);
                 color:#fca5a5;font-weight:700;font-size:1rem;padding:.9rem;
                 border-radius:1rem;cursor:pointer;transition:background .2s;"
          onmouseover="this.style.background='rgba(239,68,68,.3)'"
          onmouseout="this.style.background='rgba(239,68,68,.15)'">
          🚪 Encerrar sessão
        </button>
      </div>
    </div>
  `;
}

// ── Encerra sessão do aluno QR ────────────────
window.encerrarSessao = function () {
  trilhoGame.setPerfilLocal('Visitante');
  fecharModalPerfil();
  window.location.href = '/';
};

// ── Conteúdo do modal para visitantes ────────
function renderConteudoVisitante() {
  return `
    <div style="text-align:center;padding:1rem 0;">
      <div style="font-size:3.5rem;margin-bottom:1rem;">🏕️</div>
      <h2 style="color:white;font-size:1.5rem;font-weight:900;margin:0 0 .5rem;">
        Você está como visitante
      </h2>
      <p style="color:#9ca3af;font-size:.95rem;margin:0 0 1.5rem;">
        Para salvar seu progresso e ganhar pontos, você precisa do seu QR Code.
      </p>
      <div style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);
                  border-radius:1rem;padding:1.25rem;text-align:left;font-size:.9rem;color:#d1d5db;">
        <p style="margin:0 0 .5rem;font-weight:700;color:#a78bfa;">📲 Como entrar com minha conta?</p>
        <p style="margin:0;">Peça ao seu professor o QR Code do seu perfil e escaneie com a câmera do celular.</p>
      </div>
    </div>
  `;
}

// ── Fecha modal ──────────────────────────────
window.fecharModalPerfil = function () {
  const modal = document.getElementById('perfil-modal');
  if (modal) modal.style.display = 'none';
};
