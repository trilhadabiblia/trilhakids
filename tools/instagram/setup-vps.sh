#!/usr/bin/env bash
# ============================================================
# Prepara a VPS (Debian/Ubuntu) para rodar o pipeline Trilho Kids → Instagram.
# Rode DENTRO de tools/instagram/ na VPS:
#     bash setup-vps.sh
# Idempotente: pode rodar de novo sem problema.
# ============================================================
set -euo pipefail

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

echo "== Trilho Kids · preparação da VPS =="

# 1) Node 20+
if ! command -v node >/dev/null 2>&1; then
  echo "-> Node não encontrado. Instalando Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi
echo "   Node $(node -v)"

# 2) Chromium + dependências de headless
echo "-> Instalando Chromium e dependências..."
$SUDO apt-get update -y
$SUDO apt-get install -y fonts-liberation libnss3 libatk-bridge2.0-0 \
  libgtk-3-0 libasound2 libgbm1 ca-certificates || true
apt-cache show chromium         >/dev/null 2>&1 && $SUDO apt-get install -y chromium || true
apt-cache show chromium-browser >/dev/null 2>&1 && $SUDO apt-get install -y chromium-browser || true

# 3) Descobre o binário do Chromium
CHROME=""
for c in /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium; do
  [ -x "$c" ] && { CHROME="$c"; break; }
done
if [ -n "$CHROME" ]; then
  echo "   Chromium: $CHROME"
  export PUPPETEER_SKIP_DOWNLOAD=true   # usa o do sistema, não baixa outro
else
  echo "   Chromium do sistema não encontrado — o Puppeteer vai baixar o próprio."
fi

# 4) Dependências Node
echo "-> npm install..."
npm install

# 5) Arquivo de ambiente (usado pelo publicar.sh e pelos testes)
if [ ! -f .vps-env ]; then
  cat > .vps-env <<EOF
# Ambiente do pipeline na VPS — PREENCHA as credenciais abaixo.
export PUPPETEER_EXECUTABLE_PATH="${CHROME}"
export IG_HANDLE="@portaltrilhokids"

# Não há env.php na VPS → defina as credenciais direto aqui:
export IG_USER_ID="17841471595196388"
export IG_ACCESS_TOKEN="COLE_O_TOKEN_LONGO_AQUI"   # renove com: node cli.js refresh-token
export ANTHROPIC_API_KEY="COLE_A_CHAVE_ANTHROPIC"
export IG_UPLOAD_TOKEN="COLE_O_IG_ENDPOINT_TOKEN"  # o mesmo do env.php do host
EOF
  echo "   Criei .vps-env — PREENCHA as credenciais."
else
  echo "   .vps-env já existe (mantido)."
fi

echo ""
echo "== Próximos passos =="
echo "  1) nano .vps-env           # ajuste TRILHO_ENV_PHP"
echo "  2) source .vps-env && node cli.js config"
echo "  3) source .vps-env && node cli.js carrossel --livro jonas --dry-run"
echo "  4) source .vps-env && node cli.js carrossel --livro jonas   # publica"
