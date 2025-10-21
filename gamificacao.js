// ============================================
// SISTEMA DE GAMIFICAÇÃO - TRILHO KIDS
// ============================================
// Inclua este script em TODAS as páginas do site
// <script src="./gamificacao.js"></script>

class TrilhoKidsGame {
  constructor() {
    this.storageKey = 'trilhoKidsProgress';
    this.init();
  }

  // Inicializar sistema
  init() {
    let data = this.getData();
    if (!data) {
      data = {
        pontos: 0,
        nivel: 1,
        livrosVisitados: [],
        heroisVisitados: [],
        quizzesCompletos: [],
        badges: [],
        historia: [],
        dataCriacao: new Date().toISOString()
      };
      this.saveData(data);
    }
    return data;
  }

  // Obter dados do LocalStorage
  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  // Salvar dados no LocalStorage
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // ============================================
  // SISTEMA DE PONTOS
  // ============================================

  adicionarPontos(quantidade, motivo) {
    const data = this.getData();
    data.pontos += quantidade;
    
    // Adicionar ao histórico
    data.historia.push({
      tipo: 'pontos',
      quantidade,
      motivo,
      data: new Date().toISOString()
    });

    // Verificar nível
    this.verificarNivel(data);
    
    this.saveData(data);
    this.verificarBadges();
    
    // Mostrar notificação
    this.mostrarNotificacao(`+${quantidade} pontos! ${motivo}`, 'success');
  }

  verificarNivel(data) {
    const nivelAnterior = data.nivel;
    
    // Tabela de níveis (pontos necessários)
    const niveis = [
      { nivel: 1, nome: 'Iniciante', pontos: 0 },
      { nivel: 2, nome: 'Explorador', pontos: 100 },
      { nivel: 3, nome: 'Aventureiro', pontos: 300 },
      { nivel: 4, nome: 'Discípulo', pontos: 600 },
      { nivel: 5, nome: 'Herói da Fé', pontos: 1000 },
      { nivel: 6, nome: 'Guardião', pontos: 1500 },
      { nivel: 7, nome: 'Sábio', pontos: 2500 },
      { nivel: 8, nome: 'Profeta', pontos: 4000 },
      { nivel: 9, nome: 'Apóstolo', pontos: 6000 },
      { nivel: 10, nome: 'Lenda', pontos: 10000 }
    ];

    for (let i = niveis.length - 1; i >= 0; i--) {
      if (data.pontos >= niveis[i].pontos) {
        data.nivel = niveis[i].nivel;
        data.nomeNivel = niveis[i].nome;
        break;
      }
    }

    // Se subiu de nível
    if (data.nivel > nivelAnterior) {
      this.mostrarNotificacao(`🎉 SUBIU DE NÍVEL! Agora você é ${data.nomeNivel}!`, 'levelup');
      this.adicionarBadge(`nivel_${data.nivel}`, `Nível ${data.nivel}: ${data.nomeNivel}`);
    }
  }

  // ============================================
  // RASTREAMENTO DE ATIVIDADES
  // ============================================

  visitarLivro(nomeLivro) {
    const data = this.getData();
    if (!data.livrosVisitados.includes(nomeLivro)) {
      data.livrosVisitados.push(nomeLivro);
      data.historia.push({
        tipo: 'livro',
        nome: nomeLivro,
        data: new Date().toISOString()
      });
      this.saveData(data);
      this.adicionarPontos(10, `Visitou ${nomeLivro}`);
    }
  }

  visitarHeroi(nomeHeroi) {
    const data = this.getData();
    if (!data.heroisVisitados.includes(nomeHeroi)) {
      data.heroisVisitados.push(nomeHeroi);
      data.historia.push({
        tipo: 'heroi',
        nome: nomeHeroi,
        data: new Date().toISOString()
      });
      this.saveData(data);
      this.adicionarPontos(5, `Descobriu ${nomeHeroi}`);
    }
  }

  completarQuiz(nomeQuiz, acertos, total) {
    const data = this.getData();
    const percentual = (acertos / total) * 100;
    
    const quizData = {
      nome: nomeQuiz,
      acertos,
      total,
      percentual,
      data: new Date().toISOString()
    };

    data.quizzesCompletos.push(quizData);
    data.historia.push({
      tipo: 'quiz',
      ...quizData
    });

    // Pontuação baseada no desempenho
    let pontos = acertos * 10;
    if (percentual === 100) {
      pontos += 50; // Bônus de perfeição
      this.mostrarNotificacao('🏆 PERFEITO! 100% de acerto!', 'perfect');
    }

    this.saveData(data);
    this.adicionarPontos(pontos, `Quiz ${nomeQuiz}: ${acertos}/${total}`);
  }

  // ============================================
  // SISTEMA DE BADGES
  // ============================================

  verificarBadges() {
    const data = this.getData();

    // Lista de badges disponíveis
    const badges = [
      {
        id: 'primeiro_livro',
        nome: '📖 Primeiro Passo',
        descricao: 'Visitou seu primeiro livro',
        condicao: () => data.livrosVisitados.length >= 1
      },
      {
        id: 'leitor_iniciante',
        nome: '📚 Leitor Iniciante',
        descricao: 'Visitou 3 livros diferentes',
        condicao: () => data.livrosVisitados.length >= 3
      },
      {
        id: 'leitor_dedicado',
        nome: '📗 Leitor Dedicado',
        descricao: 'Visitou 10 livros diferentes',
        condicao: () => data.livrosVisitados.length >= 10
      },
      {
        id: 'explorador_biblico',
        nome: '🌟 Explorador Bíblico',
        descricao: 'Visitou 20 livros diferentes',
        condicao: () => data.livrosVisitados.length >= 20
      },
      {
        id: 'conhecedor_herois',
        nome: '⚔️ Conhecedor dos Heróis',
        descricao: 'Visitou todos os 14 juízes',
        condicao: () => data.heroisVisitados.length >= 14
      },
      {
        id: 'primeiro_quiz',
        nome: '🎯 Primeira Tentativa',
        descricao: 'Completou seu primeiro quiz',
        condicao: () => data.quizzesCompletos.length >= 1
      },
      {
        id: 'mestre_quiz',
        nome: '🏆 Mestre do Quiz',
        descricao: 'Conseguiu 100% em um quiz',
        condicao: () => data.quizzesCompletos.some(q => q.percentual === 100)
      },
      {
        id: 'estudioso',
        nome: '📖 Estudioso',
        descricao: 'Completou 5 quizzes',
        condicao: () => data.quizzesCompletos.length >= 5
      },
      {
        id: 'centuriao',
        nome: '💯 Centurião',
        descricao: 'Alcançou 100 pontos',
        condicao: () => data.pontos >= 100
      },
      {
        id: 'guerreiro',
        nome: '⚔️ Guerreiro',
        descricao: 'Alcançou 500 pontos',
        condicao: () => data.pontos >= 500
      },
      {
        id: 'lenda',
        nome: '👑 Lenda',
        descricao: 'Alcançou 1000 pontos',
        condicao: () => data.pontos >= 1000
      }
    ];

    // Verificar cada badge
    badges.forEach(badge => {
      if (badge.condicao() && !data.badges.some(b => b.id === badge.id)) {
        this.adicionarBadge(badge.id, badge.nome, badge.descricao);
      }
    });
  }

  adicionarBadge(id, nome, descricao = '') {
    const data = this.getData();
    if (!data.badges.some(b => b.id === id)) {
      data.badges.push({
        id,
        nome,
        descricao,
        data: new Date().toISOString()
      });
      this.saveData(data);
      this.mostrarNotificacao(`🏅 Nova Badge: ${nome}`, 'badge');
    }
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    notif.className = 'trilho-notificacao';
    
    const cores = {
      success: 'from-green-500 to-emerald-500',
      badge: 'from-yellow-500 to-amber-500',
      levelup: 'from-purple-500 to-pink-500',
      perfect: 'from-blue-500 to-cyan-500',
      info: 'from-gray-500 to-slate-500'
    };

    notif.innerHTML = `
      <div class="bg-gradient-to-r ${cores[tipo]} text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-bounce">
        ${mensagem}
      </div>
    `;

    notif.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 9999;
      animation: slideIn 0.5s ease-out;
    `;

    document.body.appendChild(notif);

    // Remover após 3 segundos
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.5s ease-out';
      setTimeout(() => notif.remove(), 500);
    }, 3000);
  }

  // ============================================
  // DASHBOARD / ESTATÍSTICAS
  // ============================================

  getEstatisticas() {
    const data = this.getData();
    return {
      pontos: data.pontos,
      nivel: data.nivel,
      nomeNivel: data.nomeNivel || 'Iniciante',
      livrosVisitados: data.livrosVisitados.length,
      heroisVisitados: data.heroisVisitados.length,
      quizzesCompletos: data.quizzesCompletos.length,
      badges: data.badges.length,
      percentualBadges: Math.round((data.badges.length / 11) * 100), // 11 badges totais
      proximoNivel: this.getProximoNivel(data.pontos)
    };
  }

  getProximoNivel(pontosAtuais) {
    const niveis = [100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
    for (let pontos of niveis) {
      if (pontosAtuais < pontos) {
        return { pontos, faltam: pontos - pontosAtuais };
      }
    }
    return { pontos: 10000, faltam: 0 }; // Nível máximo
  }

  getBadges() {
    const data = this.getData();
    return data.badges;
  }

  getHistoria() {
    const data = this.getData();
    return data.historia.slice().reverse(); // Mais recentes primeiro
  }

  // ============================================
  // RESET (para testes)
  // ============================================

  resetarProgresso() {
    if (confirm('Tem certeza que deseja resetar TODO o progresso?')) {
      localStorage.removeItem(this.storageKey);
      this.init();
      alert('Progresso resetado!');
      window.location.reload();
    }
  }
}

// Inicializar sistema globalmente
const trilhoGame = new TrilhoKidsGame();

// Adicionar CSS de animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ============================================
// EXEMPLOS DE USO
// ============================================

/*
// Em cada página de livro (josue.html, rute.html, etc):
trilhoGame.visitarLivro('Josué');

// Na página de heróis (quando clicam em um juiz):
trilhoGame.visitarHeroi('Sansão');

// No quiz (após completar):
trilhoGame.completarQuiz('Quiz Josué', 3, 4); // 3 acertos de 4

// Ver estatísticas:
console.log(trilhoGame.getEstatisticas());

// Ver badges:
console.log(trilhoGame.getBadges());

// Ver histórico:
console.log(trilhoGame.getHistoria());
*/