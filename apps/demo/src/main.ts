import { createLiquidGlassScene } from '@lge/core';
import { buildContent } from './content';

const params = new URLSearchParams(window.location.search);
const rendererPreference = (params.get('renderer') ?? 'auto') as 'auto' | 'webgpu' | 'webgl2';
const lanePreference = (params.get('lane') ?? 'auto') as 'auto' | 'A' | 'B';
const hud = document.getElementById('hud') as HTMLDivElement;

const content = buildContent();
const scene = await createLiquidGlassScene({
  container: document.body,
  content,
  renderer: rendererPreference,
  lane: lanePreference,
});

const chipRow = content.querySelector('.chip-row');
const input = content.querySelector('#live-input');
if (chipRow) scene.attach(chipRow, { padding: 16 });
if (input) scene.attach(input, { padding: 10 });

const diagnostics = {
  capabilities: scene.capabilities,
  lane: scene.lane,
  rendererKind: scene.rendererKind,
  renderer: scene.rendererKind,
  webgpu: scene.rendererKind === 'webgpu',
  frames: 0,
  captures: 0,
  captureDebug: { paintEvents: 0, lastError: null as string | null },
};
(window as unknown as { __LGE_DIAGNOSTICS__: typeof diagnostics }).__LGE_DIAGNOSTICS__ =
  diagnostics;

let hudTick = 0;
const frame = () => {
  requestAnimationFrame(frame);
  diagnostics.frames = scene.frameCount;
  diagnostics.captures = scene.captureCount;
  diagnostics.captureDebug = scene.captureDebug;
  hudTick += 1;
  if (hudTick % 30 === 0) {
    hud.textContent = [
      `LGE · Lane ${scene.lane}${
        scene.lane === 'A' ? ' (HTML-in-Canvas live DOM)' : ' (snapshot fallback)'
      } · ${scene.rendererKind ?? 'no renderer'}`,
      scene.captureDebug.lastError
        ? `capture: ${scene.captureDebug.lastError}`
        : '把鼠标移到控件上；在输入框打字，观察玻璃里的折射实时更新。',
    ].join('\n');
  }
};
frame();
