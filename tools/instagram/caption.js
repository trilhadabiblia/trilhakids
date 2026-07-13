// ============================================================
// Gera legenda + hashtags em pt-BR via LLM.
// Providers: NVIDIA (principal) → Anthropic (fallback) → offline (ver llm.js).
// ============================================================
import { SECOES, cfg } from './config.js';
import { pedirJSON, temLLM } from './llm.js';

// Legenda simples, sem IA — usada quando nenhum provider está configurado
// ou quando todos falham.
function legendaOffline(item) {
  return {
    legenda: `📖 A história do livro de ${item.nome} ganhou vida no Trilho Kids: as crianças leem, jogam o quiz e evoluem de nível aprendendo a Bíblia brincando. 💜`,
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
  // Item que já traz legenda pronta (ex.: peças de campanha) não passa pela IA.
  if (item.legenda != null) return { legenda: item.legenda, hashtags: item.hashtags || [] };
  if (!temLLM()) return legendaOffline(item); // sem provider → legenda simples

  const secao = SECOES[item.secao] || 'Bíblia';
  const formato = item.tipo === 'story' ? 'story (vertical)' : item.tipo === 'post' ? 'post único' : 'carrossel';
  const foco = item.assunto ? `\nO conteúdo é sobre: ${item.assunto}.` : '';

  const prompt = `Você escreve para o Instagram do "Trilho Kids", um portal cristão que ensina a Bíblia para crianças (8-12 anos) da igreja IBP, de forma gamificada (pontos, badges, quizzes, QR Code pessoal).

Crie a legenda de um ${formato} sobre o livro bíblico de "${item.nome}" (seção: ${secao}).${foco}

Diretrizes:
- ABRA com um GANCHO de curiosidade ou conflito na 1ª linha — algo intrigante e específico de ${item.nome} (uma reviravolta, um mistério, uma pergunta que prende). NUNCA comece com "Conheça o livro de...", nem com rótulo ou resumo escolar.
  Exemplo do padrão (livro de Jonas): "🐋 Um profeta foi engolido vivo por um peixe gigante — e tudo porque tentou fugir de Deus."
- Depois do gancho, entregue valor: o que essa história ensina ou por que ela encanta uma criança.
- Tom caloroso, alegre e acolhedor, falando com pais, professores e ministério infantil. Português do Brasil, 1 a 3 parágrafos curtos, emojis com moderação.
- NÃO inclua links nem "escaneie o QR Code": a chamada para ação e o link são anexados automaticamente depois. Encerre com uma frase que desperte a vontade de conhecer a história completa.
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

// CTA anexado à legenda: frase curta + link do portal com UTMs.
// utm_campaign = livro/peça e utm_medium = formato → dá para separar no portal
// quanto tráfego cada um gera. O link não é clicável no feed, mas a URL é
// curta/memorável e reforça o "link na bio" (que aponta para /bio).
// A frase pode vir pronta no item (item.ctaTexto, ex.: peças de campanha).
function ctaDe(item) {
  if (!cfg.cta.ativo || !item) return '';
  const q = new URLSearchParams({
    utm_source: cfg.cta.utmSource,
    utm_medium: item.tipo || 'post',
    utm_campaign: item.livro || 'trilhokids',
  }).toString();
  const frase = item.ctaTexto || `📖 Leia a história completa de ${item.nome} no Trilho Kids — link na bio!`;
  return `${frase}\n👉 ${cfg.cta.url}?${q}`;
}

// Monta a legenda final: texto da IA + CTA (com link/UTM) + hashtags.
// `item` é opcional; sem ele o CTA é omitido (mantém compatibilidade).
export function montarCaption({ legenda, hashtags }, item) {
  const tags = (hashtags || []).map((h) => '#' + String(h).replace(/^#/, '').replace(/\s+/g, '')).join(' ');
  return [legenda, ctaDe(item), tags].filter(Boolean).join('\n\n').trim();
}
