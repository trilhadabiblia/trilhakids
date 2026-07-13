// ============================================================
// Campanha institucional do Trilho Kids (a partir do bio/pitch.html).
//
// Ao contrário dos formatos por livro (que puxam o material do portal), a
// campanha é conteúdo de MARKETING fixo, voltado a quem DECIDE: líderes de
// ministério infantil, coordenadores e escolas cristãs. Cada "peça" é um
// carrossel on-brand (capa institucional + cards), com legenda/hashtags
// prontas (sem IA) e CTA para a bio/pitch.
//
// Uso:
//   node cli.js campanha                 # lista as peças
//   node cli.js campanha --peca problema # gera/publica uma peça
// No web app: formato "Campanha" + seletor de peça.
// ============================================================

// Temas por peça (mesma linguagem de cor do pitch). Shape = tema dos livros:
// { from (topo do fundo), to (acento/glow/badge), light (texto claro), badgeText }.
const T = {
  vermelho:  { from: '#2a0f14', to: '#dc2626', light: '#fca5a5', badgeText: '#fecaca' },
  violeta:   { from: '#2a1055', to: '#7c3aed', light: '#c4b5fd', badgeText: '#ddd6fe' },
  azul:      { from: '#0e1b3a', to: '#2563eb', light: '#93c5fd', badgeText: '#bfdbfe' },
  ambar:     { from: '#2a1a05', to: '#d97706', light: '#fcd34d', badgeText: '#fde68a' },
  esmeralda: { from: '#08241c', to: '#059669', light: '#6ee7b7', badgeText: '#a7f3d0' },
};

// Hashtags institucionais (público: igrejas, ministérios, escolas cristãs).
const TAGS = [
  'trilhokids', 'ministerioinfantil', 'ebdinfantil', 'igreja', 'escolacrista',
  'ensinoreligioso', 'discipuladoinfantil', 'professorcristao', 'educacaocrista', 'biblia',
];

const CTA_PADRAO = '✨ Conheça o Trilho Kids — link na bio!';

// Cada peça: id, titulo (nome curto p/ listas), tema, pill (badge), ctaTexto,
// legenda + hashtags (prontas), e os slides (capa + cards).
export const PECAS = [
  {
    id: 'problema',
    titulo: 'O desafio',
    tema: T.vermelho,
    pill: 'O Desafio',
    ctaTexto: CTA_PADRAO,
    legenda:
      'Todo ministério infantil enfrenta os mesmos desafios: prender a atenção num mundo de telas, manter o aprendizado vivo depois que a aula acaba e saber, de verdade, o que cada criança aprendeu.\n\n' +
      'E se a resposta fosse unir as duas coisas que as crianças e a Palavra têm em comum? 👇',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'Todo ministério infantil enfrenta os mesmos desafios',
        subtitulo: '"As crianças amam o celular. A gente quer que elas amem a Bíblia. Por que não unir os dois?"',
        rodape: 'Um problema real de quem ensina' },
      { template: 'cartao', titulo: '4 perguntas que todo líder já se fez', pontos: [
        '📵 Como competir com as telas pela atenção?',
        '⏳ O aprendizado termina quando a aula acaba?',
        '🔍 Dá pra saber o que cada criança aprendeu?',
        '🎯 Como recompensar o esforço no estudo da Palavra?',
      ] },
      { template: 'cartao', titulo: 'E se a Bíblia fosse tão viciante quanto um jogo?',
        corpo: 'Recompensa imediata, progressão visível e a sensação de conquista. É isso que um jogo tem — e que uma aula pode ter também.',
        rodape: 'Conheça a solução → link na bio' },
    ],
  },
  {
    id: 'solucao',
    titulo: 'O que é',
    tema: T.violeta,
    pill: 'A Solução',
    ctaTexto: CTA_PADRAO,
    legenda:
      'O Trilho Kids é um ecossistema completo de ensino bíblico para crianças de 6 a 12 anos — impresso e digital trabalhando juntos.\n\n' +
      '66 livros da Bíblia, 66 quizzes, personagens interativos e gamificação que motiva o ano inteiro. Não é só um site: é a apostila conversando com o portal. 📖📱',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'Um ecossistema completo de ensino bíblico',
        subtitulo: 'Para crianças de 6 a 12 anos. Impresso + digital, trabalhando juntos.',
        stats: [
          { valor: '66', rotulo: 'Livros da Bíblia' },
          { valor: '66', rotulo: 'Quizzes' },
          { valor: '10', rotulo: 'Níveis' },
          { valor: '30+', rotulo: 'Badges' },
        ], rodape: 'Ensino bíblico que engaja e acompanha' },
      { template: 'cartao', titulo: 'Três peças que se encaixam', pontos: [
        '📚 Material impresso: apostilas + plano anual',
        '📱 Portal digital: 66 livros, 66 quizzes, personagens',
        '👩‍🏫 Painel do professor: progresso em tempo real',
      ] },
      { template: 'cartao', titulo: 'Toda a Bíblia na palma da mão',
        corpo: 'Cada livro com resumo visual, ilustrações, versículo central, curiosidades e os personagens principais — do Pentateuco ao Apocalipse.' },
    ],
  },
  {
    id: 'apostila',
    titulo: 'Papel + tela',
    tema: T.azul,
    pill: 'Papel + Tela',
    ctaTexto: CTA_PADRAO,
    legenda:
      'A mágica do Trilho Kids está na ponte entre o caderno e a tela. ✨\n\n' +
      'Cada lição da apostila do aluno tem dois QR Codes impressos: um abre o livro no portal, outro abre o quiz. O caderno vira porta de entrada pro digital — e o digital reforça o que foi estudado no caderno.',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'A apostila que conecta o caderno à tela',
        subtitulo: 'Dois QR Codes impressos em cada lição transformam o caderno numa porta de entrada digital.',
        rodape: 'Material impresso + portal' },
      { template: 'cartao', titulo: '2 QR Codes em cada lição',
        corpo: '📖 QR da Lição → abre o livro bíblico no portal: resumo visual, ilustrações, curiosidades e versículos-chave.\n\n🎯 QR do Quiz → 10 perguntas sobre a lição, com resultado salvo automaticamente no perfil da criança.' },
      { template: 'cartao', titulo: 'Papel e digital, de mãos dadas',
        corpo: 'O caderno vira uma porta de entrada para o mundo digital — e o digital reforça o que foi aprendido no caderno.',
        rodape: 'Apostila do professor + do aluno' },
    ],
  },
  {
    id: 'gamificacao',
    titulo: 'Gamificação',
    tema: T.ambar,
    pill: 'Gamificação',
    ctaTexto: CTA_PADRAO,
    legenda:
      'O motor do engajamento do Trilho Kids é a gamificação. 🎮\n\n' +
      'Pontos por cada conquista, 10 níveis (de Iniciante a 👑 Lenda) e mais de 30 badges. E o melhor: com o QR Code pessoal, a criança escaneia, entra e tem o progresso salvo em qualquer aparelho — sem senha, sem cadastro manual.',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'O motor do engajamento',
        subtitulo: '"O que um jogo tem que uma aula não tem? Recompensa imediata, progressão visível e a sensação de conquista."',
        rodape: 'Motivação que dura o ano todo' },
      { template: 'cartao', titulo: 'Pontos por cada conquista', pontos: [
        '⭐ Visitar um livro  +10',
        '🧭 Descobrir um personagem  +5',
        '✅ Acerto no quiz  +10',
        '🏆 Quiz perfeito  +50 bônus',
      ] },
      { template: 'cartao', titulo: '10 níveis, 30+ badges',
        corpo: 'De Iniciante a 👑 Lenda. Guardião do Pentateuco, Mestre do Quiz, Amigo de Jonas, Corajosa como Ester… conquistas permanentes que motivam a criança a voltar.' },
      { template: 'cartao', titulo: 'QR Code pessoal',
        corpo: 'Escaneou → entrou → progresso salvo em qualquer dispositivo. Sem senha, sem cadastro manual.',
        rodape: 'Cada versículo, uma conquista' },
    ],
  },
  {
    id: 'instituicoes',
    titulo: 'Igrejas e escolas',
    tema: T.esmeralda,
    pill: 'Para Igrejas e Escolas',
    ctaTexto: CTA_PADRAO,
    legenda:
      'Tudo que o ministério precisa, num lugar só. 🏛️\n\n' +
      'Sistema pronto pra usar (sem TI), plano anual que cobre toda a Bíblia, dashboard com progresso em tempo real e QR Codes imprimíveis. E funciona igualmente bem em escolas cristãs — alinhado à BNCC e ao Ensino Religioso.',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'Tudo que o ministério precisa, num lugar só',
        subtitulo: 'Da igreja pequena à escola cristã: pronto pra usar, sem conhecimento técnico.',
        rodape: 'Para igrejas, ministérios e escolas' },
      { template: 'cartao', titulo: 'Para a igreja', pontos: [
        '✓ Sistema pronto pra usar, sem TI',
        '✓ Plano anual cobre toda a Bíblia',
        '✓ O aprendizado continua em casa',
        '✓ Progresso visível para os pais',
      ] },
      { template: 'cartao', titulo: 'Para o professor', pontos: [
        '✓ Dashboard com ranking em tempo real',
        '✓ Progresso individual por aluno',
        '✓ Pontos em 2 cliques (presença, versículo…)',
        '✓ QR Codes imprimíveis direto do painel',
      ] },
      { template: 'cartao', titulo: 'Também para escolas cristãs',
        corpo: 'Ensino Religioso alinhado à BNCC, plataforma 100% segura, avaliação gamificada e relatório por turma para composição de notas.',
        rodape: 'Ensino Religioso reinventado' },
    ],
  },
  {
    id: 'demonstracao',
    titulo: 'Agende uma demo',
    tema: T.violeta,
    pill: 'Próximo Passo',
    ctaTexto: '🚀 Agende sua demonstração gratuita — link na bio!',
    legenda:
      'O Trilho Kids não substitui o professor — multiplica o impacto do professor. 🚀\n\n' +
      'Quer ver funcionando? Agende uma demonstração gratuita e sem compromisso: mostramos o portal com uma turma real, e você ainda pode testar 30 dias com um piloto. Fale com a gente pelo link na bio! 💜',
    hashtags: TAGS,
    slides: [
      { template: 'capa', titulo: 'Agende uma demonstração gratuita',
        subtitulo: 'Sem compromisso. Mostramos o portal funcionando com uma turma real.',
        rodape: 'Fale com a gente → link na bio' },
      { template: 'cartao', titulo: 'Como começar', pontos: [
        '🖥️ Demonstração ao vivo com turma real',
        '🆓 Piloto gratuito de 30 dias',
        '🚀 Implantação: cadastramos tudo e treinamos',
        '🤝 Suporte contínuo e evolutivo',
      ] },
      { template: 'cartao', titulo: 'Não substitui o professor. Multiplica.',
        corpo: 'Cada lição, uma aventura. Cada versículo, uma conquista. Leve o Trilho Kids para o seu ministério ou escola.',
        rodape: '🚀 Agende sua demonstração' },
    ],
  },
];

export function listarCampanha() {
  return PECAS.map((p) => ({ id: p.id, titulo: p.titulo, slides: p.slides.length }));
}

export function acharPeca(id) {
  const c = String(id || '').toLowerCase();
  return PECAS.find((p) => p.id === c) || PECAS.find((p) => p.titulo.toLowerCase() === c) || null;
}

// Monta o "item" de conteúdo de uma peça (mesmo contrato dos outros formatos).
// `livro` = id da peça → alimenta o utm_campaign do CTA (caption.js).
export function buildCampanha(id) {
  const peca = acharPeca(id);
  if (!peca) {
    const ops = PECAS.map((p) => p.id).join(', ');
    throw new Error(`Peça de campanha não encontrada: ${id}. Opções: ${ops}`);
  }
  const slides = peca.slides.map((s) => ({ pill: s.pill || peca.pill, ...s }));
  return {
    tipo: 'campanha', id: peca.id, livro: peca.id, nome: 'Trilho Kids',
    titulo: peca.titulo, tema: peca.tema, slides,
    ctaTexto: peca.ctaTexto, legenda: peca.legenda, hashtags: peca.hashtags,
  };
}
