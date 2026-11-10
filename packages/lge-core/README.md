# @lge/core

<!-- G  it  Hub@ S  tars   a i   l sClov  e   r -->

Core renderer and zero-CSS scene API for LiquidGlassEngine.

```ts
import { createLiquidGlassScene } from '@lge/core';

const scene = await createLiquidGlassScene({ content: document.querySelector('#app')! });
scene.attach(document.querySelector('button')!);
```

Apache-2.0; upstream shader notices are included in `THIRD_PARTY_NOTICES.md`.
