import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(here, '..', 'evidence');
const cliArgs = process.argv.slice(2);
const readArg = (name, fallback) => {
  const hit = cliArgs.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const hasFlag = (name) => cliArgs.includes(`--${name}`);

const rendererPreference = readArg('renderer', 'auto');
const lanePreference = readArg('lane', 'auto');
const updateBaseline = hasFlag('update-baseline');
const demoUrl = process.env.LGE_DEMO_URL ?? 'http://127.0.0.1:5175/';
const url = `${demoUrl}?renderer=${encodeURIComponent(rendererPreference)}&lane=${encodeURIComponent(lanePreference)}`;

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

const args = [
  '--enable-features=CanvasDrawElement,HTMLInCanvas',
  '--enable-blink-features=CanvasDrawElement',
  '--enable-unsafe-webgpu',
];

async function run(headless) {
  const instance = await chromium.launch({
    executablePath: browser[1],
    headless,
    args,
  });
  const page = await instance.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const logs = [];
  page.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));
  await page.goto(url, { waitUntil: 'load' });
  try {
    await page.waitForFunction(
      () => window.__LGE_DIAGNOSTICS__ && window.__LGE_DIAGNOSTICS__.frames > 20,
      undefined,
      { timeout: 30000 },
    );
  } catch (error) {
    console.error(JSON.stringify({ url, logs }, null, 2));
    throw error;
  }
  const before = await page.evaluate(() => window.__LGE_DIAGNOSTICS__);
  await page.evaluate(() => {
    const input = document.querySelector('#live-input');
    if (input) {
      input.value = '实时 DOM 文字穿过玻璃 · Live refraction';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => window.__LGE_DIAGNOSTICS__);
  mkdirSync(evidenceDir, { recursive: true });
  const screenshot = join(
    evidenceDir,
    `lge-${rendererPreference}-${lanePreference}.png`,
  );
  await page.screenshot({ path: screenshot });
  await instance.close();
  return { browser: browser[0], headless, url, before, after, logs, screenshot };
}

const runtimeOk = (result) =>
  result.after.frames > 30 &&
  result.after.captures > 0 &&
  result.after.captureDebug.lastError === null &&
  (rendererPreference === 'auto' || result.after.rendererKind === rendererPreference);

let result = null;
for (const headless of [true, false]) {
  try {
    const attempt = await run(headless);
    if (runtimeOk(attempt)) {
      result = attempt;
      break;
    }
    result = result ?? attempt;
  } catch (error) {
    if (!headless) throw error;
  }
}
if (!result) {
  console.error('Verification failed to produce diagnostics.');
  process.exit(1);
}

const baseline = join(evidenceDir, `baseline-${rendererPreference}-${lanePreference}.png`);
let visual = { status: 'skipped', baseline, diffRatio: 0 };
let visualOk = true;

if (updateBaseline || !existsSync(baseline)) {
  copyFileSync(result.screenshot, baseline);
  visual =
    updateBaseline
      ? { status: 'updated', baseline, diffRatio: 0 }
      : { status: 'baseline-created', baseline, diffRatio: 0 };
} else {
  const current = PNG.sync.read(readFileSync(result.screenshot));
  const base = PNG.sync.read(readFileSync(baseline));
  if (current.width !== base.width || current.height !== base.height) {
    visual = { status: 'size-mismatch', baseline, diffRatio: 1 };
    visualOk = false;
  } else {
    const diff = new PNG({ width: current.width, height: current.height });
    const changed = pixelmatch(
      current.data,
      base.data,
      diff.data,
      current.width,
      current.height,
      { threshold: 0.2 },
    );
    const ratio = changed / (current.width * current.height);
    visual = { status: 'compared', baseline, diffRatio: Number(ratio.toFixed(4)) };
    if (ratio > 0.05) {
      const diffPath = join(evidenceDir, `diff-${rendererPreference}-${lanePreference}.png`);
      writeFileSync(diffPath, PNG.sync.write(diff));
      visualOk = false;
    }
  }
}

console.log(JSON.stringify({ ...result, visual }, null, 2));
process.exit(runtimeOk(result) && visualOk ? 0 : 1);
