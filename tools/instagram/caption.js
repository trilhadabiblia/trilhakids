// ============================================================
// Gera legenda + hashtags em pt-BR via LLM.
// Providers: NVIDIA (principal) → Anthropic (fallback) → offline (ver llm.js).
// ============================================================
import { SECOES } from './config.js';
import { pedirJSON, temLLM } from './llm.js';

// Legenda simples, sem IA — usada quando nenhum provider está configurado
// ou quando todos falham.
function legendaOffline(item) {
  return {
    legenda: `📖 Conheça o livro de ${item.nome}! No Trilho Kids as crianças aprendem a Bíblia brincando. Escaneie o QR Code e comece a jogar. 💜`,
    hashtags: ['trilhokids', 'biblia', 'ministerioinfantil', 'ebd', 'criancas', 'igreja', 'fe', 'ensinobiblico', item.livro],
  };
}

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

export async function gerarLegenda(item) {
  if (!temLLM()) return legendaOffline(item); // sem provider → legenda simples

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

  try {
    const dados = await pedirJSON(SCHEMA, prompt, 1200);
    return { legenda: dados.legenda, hashtags: dados.hashtags || [] };
  } catch (e) {
    console.warn('⚠  todos os providers falharam; usando legenda offline:', e.message);
    return legendaOffline(item);
  }
}

export function montarCaption({ legenda, hashtags }) {
  const tags = (hashtags || []).map((h) => '#' + String(h).replace(/^#/, '').replace(/\s+/g, '')).join(' ');
  return `${legenda}\n\n${tags}`.trim();
}
