// ============================================================
// Extrai a seção "Versículo para Guardar no Coração" da página
// HTML de cada livro (versículo + referência + explicação).
// Estruturas variam por livro; ancoramos no título da seção e nas
// aspas do versículo, então pegamos referência e texto por proximidade.
// ============================================================
import { limpa } from './secoes.js';

export function extrairVersiculo(html) {
  if (!html) return null;

  const idx = html.search(/Versículo para Guardar no Coração/i);
  if (idx === -1) return null;

  const fimSection = html.indexOf('</section>', idx);
  const trecho = html.slice(idx, fimSection === -1 ? idx + 4000 : fimSection);

  // Fragmentos de texto (remove tags e scripts).
  const frags = trecho
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .split(/<[^>]+>/)
    .map(limpa)
    .filter(Boolean);

  // Versículo = primeiro fragmento com aspas (retas ou tipográficas).
  const iVerse = frags.findIndex((f) => /["“][^"”]{5,}["”]/.test(f));
  if (iVerse === -1) return null;
  const mVerse = frags[iVerse].match(/["“]([^"”]+)["”]/);
  const versiculo = (mVerse ? mVerse[1] : frags[iVerse]).trim();

  // Referência = primeiro fragmento curto após o versículo (tira "— ").
  let referencia = '';
  for (let j = iVerse + 1; j < frags.length; j++) {
    const f = frags[j].replace(/^[—–-]\s*/, '').trim();
    if (f && f.length <= 40 && !/^[✍️🗣️🖨️📝📌📖🌍✨💛]/.test(frags[j])) {
      referencia = f;
      break;
    }
  }

  // Texto = primeiro fragmento longo após o versículo (a explicação).
  let texto = '';
  for (let j = iVerse + 1; j < frags.length; j++) {
    if (frags[j].length > 60) { texto = frags[j]; break; }
  }
  // Limpa emojis iniciais e rótulos comuns.
  texto = texto
    .replace(/^[^\p{L}"]+/u, '')
    .replace(/^(O que isso significa\??|O que isso quer dizer\??|O que significa\??)\s*/i, '')
    .trim();

  if (!versiculo) return null;
  return { versiculo, referencia, texto };
}
