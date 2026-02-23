// ============================================
// SISTEMA DE GAMIFICAÇÃO — TRILHO KIDS v3.0
// API: cafecomhomensdedeus.com.br/trilhokids/api
// ============================================

const TRILHO_API = 'https://cafecomhomensdedeus.com.br/trilhokids/api';

class TrilhoKidsGame {
  constructor() {
    // Perfil ativo em memória (+ sessionStorage como cache leve)
    this._perfilAtivo = sessionStorage.getItem('trilho_perfil') || null;
    this._cache       = null; // dados do perfil em memória
    this.senhaAdmin   = 'trilho2025';

    this.niveis = [
      { nivel: 1,  nome: 'Iniciante',    pontos: 0     },
      { nivel: 2,  nome: 'Explorador',   pontos: 100   },
      { nivel: 3,  nome: 'Aventureiro',  pontos: 300   },
      { nivel: 4,  nome: 'Discípulo',    pontos: 600   },
      { nivel: 5,  nome: 'Herói da Fé', pontos: 1000  },
      { nivel: 6,  nome: 'Guardião',     pontos: 1500  },
      { nivel: 7,  nome: 'Sábio',        pontos: 2500  },
      { nivel: 8,  nome: 'Profeta',      pontos: 4000  },
      { nivel: 9,  nome: 'Apóstolo',     pontos: 6000  },
      { nivel: 10, nome: 'Lenda',        pontos: 10000 },
    ];

    this.todasBadges = this._definirBadges();
    this._injetarCSS();
  }

  // ============================================
  // PERFIL ATIVO
  // ============================================

  getPerfilAtivo() { return this._perfilAtivo; }

  setPerfilAtivo(nome) {
    this._perfilAtivo = nome;
    this._cache = null;
    if (nome) sessionStorage.setItem('trilho_perfil', nome);
    else      sessionStorage.removeItem('trilho_perfil');
  }

  // ============================================
  // HELPERS DE API
  // ============================================

  async _fetch(endpoint, options = {}) {
    try {
      const res = await fetch(`${TRILHO_API}/${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      return await res.json();
    } catch (err) {
      console.error(`[TrilhoKids] Erro na API (${endpoint}):`, err);
      return { ok: false, erro: 'Sem conexão com o servidor.' };
    }
  }

  async _get(endpoint)         { return this._fetch(endpoint); }
  async _post(endpoint, body)  { return this._fetch(endpoint, { method: 'POST',   body: JSON.stringify(body) }); }
  async _delete(endpoint, body){ return this._fetch(endpoint, { method: 'DELETE', body: JSON.stringify(body) }); }

  // ============================================
  // GERENCIAMENTO DE PERFIS
  // ============================================

  async getPerfis() {
    const res = await this._get('perfis.php');
    return res.ok ? res.dados : [];
  }

  async criarPerfil(nome) {
    const res = await this._post('perfis.php', { nome: nome.trim() });
    return res.ok
      ? { ok: true,  perfil: res.dados }
      : { ok: false, erro: res.erro };
  }

  async removerPerfil(nome) {
    const res = await this._delete('perfis.php', { nome, senha: this.senhaAdmin });
    if (res.ok && this._perfilAtivo === nome) this.setPerfilAtivo(null);
    return res;
  }

  // ============================================
  // DADOS DO PERFIL ATIVO
  // ============================================

  async getData(forceRefresh = false) {
    if (this._cache && !forceRefresh) return this._cache;
    if (!this._perfilAtivo) return null;

    const res = await this._get(`progresso.php?nome=${encodeURIComponent(this._perfilAtivo)}`);
    if (res.ok) {
      this._cache = res.dados;
      return this._cache;
    }
    return null;
  }

  async _saveData(payload) {
    if (!this._perfilAtivo) return;
    this._cache = null; // invalida cache
    await this._post('progresso.php', { nome: this._perfilAtivo, ...payload });
  }

  // ============================================
  // SISTEMA DE PONTOS
  // ============================================

  async adicionarPontos(quantidade, motivo) {
    const data = await this.getData();
    if (!data) return;

    const novoPontos = data.pontos + quantidade;
    const { nivel, nome_nivel } = this._calcularNivel(novoPontos);
    const nivelAnterior = data.nivel;

    await this._saveData({
      pontos:     novoPontos,
      nivel,
      nome_nivel,
      evento: {
        tipo:      'pontos',
        quantidade,
        motivo,
        lancado_por: 'sistema',
      },
    });

    // Invalida cache e recarrega
    const atualizado = await this.getData(true);

    if (nivel > nivelAnterior) {
      this.mostrarNotificacao(`🎉 SUBIU DE NÍVEL! Agora você é ${nome_nivel}!`, 'levelup');
    }

    this.mostrarNotificacao(`+${quantidade} pontos! ${motivo}`, 'success');
    await this._verificarBadges(atualizado);
  }

  _calcularNivel(pontos) {
    let resultado = this.niveis[0];
    for (const n of this.niveis) {
      if (pontos >= n.pontos) resultado = n;
    }
    return { nivel: resultado.nivel, nome_nivel: resultado.nome };
  }

  getProximoNivel(pontosAtuais) {
    for (const n of this.niveis) {
      if (pontosAtuais < n.pontos) return { pontos: n.pontos, faltam: n.pontos - pontosAtuais };
    }
    return { pontos: 10000, faltam: 0 };
  }

  // ============================================
  // RASTREAMENTO DE ATIVIDADES
  // ============================================

  async visitarLivro(nomeLivro) {
    const data = await this.getData();
    if (!data) return;

    const livros = data.livros_visitados || [];
    if (livros.includes(nomeLivro)) return;

    const novosLivros = [...livros, nomeLivro];
    await this._saveData({
      livros_visitados: novosLivros,
      evento: { tipo: 'livro', quantidade: 10, motivo: `Visitou ${nomeLivro}`, lancado_por: 'sistema' },
    });
    await this.adicionarPontos(10, `Visitou ${nomeLivro}`);
  }

  async visitarHeroi(nomeHeroi) {
    const data = await this.getData();
    if (!data) return;

    const herois = data.herois_visitados || [];
    if (herois.includes(nomeHeroi)) return;

    const novosHerois = [...herois, nomeHeroi];
    await this._saveData({
      herois_visitados: novosHerois,
      evento: { tipo: 'heroi', quantidade: 5, motivo: `Descobriu ${nomeHeroi}`, lancado_por: 'sistema' },
    });
    await this.adicionarPontos(5, `Descobriu ${nomeHeroi}`);
  }

  async completarQuiz(nomeQuiz, acertos, total) {
    const data = await this.getData();
    if (!data) return;

    const percentual = Math.round((acertos / total) * 100);
    let pontos = acertos * 10;
    if (percentual >= 70)  pontos += 10;
    if (percentual === 100) {
      pontos += 50;
      this.mostrarNotificacao('🏆 PERFEITO! 100% de acerto!', 'perfect');
    }

    await this._saveData({
      quiz: { nome: nomeQuiz, acertos, total, percentual },
      evento: {
        tipo:      'quiz',
        quantidade: pontos,
        motivo:    `Quiz ${nomeQuiz}: ${acertos}/${total}`,
        lancado_por: 'sistema',
        detalhes:  { acertos, total, percentual },
      },
    });
    await this.adicionarPontos(pontos, `Quiz ${nomeQuiz}: ${acertos}/${total}`);
  }

  // ============================================
  // PONTOS MANUAIS (PROFESSOR)
  // ============================================

  async adicionarPontosManual(nomeAluno, quantidade, motivo, senha) {
    const res = await this._post('pontos.php', { nome: nomeAluno, quantidade, motivo, senha });
    return res.ok
      ? { ok: true,  dados: res.dados }
      : { ok: false, erro: res.erro };
  }

  // ============================================
  // SISTEMA DE BADGES
  // ============================================

  async _verificarBadges(data) {
    if (!data) return;

    const conquistadas = data.badges || [];
    const novas = [];

    for (const badge of this.todasBadges) {
      const jatem = conquistadas.some(b => b.id === badge.id);
      if (!jatem && badge.condicao(data)) {
        const novaBadge = {
          id:        badge.id,
          nome:      badge.nome,
          descricao: badge.descricao,
          categoria: badge.categoria,
          data:      new Date().toISOString(),
        };
        novas.push(novaBadge);
        this.mostrarNotificacao(`🏅 Nova Badge: ${badge.nome}`, 'badge');
      }
    }

    if (novas.length > 0) {
      const todasBadgesAtualizadas = [...conquistadas, ...novas];
      await this._saveData({ badges: todasBadgesAtualizadas });
    }
  }

  _definirBadges() {
    const PENTATEUCO   = ['Gênesis','Êxodo','Levítico','Números','Deuteronômio'];
    const HISTORICOS   = ['Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis',
                          '1 Crônicas','2 Crônicas','Esdras','Neemias','Ester'];
    const PROF_MENORES = ['Oséias','Joel','Amós','Obadias','Jonas','Miquéias',
                          'Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'];
    const EVANGELHOS   = ['Mateus','Marcos','Lucas','João'];
    const CARTAS_PAULO = ['Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios',
                          'Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses',
                          '1 Timóteo','2 Timóteo','Tito','Filemom'];
    const OUTRAS_CARTAS= ['Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas'];
    const TODOS        = [...PENTATEUCO,...HISTORICOS,...PROF_MENORES,'Atos',
                          ...EVANGELHOS,...CARTAS_PAULO,...OUTRAS_CARTAS,'Apocalipse'];

    const lv = d => d.livros_visitados || [];
    const qz = d => d.quizzes_completos || [];

    return [
      // ── Seção ────────────────────────────────────────────────────
      { id:'pentateuco_completo',      categoria:'secao',      nome:'📜 Guardião do Pentateuco',    descricao:'Visitou os 5 livros do Pentateuco',          condicao: d => PENTATEUCO.every(l => lv(d).includes(l)) },
      { id:'historicos_completo',      categoria:'secao',      nome:'🏛️ Historiador de Israel',    descricao:'Visitou os 12 Livros Históricos',            condicao: d => HISTORICOS.every(l => lv(d).includes(l)) },
      { id:'profetas_menores_completo',categoria:'secao',      nome:'🔥 Voz dos Profetas',          descricao:'Visitou os 12 Profetas Menores',             condicao: d => PROF_MENORES.every(l => lv(d).includes(l)) },
      { id:'evangelhos_completo',      categoria:'secao',      nome:'✝️ Seguidor de Jesus',         descricao:'Visitou os 4 Evangelhos',                    condicao: d => EVANGELHOS.every(l => lv(d).includes(l)) },
      { id:'atos_visitado',            categoria:'secao',      nome:'🕊️ Testemunha de Atos',        descricao:'Visitou o livro de Atos',                    condicao: d => lv(d).includes('Atos') },
      { id:'cartas_paulo_completo',    categoria:'secao',      nome:'✉️ Discípulo de Paulo',         descricao:'Visitou as 13 Cartas de Paulo',              condicao: d => CARTAS_PAULO.every(l => lv(d).includes(l)) },
      { id:'outras_cartas_completo',   categoria:'secao',      nome:'📨 Leitor das Epístolas',       descricao:'Visitou as 8 Epístolas Gerais',              condicao: d => OUTRAS_CARTAS.every(l => lv(d).includes(l)) },
      { id:'apocalipse_visitado',      categoria:'secao',      nome:'🌋 Guardião do Apocalipse',     descricao:'Visitou o livro do Apocalipse',              condicao: d => lv(d).includes('Apocalipse') },
      { id:'biblia_completa',          categoria:'secao',      nome:'🏆 Explorador Completo',        descricao:'Visitou todos os livros da Bíblia!',         condicao: d => TODOS.every(l => lv(d).includes(l)) },
      // ── Desempenho ───────────────────────────────────────────────
      { id:'primeiro_livro',           categoria:'desempenho', nome:'📖 Primeiro Passo',             descricao:'Visitou seu primeiro livro',                 condicao: d => lv(d).length >= 1 },
      { id:'leitor_iniciante',         categoria:'desempenho', nome:'📚 Leitor Iniciante',            descricao:'Visitou 5 livros diferentes',                condicao: d => lv(d).length >= 5 },
      { id:'leitor_dedicado',          categoria:'desempenho', nome:'📗 Leitor Dedicado',             descricao:'Visitou 15 livros diferentes',               condicao: d => lv(d).length >= 15 },
      { id:'explorador_biblico',       categoria:'desempenho', nome:'🌟 Explorador Bíblico',          descricao:'Visitou 30 livros diferentes',               condicao: d => lv(d).length >= 30 },
      { id:'primeiro_quiz',            categoria:'desempenho', nome:'🎯 Primeira Tentativa',          descricao:'Completou seu primeiro quiz',                condicao: d => qz(d).length >= 1 },
      { id:'estudioso',                categoria:'desempenho', nome:'📖 Estudioso',                   descricao:'Completou 5 quizzes',                        condicao: d => qz(d).length >= 5 },
      { id:'sabio_treinamento',        categoria:'desempenho', nome:'🧠 Sábio em Treinamento',        descricao:'Completou 10 quizzes',                       condicao: d => qz(d).length >= 10 },
      { id:'mestre_quiz',              categoria:'desempenho', nome:'🏆 Mestre do Quiz',              descricao:'Conseguiu 100% em um quiz',                  condicao: d => qz(d).some(q => q.percentual === 100) },
      { id:'leitor_consistente',       categoria:'desempenho', nome:'⭐ Leitor Consistente',           descricao:'Conseguiu 100% em 3 quizzes diferentes',     condicao: d => qz(d).filter(q => q.percentual === 100).length >= 3 },
      { id:'diamante',                 categoria:'desempenho', nome:'💎 Diamante',                    descricao:'Conseguiu 100% em 5 quizzes diferentes',     condicao: d => qz(d).filter(q => q.percentual === 100).length >= 5 },
      // ── Pontos ───────────────────────────────────────────────────
      { id:'centuriao',                categoria:'pontos',     nome:'💯 Centurião',                   descricao:'Alcançou 100 pontos',                        condicao: d => d.pontos >= 100 },
      { id:'guerreiro',                categoria:'pontos',     nome:'⚔️ Guerreiro da Fé',             descricao:'Alcançou 500 pontos',                        condicao: d => d.pontos >= 500 },
      { id:'lenda',                    categoria:'pontos',     nome:'👑 Lenda',                       descricao:'Alcançou 1000 pontos',                       condicao: d => d.pontos >= 1000 },
      // ── Especiais ────────────────────────────────────────────────
      { id:'amigo_jonas',              categoria:'especial',   nome:'🐋 Amigo de Jonas',              descricao:'Visitou o livro de Jonas',                   condicao: d => lv(d).includes('Jonas') },
      { id:'coracao_oseias',           categoria:'especial',   nome:'💔 Coração de Oséias',           descricao:'Visitou o livro de Oséias',                  condicao: d => lv(d).includes('Oséias') },
      { id:'coracao_davi',             categoria:'especial',   nome:'🦁 Coração de Davi',             descricao:'Visitou 1 Samuel e 2 Samuel',                condicao: d => lv(d).includes('1 Samuel') && lv(d).includes('2 Samuel') },
      { id:'fiel_rute',                categoria:'especial',   nome:'🌾 Fiel como Rute',              descricao:'Visitou o livro de Rute',                    condicao: d => lv(d).includes('Rute') },
      { id:'construtor_neemias',       categoria:'especial',   nome:'🔨 Construtor como Neemias',     descricao:'Visitou o livro de Neemias',                 condicao: d => lv(d).includes('Neemias') },
      { id:'corajosa_ester',           categoria:'especial',   nome:'👸 Corajosa como Ester',         descricao:'Visitou o livro de Ester',                   condicao: d => lv(d).includes('Ester') },
      { id:'amigo_fiel',               categoria:'especial',   nome:'🤝 Amigo Fiel',                  descricao:'Visitou o livro de Filemom',                 condicao: d => lv(d).includes('Filemom') },
      { id:'heroi_fe',                 categoria:'especial',   nome:'⚔️ Conhecedor dos Heróis',       descricao:'Descobriu 10 personagens bíblicos',          condicao: d => (d.herois_visitados || []).length >= 10 },
    ];
  }

  getTodasBadges() { return this.todasBadges; }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  async getEstatisticas() {
    const data = await this.getData();
    if (!data) return null;
    const totalBadges = this.todasBadges.length;
    const badges = data.badges || [];
    const quizzes = data.quizzes_completos || [];
    return {
      nome:              data.nome,
      pontos:            data.pontos,
      nivel:             data.nivel,
      nomeNivel:         data.nome_nivel || 'Iniciante',
      livrosVisitados:   (data.livros_visitados || []).length,
      heroisVisitados:   (data.herois_visitados || []).length,
      quizzesCompletos:  quizzes.length,
      quizzesPerfectos:  quizzes.filter(q => q.percentual === 100).length,
      badges:            badges.length,
      totalBadges,
      percentualBadges:  Math.round((badges.length / totalBadges) * 100),
      proximoNivel:      this.getProximoNivel(data.pontos),
    };
  }

  async getBadgesConquistadas() {
    const data = await this.getData();
    return data ? (data.badges || []) : [];
  }

  async getHistoria(limit = 50) {
    if (!this._perfilAtivo) return [];
    const res = await this._get(`historia.php?nome=${encodeURIComponent(this._perfilAtivo)}&limit=${limit}`);
    return res.ok ? res.dados.eventos : [];
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  mostrarNotificacao(mensagem, tipo = 'info') {
    const cores = {
      success: 'from-green-500 to-emerald-600',
      badge:   'from-yellow-500 to-amber-500',
      levelup: 'from-purple-500 to-pink-600',
      perfect: 'from-blue-500 to-cyan-500',
      info:    'from-gray-500 to-slate-600',
    };
    const existentes = document.querySelectorAll('.trilho-notificacao');
    const topOffset  = 100 + existentes.length * 72;

    const notif = document.createElement('div');
    notif.className = 'trilho-notificacao';
    notif.style.cssText = `position:fixed;top:${topOffset}px;right:20px;z-index:9999;animation:tkSlideIn 0.4s ease-out forwards;`;
    notif.innerHTML = `
      <div class="bg-gradient-to-r ${cores[tipo] || cores.info} text-white px-5 py-3 rounded-full shadow-xl font-bold text-sm max-w-xs">
        ${mensagem}
      </div>`;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'tkSlideOut 0.4s ease-out forwards';
      setTimeout(() => notif.remove(), 400);
    }, 3500);
  }

  _injetarCSS() {
    if (document.getElementById('trilho-css')) return;
    const s = document.createElement('style');
    s.id = 'trilho-css';
    s.textContent = `
      @keyframes tkSlideIn { from{transform:translateX(420px);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes tkSlideOut{ from{transform:translateX(0);opacity:1} to{transform:translateX(420px);opacity:0} }
    `;
    document.head.appendChild(s);
  }
}

// ── Instância global ─────────────────────────
const trilhoGame = new TrilhoKidsGame();


// ============================================
// EXEMPLOS DE USO
// ============================================
/*

// Selecionar perfil ao entrar
trilhoGame.setPerfilAtivo('Maria');

// Criar novo aluno
await trilhoGame.criarPerfil('João');

// Em cada página de livro
await trilhoGame.visitarLivro('Jonas');

// Na página de personagens
await trilhoGame.visitarHeroi('Sansão');

// Ao finalizar quiz
await trilhoGame.completarQuiz('Quiz Josué', 3, 4);

// Professor adicionando pontos manuais
const res = await trilhoGame.adicionarPontosManual('João', 10, 'Presença', 'trilho2025');
console.log(res);

// Estatísticas
console.log(await trilhoGame.getEstatisticas());

// Badges conquistadas
console.log(await trilhoGame.getBadgesConquistadas());

// Histórico
console.log(await trilhoGame.getHistoria());

// Listar todos os perfis
console.log(await trilhoGame.getPerfis());

*/