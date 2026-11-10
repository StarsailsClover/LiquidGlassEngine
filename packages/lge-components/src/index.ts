// GitHub@Starsa   il s Clove   r
export { normalizeSize, normalizeVariant, type GlassSize, type GlassVariant } from './attributes';
export { LgeButtonElement } from './button';
export { LgeInputElement } from './input';
export { LgeSliderElement } from './slider';
export { LgeTabbarElement } from './tabbar';
export { LgeToggleElement } from './toggle';
export { LgeToolbarElement } from './toolbar';
export {
  acquireSharedScene,
  getSharedSceneInstance,
  getSharedSceneReferenceCount,
  releaseSharedScene,
} from './shared-scene';

import { LgeButtonElement } from './button';
import { LgeInputElement } from './input';
import { LgeSliderElement } from './slider';
import { LgeTabbarElement } from './tabbar';
import { LgeToggleElement } from './toggle';
import { LgeToolbarElement } from './toolbar';

export function registerLiquidGlassElements(): void {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('lge-button')) customElements.define('lge-button', LgeButtonElement);
  if (!customElements.get('lge-input')) customElements.define('lge-input', LgeInputElement);
  if (!customElements.get('lge-slider')) customElements.define('lge-slider', LgeSliderElement);
  if (!customElements.get('lge-toggle')) customElements.define('lge-toggle', LgeToggleElement);
  if (!customElements.get('lge-toolbar')) customElements.define('lge-toolbar', LgeToolbarElement);
  if (!customElements.get('lge-tabbar')) customElements.define('lge-tabbar', LgeTabbarElement);
}

registerLiquidGlassElements();
