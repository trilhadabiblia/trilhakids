// ============================================================
// Sobe o PNG renderizado para um host PÚBLICO e devolve a URL.
// A Graph API do Instagram BAIXA a imagem desse URL na hora de publicar.
// Usa o endpoint api/ig_upload.php (cPanel), protegido por segredo.
// ============================================================
import { cfg } from './config.js';

export async function hospedar(buffer, filename) {
  if (!cfg.upload.url) {
    throw new Error(
      'IG_UPLOAD_URL não configurado. Defina no .env (endpoint ig_upload.php) ' +
      'ou rode com --dry-run para só gerar os PNGs localmente.'
    );
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), filename);

  const resp = await fetch(cfg.upload.url, {
    method: 'POST',
    headers: { 'X-IG-Token': cfg.upload.token },
    body: form,
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.ok || !json.dados?.url) {
    throw new Error(`Falha ao hospedar imagem: ${resp.status} ${JSON.stringify(json)}`);
  }
  return json.dados.url;
}
