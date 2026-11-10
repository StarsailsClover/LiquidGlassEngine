# Verification: Live DOM Text Through Glass (Lane A)

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Date: 2026-11-10 (Asia/Hong_Kong)
- Result: **PASS** (lane A, WebGPU, live DOM capture, refracted output)
- Evidence screenshot: `apps/demo/evidence/lge-dom-glass.png`
- Demo: `apps/demo` (Vite dev server at http://127.0.0.1:5175/)

## Environment

- OS: Windows (local host)
- Browser runtime: Microsoft Edge 157.0.4341.42 (Chromium 157). Google Chrome is
  not installed on this machine, so Edge is the Chromium validation runtime.
  The flags are the Chromium `canvas-draw-element` features and apply to both.
- Launch flags used by `apps/demo/e2e/verify.mjs`:

```
--enable-features=CanvasDrawElement,HTMLInCanvas
--enable-blink-features=CanvasDrawElement
--enable-unsafe-webgpu
```

## API surface observed in Edge 157

| Capability | Present |
|---|---|
| `HTMLCanvasElement.content` attribute | true |
| `CanvasRenderingContext2D.drawElementImage` | true |
| `HTMLCanvasElement.captureElementImage` | true |
| `WebGL2RenderingContext.texElementSubImage2D` | true |
| `GPUQueue.drawElementImageToTexture` | true |
| WebGPU adapter + device | true |
| WebGL2 | true |

## Runtime result (headless Edge, verify script)

```json
{
  "lane": "A",
  "webgpu": true,
  "rendererError": null,
  "frames": 378,
  "captures": 2,
  "captureDebug": { "paintEvents": 2, "lastError": null }
}
```

The demo:

1. lays out real DOM text, chips and an input inside the `content="drawable"`
   canvas;
2. captures the drawable subtree on the canvas `paint` event;
3. uploads sharp + blurred copies to GPU textures;
4. renders the glass panel with the upstream `fragment-main.wgsl` from
   `iyinchao/liquid-glass-studio` (MIT) over the live DOM texture;
5. keeps the canvas transparent outside the glass shape so the DOM underneath
   remains visible.

## Key implementation finding

In the current Chromium implementation (Edge 157), `drawElementImage` must be
called on the 2D context of the canvas that **owns** the `content="drawable"`
subtree. Calling it from a separate capture canvas throws:

```
DrawElementImage requires the canvas to have the content=drawable attribute.
```

Also, calling it before the first snapshot exists throws
`No cached paint record for element.` The working pattern is:

```
DOM subtree -> owner canvas 2d context (drawElementImage on paint)
            -> copy owner canvas bitmap to capture canvas
            -> GPU texture (copyExternalImageToTexture)
```

## Reproduction

```bash
pnpm install
pnpm --filter @lge/demo dev        # http://127.0.0.1:5175/
pnpm verify:dom-glass              # launches Chromium with the flags
pnpm -r typecheck
pnpm test                          # 8 unit tests
pnpm -r build
```

## Known limits (next milestones)

- Blur currently uses a CPU 2D `filter: blur()` pass for the prototype; the
  upstream `vBlurPass`/`hBlurPass` WGSL passes must be ported next.
- The renderer is WebGPU-only in this prototype; the WebGL2 compatibility path
  is still pending.
- Lane B (snapshot) is implemented and unit-tested but was not the selected
  lane in this run; force it by launching without the feature flags.

## Formal four-pass verification (later on 2026-11-10)

The prototype single-pass renderer was replaced by the upstream four-pass
contract in `@lge/core`:

```
bgPass -> vBlurPass -> hBlurPass -> mainPass
```

Results:

- WebGPU four-pass, lane A: PASS; `rendererKind: webgpu`, no page errors,
  visual diff `0` against `baseline-webgpu-auto.png`.
- WebGL2 four-pass, lane A: PASS; `rendererKind: webgl2`, no page errors,
  visual diff `0` against `baseline-webgl2-auto.png`.
- WebGPU, forced lane B snapshot: PASS; captures updated repeatedly,
  no errors, visual diff `0` against `baseline-webgpu-B.png`.

Key findings from the formal run:

1. GLSL requires `#version 300 es` on the literal first line; MIT attribution
   comments must follow it, not precede it.
2. Lane B must serialize with `XMLSerializer`, not `outerHTML`: HTML void
   elements such as `<input>` are invalid XML inside `<foreignObject>` and make
   the snapshot fail with "The source image cannot be decoded".
3. A canvas passed to `copyExternalImageToTexture` must already have a render
   context; the scene now acquires the 2D context before the first upload and
   waits for the first successful lane B snapshot.

Screenshots:

- `apps/demo/evidence/lge-webgpu-auto.png`
- `apps/demo/evidence/lge-webgl2-auto.png`
- `apps/demo/evidence/lge-webgpu-B.png`

All three are committed with their baselines; the verifier exits non-zero on
runtime failure or a pixel diff above 5%.

## Crisp control content (contentAbove)

`scene.attach(..., { contentAbove: true })` (default) suppresses the real
control only for backdrop capture (opacity 0.001, still hit-testable), removes
its opaque chrome, and composites a sharp lane-B mirror snapshot above the
glass. This keeps labels, icons and input values crisp while the page backdrop
refracts through the material. Baselines for WebGPU, WebGL2 and forced lane B
were refreshed and re-verified with diff 0.
