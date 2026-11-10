# ADR-0001: DOM Content Pipeline and Capability Lanes

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Status: Proposed (bootstrap decision for v26.0-Alpha1)
- Date: 2026-11-10
- Owners: LiquidGlassEngine

## Context

WebGPU cannot sample browser-rendered DOM. A glass shader can refract a scene
the engine renders, but not live text, controls, or images. The platform has
three relevant realities:

1. WICG HTML-in-Canvas provides the only live DOM-to-texture path; Chrome is
   developing it (target milestone 157, Dev Trial flag
   `chrome://flags/#canvas-draw-element`), WebKit is implementing early,
   Firefox has no position.
2. Snapshot rasterisers can approximate the effect today, but lose CSS
   animation fidelity and need explicit dynamic-fast-paths for video.
3. CSS `backdrop-filter` can blur/tint, but not produce true lensing; it is a
   degraded appearance, not Liquid Glass.

## Decision

1. LGE is WebGPU-first; WebGL2 is a compatibility renderer and CSS is an
   explicit reduced-capability mode.
2. Content is abstracted behind `ContentSource` with three lanes:
   - A: `HtmlInCanvasSource` - live DOM snapshots and GPU copies;
   - B: `SnapshotSource` - periodic rasterisation for broad compatibility;
   - C: `NativeSceneSource` - engine-owned SDF labels/shapes.
3. The public capability object reports which lanes are active. Products must
   branch on capabilities for visual, layout, and contrast behavior.
4. The DOM stays the source of truth for text, controls, focus, and
   accessibility. Where available, `updateElementGeometry()` mirrors geometry
   for hit testing and screen readers; otherwise DOM overlays remain above the
   canvas.
5. Cross-origin media is not read back. Such regions must be proxied to a
   same-origin asset or rendered as an opaque/non-refractive surface.
6. Apple Figma assets are a specification source only; no source asset
   redistribution. Implementation parameters are versioned engine tokens.

## Consequences

- Full-fidelity DOM refraction is gated on HTML-in-Canvas (currently a Chrome
  Dev Trial); lane B must ship for other browsers from day one.
- The engine needs a deterministic capability matrix, visual regression
  fixtures for both lanes, and clear product-facing degraded states.
- The snapshot lane needs a texture budget, atlas/tiling strategy, and
  dynamic-content classification (static, video, animated).
- The DOM interaction layer cannot be replaced by canvas-only hit testing for
  arbitrary content in the alpha; accessibility remains a DOM-first design.

## Rejected alternatives

- CSS-only implementation: insufficient lensing/displacement, cross-browser
  inconsistency; explicitly forbidden by the design pipeline.
- Canvas-only UI: would require re-implementing text, forms, selection, IME,
  and accessibility; too risky for product surfaces.
- Wholesale copy of liquid-dom: MIT-compatible reference, but LGE needs its own
  capability/fallback contract; only independently scoped code with attribution
  may be reused.
- Server-side/DOM screenshot service: latency, privacy, and live-interaction
  costs outweigh fidelity benefits.

## Follow-ups

- Implement lane A behind a feature probe; build a capability report.
- Build lane B with a DOM snapshot rasteriser and video fast path.
- Add a shader preset module for the organization's optical parameter table.
- Add Playwright visual fixtures for Chrome (flag on/off), Edge, Safari, and
  Firefox; record pass/fail in `_devdocs`.
