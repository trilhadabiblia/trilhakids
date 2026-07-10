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

export function montarCaption({ legenda, hashtags }) {
  const tags = (hashtags || []).map((h) => '#' + String(h).replace(/^#/, '').replace(/\s+/g, '')).join(' ');
  return `${legenda}\n\n${tags}`.trim();
}
