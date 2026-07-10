// ============================================================
// Extrai o tema de cor de cada livro a partir do gradiente do
// título (<h1> ... from-XXX-700 to-YYY-800 ...) e converte as
// classes Tailwind em hex, para tematizar os cards do livro.
// ============================================================
// Paleta Tailwind v3 (shades 200–900) das famílias usadas nas páginas.
const TW = {
  slate:{200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'},
  gray:{200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827'},
  zinc:{200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b'},
  red:{200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d'},
  orange:{200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'},
  amber:{200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f'},
  yellow:{200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12'},
  lime:{200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314'},
  green:{200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d'},
  emerald:{200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b'},
  teal:{200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a'},
  cyan:{200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63'},
  sky:{200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e'},
  blue:{200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a'},
  indigo:{200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81'},
  violet:{200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95'},
  purple:{200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87'},
  fuchsia:{200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75'},
  pink:{200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843'},
  rose:{200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337'},
};

function hex(familia, shade) {
  const fam = TW[familia];
  if (!fam) return null;
  return fam[shade] || fam[700] || null;
}

// Tema padrão (marca) quando não há gradiente no livro.
export const TEMA_PADRAO = { from: '#2a1055', to: '#7c3aed', light: '#c4b5fd', badgeText: '#ddd6fe' };

export function extrairTema(html) {
  if (!html) return null;

  // Prioriza o gradiente dentro do primeiro <h1> (título do livro).
  const h1 = (html.match(/<h1[\s\S]*?<\/h1>/i) || [])[0] || '';
  const alvo = /from-[a-z]+-\d{3}[\s\S]{0,120}?to-[a-z]+-\d{3}/.test(h1) ? h1 : html;

  const mFrom = alvo.match(/from-([a-z]+)-(\d{3})/);
  const mTo = alvo.match(/to-([a-z]+)-(\d{3})/);
  if (!mFrom || !mTo) return null;

  const from = hex(mFrom[1], mFrom[2]);
  const to = hex(mTo[1], mTo[2]);
  if (!from || !to) return null;

  return {
    from,                                   // topo do fundo
    to,                                     // acento/glow/badge
    light: hex(mFrom[1], 300) || '#c4b5fd', // texto claro (nome, rótulos)
    badgeText: hex(mTo[1], 200) || '#ddd6fe',
  };
}
