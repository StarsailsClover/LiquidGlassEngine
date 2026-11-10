# ADR-0002: Adopt liquid-glass-studio as the Rendering Core

<!-- G i tHub@S   ta  rs  ailsC lov er -->

- Status: Accepted for v26.0-Alpha1 (mandated 2026-11-10)
- Owners: LiquidGlassEngine
- Related: ADR-0001 (DOM content pipeline and capability lanes)

## Context

The organization mandated that the Liquid Glass implementation must be
`iyinchao/liquid-glass-studio` (MIT, Charles Yin). That project already
implements refraction, dispersion, Fresnel, glare, tint, shadow, superellipse
SDF shapes, smooth-merge blob geometry, and a shared WebGL2/WebGPU multi-pass
renderer. Its parameter names map almost one-to-one to the organization's
reference preset, and two of its open TODOs (glass text rendering, UI content
inside a shape) are precisely the DOM compositing problem LGE must solve.

## Decision

1. `iyinchao/liquid-glass-studio` is the rendering core of LGE. We fork it to
   `StarsailsClover/liquid-glass-studio` and track upstream as a remote; the
   fork is the source for renderer and shader evolution.
2. `StarsailsClover/LiquidGlassEngine` remains the distribution/extension
   repo: extracted core package, Oxygen preset, DOM content pipeline
   (ADR-0001), iOS 27 component library, tests, and integration docs.
3. Keep the upstream four-pass contract (`bgPass -> vBlurPass -> hBlurPass ->
   mainPass`) and the WebGL2/WebGPU shared interface. LGE prefers WebGPU and
   treats WebGL2 as the compatibility path.
4. Keep the MIT copyright notice and license text in all derived source; pin
   the upstream commit in `UPSTREAM.md`.
5. Do not copy demo-only dependencies (Leva, MUI, re-resizable) into the core
   package; the Studio app stays as the reference playground under `apps/`.

## Preset rule

The organization preset overrides the upstream defaults where they differ:

- `refFactor` 1.40 -> 1.50
- `refDispersion` 7 -> 9.50
- `refFresnelRange` 30 -> 33.50
- `refFresnelHardness` 20 -> 50.00
- `blurRadius` 1 -> tier baseline 30 (official tiers 5/10/15/20/25/30)
- `shapeRadius` 80 -> 100; `shapeRoundness` 7 for large surfaces and 2 for
  small controls (per the superellipse mapping)

All other reference values already match upstream defaults.

## Consequences

- We inherit a high-fidelity shader instead of re-implementing Apple optics;
  effort shifts to library extraction, DOM content, presets, and components.
- Upstream has no tests or CI; LGE must add its own verification gates.
- Upstream keeps evolving (WebGPU added 2026-03, refDistance 2026-09); the fork
  must rebase deliberately and verify both backends after each sync.
- Upstream PR #19 (React component library) and #22 (modularization) were
  closed; our extraction must not assume upstream will accept library changes.

## Follow-ups

- [x] Fork created at `StarsailsClover/liquid-glass-studio`; upstream pinned at
      `f7b28c36305a862f5cffed3ddd51511cf1204f56` (2026-09-11).
- [ ] Add the `upstream` remote when the working checkout is created.
- [ ] Extract `packages/lge-core` with MIT headers and the pass contract.
- [ ] Add the Oxygen preset schema and JSON.
- [ ] Implement lane A/B DOM content sources on `u_bgTexture`.
- [ ] Add tests (unit + WebGPU/WebGL parity + Playwright visual gates).
