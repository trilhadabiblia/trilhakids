// ============================================================
// Frames de Reel (1080x1920) — cartelas estáticas on-brand para montar os
// reels da Fase 1 no CapCut (ver prompt/reels-fase1.md). O pipeline NÃO
// publica reels (é vídeo); estes frames são EXPORTADOS para ./out e o usuário
// monta o vídeo fora, com a trilha sonora.
//
// Uso:
//   node cli.js reel                    # lista os roteiros
//   node cli.js reel --roteiro reel2    # exporta os frames para ./out
// No web app: formato "Reel" + seletor de roteiro (preview, sem publicar).
// ============================================================

// Temas por cartela (shape dos livros: from, to, light, badgeText).
const T = {
  dramatico: { from: '#0a0818', to: '#4c1d95', light: '#c4b5fd', badgeText: '#ddd6fe' },
  violeta:   { from: '#2a1055', to: '#7c3aed', light: '#c4b5fd', badgeText: '#ddd6fe' },
  jonas:     { from: '#082f2b', to: '#0d9488', light: '#5eead4', badgeText: '#99f6e4' },
  josue:     { from: '#2a1a05', to: '#d97706', light: '#fcd34d', badgeText: '#fde68a' },
  davi:      { from: '#0e1b3a', to: '#4f46e5', light: '#a5b4fc', badgeText: '#c7d2fe' },
  daniel:    { from: '#2a0f14', to: '#dc2626', light: '#fca5a5', badgeText: '#fecaca' },
  exodo:     { from: '#0a1830', to: '#0284c7', light: '#7dd3fc', badgeText: '#bae6fd' },
};

// Perguntas do Reel 3 (reais, do quiz do portal) — cada uma vira 2 frames
// (pergunta + resposta) via `expandirQuiz`.
const QUIZZ = [
  {
    numero: 1, tema: T.davi,
    pergunta: 'Com que arma Davi derrotou o gigante Golias?',
    opcoes: ['Uma espada', 'Funda e uma pedra', 'Uma lança', 'Fogo do céu'],
    correta: 1,
    justificativa: 'Davi confiou em Deus e venceu Golias com uma funda e uma pedra. (1 Samuel 17)',
  },
  {
    numero: 2, tema: T.jonas,
    pergunta: 'Pra onde Jonas fugiu quando Deus o chamou?',
    opcoes: ['Nínive', 'Társis', 'Egito', 'Jerusalém'],
    correta: 1,
    justificativa: 'Jonas pegou um barco pra Társis — mas ninguém foge de Deus! (Jonas 1)',
  },
];

function expandirQuiz(q) {
  const base = { template: 'quiz', numero: q.numero, pergunta: q.pergunta, opcoes: q.opcoes, correta: q.correta, tema: q.tema };
  return [
    { ...base, revelar: false },
    { ...base, revelar: true, justificativa: q.justificativa },
  ];
}

export const ROTEIROS = [
  {
    id: 'reel1',
    titulo: 'O caderno tem um portal (QR)',
    nota: 'Reel filmado (mão + apostila + celular). Estes 2 frames são overlays de texto para compor sobre o vídeo.',
    frames: [
      { template: 'capa', titulo: 'Esse caderno tem um portal escondido 👀', rodape: 'Escaneia e vê 📲', tema: T.violeta },
      { template: 'capa', titulo: 'Do caderno pro celular. E é grátis.', subtitulo: 'A criança lê, joga o quiz e sobe de nível.', rodape: '📲 Comece grátis — link na bio', tema: T.violeta },
    ],
  },
  {
    id: 'reel2',
    titulo: 'Se a Bíblia fosse série',
    nota: 'Reel 100% montável com estes frames + trilha épica (trending).',
    frames: [
      { template: 'capa', kicker: 'Trilho Kids apresenta', titulo: 'Se a Bíblia fosse série…', subtitulo: '…teria mais reviravolta que qualquer drama.', rodape: 'Deslize e comprove 👇', tema: T.dramatico },
      { template: 'twist', emoji: '🐋', titulo: 'Um profeta foi engolido VIVO por um peixe gigante', rotulo: 'Jonas', tema: T.jonas },
      { template: 'twist', emoji: '🎺', titulo: 'Muralhas que caíram só com um grito', rotulo: 'Josué · Jericó', tema: T.josue },
      { template: 'twist', emoji: '🪨', titulo: 'Um menino derrubou um gigante com uma pedra', rotulo: '1 Samuel · Davi', tema: T.davi },
      { template: 'twist', emoji: '🦁', titulo: 'Uma noite inteira na cova dos leões', rotulo: 'Daniel', tema: T.daniel },
      { template: 'twist', emoji: '🌊', titulo: 'E um mar que se abriu no meio', rotulo: 'Êxodo · Mar Vermelho', tema: T.exodo },
      { template: 'capa', titulo: 'Tudo isso virou aventura no Trilho Kids', subtitulo: 'A criança lê, joga o quiz e ganha medalhas. De graça.', rodape: '📲 Comece grátis — link na bio', tema: T.violeta },
    ],
  },
  {
    id: 'reel3',
    titulo: 'Quiz em 10s: você passa?',
    nota: 'Cada pergunta tem 2 frames (pergunta + resposta). Adicione o timer 3‑2‑1 no CapCut.',
    frames: [
      { template: 'capa', kicker: 'Desafio Trilho Kids', titulo: 'Quiz bíblico em 10 segundos', subtitulo: 'Você — adulto — passa? 👀', rodape: 'Comenta sua resposta 👇', tema: T.violeta },
      ...QUIZZ.flatMap(expandirQuiz),
      { template: 'capa', titulo: 'As crianças fazem isso e ainda ganham pontos 🏅', subtitulo: 'Joga o quiz completo, grátis.', rodape: '👉 Link na bio · marca quem não acerta 😂', tema: T.violeta },
    ],
  },
];

export function listarReels() {
  return ROTEIROS.map((r) => ({ id: r.id, titulo: r.titulo, frames: r.frames.length, nota: r.nota }));
}

export function acharReel(id) {
  const c = String(id || '').toLowerCase();
  return ROTEIROS.find((r) => r.id === c) || ROTEIROS.find((r) => r.titulo.toLowerCase() === c) || null;
}

// Monta o "item" de um reel. `livro` = id → alimenta o utm_campaign (se um dia
// a legenda for usada); reels não publicam pelo pipeline.
export function buildReel(id) {
  const r = acharReel(id);
  if (!r) {
    const ops = ROTEIROS.map((x) => x.id).join(', ');
    throw new Error(`Roteiro de reel não encontrado: ${id}. Opções: ${ops}`);
  }
  return {
    tipo: 'reel', id: r.id, livro: r.id, nome: 'Trilho Kids',
    titulo: r.titulo, nota: r.nota, tema: T.violeta, frames: r.frames,
  };
}
