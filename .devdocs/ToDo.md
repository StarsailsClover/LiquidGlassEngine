# LiquidGlassEngine - Request ToDo

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Request timestamp: 2026-11-10 13:35 +08:00 (Asia/Hong_Kong)
- Request: Develop LiquidGlassEngine (LGE) to solve the native-web limitation
  that DOM text/controls cannot be used as glass backdrop; research first, and
  prepare the Figma iOS 27 resource pull for the component library.

## Phase 0 - Research and bootstrap (in progress)

- [x] Repository skeleton, private GitHub repo, canonical watermark resolved
- [x] Platform research: html-in-canvas status and primitives (Chrome Status,
      WICG explainer, read-back security model)
- [x] Competitor scan: liquid-dom, liquidGL v3, liquid-glass-react, Kyant
      Android original and its WebGL ports
- [x] Mandated implementation base research: iyinchao/liquid-glass-studio
      (MIT, WebGL2/WebGPU, parameter mapping, gaps) -> research doc + ADR-0002
- [x] Figma iOS 27: duplicate Apple community file into the OxygenAI account
      and record the design `fileKey` (`A584PysarXACnq9FqGhCAS`)
- [x] Figma extraction pass: Materials/Buttons/Tab Bars/Toolbars/Sliders/
      Toggles/Text Fields/Menus/Popovers/Sheets/Segmented/Context Menus/
      Action Sheets/Alerts/Sidebars/Progress/Steppers/Page Controls/Lists/
      Notifications/Pop-up Buttons/Keyboards/Status Bars extracted
- [x] Architecture decision record: content pipeline lanes and fallback chain
- [x] Browser support matrix: WebGPU support snapshot recorded; html-in-canvas
      and WebGL2 fallback verification remains part of the alpha gate

## Phase 1 - Engine foundation

- [x] Fork iyinchao/liquid-glass-studio to StarsailsClover (upstream remote
      still to be added in the working checkout)
- [x] Extract `packages/lge-core` (initial; renderer + upstream WGSL, MIT
      headers preserved)
- [x] Oxygen preset (`OXYGEN_PRESET` typed module; JSON export pending)
- [x] WebGPU-first capability gate (initial); WebGL2 compatibility path pending
- [x] DOM content lane A: html-in-canvas live textures (flag/dev-trial)
- [x] DOM content lane B: snapshot rasteriser fallback
- [ ] Hit testing + accessibility geometry mirror

## Phase 2 - Components and integration

- [x] Initial zero-CSS Web Components: `lge-button`, `lge-input`,
      `lge-toolbar`, `lge-tabbar` (shared scene + contentAbove mirrors)
- [ ] iOS 27 component library expansion (sliders, toggles, menus, popovers,
      sheets) driven by the Figma spec
- [ ] React 19 bindings; Astryx integration notes for product surfaces
- [ ] 12x24 grid, light/dark, increased-contrast, reduced-motion gates

## Phase 3 - Release

- [x] First runtime verification: live DOM text through glass (lane A + WebGPU)
      on Chromium 157 with `canvas-draw-element`; evidence in
      `.devdocs/verification/20261110-dom-through-glass.md`
- [x] Unit tests (Vitest, 8) + Playwright-core verification script
- [ ] Port upstream vBlur/hBlur WGSL passes (CPU blur in the prototype)
- [ ] WebGL2 compatibility renderer path
- [ ] Performance budget (frame time, texture memory) and regression tests
- [ ] `v26.0-Alpha1` prerelease with screenshots in the release note

## Formal development status (2026-11-10)

- [x] Apache-2.0 `LICENSE` added; upstream MIT notices retained
- [x] `@lge/core` extracted with WebGPU four-pass renderer
      (bg -> vBlur -> hBlur -> main) and WebGL2 compatibility renderer
- [x] Zero-CSS Scene API (`createLiquidGlassScene` + `attach`) implemented
- [x] Vitest unit tests + Playwright visual gates
      (`verify:webgpu` / `verify:webgl2`, pixel baselines, diffRatio 0)
- [x] Lane A live DOM + lane B snapshot both wired into `u_bgTexture`
- [ ] Public GitHub release gate: purge Apple screenshots/spec assets from
      tracked tree and history, then flip visibility
- [x] Control-content-above-glass mode (crisp labels/icons over the material)
- [ ] Publishable dist build / npm package metadata
