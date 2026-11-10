# iOS 27 Component Page Extraction (Interactive Set)

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

- Source file key: `A584PysarXACnq9FqGhCAS` (Apple iOS/iPadOS 27 UI Kit copy)
- Extraction date: 2026-11-10
- Scope: completed the remaining interactive component pages of the System
  section. Non-interactive / media pages are indexed at the bottom.
- All dimensions are Figma design units. Demonstrate states in light and dark.

## Toolbars (`507:25993`)

| Component | Node | Size |
|---|---|---|
| Toolbar - Top - iPhone | `1:54472` | 402x54 (default/compact), 402x54 (2-line), 402x125 (large title) |
| Toolbar - Bottom - iPhone | `4:55732` | 402x84; types: Buttons, Search, Search + Leading/Trailing item, Search with focus, Buttons + page dots |
| Toolbar - Top - iPad | `5561:41165` | 820x54 (compact), 820x131 (large title), x98 (2-line) |
| Toolbar - Bottom - iPad | `8515:13163` | 500x58 |
| Buttons 44pt | `5720:29596` | Back 44x44, Text 73x44, Button Group 160x44, Symbol 44x44 |
| Buttons 48pt | `5720:47981` | Text 69x48, Button Group 164x48 (vertical 48x164) |
| Search 44pt / 48pt | `5720:33677` / `5720:33170` | 190x44 / 190x48 |
| Search accessory | `5573:24624` | 820x44 |
| Page control | `5704:38375` | 72x48 (2 dots) - 168x48 (8+ dots) |
| Page dots | `5811:30646` | 8x8 |
| Back bar button | `5431:813` | 36x36 |
| Segmented control button | `5573:24524` | 126x36 |

## Sliders (`507:24685`)

- Component rows are 400x52 (`7:53847`), states Idle / Pressed / Disabled x
  values 0 / 25 / 50 / 75 / 100%.
- Parts: `_Track` 282x6, `_Fill` 282x6, `_Ticks` 282x4,
  `_Knob - Idle` and `_Knob - Pressed` 2x24.
- Grouped table example 400x156 with three 52-high rows.

## Toggles (`507:24690`)

- `Toggle - Switch` (`29:56814`): 64x28, variants State (Idle/Pressed) x
  Is On (True/False) x Is Enabled (True/False) = 8 states, light and dark.

## Text Fields (`553:22762`)

- `Text Field` (`553:23047`): 402x52 rows; states Placeholder, Focused,
  Typing, Value Entered.
- Grouped table example 402x156.

## Menus (`507:24676`)

- Menu container uses `Liquid Glass - Regular - Medium`; observed sizes:
  238x578, 238x437, 238x532.
- Control group 238x56; menu items 206-222x40 (tall 58-60);
  separators 206-222x18-21; section titles 206-222x27-29.
- Edit menu 238x44; menu indicator 36x36; quick action 70x57.
- Item states: Default / Disabled / Destructive x light/dark;
  submenu variants add Open True/False and "Menu has Selection" True/False.

## Popovers (`507:24681`)

- iPad-only 200x200 specimens for 12 edge placements: Top/Bottom/Leading/
  Trailing x Leading/Center/Trailing (nodes `61:65422` ... `61:65476`).

## Sheets (`507:24684`)

- `Sheet - iPhone` (`10525:1632`): Detent Medium / Large / Large (Stacked),
  402x874 each.
- Grabber 60x4 (light `5827:57545`, dark `5827:57567`); overlay 100x100.
- `Sheet - iPad` 936x852 (`5719:30145`).

## Segmented Controls (`507:24683`)

- Container sizes: small 370x32, large 370x50 (`10460:145`).
- Segment buttons 28-50 high; examples 430x32 with 2/3/4/5/6 segments
  (nodes `10456:17010`, `10456:16998`, `10456:16986`, `595:19723`,
  `10456:17126`).
- `_Option` 80x28 selected/unselected.

## Contextual Menus (`507:25994`)

- `Context Menu` (`125:58750`): vertical/leading `125:58302`,
  vertical/trailing `125:58751`, horizontal (iPad) leading `128:77888`,
  trailing `128:77880`; each 351x160-161.
- Dimming overlay 200x200 (`128:76929`).

## Action Sheets (`507:24669`)

- `Action Sheet` (`5446:10266`) 300x296 on a 390x400 stage.

## Alerts (`507:24668`)

- `Alert` (`63:57121`) 670x480: side-by-side buttons 300x307, stacked
  300x419.
- `_Buttons` 86x48 roles: None / Cancel / Default / Destructive x light/dark.
- Text field background 160x52; alert text field 272x123.

## Sidebars (`507:26013`)

- Sidebar 320x802 (floating true/false), iPad 700x842 stage.
- Rows 320x44: state Default / Selected / Disclosable / Disabled x indent 0/1/2.
- Leading item variants: Image Hidden 34x44, Symbol/Bitmap/Collection 85x44.
- Trailing types: Detail, Checkmark, Info, Disclosure, Symbol, Toggle
  (52-88x44).
- Section header 260x54; sidebar search field 200x64; search field 200x44
  (placeholder / typing / value); selection background 100x44.

## Progress Indicators (`507:24682`)

- Determinate linear (`9:55875`): 402x44 rows for 0-100% in 10% steps.
- Indeterminate spinner: small 14x14, regular 20x20, large 35x35.

## Steppers (`507:24687`)

- Stepper 92x32; decrement/increment halves 46x32 with default / pressed /
  disabled states.

## Page Controls (`507:24679`)

- Page control 402x44; 1-6 page variants; dots 8x8
  (default / adjacent / overflow types, active and inactive).

## Lists (`507:24675`)

- Rows 300x52 regular, 300x68 tall; row button states default / destructive /
  disabled.
- Leading images: regular 20-52, tall 20-68; circular 42/60; fill 52/68.
- Trailing types: default, disclosure 64x32, toggle 64x28, stepper 92x32,
  date/time pickers 86-198x34, pop-up 97x22, button 52x16.
- Swipe actions: symbol only 402x52, symbol + label 402x52, tall 402x68.
- Header accessory types: disclosure open 63x22, action 45x20, image 42x42,
  button 44x44. Section title 300x39; footer 300x32; separator 370x1.
- Index bar: iPhone 16x700, iPad 30x700.

## Notifications (`507:24678`)

- Collapsed stacks: 386x66 (1), 386x71 (2), 386x77 (3).
- Expanded notification 402x552.
- List layout 402x337; overlay 100x100; time 51x20.

## Pop-up Buttons (`507:26009`)

- Popup button 65x44 enabled / disabled.

## Keyboards (`507:24674`)

- iPhone keyboard 402x332 (upper/lower/numeric/punctuation/email),
  402x307 (URL/web), 402x308 (number pad), 402x392 (emoji).
- Keys 50x43; iPad keys 82x74, iPad keyboard 1210x332/428.
- Accessory bars 402x44-101; iPhone Duo keyboard variants 466-951 wide.

## Status Bars and Menu Bars (`507:24686`)

- iPhone status bar 402x62 (iPhone 17 Pro / 18 Pro / 18 Pro Max).
- iPad status/menu bar 1210x32; menu bar item 59x32;
  window controls 16x16.
- iPhone Duo status vertical 48x83, horizontal 98x48.

## Index-only pages (not expanded this pass)

The following System pages have been located but are not glass-control
surfaces; extract on demand: Activity Views `507:24670`, App Icons
`507:24671`, Color Pickers `507:26010`, Date and Time Pickers `507:24680`,
Empty States `5518:18111`, Face ID `507:26011`, Widgets `507:26511`,
Windows `5413:10149`.
