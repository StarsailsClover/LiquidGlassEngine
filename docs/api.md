# LiquidGlassEngine API (0.1.0-alpha.1)

<!-- G i tHub@S   ta  rs  ailsC lov er -->

LGE is a framework-agnostic, zero-CSS standard library: create a scene, attach
native elements, and the library owns the glass renderer, the DOM capture
pipeline, positioning, and pointer wiring. Styling the controls is optional;
the glass surface itself needs no stylesheet.

## Create a scene

```ts
import { createLiquidGlassScene } from '@lge/core';

const scene = await createLiquidGlassScene({
  container: document.body,   // optional, defaults to document.body
  content: document.querySelector('#app')!, // optional DOM to capture
  renderer: 'auto',            // 'auto' | 'webgpu' | 'webgl2'
  lane: 'auto',                // 'auto' | 'A' | 'B'
});
```

- **Lane A (preferred)** uses HTML-in-Canvas live DOM snapshots. It requires
  the Chromium `canvas-draw-element` feature and a `content="drawable"`
  subtree. When `content` is provided, the scene mounts it for you.
- **Lane B (fallback)** serializes the capture element into an SVG snapshot and
  refreshes it periodically. It works in every supported browser, with lower
  fidelity for animations and cross-origin content.
- **Renderer** is WebGPU-first. WebGL2 is the automatic compatibility path.

## Attach native controls

```ts
const buttonGlass = scene.attach(document.querySelector('button')!, {
  padding: 8,                 // optical padding in CSS pixels
  preset: undefined,          // override the full GlassPreset
  presetPatch: { blurRadius: 18 },
  contentAbove: true,         // crisp labels/icons (default)
});

// later
buttonGlass.update({ presetPatch: { tint: [1, 1, 1, 0.08] } });
buttonGlass.destroy();
scene.destroy();
```

`attach` measures the element every frame, so layout, resize, scroll and dynamic
content are reflected without observers or CSS. Small controls (min dimension
<= 96 px) automatically use the small-control superellipse preset.

With `contentAbove` (default), the real control is excluded from the backdrop
texture and a sharp mirror snapshot is composited above the glass; the control
remains interactive. This keeps labels, icons, inputs and IME text crisp while
the surrounding backdrop refracts. Set `contentAbove: false` to make the whole
element part of the refracted content instead.

## Presets

```ts
import { OXYGEN_PRESET, SMALL_CONTROL_PRESET } from '@lge/core';
```

- `OXYGEN_PRESET` is the organization reference preset (large surfaces, superellipse
  coefficient 7, radius 100%).
- `SMALL_CONTROL_PRESET` uses coefficient 2 for buttons, inputs and compact controls.
- Every field is a versioned engine parameter, not a CSS value.

## Capabilities

```ts
const { capabilities, lane, rendererKind } = scene;
capabilities.webgpu.supported;          // adapter probe
capabilities.htmlInCanvas.supported;    // lane A availability
capabilities.htmlInCanvas.drawElementImage;
capabilities.htmlInCanvas.drawElementImageToTexture;
```

Products can branch on these capabilities for contrast, motion, or a solid
reduced-capability appearance; the library never silently presents a CSS
`backdrop-filter` as Liquid Glass.

## Low-level API

- `GlassRenderer` (WebGPU) and `WebGL2GlassRenderer` expose the shared four-pass
  contract: `bgPass -> vBlurPass -> hBlurPass -> mainPass`.
- `createLaneAController` / `createLaneBController` can be used independently.
- `computeGaussianKernel`, `packMainUniforms` and `expandWgslIncludes` are
  exported for advanced integrations and tests.

## Styling policy

The scene injects only structural styles for its own canvases and mounting
(position, size, z-index, pointer events). It does not require user CSS.
Product-level CSS remains optional for typography, spacing, focus rings and
brand tokens.
