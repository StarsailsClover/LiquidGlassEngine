# Apple iOS/iPadOS 27 UI Kit - Extraction Record

<!-- G   itHu   b@S tars ailsClove   r -->

- Source community file: `1651309003795292092` (iOS and iPadOS 27, by Apple)
- Working copy file key: `A584PysarXACnq9FqGhCAS`
- Figma MCP session: `84246cfa-d8a9-4161-b25a-0c6be85a2b98`
- Extracted: 2026-11-10 (Asia/Hong_Kong)
- License: Apple Design Resources License. Store measurements and analysis only;
  do not redistribute Apple source assets.

## Figma library keys

The account exposes these Apple community libraries (from `get_libraries`):

| Library | Key |
|---|---|
| iOS and iPadOS 27 | `lk-3167e7e1386e96621fc3b20782e2ec1b199754eeceff2ef04bf90d28a124be6414b67982dc8fb71ea1896b0310c316f54d7b9f0ac598cb3111748728c039a567` |
| iOS and iPadOS 26 | `lk-a5b98decf0fb24381005421a2986b813149fcf20f37a1169316d44e2802c483494c6fc98ab8e083540a73bd5e45cf892a38123ee61981aee097d5f4eb8487a17` |
| macOS 27 | `lk-9b6046629e11db2bbe15e5a3fa0443ecd557a34812bc69997a2b8598852d86fb806d4036ca6c146521c7e1cf898a1e3d46dda55a15bf1f86579794b29480aa80` |

Use these keys with `search_design_system` when wiring product files to the
official library. The current working copy has no subscribed libraries; the
kit is the file itself.

## Materials

### Glass style matrix

`_Materials/Mode Options` (`510:78330`, 620x540) contains 20 symbols:
Mode (`Light`, `Dark`, `IC - Light`, `IC - Dark`) x Style (`Ultrathin`, `Thin`,
`Regular`, `Thick`, `Chrome`), each 100x100.

| Mode | Ultrathin | Thin | Regular | Thick | Chrome |
|---|---|---|---|---|---|
| IC - Dark | 3095:22069 | 3095:22066 | 3095:22067 | 3095:22068 | 3095:22065 |
| IC - Light | 3095:22074 | 3095:22071 | 3095:22072 | 3095:22073 | 3095:22070 |
| Dark | 510:78347 | 510:78345 | 510:78343 | 510:78341 | 510:78339 |
| Light | 510:78329 | 510:78331 | 510:78333 | 510:78335 | 510:78337 |

The `_Materials` row (`510:79105`) exposes the five styles as 100x100 symbols
(`510:79104` Ultrathin ... `510:79106` Chrome).

### Material detail frames (620x440)

Each frame places a 500x320 material instance at (60, 60), with label/fill
swatches and a ~0.5px separator:

- Thick - Light `224:56304`; Thick - Dark `224:56300`
- Regular (Default) - Light `224:56303`; Regular (Default) - Dark `224:56305`
- Thin - Light `224:56302`; Thin - Dark `224:56306`
- Ultrathin - Light `224:56301`; Ultrathin - Dark `224:56307`

### Liquid Glass specimens

| Specimen | Node | Size | Variants |
|---|---|---|---|
| Regular - Small | `5584:32505` | 290x150 frame | 8 states at 48x48 |
| Regular - Medium | `5584:32503` | 400x200 frame | Light `5584:31857`, Dark `5584:31858` (160x160) |
| Regular - Large | `5584:32504` | 400x200 frame | Light `5584:31859`, Dark `5584:31860` (160x160) |
| Clear | `5914:23547` | 160x160 | single component |

Small variant node IDs:

- Light Active, not Prominent: `5564:42811`
- Light Active, Prominent: `5564:42807`
- Dark Active, not Prominent: `5426:6767`
- Dark Active, Prominent: `5431:1764`
- Light Inactive: `10472:45029`; Dark Inactive: `10472:45026`
- Light/Dark Inactive Prominent: `10472:45041` / `10472:45038`

Composite showcases: Dark `5583:28439`, Light `5583:28429` (1000x860), each
showing small/medium/large UI over a striped backdrop.

Scroll Edge Effect: Soft `5661:26943` (240x460; Top `5661:26964`,
Bottom `5661:26968`); Hard `5661:26978` (480x460; Light/Dark x Top/Bottom).

Superellipse mapping for the mandated rendering core
(`liquid-glass-studio`): `shapeRoundness` = `7` for large surfaces and `2`
for small controls; `shapeRadius` = `100`. Upstream defaults (`5` / `80`) must
be overridden by the Oxygen preset.

### Small glass evidence from `get_design_context`

- Shape: 48x48, corner radius 100px (pill mapping for small controls).
- Inactive light: fill `rgba(116,116,128,0.08)`, ring shadow
  `0 0 0 0.5px #ebebeb`.
- Inactive dark: fill `rgba(118,118,128,0.24)`, ring `#e6e6e6`.
- Active light (not prominent): layered white 25% + black 25% +
  `rgba(68,68,68,0.6)` plus-lighter + `rgba(248,248,248,0.2)` luminosity;
  shadows `+/-1.25px 0 0 -0.75px #d0d0d0`, `0 0 0 0.5px #e8e8e8`,
  `0 8px 15px rgba(0,0,0,0.02)`.
- Active dark (not prominent): `rgba(153,153,153,0.17)` mix-blend luminosity;
  shadows `+/-1.25px 0 0 -0.75px #a6a6a6`, `0 0 0 0.5px #a6a6a6`,
  `0 8px 15px rgba(0,0,0,0.04)`.
- Prominent: white backing at 94% opacity + `accents/blue` tint `#08f`.
- The exported "Glass Effect" layer has no static CSS equivalent; the lens,
  refraction and highlight must come from the WebGPU shader.

## Buttons

Main matrix: `Button - Content Area` (`40:58696`, 950x1070).

Variant axes: Size (`Large`, `Medium`, `Small`) x Style (`Borderless`,
`Bordered`, `Bordered - Prominent`, `Glass`, `Glass Prominent`) x Label Style
(`Icon only`, `Title only`, `Title and Icon`) x `Is Enabled` x `Destructive`.

Observed visual sizes:

| Label style | Large | Medium | Small |
|---|---|---|---|
| Icon only | 50x50 | 34x34 | 28x28 |
| Title only | 73x50 | 57x34 | 49x28 |
| Title + icon | 92x50 | 75x34 | 66x28 |
| Glass text | 85x50 | 69x34 | 60x28 |
| Glass symbol | 50x50 | - | - |

Glass component frames:

- Glass Text `5473:21667` (580x320), Style `Glass` / `Glass Prominent`,
  enabled/destructive variants; large enabled node `5473:21932`.
- Glass Symbol `5522:11866` (180x320); nodes `5522:11867`, `5522:11870`,
  `10456:8891`, `10456:8894`, `10456:9821`, `10456:9824`, `10456:9827`,
  `10456:9830`.
- Background examples over light `5473:26011` and dark `5473:26157`.

### Large Glass Text evidence (`5473:21932`)

- Layout: `px-20px`, `py-16px`, `gap-4px`, radius `1000px`.
- Fill/shadow: `+/-1.25px 0 0 -0.75px #d0d0d0`,
  `0 0 0 0.5px #e8e8e8`, `0 8px 15px rgba(0,0,0,0.02)`.
- Layering: white 25%, black 25%, `rgba(68,68,68,0.6)` plus-lighter,
  `rgba(248,248,248,0.2)` luminosity; the `Glass Effect` layer is shader work.
- Label: SF Pro Medium, weight 510, 17px/18px, `ss16` feature, width 100,
  color `var(--labels---vibrant/primary, #1a1a1a)`.
- Apple HIG reference:
  https://developer.apple.com/design/human-interface-guidelines/buttons

Implementation note: 28x28 / 34x34 visual buttons still require an expanded
hit region (Apple minimum 44x44 pt); the DOM hit target must not shrink with
the glass visual.

## Tab Bars

iPhone tab bar `3:70967` (890x1438):

- Tabs 2-5 x Minimized (`False` 402x95, `True` 402x88) x Type
  (`Default`, `Search Role`, `Prominent Tab`).
- Examples: `3:72207` (2 tabs, default, not minimized), `5538:24452`
  (2 tabs, search role, not minimized), `10459:4738` (2 tabs, prominent,
  not minimized).
- iPhone tab button `5735:65307` (72x54; selected `72x54`, unselected
  `72x53.5`); round button `5735:65306` (54x54).
- iPhone Duo buttons `48x48`; `Tab Bar - iPhone Duo` `12887:20935`.
- iPad tab bar `2524:7957` 491x44; text button 75x36, selected 77x36;
  symbol button 54x36.

## Screenshots (private)

Apple's design-resource screenshots are retained only in the private local
design-assets archive (`.refers/ios27-apple-screenshots`, git-ignored) and in
the private design-assets repository. They are intentionally excluded from the
Apache-2.0 public distribution; the measurements and node IDs above remain as
factual implementation references.

## Next extraction queue

Toolbars (`507:25993`), Sliders (`507:24685`), Toggles (`507:24690`),
Text Fields (`553:22762`), Menus (`507:24676`), Popovers (`507:24681`),
Sheets (`507:24684`), Segmented Controls (`507:24683`),
Contextual Menus (`507:25994`), Action Sheets (`507:24669`),
Alerts (`507:24668`), Sidebars (`507:26013`).
