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
import { buildPost, buildStory, buildCarrossel, listarLivros, acharLivro } from './content.js';
import { slideHTML, storyHTML, versiculoHTML } from './templates.js';
import { renderHTML, fecharBrowser } from './render.js';
import { gerarLegenda, montarCaption } from './caption.js';
import { provedores } from './llm.js';
import { hospedar } from './host.js';
import { publicarImagem, publicarStory, publicarCarrossel, refrescarToken } from './instagram.js';
import { proximoLivro, avancar } from './agenda.js';
import { REMOTO, BASE, LIVROS, relativo, listarImagens } from './source.js';

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

const FORMATOS = ['post', 'story', 'carrossel'];

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
        label: imagem.rotulo || item.titulo, texto: imagem.texto,
        pontos: imagem.pontos, tema: item.tema,
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

  // Legenda (Anthropic) e render (Puppeteer) são independentes → em paralelo.
  const [legenda, slides] = await Promise.all([
    tipo === 'story' ? Promise.resolve(null) : gerarLegenda(item),
    renderSlides(item),
  ]);
  const caption = legenda ? montarCaption(legenda) : '';
  if (caption) console.log(`\n📝 Legenda:\n${caption}\n`);

  const salvos = slides.map((s) => salvar(s.buffer, s.filename));
  console.log(`🖼  Renderizado:\n${salvos.map((p) => '   ' + p).join('\n')}`);
  await fecharBrowser();

  if (opts.dryRun) {
    console.log('\n✅ dry-run: nada foi publicado. Confira os PNGs em ./out\n');
    return null;
  }

  console.log('\n☁  Hospedando imagens...');
  // Uploads são independentes; Promise.all preserva a ordem dos slides.
  const urls = await Promise.all(slides.map((s) => hospedar(s.buffer, s.filename)));
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
    console.log('\nLegendas (providers em ordem: NVIDIA → Anthropic):');
    console.log('  NVIDIA_API_KEY    ', mask(cfg.nvidia.apiKey));
    console.log('  NVIDIA modelo     ', cfg.nvidia.model);
    console.log('  ANTHROPIC_API_KEY ', mask(cfg.anthropicKey));
    console.log('  Anthropic modelo  ', cfg.captionModel);
    console.log('  Ativos            ', provedores().join(' → ') || '❌ nenhum (legenda offline)');
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

  if (cmd === 'diag') {
    const chave = args.livro || 'jonas';
    console.log(`\n🔎 Diagnóstico — modo: ${REMOTO ? 'REMOTO' : 'LOCAL'} | base: ${BASE}`);
    console.log(`   Node ${process.version} | livros carregados: ${LIVROS.length}`);

    if (REMOTO) {
      const u = `${BASE}/livros.js`;
      try {
        const r = await fetch(u);
        console.log(`   livros.js: HTTP ${r.status} ${r.ok ? 'OK' : 'FALHOU'}  ${u}`);
      } catch (e) { console.log(`   livros.js: ERRO ${e.message}  ${u}`); }
    }

    const livro = acharLivro(chave);
    if (!livro) { console.log(`   ❌ livro não encontrado: ${chave}`); return; }
    const rel = relativo(livro);
    console.log(`   livro: ${livro.nome} | pasta relativa: ${rel} | seção: ${livro.secao}`);

    if (REMOTO) {
      const hu = `${BASE}/${rel}/${livro.pasta}.html`;
      try {
        const r = await fetch(hu);
        const t = r.ok ? await r.text() : '';
        const srcs = [...t.matchAll(/src="([^"]+\.png)"/gi)].map((m) => m[1]);
        console.log(`   HTML: HTTP ${r.status} ${r.ok ? 'OK' : 'FALHOU'}  tamanho=${t.length}  pngRefs=${srcs.length}  ${hu}`);
        console.log(`   refs: ${srcs.slice(0, 6).join(', ') || '(nenhuma)'}`);
      } catch (e) { console.log(`   HTML: ERRO ${e.message}  ${hu}`); }
    }

    const imgs = await listarImagens(livro);
    console.log(`   imagens encontradas: ${imgs.length}`);
    imgs.slice(0, 4).forEach((i) => console.log(`     - ${i.url || i.caminho}`));
    if (imgs[0]?.url) {
      try {
        const r = await fetch(imgs[0].url);
        console.log(`   GET 1ª imagem: HTTP ${r.status} ${r.ok ? 'OK' : 'FALHOU'}`);
      } catch (e) { console.log(`   GET 1ª imagem: ERRO ${e.message}`); }
    }
    console.log('');
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
    if (!FORMATOS.includes(formato)) {
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

  if (!FORMATOS.includes(cmd)) {
    console.log('Comandos: config | diag | listar | post | story | carrossel | proximo | refresh-token');
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
