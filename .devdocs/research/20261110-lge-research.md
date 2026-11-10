# LiquidGlassEngine - Research Notes

<!-- G i tHub@S   ta  rs  ailsC lov er -->

- Date: 2026-11-10 (Asia/Hong_Kong)
- Status: draft, evidence collected from primary specs and source code
- Owner: StarsailsClover

## 1. Problem statement

WebGPU and the DOM do not share a pixel path. A glass shader can sample a
scene that the engine rendered, but it cannot read browser-rendered text,
controls, images, or scroll content. On the web this is a platform limitation,
not an implementation bug. A Liquid Glass engine that only renders a
transparent canvas behind the page can refract a background image or a
WebGPU scene, but it cannot refract live DOM content that sits under (or
inside) a glass panel.

The user goal is therefore two-part:

1. Build a WebGPU Liquid Glass renderer that can be adopted globally by
   Oxygen/Prima web products.
2. Solve the content pipeline so live DOM text and controls can be sampled as
   glass backdrop without giving up native layout, interaction, or a11y.

## 2. Platform facts

### 2.1 WebGPU canvas and DOM are separate compositor inputs

- A `HTMLCanvasElement` configured for WebGPU is a GPU surface. The page and
  the canvas are composited by the browser, but the DOM's pixels are not a
  readable texture inside the GPU pipeline.
- CSS `backdrop-filter` can blur/tint what is behind an element at the
  compositor level, but it is not a general displacement/refraction pipeline
  and behaves differently across engines. It is a reduced-capability fallback,
  never the "Liquid Glass" implementation.
- Reading browser-rendered text from a canvas is intentionally restricted;
  the platform does not expose a DOM-to-GPU texture API in stable WebGPU today.

### 2.2 WICG HTML-in-Canvas (the real DOM-to-GPU path)

Primary sources:

- Explainer: https://github.com/WICG/html-in-canvas
- Living document: https://wicg.github.io/html-in-canvas/
- Spec PR: https://github.com/whatwg/html/pull/11588

The proposal adds:

- `<canvas content="drawable">`: descendants participate in layout and can be
  snapshotted without leaving the accessibility tree.
- `drawable` on descendants: marks the subtree whose rendered commands are
  captured; it also establishes isolation and a containing block.
- `paint` event and `requestPaint()`: synchronize DOM snapshots with the
  canvas rendering update.
- `captureElementImage()` / `ElementImage`: transferable snapshot objects that
  can be used on workers and `OffscreenCanvas`.
- `drawElementImage()` for 2D and `texElementSubImage2D()` / 
  `drawElementImageToTexture()` for WebGL/WebGPU.
- `updateElementGeometry()`: maps a drawable element's DOM border box into
  canvas space, preserves hit-test order and exposes a11y geometry; it is
  required for 3D contexts.

Security/read-back model (important for LGE):

- Snapshots must be "read-back-allowed rendering". Cross-origin embedded
  content (`iframe`, `img`, CSS `url()`, tainted canvas, SVG references) is
  excluded from pixels and invalidation.
- System colors/themes/preferences, spelling/grammar markers, and visited-link
  information are also excluded.
- Same-origin iframes can paint, but cross-origin content inside them does not.
- Consequence: glass cannot refract cross-origin media through this path;
  product surfaces must either proxy/same-origin the media or treat those
  regions as non-refractive.

Chrome Status (queried 2026-11-10):

- Status: "In development"; announced; desktop/Android/WebView target
  milestone 157; `CanvasHtml` WebFeature counter exists.
- Dev Trial is available; the Chrome flag referenced by prior art is
  `chrome://flags/#canvas-draw-element`.
- Chrome tracking bug: https://crbug.com/500967896
- Firefox standards position: no signal
  (https://github.com/mozilla/standards-positions/issues/1076).
- WebKit position: positive; early implementation work in
  https://github.com/WebKit/WebKit/pull/70542
  (https://github.com/WebKit/standards-positions/issues/630).

### 2.3 Fallback capture options

| Option | Fidelity | Cost | Notes |
|---|---|---|---|
| HTML-in-Canvas (lane A) | Live DOM -> GPU texture | Low per frame once attached | Chrome flag/Dev Trial today; full a11y/hit testing when geometry APIs are used |
| DOM snapshot rasteriser (lane B) | Periodic still image; animations lag | Serialize + paint + upload | Works broadly; needs style inlining; CSS animations and cross-origin media are lossy |
| Engine-native SDF/UI (lane C) | Exact, but re-implements content | Text/control rendering work | Good for engine-owned labels, icons, and controls; not arbitrary HTML |
| CSS backdrop-filter | Blur/tint only, no true lensing | Low | Explicit degraded mode only; forbidden as the Liquid Glass deliverable |

### 2.4 WebGPU support snapshot (caniuse, 2026-11-10)

- Global usage: 86.83% full support + 3.32% partial support.
- Chrome 159/160 full; Edge 155/156 full; Firefox 161/162 partial;
  Safari 27.3 partial; iOS Safari 27.1/27.2 full.
- Treat the percentages as directional. Product QA must still run the real
  device/browser matrix; `html-in-canvas` availability is separate and is not
  represented by the WebGPU metric.

## 3. Prior art

### 3.1 liquid-dom (AndrewPrifer, MIT)

- Repository: https://github.com/AndrewPrifer/liquid-dom
- Monorepo packages: `@liquid-dom/core` (WebGPU renderer/scene graph),
  `@liquid-dom/react`, `@liquid-dom/three`, `@liquid-dom/r3f`,
  `@liquid-dom/layout`.
- Core version observed: `0.1.1`; MIT license (Copyright 2026 Andras Prifer).
- README states DOM-backed `Html` requires the experimental HTML-in-Canvas API
  behind Chrome's `chrome://flags/#canvas-draw-element`.
- `dom-content-source.ts` sets `targetCanvas.setAttribute('layoutsubtree',
  'true')`, listens for `paint`, and feeds a `DomContentSync`.
- `dom-content-sync.ts` copies drawable DOM hosts into GPU textures, packs
  per-glass content into atlases, applies adaptive blur chains, and keeps
  host DOM order aligned with visual order for hit testing.
- Scene semantics: `Html` nodes below a container become backdrop content;
  `Html` inside a `Glass` is sampled through that glass.
- Takeaway: closest architectural reference for the DOM content lane. The
  mandated rendering core is `iyinchao/liquid-glass-studio`; see
  `20261110-liquid-glass-studio.md` and ADR-0002.

### 3.2 liquidGL (naughtyduk, npm `liquid-gl` v3)

- Repository: https://github.com/naughtyduk/liquidGL
- One-file runtime with WebGPU -> WebGL2 -> WebGL1 -> CSS fallback chain.
- Uses a custom DOM snapshot rasteriser (`NaughtyDOM.rasteriseAsync`):
  clone the element, inline computed SVG-relevant styles, serialize to SVG,
  draw into a canvas, then upload to the GPU texture.
- Snapshot pipeline has a resolution cap, worker + `OffscreenCanvas` /
  `ImageBitmap` path, retries, ResizeObserver, and a periodic recapture
  interval. Live videos are tracked and composited dynamically.
- Documented limitation: video and text animation can refract, but CSS
  animations are not captured (periodic snapshots). The README advertises
  WebGPU rendering and multiple/stacked lenses, tint, fluid interaction,
  chromatic aberration, zIndex, and automatic fallback.
- Takeaway: best reference for the broad-compatibility lane and for the
  wording of degraded capability. Its snapshot fidelity ceiling is exactly
  what LGE's lane A is meant to remove.

### 3.3 backdrop-filter + SVG displacement (rdev/liquid-glass-react, shuding/liquid-glass)

- https://github.com/rdev/liquid-glass-react (6.6k stars, 2025-06)
- https://github.com/shuding/liquid-glass (copy-paste SVG shader)
- rdev README explicitly notes Safari and Firefox only partially support the
  effect and displacement is not visible there.
- Takeaway: useful for a CSS-only degraded mode, but not acceptable as the
  organization's global Liquid Glass implementation and not a substitute for
  WebGPU lensing.

### 3.4 Kyant / Compose Multiplatform references

- https://github.com/Kyant0/AndroidLiquidGlass (Compose original)
- https://github.com/martin65536/liquid-glass-webgl (WebGL1 port; 106 stars,
  updated 2026-11-08)
- Useful for superellipse/smooth-corner math, SDF-based backdrop sampling,
  highlight layers, and the optical parameter model. These are rendering
  references only; platform UI behavior still follows the Apple Figma kit.

## 4. Proposed LGE architecture (v0)

### 4.1 Layers

1. **Renderer core** (`@lge/core`, extracted from the mandated
   `liquid-glass-studio` fork; see ADR-0002): WebGPU device lifecycle, SDF glass
   geometry, backdrop sampling, refraction/dispersion/Fresnel/highlight
   shaders, adaptive blur, shadow, reduced-GPU path.
2. **Content sources**: a `ContentSource` abstraction with:
   - `HtmlInCanvasSource` (lane A, capability-gated),
   - `SnapshotSource` (lane B, degraded),
   - `NativeSceneSource` (lane C, engine-owned SDF labels/shapes).
3. **Scene graph / bindings** (`@lge/react` etc.): `Glass`, `Container`,
   `Html`, stacking and transform semantics modelled after the platform
   capabilities, not after CSS stacking hacks.
4. **Component library**: iOS 27-derived glass buttons, toolbars, tab bars,
   sliders, toggles, menus, popovers, sheets; tokens and states come from the
   official Figma kit and the 12x24 product grid.

### 4.2 Capability matrix and fallback chain

- `webgpu + html-in-canvas`: full live DOM refraction and geometry mirroring.
- `webgpu + snapshot`: live glass optics on a periodic snapshot; DOM remains
  the interactive layer; explicit "snapshot" capability flag.
- `webgpu + native scene`: engine-owned UI only; exact but not arbitrary HTML.
- `webgl2 + snapshot`: compatibility; same visual contract, lower budget.
- `css reduced`: blur/tint + solid fallback; never labelled Liquid Glass;
  respects reduced-transparency.

The capability object is part of the public API and must be asserted by
product integrations (e.g. `capabilities.htmlInCanvas === true`), so products
can choose layout/contrast behavior instead of silently degrading.

### 4.3 Interaction and accessibility

- Prefer `updateElementGeometry()` so the DOM stays the hit-test/a11y source
  of truth while pixels come from the GPU.
- When only the snapshot lane exists, DOM controls remain above the canvas;
  glass panels underneath cannot claim arbitrary DOM as refracted content.
- Keyboard order follows DOM order; focus rings are never rendered only in
  the GPU layer; reduced-motion and reduced-transparency are engine states.
- Cross-origin media is excluded from read-back; components should render a
  local proxy or an opaque surface over those regions.

### 4.4 Performance guardrails

- Texture budget per viewport; atlas for small DOM hosts; cap snapshot
  resolution; tile large pages; avoid full-page recapture on every scroll.
- Separate static content (cacheable) from animated/video content (dynamic
  fast path). Limit simultaneous glass materials and share sampling.
- Device-pixel-ratio aware sizing; degrade blur/refraction before dropping
  frames; log capability/performance evidence in `_devdocs`.

## 5. Versioned design contract

The organization baseline from the design pipeline is the initial preset
(values are engine parameters, not CSS pixels):

| Parameter | Reference | Notes |
|---|---:|---|
| Renderer | WebGPU | WebGL only as compatibility |
| Refraction thickness | 20.00 | main refractive thickness |
| Background distance | 0.05 | background sampling distance |
| Refraction index | 1.50 | refraction baseline |
| Dispersion gain | 9.50 | chromatic edge baseline |
| Fresnel range | 33.50 | reflection transition range |
| Fresnel hardness | 50.00 | transition hardness |
| Fresnel strength | 20.00 | reflection strength |
| Highlight range | 30.00 | highlight coverage |
| Highlight hardness | 20.00 | highlight edge falloff |
| Highlight strength | 90.00 | highlight energy |
| Highlight concentration | 50.00 | highlight focus |
| Opposite highlight strength | 80.00 | secondary highlight |
| Highlight angle | -45 deg | primary light direction |
| Blur tiers | 5/10/15/20/25/30 | demos commonly 15; captured baseline 30 |
| Blur edge | true | retain softened edge |
| Tint | `#ffffff00` | transparent white tint |
| Shadow spread / strength | 25.00 / 15.00 | glass shadow |

Superellipse mapping:

- Large surfaces (popovers, dropdown panels, menus, large floating panels):
  coefficient `7`, radius `100`.
- Small controls (icon/text buttons, compact controls, inputs): coefficient
  `2`, radius `100`.
- Shape is chosen before optical tuning; blur alone is not an acceptable
  imitation.

## 6. Figma iOS 27 resource plan

Official Apple Design Resources page (verified 2026-11-10):

- iOS and iPadOS 27 UI Kit:
  https://www.figma.com/community/file/1651309003795292092/ios-and-ipados-27
- App Icon Template (iOS/iPadOS/watchOS 27):
  https://www.figma.com/community/file/1645923469870515372/app-icon-template-ios-ipados-and-watchos-27
- macOS 27:
  https://www.figma.com/community/file/1651309434229735362/macos-27
- Apple Design Resources index: https://developer.apple.com/design/resources/

State on 2026-11-10:

- The kit is described by Apple as fully overhauled for iOS/iPadOS 27,
  including Liquid Glass, layout, sidebar colors, and scroll edge effects
  (community page, updated 2026-10-28).
- The Figma account is `OxygenAI` / `account001@oxygenai.top`; the UI Kit is
  already present in the account's assets panel. A full copy was created for
  extraction: design file key `A584PysarXACnq9FqGhCAS`.
- Initial extraction (Materials/Buttons/Tab Bars) is recorded in
  `.devdocs/specs/ios27/README.md`, including node IDs, variant matrices,
  observed dimensions, and the small-glass CSS evidence.
- License: Apple Design Resources License
  (https://developer.apple.com/apple-design-resources-license/). Do not
  redistribute Apple source assets; store measurements, token tables, and
  analysis in the private repo, and link back to the official file.

Extraction checklist (next):

- Pages and top-level frames: navigation/toolbars/tab bars/sheets/popovers.
- Glass material variants and all documented states.
- Component properties/variants and variable modes (light/dark, appearance).
- Corner/radius/superellipse behavior, typography, spacing, hit sizes,
  scroll-edge behavior, and motion/transition examples.
- Store specs under `.devdocs/specs/ios27/`; screenshots/measurements must be
  traceable to node IDs. Do not commit the full Apple asset tree.

## 7. Risks and open questions

- HTML-in-Canvas is not yet enabled by default (Chrome target M157); shipping
  LGE before then requires lane B and explicit capability messaging.
- Safari/WebKit is implementing early; Firefox has no position. Cross-engine
  visual parity must be measured, not assumed.
- Read-back exclusions mean cross-origin images/video cannot be refracted;
  product surfaces need policy and asset hosting rules.
- Snapshot lane fidelity: CSS animations, video, caret/selection, and form
  controls need per-case treatment; some content should stay above glass.
- Figma UI kit comments report heavy prototype cost for glass effects and
  dark-mode variable gaps; LGE should verify its own performance/dark-mode
  gates rather than inheriting Figma behavior.
- Package naming, public/private license, and whether any MIT liquid-dom code
  is reused (with attribution) are still decisions for the ADR.

## 8. Source log

- WICG html-in-canvas README (fetched 2026-11-10, GitHub API)
- Chrome Status query "html-in-canvas" (2026-11-10)
- https://crbug.com/500967896
- https://github.com/whatwg/html/pull/11588
- https://github.com/WebKit/standards-positions/issues/630
- https://github.com/mozilla/standards-positions/issues/1076
- https://github.com/AndrewPrifer/liquid-dom (README + core source)
- https://github.com/naughtyduk/liquidGL (README + `package/liquidGL.js`)
- https://github.com/rdev/liquid-glass-react
- https://github.com/shuding/liquid-glass
- https://github.com/Kyant0/AndroidLiquidGlass
- https://github.com/martin65536/liquid-glass-webgl
- Apple Design Resources page and Figma community listing (2026-11-10)
