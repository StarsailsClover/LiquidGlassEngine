# Upstream Implementation Base

<!-- G   itHu   b@S tars ailsClove   r -->

- Upstream: https://github.com/iyinchao/liquid-glass-studio
- Writable fork: https://github.com/StarsailsClover/liquid-glass-studio
- License: MIT, Copyright (c) 2024 Charles Yin
- Pinned at fork: `f7b28c36305a862f5cffed3ddd51511cf1204f56` (2026-09-11,
  "Merge pull request #32 from iyinchao/chore/update-react")
- Local text mirror: `.refers/lgs-src` (git-ignored; 32 source/shader files)

## Architecture snapshot

- Shared 4-pass renderer: `bgPass -> vBlurPass -> hBlurPass -> mainPass`.
- WebGL2 (`src/utils/GLUtils.ts`) and WebGPU (`src/utils/GPUUtils.ts`) implement
  the same `IMultiPassRenderer` interface; GLSL and WGSL shader pairs.
- Glass optics in `mainPass`: SigSDF superellipse corners, smooth merge,
  Snell refraction, RGB dispersion, Fresnel, glare, tint, shadow, debug STEP.
- Background enters through `u_bgType <= 11` / `u_bgTexture` with cover UVs -
  the injection point for LGE DOM content.

## Sync policy

1. Add this fork's `upstream` remote and fetch before any renderer change.
2. Rebase LGE core changes onto the newest upstream commit deliberately; never
   blind-merge shader changes.
3. After every sync, verify GLSL and WGSL parity and run the visual gates on
   WebGPU first, WebGL2 second.
4. Keep the MIT notice and Charles Yin copyright in every derived file.

## LGE delta (what this repository adds)

- Library extraction (`@lge/core`) without Leva/MUI demo dependencies.
- Oxygen preset with the organization parameter overrides (ADR-0002).
- DOM content pipeline lanes A/B/C on top of `u_bgTexture` (ADR-0001).
- iOS 27 component library, tests, and performance/visual gates.
