// ============================================================
// Publicação via Instagram Graph API (Content Publishing).
// Fluxo: cria container(s) -> aguarda FINISHED -> publica.
// Docs: developers.facebook.com/docs/instagram-api/guides/content-publishing
// ============================================================
import { cfg } from './config.js';

function base() {
  // graph.instagram.com casa com o token IGAA... do devocional (mesmo host do
  // InstagramClient.php). Sobrescreva com IG_GRAPH_HOST se precisar.
  return `https://${cfg.ig.graphHost}/${cfg.ig.version}`;
}

function checarConfig() {
  if (!cfg.ig.userId || !cfg.ig.token) {
    throw new Error('IG_USER_ID e IG_ACCESS_TOKEN precisam estar no .env para publicar.');
  }
}

async function api(pathname, params, method = 'POST') {
  const url = new URL(`${base()}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: cfg.ig.token });
  const opt = method === 'GET' ? {} : { method: 'POST', body };
  if (method === 'GET') for (const [k, v] of body) url.searchParams.set(k, v);
  const resp = await fetch(url, opt);
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.error) {
    throw new Error(`Graph API ${resp.status}: ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

// Aguarda o container ficar pronto (imagens costumam ser rápidas).
async function aguardarContainer(creationId, tentativas = 20, intervaloMs = 2000) {
  for (let i = 0; i < tentativas; i++) {
    const st = await api(creationId, { fields: 'status_code,status' }, 'GET');
    if (st.status_code === 'FINISHED') return;
    if (st.status_code === 'ERROR') throw new Error(`Container falhou: ${st.status}`);
    await new Promise((r) => setTimeout(r, intervaloMs));
  }
  throw new Error('Timeout aguardando o container ficar pronto.');
}

async function publicar(creationId) {
  const res = await api(`${cfg.ig.userId}/media_publish`, { creation_id: creationId });
  return res.id; // media id publicado
}

// Post de imagem única (feed).
export async function publicarImagem({ imageUrl, caption }) {
  checarConfig();
  const c = await api(`${cfg.ig.userId}/media`, { image_url: imageUrl, caption: caption || '' });
  await aguardarContainer(c.id);
  return publicar(c.id);
}

// Story (imagem). Legenda não aparece em stories.
export async function publicarStory({ imageUrl }) {
  checarConfig();
  const c = await api(`${cfg.ig.userId}/media`, { image_url: imageUrl, media_type: 'STORIES' });
  await aguardarContainer(c.id);
  return publicar(c.id);
}

// Renova o token longo (Instagram Login, 60 dias). Não precisa de app secret.
// Requer token com >= 24h de vida. Retorna { access_token, expires_in }.
export async function refrescarToken() {
  if (!cfg.ig.token) throw new Error('Sem IG_ACCESS_TOKEN para renovar.');
  const url = `https://${cfg.ig.graphHost}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(cfg.ig.token)}`;
  const resp = await fetch(url);
  const j = await resp.json().catch(() => ({}));
  if (!resp.ok || !j.access_token) {
    throw new Error(`Falha ao renovar token: ${JSON.stringify(j.error || j)}`);
  }
  return j;
}

// Carrossel (2 a 10 imagens).
export async function publicarCarrossel({ imageUrls, caption }) {
  checarConfig();
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error('Carrossel precisa de 2 a 10 imagens.');
  }
  const filhos = [];
  for (const url of imageUrls) {
    const child = await api(`${cfg.ig.userId}/media`, {
      image_url: url,
      is_carousel_item: 'true',
    });
    await aguardarContainer(child.id);
    filhos.push(child.id);
  }
  const parent = await api(`${cfg.ig.userId}/media`, {
    media_type: 'CAROUSEL',
    children: filhos.join(','),
    caption: caption || '',
  });
  await aguardarContainer(parent.id);
  return publicar(parent.id);
}
