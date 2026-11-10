# Liquid Glass Components

<!-- G i tHub@S   ta  rs  ailsC lov er -->

`@lge/components` provides light-DOM Web Components on top of `@lge/core`.
No stylesheet import is required; each component acquires the shared glass
scene and registers its native surface automatically.

```html
<script type="module">
  import '@lge/components';
</script>

<lge-toolbar>
  <button>Back</button>
  <button>Share</button>
</lge-toolbar>

<lge-button variant="prominent" size="large">Done</lge-button>
<lge-input placeholder="Search"></lge-input>

<lge-tabbar>
  <button aria-selected="true">Home</button>
  <button>Library</button>
  <button>Profile</button>
</lge-tabbar>
```

## Elements

| Element | Notes |
|---|---|
| `<lge-button>` | `variant="regular|prominent"`, `size="small|medium|large"`, `disabled` |
| `<lge-input>` | `placeholder`, `type`, `value`, `disabled`; emits native input/change events |
| `<lge-toolbar>` | Glass container for native buttons or other controls |
| `<lge-tabbar>` | Glass tab bar; child buttons use `aria-selected` |

Components are light-DOM so their content remains accessible, interactive and
capturable. The `contentAbove` mirror keeps labels and values crisp while the
backdrop is refracted by the glass material.

## Verification

```bash
pnpm --filter @lge/demo dev
pnpm verify:components
```

The verifier checks all custom elements, the shared glass canvas, the per-surface
mirrors and a clean page-error log.
