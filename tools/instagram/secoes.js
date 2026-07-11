// ============================================================
// Extrai da página do livro:
//  - subtitulo: a linha logo abaixo do <h1> (ex: "O Profeta Fujão
//    e o Grande Peixe — Um Resumo Visual para Crianças") → usada no slide da capa.
//  - secoes: heading + texto de cada seção, mapeados ao sufixo da imagem,
//    para servir de base à síntese por IA.
// ============================================================

function limpa(s) {
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
