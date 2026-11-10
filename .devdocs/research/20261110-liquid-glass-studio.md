# Implementation Base Research - iyinchao/liquid-glass-studio

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Date: 2026-11-10 (Asia/Hong_Kong)
- Mandate: Liquid Glass UI implementation must be based on
  https://github.com/iyinchao/liquid-glass-studio
- Local source mirror: `.refers/lgs-src` (text files only, git-ignored)

## 1. Repository facts

| Item | Value |
|---|---|
| Repository | `iyinchao/liquid-glass-studio` |
| Default branch | `main` |
| Language | TypeScript (React) |
| License | MIT, Copyright (c) 2024 Charles Yin |
| Stars / forks | 822 / 82 |
| Created / last push | 2025-06-20 / 2026-09-11 |
| Disk usage | ~134 MB (mostly demo media assets) |
| Homepage | https://liquid-glass-studio.vercel.app/ (China mirror: https://liquid-glass.iyinchao.cn/) |
| Package | Private Vite app, `name: "liquid-glass"`, `version: 0.0.0` (not a library) |

The project is a **studio/demo web app**, not a reusable engine package. It
renders Apple-style Liquid Glass with WebGL2 and WebGPU backends and exposes
real-time parameter controls (Leva) plus image/video backgrounds.

## 2. Feature scope vs LGE needs

Implemented:

- Refraction, dispersion, Fresnel reflection, glare, tint, shadow.
- SDF shapes with **superellipse corners** and smooth merge (blob effect).
- Multi-pass Gaussian blur (vertical + horizontal) with new `blurEdge` option.
- WebGL2 and WebGPU backends behind one multi-pass renderer interface.
- Image/video/custom-file backgrounds; preset import/export (JSON v1).
- Spring-based shape/mouse interactions.

Upstream TODO (README):

- Editor mode; **glass text rendering**; **glass presets**; self-illumination;
  HDR illumination; **UI content inside of shape**.

The three bold TODOs are exactly the LGE delta: live DOM text/controls inside
or behind glass, versioned named presets, and a reusable library surface.

Historical pull requests (all closed, not merged):

- #19 "Transform liquid-glass-studio into reusable React component library"
  (2025-11-08) - attempted the extraction we need.
- #22 "Refactor: Modularize app.tsx and Decompose GL Utilities" (2026-03-13).
- #23/#24 TODO-completion and README-sync attempts.

Conclusion: upstream keeps the Studio app scope; the library extraction and
DOM-content work belong in our fork/derivative.

## 3. Architecture

### 3.1 Stack

- React 19.3 + Vite 6 + TypeScript 5.8, Sass modules.
- `leva` 0.10 for controls, MUI 7 icons, `re-resizable`, `@react-spring/web`.
- Shaders authored as GLSL and WGSL pairs, loaded with `vite-plugin-glsl`.
- `@webgpu/types` for WebGPU typing.

### 3.2 Renderer abstraction

`src/utils/RendererInterface.ts` defines `RenderPassConfig` and
`IMultiPassRenderer`; both backends implement the same interface:

- `src/utils/GLUtils.ts` (`MultiPassRenderer`, ~708 lines): WebGL2 programs,
  framebuffers (`RGBA16F` color + `DEPTH_COMPONENT24`), uniform introspection,
  texture loading and per-frame video texture updates.
- `src/utils/GPUUtils.ts` (`GPUMultiPassRenderer`, ~660 lines): WebGPU device,
  per-pass bind group layouts (bg / blur / main), uniform buffers, `rgba16float`
  offscreen targets, `copyExternalImageToTexture` for image/video uploads.
- `src/utils/gpuDetect.ts`: `navigator.gpu` probe, adapter/device request,
  cached result; Studio defaults to WebGL2 and toggles WebGPU at runtime.

### 3.3 Pass graph (identical for both backends)

```
bgPass            -> background composite (pattern or u_bgTexture)
vBlurPass         -> vertical Gaussian blur of bgPass
hBlurPass         -> horizontal Gaussian blur of vBlurPass
mainPass          -> glass SDF + optics, inputs u_bg (bgPass),
                     u_blurredBg (hBlurPass), outputToScreen
```

Blur kernel: `computeGaussianKernelByRadius(radius)` uses `sigma = radius / 3`
and a normalized 1D kernel; `blurRadius` is a continuous control (1-200), not
the organization's official 5/10/15/20/25/30 tiers.

### 3.4 Background injection point

`fragment-bg.glsl` / `fragment-bg.wgsl` branch on `u_bgType`; types `<= 11`
sample `u_bgTexture` with `getCoverUV(...)` and `u_bgTextureRatio`, gated by
`u_bgTextureReady`. That single texture slot is where LGE injects DOM content:

- lane A: HTML-in-Canvas `drawElementImageToTexture` (WebGPU) /
  `texElementSubImage2D` (WebGL) into the background texture;
- lane B: snapshot rasteriser upload through the same slot.

No DOM sampling, text rendering, or content compositing exists upstream yet.

### 3.5 Glass shader (main pass)

- SDF: `sdCircle` + `roundedRectSDF` with `superellipseCornerSDF`
  (`(|x|^n + |y|^n)^(1/n)`) and `smin` merge; `u_shapeRoundness` is the
  superellipse exponent n (range 2-7), `u_shapeRadius` the corner radius.
- Refraction: Snell's law with `u_refThickness`, `u_refFactor` (IOR),
  `x_R_ratio`, `thetaI/thetaT`, `edgeFactor = -tan(thetaT - thetaI)`; sampling
  offset scales with `u_refDistance * u_dpr`.
- Dispersion: `getTextureDispersion` samples R/G/B channels at channel-specific
  offsets (`u_refDispersion`).
- Fresnel: `pow(1 + merged*resY/1500*(500/range)^2 + hardness, 5)` mixed with an
  LCH-lifted tint by `fresnelFactor * u_refFresnelFactor * 0.7`.
- Glare: geometry + angle factor (normal angle + `u_glareAngle`), farside uses
  `u_glareOppositeFactor`, convergence exponent
  `0.1 + u_glareConvergence*2`, LCH lift +150 luminance / +30 chroma.
- `STEP` uniform selects debug views (SDF, blur, normals, etc.).

## 4. Parameter mapping (organization preset vs upstream defaults)

Upstream control -> uniform normalization is in `App.tsx`: tint RGB `/255`;
`refFresnelHardness`, `refFresnelFactor`, `glareHardness`, `glareConvergence`,
`glareOppositeFactor`, `glareFactor` are divided by 100; ranges stay raw.

| Organization parameter | Reference | Upstream default | Action |
|---|---:|---:|---|
| Renderer | WebGPU | WebGL2 default, WebGPU optional | LGE policy: WebGPU first |
| Refraction thickness | 20.00 | `refThickness` 20 | match |
| Background distance | 0.05 | `refDistance` 0.05 | match |
| Refraction index | 1.50 | `refFactor` 1.40 | preset override |
| Dispersion gain | 9.50 | `refDispersion` 7 | preset override |
| Fresnel range | 33.50 | `refFresnelRange` 30 | preset override |
| Fresnel hardness | 50.00 | `refFresnelHardness` 20 | preset override |
| Fresnel strength | 20.00 | `refFresnelFactor` 20 | match |
| Highlight range | 30.00 | `glareRange` 30 | match |
| Highlight hardness | 20.00 | `glareHardness` 20 | match |
| Highlight strength | 90.00 | `glareFactor` 90 | match |
| Highlight concentration | 50.00 | `glareConvergence` 50 | match |
| Opposite highlight | 80.00 | `glareOppositeFactor` 80 | match |
| Highlight angle | -45 deg | `glareAngle` -45 | match |
| Blur tiers | 5-30 (baseline 30) | `blurRadius` 1 (range 1-200) | preset/tier mapping |
| Blur edge | true | `blurEdge` true | match |
| Tint | `#ffffff00` | `{255,255,255,0}` | match |
| Shadow spread | 25.00 | `shadowExpand` 25 | match |
| Shadow strength | 15.00 | `shadowFactor` 15 | match |
| Superellipse large | n=7, radius 100 | `shapeRoundness` 5, `shapeRadius` 80 | preset override |
| Superellipse small | n=2, radius 100 | same controls | component preset |

## 5. Gaps to close in LiquidGlassEngine

1. **Library extraction** - core renderer/shaders are welded to the demo app
   (Leva/MUI/re-resizable). Extract a headless `@lge/core` plus thin React
   binding, preserving MIT attribution and the pass/uniform contract.
2. **DOM content pipeline** - implement ADR-0001 lanes on top of the
   `u_bgTexture` slot; keep DOM as the a11y/hit-test source.
3. **Oxygen preset** - versioned preset with the table in section 4; export as
   JSON compatible with the existing `PresetData` v1 schema.
4. **Component library** - iOS 27 Figma-derived glass controls on top of the
   core (spec in `.devdocs/specs/ios27/`).
5. **Tests and CI** - upstream has none; add Vitest unit tests, shader
   snapshot/parity checks, Playwright visual tests (WebGL2/WebGPU, flag
   on/off), and a performance budget.
6. **WebGPU-first** - upstream defaults to WebGL2; LGE must prefer WebGPU and
   treat WebGL2 as compatibility, per the design pipeline gate.

## 6. Risks

- Shader complexity and dual-backend drift (WGSL added 2026-03; GLSL remains
  the feature-first path). Changes must land in both or be gated.
- Upstream cadence is slow (last push 2026-09-11); our fork must track upstream
  via a remote and rebase intentionally.
- No tests/CI upstream; visual regressions are likely during extraction.
- MIT requires preserving the copyright/license notice in derived source.
- Apple design assets remain under Apple's license; only specs/measurements are
  stored in this repo.
- `shapeRoundness` is not a drop-in "superellipse coefficient" for all cases
  (it shapes the corner SDF); validate visually against the iOS 27 kit.

## 7. Recommended actions

1. Fork `iyinchao/liquid-glass-studio` to `StarsailsClover/liquid-glass-studio`
   (done 2026-11-10: https://github.com/StarsailsClover/liquid-glass-studio)
   and add the upstream as `upstream` remote.
2. In LGE, create `packages/lge-core` by extracting renderer + shaders from the
   mirror, keeping MIT headers and an `UPSTREAM.md` with the pinned commit.
3. Add `presets/oxygen-26.0.json` with the section-4 overrides and a typed
   schema; keep the Studio preset import/export compatible.
4. Implement lane A (HTML-in-Canvas) against `u_bgTexture` for WebGPU first,
   then lane B snapshots; wire the capability object into products.
5. Add the iOS 27 component library and the 12x24 layout gates.
