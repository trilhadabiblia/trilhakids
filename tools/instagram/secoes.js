// ============================================================
// Extrai da página do livro:
//  - subtitulo: a linha logo abaixo do <h1> (ex: "O Profeta Fujão
//    e o Grande Peixe — Um Resumo Visual para Crianças") → usada no slide da capa.
//  - secoes: heading + texto de cada seção, mapeados ao sufixo da imagem,
//    para servir de base à síntese por IA.
//  - pontos: títulos-chave dos cards de cada seção (extração determinística),
//    usados como bullets em cada slide do carrossel — sem IA.
// ============================================================

export function limpa(s) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sufixo de imagem ↔ frase-chave da seção (buscada no texto limpo da página).
const CHAVES = [
  { suf: 'o-que-conta', re: /O Que o Livro Conta\??/i },
  { suf: 'proposito', re: /(Qual [ée] o )?Prop[óo]sito( do Livro)?\??/i },
  { suf: 'curiosidade', re: /Curiosidades?[:!?]?/i },
  { suf: 'importante', re: /Por Que [ÉEée].*? Importante\??/i },
  { suf: 'personagem', re: /Quem S[ãa]o os Personagens[^?]*\??/i },
];

export function extrairSecoes(html) {
  const out = { subtitulo: '', secoes: {} };
  if (!html) return out;

  // Subtítulo: primeiro <p> depois do </h1>.
  const fimH1 = html.indexOf('</h1>');
  if (fimH1 !== -1) {
    const p = html.slice(fimH1).match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (p) out.subtitulo = limpa(p[1]);
  }

  // Texto limpo da página; para cada seção, pega a partir da frase-chave.
  const texto = limpa(html);
  for (const k of CHAVES) {
    const m = texto.match(k.re);
    if (m && m.index != null) {
      out.secoes[k.suf] = {
        heading: m[0].trim(),
        corpo: texto.slice(m.index, m.index + 380).trim(),
      };
    }
  }
  return out;
}

// Sufixo (o-que-conta, proposito, curiosidade, importante, personagem, capa)
// a partir do nome do arquivo. Normaliza variantes.
export function sufixoDe(arquivo, pasta) {
  let s = arquivo.replace(`${pasta}-`, '').replace(/\.png$/i, '');
  if (/^por-que-importante$/.test(s)) s = 'importante';
  if (/^(quem-e|quem-sao)$/.test(s)) s = 'personagem';
  return s;
}

// ------------------------------------------------------------
// Extração determinística dos pontos de cada seção (para os bullets
// do carrossel). Título da seção (<h2>) → sufixo da imagem.
// ------------------------------------------------------------
const SECAO_SUFIXO = [
  { suf: 'personagem', re: /Quem S[ãa]o os Personagens/i },
  { suf: 'o-que-conta', re: /O Que o Livro Conta/i },
  { suf: 'importante', re: /Por Que .*Importante/i },
  { suf: 'proposito', re: /Prop[óo]sito/i },
  { suf: 'curiosidade', re: /Voc[êe] Sabia|Curiosidade/i },
];

// Todos os textos limpos capturados por um regex (grupo 1) num bloco.
function capturarTodos(re, bloco) {
  return [...bloco.matchAll(re)].map((m) => limpa(m[1])).filter(Boolean);
}

// Retorna { [sufixo]: ['ponto', ...] } com os títulos-chave de cada seção.
// Regra: usa os <h3> quando há ≥2 (são os pontos); se houver só 1 <h3>
// (um agrupador), cai para os <p class="font-bold…"> e, na falta, os <strong>.
export function extrairPontos(html) {
  const out = {};
  if (!html) return out;

  const secoes = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)].map((m) => m[1]);
  for (const bloco of secoes) {
    const h2 = bloco.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!h2) continue;
    const alvo = SECAO_SUFIXO.find((s) => s.re.test(limpa(h2[1])));
    if (!alvo || out[alvo.suf]) continue;

    const h3 = capturarTodos(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, bloco);
    let pontos = h3;
    if (h3.length <= 1) {
      // class DEVE começar com "font-bold" — evita rótulos como
      // "text-sm font-bold …" (ex.: "📖 Curiosidade incrível!").
      const bold = capturarTodos(/<p[^>]*class="font-bold[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, bloco);
      // Nas curiosidades o emoji fica ANTES do <strong> (ex.: "📜 <strong>…</strong>");
      // captura o emoji líder (opcional) + o texto do strong.
      const strong = [...bloco.matchAll(/([\p{Extended_Pictographic}☀-➿]️?\s*)?<strong[^>]*>([\s\S]*?)<\/strong>/giu)]
        .map((m) => limpa((m[1] || '') + m[2])).filter(Boolean);
      const fallback = bold.length ? bold : strong;
      if (fallback.length) pontos = fallback;
    }

    pontos = pontos
      .map((p) => p.replace(/[:：]\s*$/, '').trim()) // tira ":" final das curiosidades
      .filter(Boolean)
      .slice(0, 4);
    if (pontos.length) out[alvo.suf] = pontos;
  }
  return out;
}
