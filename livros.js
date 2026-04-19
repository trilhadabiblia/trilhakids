// ============================================
// LIVROS CANÔNICOS — TRILHO KIDS
// Ordem canônica das 66 livros da Bíblia.
// Usado por acesso.js (guard) e admin (seletor de calendário).
// ============================================

window.LIVROS_CANONICOS = [
  // ── Pentateuco ───────────────────────────
  { ordem:  1, nome: 'Gênesis',             pasta: 'genesis',               secao: 'pentateuco'      },
  { ordem:  2, nome: 'Êxodo',               pasta: 'exodo',                 secao: 'pentateuco'      },
  { ordem:  3, nome: 'Levítico',            pasta: 'levitico',              secao: 'pentateuco'      },
  { ordem:  4, nome: 'Números',             pasta: 'numeros',               secao: 'pentateuco'      },
  { ordem:  5, nome: 'Deuteronômio',        pasta: 'deuteronomio',          secao: 'pentateuco'      },
  // ── Históricos ───────────────────────────
  { ordem:  6, nome: 'Josué',               pasta: 'josue',                 secao: 'historicos'      },
  { ordem:  7, nome: 'Juízes',              pasta: 'juizes',                secao: 'historicos'      },
  { ordem:  8, nome: 'Rute',                pasta: 'rute',                  secao: 'historicos'      },
  { ordem:  9, nome: '1 Samuel',            pasta: '1samuel',               secao: 'historicos'      },
  { ordem: 10, nome: '2 Samuel',            pasta: '2samuel',               secao: 'historicos'      },
  { ordem: 11, nome: '1 Reis',              pasta: '1reis',                 secao: 'historicos'      },
  { ordem: 12, nome: '2 Reis',              pasta: '2reis',                 secao: 'historicos'      },
  { ordem: 13, nome: '1 Crônicas',          pasta: '1cronicas',             secao: 'historicos'      },
  { ordem: 14, nome: '2 Crônicas',          pasta: '2cronicas',             secao: 'historicos'      },
  { ordem: 15, nome: 'Esdras',              pasta: 'esdras',                secao: 'historicos'      },
  { ordem: 16, nome: 'Neemias',             pasta: 'neemias',               secao: 'historicos'      },
  { ordem: 17, nome: 'Ester',               pasta: 'ester',                 secao: 'historicos'      },
  // ── Poéticos ─────────────────────────────
  { ordem: 18, nome: 'Jó',                  pasta: 'jo',                    secao: 'poeticos'        },
  { ordem: 19, nome: 'Salmos',              pasta: 'salmos',                secao: 'poeticos'        },
  { ordem: 20, nome: 'Provérbios',          pasta: 'proverbios',            secao: 'poeticos'        },
  { ordem: 21, nome: 'Eclesiastes',         pasta: 'eclesiastes',           secao: 'poeticos'        },
  { ordem: 22, nome: 'Cânticos',            pasta: 'cantares',              secao: 'poeticos'        },
  // ── Profetas Maiores ─────────────────────
  { ordem: 23, nome: 'Isaías',              pasta: 'isaias',                secao: 'profetas-maiores'},
  { ordem: 24, nome: 'Jeremias',            pasta: 'jeremias',              secao: 'profetas-maiores'},
  { ordem: 25, nome: 'Lamentações',         pasta: 'lamentacoes',           secao: 'profetas-maiores'},
  { ordem: 26, nome: 'Ezequiel',            pasta: 'ezequiel',              secao: 'profetas-maiores'},
  { ordem: 27, nome: 'Daniel',              pasta: 'daniel',                secao: 'profetas-maiores'},
  // ── Profetas Menores ─────────────────────
  { ordem: 28, nome: 'Oséias',              pasta: 'oseias',                secao: 'profetas-menores'},
  { ordem: 29, nome: 'Joel',                pasta: 'joel',                  secao: 'profetas-menores'},
  { ordem: 30, nome: 'Amós',                pasta: 'amos',                  secao: 'profetas-menores'},
  { ordem: 31, nome: 'Obadias',             pasta: 'obadias',               secao: 'profetas-menores'},
  { ordem: 32, nome: 'Jonas',               pasta: 'jonas',                 secao: 'profetas-menores'},
  { ordem: 33, nome: 'Miquéias',            pasta: 'miqueias',              secao: 'profetas-menores'},
  { ordem: 34, nome: 'Naum',                pasta: 'naum',                  secao: 'profetas-menores'},
  { ordem: 35, nome: 'Habacuque',           pasta: 'habacuque',             secao: 'profetas-menores'},
  { ordem: 36, nome: 'Sofonias',            pasta: 'sofonias',              secao: 'profetas-menores'},
  { ordem: 37, nome: 'Ageu',                pasta: 'ageu',                  secao: 'profetas-menores'},
  { ordem: 38, nome: 'Zacarias',            pasta: 'zacarias',              secao: 'profetas-menores'},
  { ordem: 39, nome: 'Malaquias',           pasta: 'malaquias',             secao: 'profetas-menores'},
  // ── Evangelhos ───────────────────────────
  { ordem: 40, nome: 'Mateus',              pasta: 'mateus',                secao: 'evangelhos'      },
  { ordem: 41, nome: 'Marcos',              pasta: 'marcos',                secao: 'evangelhos'      },
  { ordem: 42, nome: 'Lucas',               pasta: 'lucas',                 secao: 'evangelhos'      },
  { ordem: 43, nome: 'João',                pasta: 'joao',                  secao: 'evangelhos'      },
  // ── Histórico NT ─────────────────────────
  { ordem: 44, nome: 'Atos',                pasta: 'atos',                  secao: 'historico-nt'    },
  // ── Cartas de Paulo ──────────────────────
  { ordem: 45, nome: 'Romanos',             pasta: 'romanos',               secao: 'cartas-paulo'    },
  { ordem: 46, nome: '1 Coríntios',         pasta: '1corintios',            secao: 'cartas-paulo'    },
  { ordem: 47, nome: '2 Coríntios',         pasta: '2corintios',            secao: 'cartas-paulo'    },
  { ordem: 48, nome: 'Gálatas',             pasta: 'galatas',               secao: 'cartas-paulo'    },
  { ordem: 49, nome: 'Efésios',             pasta: 'efesios',               secao: 'cartas-paulo'    },
  { ordem: 50, nome: 'Filipenses',          pasta: 'filipenses',            secao: 'cartas-paulo'    },
  { ordem: 51, nome: 'Colossenses',         pasta: 'colossenses',           secao: 'cartas-paulo'    },
  { ordem: 52, nome: '1 Tessalonicenses',   pasta: '1-tessalonicenses',     secao: 'cartas-paulo'    },
  { ordem: 53, nome: '2 Tessalonicenses',   pasta: '2-tessalonicenses',     secao: 'cartas-paulo'    },
  { ordem: 54, nome: '1 Timóteo',           pasta: '1-timoteo',             secao: 'cartas-paulo'    },
  { ordem: 55, nome: '2 Timóteo',           pasta: '2-timoteo',             secao: 'cartas-paulo'    },
  { ordem: 56, nome: 'Tito',                pasta: 'tito',                  secao: 'cartas-paulo'    },
  { ordem: 57, nome: 'Filemom',             pasta: 'filemom',               secao: 'cartas-paulo'    },
  // ── Outras Cartas ────────────────────────
  { ordem: 58, nome: 'Hebreus',             pasta: 'hebreus',               secao: 'outras-cartas'   },
  { ordem: 59, nome: 'Tiago',               pasta: 'tiago',                 secao: 'outras-cartas'   },
  { ordem: 60, nome: '1 Pedro',             pasta: '1pedro',                secao: 'outras-cartas'   },
  { ordem: 61, nome: '2 Pedro',             pasta: '2pedro',                secao: 'outras-cartas'   },
  { ordem: 62, nome: '1 João',              pasta: '1joao',                 secao: 'outras-cartas'   },
  { ordem: 63, nome: '2 João',              pasta: '2joao',                 secao: 'outras-cartas'   },
  { ordem: 64, nome: '3 João',              pasta: '3joao',                 secao: 'outras-cartas'   },
  { ordem: 65, nome: 'Judas',               pasta: 'judas',                 secao: 'outras-cartas'   },
  // ── Profético NT ─────────────────────────
  { ordem: 66, nome: 'Apocalipse',          pasta: 'apocalipse',            secao: 'profetico-nt'    },
];
