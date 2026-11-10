export { normalizeSize, normalizeVariant, type GlassSize, type GlassVariant } from './attributes';
export { LgeButtonElement } from './button';
export { LgeInputElement } from './input';
export { LgeTabbarElement } from './tabbar';
export { LgeToolbarElement } from './toolbar';
export {
  acquireSharedScene,
  getSharedSceneInstance,
  getSharedSceneReferenceCount,
  releaseSharedScene,
} from './shared-scene';

import { LgeButtonElement } from './button';
import { LgeInputElement } from './input';
import { LgeTabbarElement } from './tabbar';
import { LgeToolbarElement } from './toolbar';

export function registerLiquidGlassElements(): void {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('lge-button')) customElements.define('lge-button', LgeButtonElement);
  if (!customElements.get('lge-input')) customElements.define('lge-input', LgeInputElement);
  if (!customElements.get('lge-toolbar')) customElements.define('lge-toolbar', LgeToolbarElement);
  if (!customElements.get('lge-tabbar')) customElements.define('lge-tabbar', LgeTabbarElement);
}

registerLiquidGlassElements();
