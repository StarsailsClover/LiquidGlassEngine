# LiquidGlassEngine (LGE)

<!-- G i tHub@S   ta  rs  ailsC lov er -->

**LGE is a framework-agnostic Liquid Glass standard library for native DOM
controls, in the spirit of Three.js for rendering.** Attach an existing button,
input, toolbar or any other native element and it receives a high-fidelity
Liquid Glass surface — the library owns the WebGPU/WebGL2 renderer, DOM capture,
geometry, pointer tracking and z-order. **No CSS is required**; product CSS
remains optional.

## Why LGE

WebGPU and the DOM do not share a pixel path: a GPU glass shader cannot read
browser-rendered text, controls or scroll content. LGE closes that gap with
live HTML-in-Canvas capture (lane A) and a snapshot fallback (lane B), then
feeds the captured DOM into the Liquid Glass optics.

- **Zero-CSS adoption:** `createLiquidGlassScene` + `scene.attach(element)`.
- **Native content:** real DOM stays the source of truth for text, focus,
  IME and accessibility.
- **Standard-library surface:** framework-agnostic core; React/Vue/Svelte
  bindings can be thin adapters.
- **WebGPU first, WebGL2 compatible:** both renderers implement the same
  four-pass contract and the same visual gate.
- **Open source:** original code is Apache-2.0; the mandated upstream shader
  core remains MIT with explicit notices.

## Quick start

```bash
pnpm install
pnpm --filter @lge/demo dev     # http://127.0.0.1:5175/
```

```ts
import { createLiquidGlassScene } from '@lge/core';

const scene = await createLiquidGlassScene({
  content: document.querySelector('#app')!,
  renderer: 'auto', // WebGPU preferred, WebGL2 fallback
  lane: 'auto',     // HTML-in-Canvas preferred, snapshot fallback
});

scene.attach(document.querySelector('button')!, { padding: 8 });
```

No stylesheet import and no per-project glass CSS. The library injects only
structural styles for its own canvases. See [docs/api.md](docs/api.md).

### Zero-CSS components

```html
<script type="module">
  import '@lge/components';
</script>

<lge-toolbar>
  <button>Back</button>
  <button>Share</button>
</lge-toolbar>
<lge-button variant="prominent">Done</lge-button>
<lge-input placeholder="Search"></lge-input>
```

See [docs/components.md](docs/components.md) for the element attributes and
events.

## Architecture

The rendering core is the mandated
[`iyinchao/liquid-glass-studio`](https://github.com/iyinchao/liquid-glass-studio)
(MIT, Copyright 2024 Charles Yin), extracted into `@lge/core` without
Leva/MUI/demo dependencies. The four-pass graph is preserved:

```text
bgPass -> vBlurPass -> hBlurPass -> mainPass
```

- `bgPass` composites the DOM texture into an offscreen target.
- `vBlurPass` / `hBlurPass` run the separable Gaussian blur.
- `mainPass` applies SDF superellipse geometry, Snell refraction, RGB
  dispersion, Fresnel, glare, tint and shadow.
- The main pass is masked to premultiplied alpha so the live DOM remains
  visible outside the glass shape.

Two content lanes feed the same source texture:

| Lane | Source | Requirement |
|---|---|---|
| A | Live HTML-in-Canvas DOM snapshot | Chromium `canvas-draw-element` feature |
| B | SVG `foreignObject` snapshot | All supported browsers |

## Status

`v26.0-Alpha1` formal development. Current gates are green:

- `pnpm -r typecheck`
- `pnpm test` (Vitest unit tests)
- `pnpm -r build`
- `pnpm verify:webgpu` (lane A + WebGPU + visual diff)
- `pnpm verify:webgl2` (lane A + WebGL2 + visual diff)

Runtime evidence: `.devdocs/verification/20261110-dom-through-glass.md`.
The visual baselines live in `apps/demo/evidence/`.

## Repository layout

```text
LiquidGlassEngine/
├── packages/lge-core/   # renderer, shaders, lanes, presets, scene API
├── apps/demo/           # zero-CSS demo + Playwright visual gates
├── docs/                # public API and long-form docs
├── .devdocs/            # research, ADRs, specs, verification evidence
├── .github/             # CI workflows (to be added)
└── _scripts/            # development scripts
```

## Visual gates

```bash
pnpm verify:webgpu      # WebGPU + lane A; pixel diff against baseline
pnpm verify:webgl2      # WebGL2 + lane A; pixel diff against baseline
pnpm verify:lane-b      # forced snapshot fallback
pnpm verify:components  # zero-CSS Web Components smoke/visual check
pnpm visual:update      # refresh both baselines after a reviewed visual change
```

The verifier launches a Chromium browser with
`--enable-features=CanvasDrawElement,HTMLInCanvas` and compares the rendered
frame with the committed baseline using `pixelmatch`.

## License and asset policy

- Original LGE code: **Apache-2.0** (see [LICENSE](LICENSE)).
- Derived `liquid-glass-studio` shader files: **MIT**, Copyright (c) 2024
  Charles Yin; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Apple Design Resources (Figma kit, screenshots) are **not** Apache-2.0.
  They must be removed from the tracked tree and history before the repository
  is made public; see ADR-0003.

## References

- WICG HTML-in-Canvas: https://github.com/WICG/html-in-canvas
- WICG explainer: https://wicg.github.io/html-in-canvas/
- Chromium flag: `chrome://flags/#canvas-draw-element`
- Upstream implementation: https://github.com/iyinchao/liquid-glass-studio
- Research and ADRs: `.devdocs/research/`, `.devdocs/design/`
