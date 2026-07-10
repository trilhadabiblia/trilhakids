#!/usr/bin/env bash
# ============================================================
# Wrapper para o cron chamar o pipeline com o ambiente certo.
# Ele carrega o .vps-env gerado pelo setup-vps.sh.
#   Ex.: ./publicar.sh proximo --formato carrossel
# ============================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Carrega o ambiente (PUPPETEER_EXECUTABLE_PATH, TRILHO_ENV_PHP, IG_HANDLE...)
[ -f .vps-env ] && source .vps-env

exec node cli.js "$@"
