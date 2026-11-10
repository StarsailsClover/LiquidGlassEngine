// G it  H ub@St   ar  sails Cl  ov  er
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(here, '..', 'evidence');
const cliArgs = process.argv.slice(2);
const updateBaseline = cliArgs.includes('--update-baseline');
const componentsUrl = process.env.LGE_COMPONENTS_URL ?? 'http://127.0.0.1:5175/components.html';

const browsers = [
  ['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'],
  ['chrome-x86', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'],
  ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
  ['edge-x64', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'],
];
const browser = browsers.find(([, path]) => existsSync(path));
if (!browser) {
  console.error('No Chromium browser found (Chrome/Edge).');
  process.exit(2);
}

const instance = await chromium.launch({
  executablePath: browser[1],
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
await page.goto(componentsUrl, { waitUntil: 'load' });
await page.waitForFunction(() => window.__LGE_COMPONENTS_READY__ === true, undefined, {
  timeout: 30000,
});

const defined = (tag) => page.evaluate((name) => Boolean(customElements.get(name)), tag);
const definitions = {
  button: await defined('lge-button'),
  input: await defined('lge-input'),
  slider: await defined('lge-slider'),
  tabbar: await defined('lge-tabbar'),
  toggle: await defined('lge-toggle'),
  toolbar: await defined('lge-toolbar'),
};

const counts = await page.evaluate(() => ({
  internalCanvases: document.querySelectorAll('[data-lge-internal]').length,
  glassCanvases: Array.from(document.querySelectorAll('canvas')).length,
  surfaces: Array.from(
    document.querySelectorAll('lge-button, lge-input, lge-slider, lge-toggle, lge-toolbar, lge-tabbar'),
  ).length,
}));

// Interaction gate: the native control must stay interactive on top of glass.
const toggleBefore = await page.evaluate(() => document.querySelector('lge-toggle')?.checked ?? null);
await page.locator('lge-toggle input').click();
const toggleAfter = await page.evaluate(() => ({
  property: document.querySelector('lge-toggle')?.checked ?? null,
  attribute: document.querySelector('lge-toggle')?.hasAttribute('checked') ?? null,
}));
const switchRole = await page.evaluate(
  () => document.querySelector('lge-toggle input')?.getAttribute('role') ?? null,
);

const sliderBefore = await page.evaluate(() => document.querySelector('lge-slider')?.value ?? null);
await page.locator('lge-slider input').focus();
await page.keyboard.press('ArrowRight');
const sliderAfter = await page.evaluate(() => ({
  property: document.querySelector('lge-slider')?.value ?? null,
  attribute: document.querySelector('lge-slider')?.getAttribute('value') ?? null,
}));

const typed = await page.evaluate(() => {
  const input = document.querySelector('lge-input input');
  if (!input) return null;
  input.focus();
  input.value = 'Live DOM over glass';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return document.querySelector('lge-input')?.value ?? null;
});

// Restore a deterministic state before the visual baseline is captured.
await page.evaluate(() => {
  const toggle = document.querySelector('lge-toggle');
  if (toggle) toggle.checked = true;
  const slider = document.querySelector('lge-slider');
  if (slider) slider.value = '60';
  const input = document.querySelector('lge-input input');
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.blur();
  }
  document.activeElement?.blur?.();
});
await page.waitForTimeout(600);

const interactions = {
  toggle: { before: toggleBefore, after: toggleAfter, switchRole },
  slider: { before: sliderBefore, after: sliderAfter },
  input: { value: typed },
};
const interactionOk =
  toggleBefore === true &&
  toggleAfter.property === false &&
  toggleAfter.attribute === false &&
  switchRole === 'switch' &&
  sliderBefore === '60' &&
  Number(sliderAfter.property) > 60 &&
  sliderAfter.attribute === sliderAfter.property &&
  typed === 'Live DOM over glass';

mkdirSync(evidenceDir, { recursive: true });
const screenshot = join(evidenceDir, 'lge-components.png');
await page.screenshot({ path: screenshot });
await instance.close();

const baseline = join(evidenceDir, 'baseline-components.png');
let visual = { status: 'skipped', baseline, diffRatio: 0 };
let visualOk = true;
if (updateBaseline || !existsSync(baseline)) {
  copyFileSync(screenshot, baseline);
  visual = updateBaseline
    ? { status: 'updated', baseline, diffRatio: 0 }
    : { status: 'baseline-created', baseline, diffRatio: 0 };
} else {
  const current = PNG.sync.read(readFileSync(screenshot));
  const base = PNG.sync.read(readFileSync(baseline));
  if (current.width !== base.width || current.height !== base.height) {
    visual = { status: 'size-mismatch', baseline, diffRatio: 1 };
    visualOk = false;
  } else {
    const diff = new PNG({ width: current.width, height: current.height });
    const changed = pixelmatch(current.data, base.data, diff.data, current.width, current.height, {
      threshold: 0.2,
    });
    const ratio = changed / (current.width * current.height);
    visual = { status: 'compared', baseline, diffRatio: Number(ratio.toFixed(4)) };
    if (ratio > 0.02) {
      writeFileSync(join(evidenceDir, 'diff-components.png'), PNG.sync.write(diff));
      visualOk = false;
    }
  }
}

const definitionsOk = Object.values(definitions).every(Boolean);
const result = {
  browser: browser[0],
  url: componentsUrl,
  definitions,
  counts,
  interactions,
  visual,
  errors,
  logs,
  screenshot,
};
console.log(JSON.stringify(result, null, 2));
process.exit(
  definitionsOk && counts.internalCanvases > 0 && interactionOk && visualOk && errors.length === 0
    ? 0
    : 1,
);
