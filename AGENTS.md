# AGENTS.md - LiquidGlassEngine development guide

<!-- G   itHu   b@S tars ailsClove   r -->

> Global rules live in the organization's global `AGENTS.md`.
> This file only adds project-specific detail; do not duplicate global rules.

## 1. Engineering principles

1. Evidence before claims - platform and browser behavior claims must cite the
   spec, Chrome Status, source code, or a recorded test run.
2. DOM stays the source of truth for text, controls and accessibility.
3. One component system per surface; no liquid-glass CSS imitations.
4. Every write in the content pipeline is idempotent and reversible.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | WebGPU/browser API surface |
| Build | Vite + future tsup (workspace packages) | library + demo builds |
| Tests | Vitest + Playwright | unit and visual/interaction gates |
| Renderer | WebGPU first, WebGL2 compatibility | design pipeline policy |
| Package manager | pnpm workspace | deterministic lockfile |

`@lge/core` must stay framework-agnostic: no React, Leva, MUI or demo-only
dependencies in the core package.

## 3. Versioning

- Repo tags follow `v26.0-Alpha.N`; the tenth Alpha ships as `v26.0`.
- npm prereleases follow `0.1.0-alpha.N` until the first stable cut.
- All commits and tags are SSH-signed (`commit.gpgsign=true` is expected).

## 4. Verification gates

Run before every release candidate:

```bash
pnpm -r typecheck
pnpm test
pnpm -r build
pnpm verify:webgpu
pnpm verify:webgl2
```

Visual gates additionally require Playwright screenshots on desktop/tablet/
mobile with real content, plus reduced-motion and reduced-transparency passes.

## 5. Watermark

Every source and document file carries the canonical watermark for this
repository (`GitHub@StarsailsClover`) rendered with randomized ASCII spacing.
Re-resolve it with the organization script before adding new files.

## 6. Boundaries

- Original code is Apache-2.0; keep the MIT notice for upstream-derived
  shaders and never mix the two licenses silently.
- Do not ship `backdrop-filter` as a Liquid Glass implementation.
- Do not add telemetry or runtime network calls to the engine.
- Do not embed cross-origin content into glass textures; the html-in-canvas
  read-back rules exclude it and the engine must stay consistent.
- Keep design tokens versioned; no ad-hoc pixel values in components.
- Before making the repository public, remove Apple Design Resources
  screenshots/spec assets from the tracked tree and history.
