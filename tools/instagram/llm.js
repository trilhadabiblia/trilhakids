// ============================================================
// Camada de LLM com cadeia de providers para gerar JSON estruturado.
// Ordem: NVIDIA (principal) → Anthropic (fallback). O primeiro que
// responder com sucesso vence; se um falhar, tenta o próximo.
//
// NVIDIA usa a API compatível com OpenAI (/v1/chat/completions):
//   response_format json_object + instrução de schema no prompt.
// Anthropic usa structured outputs nativo (output_config.format).
// ============================================================
import { cfg } from './config.js';

// Providers disponíveis, na ordem de preferência (só os que têm credencial).
export function provedores() {
  const list = [];
  if (cfg.nvidia.apiKey) list.push('nvidia');
  if (cfg.anthropicKey) list.push('anthropic');
  return list;
}

export function temLLM() {
  return provedores().length > 0;
}

// Descreve as chaves esperadas do schema para orientar modelos sem
// suporte a json_schema estrito (caso da API NVIDIA/OpenAI-compat).
function instrucaoJSON(schema) {
  const props = schema?.properties || {};
  const linhas = Object.entries(props).map(([k, v]) => {
    const tipo = v.type === 'array' ? `array de ${v.items?.type || 'string'}` : v.type;
    return `  "${k}": ${tipo}${v.description ? ` — ${v.description}` : ''}`;
  });
  return `Responda APENAS com um objeto JSON válido (sem texto fora do JSON, sem crases/markdown), com estas chaves:\n{\n${linhas.join(',\n')}\n}`;
}

// Parser tolerante: remove cercas ```json e isola o primeiro bloco {...}.
function parseJSONsolto(txt) {
  if (!txt || !txt.trim()) throw new Error('resposta vazia');
  let s = txt.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i !== -1 && j > i) s = s.slice(i, j + 1);
  return JSON.parse(s);
}

// --- NVIDIA (OpenAI-compatível) ---
async function nvidiaJSON(schema, prompt, maxTokens) {
  const { apiKey, model, baseUrl } = cfg.nvidia;
  const resp = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: `${prompt}\n\n${instrucaoJSON(schema)}` }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: maxTokens || 1200,
      stream: false,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(180000), // geração pode ser lenta
  });

  const body = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = body?.error?.message || (body ? JSON.stringify(body) : `HTTP ${resp.status}`);
    throw new Error(`NVIDIA HTTP ${resp.status}: ${msg}`);
  }
  const content = body?.choices?.[0]?.message?.content || '';
  return parseJSONsolto(content);
}

// --- Anthropic (structured outputs nativo) ---
let _anthropic;
async function anthropicJSON(schema, prompt, maxTokens) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  _anthropic ??= new Anthropic({ apiKey: cfg.anthropicKey });
  const resp = await _anthropic.messages.create({
    model: cfg.captionModel,
    max_tokens: maxTokens || 1200,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  });
  return JSON.parse(resp.content.find((b) => b.type === 'text')?.text || '{}');
}

const IMPL = { nvidia: nvidiaJSON, anthropic: anthropicJSON };

// Pede um JSON conforme `schema`, tentando os providers em ordem.
// Lança se todos falharem (ou se nenhum estiver configurado).
export async function pedirJSON(schema, prompt, maxTokens) {
  const chain = provedores();
  if (!chain.length) {
    throw new Error('Nenhum provider LLM configurado (defina NVIDIA_API_KEY e/ou ANTHROPIC_API_KEY).');
  }

  let ultErro;
  for (const p of chain) {
    try {
      const dados = await IMPL[p](schema, prompt, maxTokens);
      if (p !== chain[0]) console.warn(`ℹ  legenda gerada via fallback: ${p}`);
      return dados;
    } catch (e) {
      ultErro = e;
      console.warn(`⚠  provider ${p} falhou: ${e.message}`);
    }
  }
  throw ultErro;
}
