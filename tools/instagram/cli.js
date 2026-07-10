// ============================================================
// CLI orquestrador do pipeline de Instagram do Trilho Kids.
//
//   node cli.js config                          # confere credenciais (env.php)
//   node cli.js listar                          # livros com imagens
//   node cli.js post      --livro jonas [--imagem curiosidade] [--dry-run]
//   node cli.js story     --livro jonas [--dry-run]
//   node cli.js carrossel --livro jonas [--max 6] [--dry-run]
//   node cli.js proximo   [--formato carrossel] [--dry-run]   # rotação (cron)
//
// --dry-run: só gera os PNGs em ./out e imprime a legenda (não hospeda/publica).
// ============================================================
import fs from 'fs';
import path from 'path';
import { OUT_DIR, cfg, TOKEN_FILE } from './config.js';
import { buildPost, buildStory, buildCarrossel, listarLivros } from './content.js';
import { slideHTML, storyHTML, versiculoHTML } from './templates.js';
import { renderHTML, fecharBrowser } from './render.js';
import { gerarLegenda, montarCaption } from './caption.js';
import { hospedar } from './host.js';
import { publicarImagem, publicarStory, publicarCarrossel, refrescarToken } from './instagram.js';
import { proximoLivro, avancar } from './agenda.js';
import { REMOTO, BASE } from './source.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function salvar(buffer, nome) {
  const p = path.join(OUT_DIR, nome);
  fs.writeFileSync(p, buffer);
  return p;
}

async function montarItem(tipo, { livro, imagem, max }) {
  if (tipo === 'post') return buildPost(livro, imagem);
  if (tipo === 'story') return buildStory(livro, imagem);
  return buildCarrossel(livro, Number(max) || 6);
}

async function renderSlides(item) {
  const out = [];
  if (item.tipo === 'story') {
    const html = storyHTML({ imagem: item.imagens[0], nome: item.nome, secao: item.secao, tema: item.tema });
    out.push({ buffer: await renderHTML(html, 1080, 1920), filename: `${item.livro}-story.png` });
  } else {
    let n = 0;
    // Carrossel abre com o card do "Versículo para guardar no coração".
    if (item.tipo === 'carrossel' && item.versiculo) {
      const html = versiculoHTML({ ...item.versiculo, nome: item.nome, secao: item.secao, tema: item.tema });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-carrossel-${++n}-versiculo.png` });
    }
    for (let i = 0; i < item.imagens.length; i++) {
      const imagem = item.imagens[i];
      const html = slideHTML({
        imagem, nome: item.nome, secao: item.secao,
        kicker: imagem.rotulo || item.titulo, tema: item.tema,
      });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}.png` });
    }
  }
  return out;
}

// Fluxo completo de um formato. Retorna o media_id (ou null em dry-run).
async function fluxo(tipo, opts) {
  const item = await montarItem(tipo, opts);
  console.log(`\n▶ ${tipo.toUpperCase()} — ${item.nome} (${item.imagens.length} imagem/ns)`);

  let caption = '';
  if (tipo !== 'story') {
    caption = montarCaption(await gerarLegenda(item));
    console.log(`\n📝 Legenda:\n${caption}\n`);
  }

  const slides = await renderSlides(item);
  const salvos = slides.map((s) => salvar(s.buffer, s.filename));
  console.log(`🖼  Renderizado:\n${salvos.map((p) => '   ' + p).join('\n')}`);
  await fecharBrowser();

  if (opts.dryRun) {
    console.log('\n✅ dry-run: nada foi publicado. Confira os PNGs em ./out\n');
    return null;
  }

  console.log('\n☁  Hospedando imagens...');
  const urls = [];
  for (const s of slides) urls.push(await hospedar(s.buffer, s.filename));
  urls.forEach((u) => console.log('   ' + u));

  console.log('\n📤 Publicando no Instagram...');
  let mediaId;
  if (tipo === 'story') mediaId = await publicarStory({ imageUrl: urls[0] });
  else if (tipo === 'post') mediaId = await publicarImagem({ imageUrl: urls[0], caption });
  else mediaId = await publicarCarrossel({ imageUrls: urls, caption });

  console.log(`\n✅ Publicado! media id: ${mediaId}\n`);
  return mediaId;
}

async function run() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (cmd === 'config') {
    const mask = (v) => (v ? v.slice(0, 4) + '…' + v.slice(-2) + ` (${v.length} chars)` : '❌ vazio');
    console.log('\nAssets dos livros:');
    console.log('  ' + (REMOTO ? `remoto → ${BASE}` : 'local (repositório no disco)'));
    console.log('\nOrigem das credenciais (config/env.php):');
    console.log('  ' + (cfg.envPhpPath || '(sem env.php — usando .env / .vps-env / process.env)'));
    console.log('\nInstagram:');
    console.log('  IG_USER_ID        ', cfg.ig.userId || '❌ vazio');
    console.log('  IG_ACCESS_TOKEN   ', mask(cfg.ig.token));
    console.log('  Graph host        ', cfg.ig.graphHost + '/' + cfg.ig.version);
    console.log('  FB_APP_ID/SECRET  ', cfg.ig.fbAppId ? 'presente' : '— (refresh manual)');
    console.log('\nLegendas (Anthropic):');
    console.log('  ANTHROPIC_API_KEY ', mask(cfg.anthropicKey));
    console.log('  Modelo            ', cfg.captionModel);
    console.log('\nHospedagem dos assets:');
    console.log('  IG_UPLOAD_URL     ', cfg.upload.url || '❌ vazio (só --dry-run)');
    console.log('  IG_UPLOAD_TOKEN   ', cfg.upload.token ? 'presente' : '❌ vazio');
    console.log('');
    return;
  }

  if (cmd === 'refresh-token') {
    const j = await refrescarToken();
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(
      { access_token: j.access_token, expires_in: j.expires_in, atualizado: new Date().toISOString() }, null, 2));
    console.log(`✅ Token renovado. Expira em ~${Math.round((j.expires_in || 0) / 86400)} dias. (salvo em .ig-token.json)`);
    return;
  }

  if (cmd === 'listar') {
    const livros = await listarLivros();
    console.log(`\n${livros.length} livros disponíveis:\n`);
    for (const l of livros) console.log(`  ${l.pasta.padEnd(18)} ${l.nome.padEnd(20)} ${l.imagens ?? '?'} imgs (${l.secao})`);
    return;
  }

  const dryRun = !!args['dry-run'];

  if (cmd === 'proximo') {
    const formato = args.formato || 'carrossel';
    if (!['post', 'story', 'carrossel'].includes(formato)) {
      console.error(`--formato inválido: ${formato}`); process.exit(1);
    }
    const { livro, nome, indice, total } = await proximoLivro();
    console.log(`\n🗓  Rotação ${indice + 1}/${total}: ${nome} (${formato})`);
    await fluxo(formato, { livro, max: args.max, dryRun });
    if (!dryRun) {
      const prox = avancar(indice, total);
      console.log(`↻ Próximo da rotação: índice ${prox}/${total}\n`);
    } else {
      console.log('(dry-run: rotação não avançou)\n');
    }
    return;
  }

  if (!['post', 'story', 'carrossel'].includes(cmd)) {
    console.log('Comandos: config | listar | post | story | carrossel | proximo | refresh-token');
    process.exit(1);
  }
  if (!args.livro) { console.error('Faltou --livro <pasta>. Ex: --livro jonas'); process.exit(1); }

  await fluxo(cmd, { livro: args.livro, imagem: args.imagem, max: args.max, dryRun });
}

run().catch(async (err) => {
  await fecharBrowser().catch(() => {});
  console.error('\n❌ Erro:', err.message, '\n');
  process.exit(1);
});
