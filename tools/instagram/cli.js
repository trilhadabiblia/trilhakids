// ============================================================
// CLI orquestrador do pipeline de Instagram do Trilho Kids.
//
//   node cli.js config                          # confere credenciais (env.php)
//   node cli.js listar                          # livros com imagens
//   node cli.js post      --livro jonas [--imagem curiosidade] [--dry-run]
//   node cli.js story     --livro jonas [--dry-run]
//   node cli.js carrossel --livro jonas [--max 6] [--dry-run]
//   node cli.js proximo   [--formato X] [--dry-run]           # agenda da semana (cron)
//   node cli.js campanha  [--peca <id>] [--dry-run]           # campanha institucional (pitch)
//
// --dry-run: só gera os PNGs em ./out e imprime a legenda (não hospeda/publica).
// ============================================================
import fs from 'fs';
import path from 'path';
import { OUT_DIR, cfg, TOKEN_FILE } from './config.js';
import { buildPost, buildStory, buildCarrossel, buildSegredos, buildReflexao, listarLivros, acharLivro } from './content.js';
import { slideHTML, storyHTML, versiculoHTML, cartaoHTML, campanhaCapaHTML, campanhaCartaoHTML } from './templates.js';
import { renderHTML, fecharBrowser } from './render.js';
import { gerarLegenda, montarCaption } from './caption.js';
import { provedores } from './llm.js';
import { hospedar } from './host.js';
import { publicarImagem, publicarStory, publicarCarrossel, refrescarToken, quemSou } from './instagram.js';
import { agendaDoDia } from './agenda.js';
import { buildCampanha, listarCampanha } from './campanha.js';
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

const FORMATOS = ['post', 'story', 'carrossel', 'segredos', 'reflexao'];

async function montarItem(tipo, { livro, imagem, max, peca }) {
  if (tipo === 'post') return buildPost(livro, imagem);
  if (tipo === 'story') return buildStory(livro, imagem);
  if (tipo === 'segredos') return buildSegredos(livro);
  if (tipo === 'reflexao') return buildReflexao(livro);
  if (tipo === 'campanha') return buildCampanha(peca);
  return buildCarrossel(livro, Number(max) || 6);
}

async function renderSlides(item) {
  const out = [];
  if (item.tipo === 'story') {
    const html = storyHTML({ imagem: item.imagens[0], nome: item.nome, secao: item.secao, tema: item.tema });
    out.push({ buffer: await renderHTML(html, 1080, 1920), filename: `${item.livro}-story.png` });
  } else if (item.tipo === 'campanha') {
    // Peça institucional: capa + cards, sem imagem de livro (só templates da marca).
    const cards = item.slides.filter((s) => s.template !== 'capa').length;
    let n = 0, c = 0;
    for (const s of item.slides) {
      const html = s.template === 'capa'
        ? campanhaCapaHTML({ ...s, tema: item.tema })
        : campanhaCartaoHTML({ ...s, tema: item.tema, contador: `${++c}/${cards}` });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `campanha-${item.id}-${++n}.png` });
    }
  } else if (item.tipo === 'segredos' || item.tipo === 'reflexao') {
    // Carrossel só de texto: capa (imagem do livro) + 1 card de texto por item.
    let n = 0;
    const capaHtml = slideHTML({
      imagem: item.capa, nome: item.nome, secao: item.secao,
      label: '', texto: item.titulo, tema: item.tema,
    });
    out.push({ buffer: await renderHTML(capaHtml, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}-capa.png` });
    for (const c of item.cartoes) {
      const html = cartaoHTML({
        ...c, nome: item.nome, secao: item.secao, tema: item.tema,
        contador: `${n}/${item.cartoes.length}`,
      });
      out.push({ buffer: await renderHTML(html, 1080, 1080), filename: `${item.livro}-${item.tipo}-${++n}.png` });
    }
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
  const nItens = item.imagens?.length ?? item.cartoes?.length ?? item.slides?.length ?? 0;
  console.log(`\n▶ ${tipo.toUpperCase()} — ${item.nome} (${nItens} ${item.imagens ? 'imagem/ns' : 'cards'})`);

  // Legenda (Anthropic) e render (Puppeteer) são independentes → em paralelo.
  const [legenda, slides] = await Promise.all([
    tipo === 'story' ? Promise.resolve(null) : gerarLegenda(item),
    renderSlides(item),
  ]);
  const caption = legenda ? montarCaption(legenda, item) : '';
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
    console.log('\nLegendas (ordem padrão: Groq → NVIDIA → Anthropic):');
    console.log('  GROQ_API_KEY      ', mask(cfg.groq.apiKey), '| modelo', cfg.groq.model);
    console.log('  NVIDIA_API_KEY    ', mask(cfg.nvidia.apiKey), '| modelo', cfg.nvidia.model);
    console.log('  ANTHROPIC_API_KEY ', mask(cfg.anthropicKey), '| modelo', cfg.captionModel);
    console.log('  Ativos (em uso)   ', provedores().join(' → ') || '❌ nenhum (legenda offline)');
    console.log('\nHospedagem dos assets:');
    console.log('  IG_UPLOAD_URL     ', cfg.upload.url || '❌ vazio (só --dry-run)');
    console.log('  IG_UPLOAD_TOKEN   ', cfg.upload.token ? 'presente' : '❌ vazio');
    console.log('');
    return;
  }

  if (cmd === 'whoami') {
    const eu = await quemSou();
    console.log(`\n👤 O token atual publica em: @${eu.username} (user_id: ${eu.user_id})`);
    if (cfg.ig.userId && String(eu.user_id) !== String(cfg.ig.userId)) {
      console.log(`⚠  IG_USER_ID configurado (${cfg.ig.userId}) DIFERE do id do token (${eu.user_id}).`);
      console.log('   A publicação usa /{IG_USER_ID}/media — alinhe IG_USER_ID ao id acima.');
    } else if (cfg.ig.userId) {
      console.log('✅ IG_USER_ID confere com o token.');
    }
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
    // Agenda da semana: o livro roda semanalmente (por data) e os formatos
    // saem conforme o dia. `--formato X` força um formato específico.
    const ag = await agendaDoDia();
    if (args.formato && !FORMATOS.includes(args.formato)) {
      console.error(`--formato inválido: ${args.formato}`); process.exit(1);
    }
    const formatos = args.formato ? [args.formato] : ag.formatos;
    if (!formatos.length) {
      console.log(`\n🗓  ${ag.dia}: sem publicação agendada para ${ag.nome} (livro ${ag.indice + 1}/${ag.total}). Grade: seg/ter/qua/sex/sáb.\n`);
      return;
    }
    console.log(`\n🗓  Semana ${ag.indice + 1}/${ag.total}: ${ag.nome} — ${ag.dia}: ${formatos.join(' + ')}`);
    for (const formato of formatos) {
      await fluxo(formato, { livro: ag.livro, max: args.max, dryRun });
    }
    if (dryRun) console.log('(dry-run: nada foi publicado)\n');
    return;
  }

  if (cmd === 'campanha') {
    const pecas = listarCampanha();
    if (!args.peca) {
      console.log('\n📣 Peças da campanha institucional (a partir do pitch):\n');
      for (const p of pecas) console.log(`  ${p.id.padEnd(16)} ${p.titulo.padEnd(22)} ${p.slides} slides`);
      console.log('\nGere com: node cli.js campanha --peca <id> [--dry-run]\n');
      return;
    }
    console.log(`\n📣 Campanha — peça "${args.peca}"`);
    await fluxo('campanha', { peca: args.peca, dryRun });
    return;
  }

  if (!FORMATOS.includes(cmd)) {
    console.log('Comandos: config | whoami | diag | listar | post | story | carrossel | segredos | reflexao | proximo | campanha | refresh-token');
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
