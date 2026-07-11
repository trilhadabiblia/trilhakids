// ============================================================
// Gera legenda + hashtags em pt-BR com a API da Claude.
// Usa structured outputs (output_config.format) para garantir JSON válido.
// ============================================================
import Anthropic from '@anthropic-ai/sdk';
import { cfg } from './config.js';

const SCHEMA = {
  type: 'object',
  properties: {
    legenda: {
      type: 'string',
      description: 'Legenda do post em pt-BR, calorosa e adequada a famílias e crianças.',
    },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
      description: 'De 8 a 15 hashtags relevantes, sem o caractere #.',
    },
  },
  required: ['legenda', 'hashtags'],
  additionalProperties: false,
};

const SECOES = {
  pentateuco: 'Pentateuco',
  historicos: 'Livros Históricos',
  poeticos: 'Livros Poéticos',
  'profetas-maiores': 'Profetas Maiores',
  'profetas-menores': 'Profetas Menores',
  evangelhos: 'Evangelhos',
  'historico-nt': 'Histórico do Novo Testamento',
  'cartas-paulo': 'Cartas de Paulo',
  'outras-cartas': 'Outras Cartas',
  'profetico-nt': 'Apocalipse',
};

export async function gerarLegenda(item) {
  if (!cfg.anthropicKey) {
    // Fallback offline: legenda simples para conseguir testar sem chave.
    return {
      legenda: `📖 Conheça o livro de ${item.nome}! No Trilho Kids as crianças aprendem a Bíblia brincando. Escaneie o QR Code e comece a jogar. 💜`,
      hashtags: ['trilhokids', 'biblia', 'ministerioinfantil', 'ebd', 'criancas', 'igreja', 'fe', 'ensinobiblico', item.livro],
    };
  }

  const client = new Anthropic({ apiKey: cfg.anthropicKey });
  const secao = SECOES[item.secao] || 'Bíblia';
  const formato =
    item.tipo === 'story' ? 'story (vertical)' : item.tipo === 'carrossel' ? 'carrossel' : 'post único';

  const prompt = `Você escreve para o Instagram do "Trilho Kids", um portal cristão que ensina a Bíblia para crianças (8-12 anos) da igreja IBP, de forma gamificada (pontos, badges, quizzes, QR Code pessoal).

Crie a legenda de um ${formato} sobre o livro bíblico de "${item.nome}" (seção: ${secao}).

Diretrizes:
- Tom caloroso, alegre e acolhedor, falando com pais, professores e ministério infantil.
- Português do Brasil. 1 a 3 parágrafos curtos, com emojis com moderação.
- Comece com um gancho sobre ${item.nome}.
- Inclua uma chamada para ação: escanear o QR Code / acessar o portal para as crianças jogarem e aprenderem.
- Sem inventar fatos bíblicos específicos que você não tenha certeza; mantenha-se no geral e no aplicável.
- As hashtags devem misturar marca, tema bíblico infantil e o nome do livro. Sem o caractere #.`;

  const resp = await client.messages.create({
    model: cfg.captionModel,
    max_tokens: 1200,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });

  const texto = resp.content.find((b) => b.type === 'text')?.text || '{}';
  const dados = JSON.parse(texto);
  return { legenda: dados.legenda, hashtags: dados.hashtags || [] };
}

// Gera uma frase-síntese curta por seção do carrossel, a partir do texto
// real da página. Retorna { [sufixo]: 'frase' }. 1 chamada por carrossel.
export async function gerarSinteses(nomeLivro, secoes) {
  const sufs = Object.keys(secoes);
  if (!sufs.length) return {};

  if (!cfg.anthropicKey) {
    // Fallback offline: usa o começo do corpo como síntese.
    const out = {};
    for (const s of sufs) out[s] = secoes[s].corpo.replace(/^[^:]*:\s*/, '').split(/[.!?]/)[0].slice(0, 90).trim();
    return out;
  }

  const props = {};
  for (const s of sufs) props[s] = { type: 'string', description: `Frase-síntese da seção "${s}".` };
  const schema = { type: 'object', properties: props, required: sufs, additionalProperties: false };

  const secoesTxt = sufs.map((s) => `[${s}] ${secoes[s].heading}\n${secoes[s].corpo}`).join('\n\n');
  const prompt = `Você cria microcópias para os slides de um carrossel do Instagram do "Trilho Kids" (Bíblia para crianças de 8–12 anos), sobre o livro de ${nomeLivro}.

Para CADA seção abaixo escreva UMA frase curta (máx ~90 caracteres), clara, alegre e fiel ao conteúdo, sintetizando o que aquela seção diz para a criança. Sem emojis, sem aspas. Não invente fatos — baseie-se no texto fornecido.

Seções:
${secoesTxt}

Responda com uma frase por seção, na chave correspondente.`;

  const client = new Anthropic({ apiKey: cfg.anthropicKey });
  const resp = await client.messages.create({
    model: cfg.captionModel,
    max_tokens: 900,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  });
  const txt = resp.content.find((b) => b.type === 'text')?.text || '{}';
  try { return JSON.parse(txt); } catch { return {}; }
}

export function montarCaption({ legenda, hashtags }) {
  const tags = (hashtags || []).map((h) => '#' + String(h).replace(/^#/, '').replace(/\s+/g, '')).join(' ');
  return `${legenda}\n\n${tags}`.trim();
}
