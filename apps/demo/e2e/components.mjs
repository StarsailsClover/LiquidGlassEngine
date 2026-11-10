import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(here, '..', 'evidence');
const browserPath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((path) => existsSync(path));
if (!browserPath) throw new Error('No Chromium browser found');

const instance = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: [
    '--enable-features=CanvasDrawElement,HTMLInCanvas',
    '--enable-blink-features=CanvasDrawElement',
    '--enable-unsafe-webgpu',
  ],
});
const page = await instance.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors = [];
const logs = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`));
await page.goto('http://127.0.0.1:5175/components.html', { waitUntil: 'load' });
await page.waitForFunction(() => window.__LGE_COMPONENTS_READY__ === true, undefined, {
  timeout: 30000,
});
const result = await page.evaluate(() => ({
  buttonDefined: Boolean(customElements.get('lge-button')),
  inputDefined: Boolean(customElements.get('lge-input')),
  toolbarDefined: Boolean(customElements.get('lge-toolbar')),
  tabbarDefined: Boolean(customElements.get('lge-tabbar')),
  internalCanvases: document.querySelectorAll('[data-lge-internal]').length,
  glassCanvases: Array.from(document.querySelectorAll('canvas')).length,
}));
mkdirSync(evidenceDir, { recursive: true });
const screenshot = join(evidenceDir, 'lge-components.png');
await page.screenshot({ path: screenshot });
await instance.close();
console.log(JSON.stringify({ ...result, errors, logs, screenshot }, null, 2));
process.exit(
  result.buttonDefined &&
    result.inputDefined &&
    result.toolbarDefined &&
    result.tabbarDefined &&
    result.internalCanvases > 0 &&
    errors.length === 0
    ? 0
    : 1,
);
