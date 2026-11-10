// GitHub@Starsa   il s Clove   r
import { createLiquidGlassScene, type LiquidGlassScene } from '@lge/core';

let scenePromise: Promise<LiquidGlassScene> | null = null;
let sceneInstance: LiquidGlassScene | null = null;
let references = 0;

export async function acquireSharedScene(): Promise<LiquidGlassScene> {
  references += 1;
  if (!scenePromise) {
    scenePromise = createLiquidGlassScene({
      container: document.body,
      capture: document.body,
      lane: 'B',
      renderer: 'auto',
    }).then((scene) => {
      sceneInstance = scene;
      return scene;
    });
  }
  return scenePromise;
}

export function releaseSharedScene(): void {
  references = Math.max(0, references - 1);
  if (references > 0 || !scenePromise) return;
  const pending = scenePromise;
  scenePromise = null;
  sceneInstance = null;
  void pending.then((scene) => scene.destroy()).catch(() => undefined);
}

export function getSharedSceneReferenceCount(): number {
  return references;
}

export function getSharedSceneInstance(): LiquidGlassScene | null {
  return sceneInstance;
}
