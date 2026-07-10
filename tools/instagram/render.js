// ============================================================
// Renderiza HTML -> PNG no tamanho exato usando Puppeteer.
// ============================================================
import puppeteer from 'puppeteer';

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      // Flags amigáveis a VPS de pouca RAM (KVM 1) rodando junto do WAHA:
      // --disable-dev-shm-usage evita crash por /dev/shm pequeno; --disable-gpu
      // e --no-zygote reduzem uso de memória. Render é curto (abre → foto → fecha).
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
      // Reaproveita um Chromium já instalado no sistema, se houver, para não
      // baixar outro (ex.: o do WAHA). Defina PUPPETEER_EXECUTABLE_PATH no env.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
  }
  return browserPromise;
}

export async function renderHTML(html, width, height) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
    });
    return buffer;
  } finally {
    await page.close();
  }
}

export async function fecharBrowser() {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}
