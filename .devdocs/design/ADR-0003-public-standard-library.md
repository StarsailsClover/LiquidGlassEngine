# ADR-0003: Public Apache-2.0 Standard Library and Zero-CSS API

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Status: Accepted (2026-11-10)
- Owners: LiquidGlassEngine

## Context

LGE is not an Oxygen-only product dependency. It is a general standard library
for any repository and external user: native controls should receive a
high-quality Liquid Glass appearance without per-project CSS, in the spirit of
Three.js as a reusable rendering library. The rendering core is derived from
the mandated MIT project `iyinchao/liquid-glass-studio`.

## Decision

1. **License:** original LGE code is Apache-2.0 (`LICENSE`). The derived shader
   files retain the MIT copyright and notice for Charles Yin; both notices ship
   with the package (`THIRD_PARTY_NOTICES.md`).
2. **Public API:** the framework-agnostic surface is
   `createLiquidGlassScene` + `scene.attach`. The library owns overlay canvases,
   capture, geometry measurement, pointer tracking, and renderer selection.
3. **Zero CSS:** consumers do not need to write CSS. Library-injected inline
   styles cover only structural concerns; product CSS remains optional.
4. **Renderer contract:** keep the upstream four-pass graph
   `bgPass -> vBlurPass -> hBlurPass -> mainPass`, WebGPU-first with a WebGL2
   compatibility renderer implementing the same public renderer interface.
5. **Core independence:** `@lge/core` must not depend on Leva, MUI, React, or
   demo-only packages. The Studio-style demo is an app, not a core dependency.
6. **Release gate:** before the GitHub repository is flipped public, Apple
   Design Resources screenshots/spec assets must be removed from the tracked
   tree and history. The Apache-2.0 license applies to LGE code, not Apple
   assets or the MIT-derived shader sources.

## Consequences

- The library needs a stable versioned API, semver discipline, docs and
  examples for external users.
- Both renderers must pass the same visual gates; divergence is a bug.
- MIT attribution must survive packaging and minification.
- The public release requires a history cleanup and a final license/asset audit.

## Follow-ups

- Add a publishable `dist` build (tsup/Rollup) and package exports.
- [x] Control-content-above-glass mode: native control stays interactive while
  a sharp mirror snapshot is composited above the material.
- Add the visual regression baselines to CI and publish the demo.
