// ============================================================
// Rotação de livros para publicação agendada (cron).
// Percorre os livros (com imagens) na ordem canônica, guardando o
// índice em agenda.json. Assim o cron só chama `node cli.js proximo`.
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listarLivros } from './content.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(here, 'agenda.json');

function lerEstado() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return { indice: 0 };
  }
}

export async function proximoLivro() {
  const livros = await listarLivros(); // ordem canônica
  if (!livros.length) throw new Error('Nenhum livro disponível.');
  const indice = (lerEstado().indice || 0) % livros.length;
  return { livro: livros[indice].pasta, nome: livros[indice].nome, indice, total: livros.length };
}

export function avancar(indice, total) {
  const proximo = (indice + 1) % total;
  fs.writeFileSync(STATE, JSON.stringify({ indice: proximo, atualizado: new Date().toISOString() }, null, 2));
  return proximo;
}
