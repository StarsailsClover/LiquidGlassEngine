// GitH   u   b@  S tar   sailsC   lover
export type LaneBController = {
  readonly captureCount: number;
  readonly lastError: string | null;
  start(): void;
  stop(): void;
  captureNow(): void;
  dispose(): void;
};

export type LaneBOptions = {
  element: HTMLElement;
  captureCanvas: HTMLCanvasElement;
  intervalMs?: number;
  onCapture?: (canvas: HTMLCanvasElement) => void;
};

const INLINE_PROPERTIES = [
  'display',
  'position',
  'box-sizing',
  'width',
  'height',
  'padding',
  'margin',
  'color',
  'background',
  'background-color',
  'border',
  'border-radius',
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'opacity',
  'overflow',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'transform',
];

let lastRasterError: string | null = null;

export function getLaneBLastError(): string | null {
  return lastRasterError;
}

export function buildForeignObjectSvg(
  innerHtml: string,
  width: number,
  height: number,
  cssText = '',
): string {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">`,
    `<foreignObject x="0" y="0" width="${safeWidth}" height="${safeHeight}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${safeWidth}px;height:${safeHeight}px;overflow:hidden">`,
    `<style>${cssText}</style>`,
    innerHtml,
    '</div></foreignObject></svg>',
  ].join('');
}

function inlineComputedStyles(source: Element, target: Element): void {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;
  const computed = getComputedStyle(source);
  const parts: string[] = [];
  for (const property of INLINE_PROPERTIES) {
    const value = computed.getPropertyValue(property);
    if (value) parts.push(`${property}:${value}`);
  }
  target.setAttribute('style', parts.join(';'));
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i += 1) {
    inlineComputedStyles(sourceChildren[i]!, targetChildren[i]!);
  }
}

function syncFormValues(source: Element, target: Element): void {
  if (source instanceof HTMLInputElement && target instanceof HTMLInputElement) {
    target.setAttribute('value', source.value);
    if (source.checked) target.setAttribute('checked', '');
    else target.removeAttribute('checked');
  } else if (source instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
    target.textContent = source.value;
  } else if (source instanceof HTMLSelectElement && target instanceof HTMLSelectElement) {
    const sourceOptions = Array.from(source.options);
    const targetOptions = Array.from(target.options);
    sourceOptions.forEach((option, index) => {
      const cloned = targetOptions[index];
      if (!cloned) return;
      if (option.selected) cloned.setAttribute('selected', '');
      else cloned.removeAttribute('selected');
    });
  }
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i += 1) {
    syncFormValues(sourceChildren[i]!, targetChildren[i]!);
  }
}

export async function rasterizeElement(
  element: HTMLElement,
  canvas: HTMLCanvasElement,
  cssText = '',
): Promise<boolean> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-lge-internal]').forEach((internal) => internal.remove());
  syncFormValues(element, clone);
  inlineComputedStyles(element, clone);
  // The real element may be visually suppressed while the scene captures the
  // backdrop; the mirrored snapshot must still render the control content.
  clone.style.opacity = '1';
  clone.style.visibility = 'visible';
  // XMLSerializer keeps void HTML elements XHTML-safe (e.g. `<input />`);
  // outerHTML would emit `<input>` and make the SVG fail to decode.
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = buildForeignObjectSvg(serialized, width, height, cssText);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
    lastRasterError = null;
  } catch (error) {
    lastRasterError = error instanceof Error ? error.message : String(error);
    return false;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return true;
}

export function createLaneBController(options: LaneBOptions): LaneBController {
  const { element, captureCanvas, intervalMs = 400, onCapture } = options;
  let running = false;
  let timer: number | null = null;
  let captureCount = 0;
  let observer: MutationObserver | null = null;

  const captureNow = () => {
    void rasterizeElement(element, captureCanvas).then((ok) => {
      if (!ok || !running) return;
      captureCount += 1;
      onCapture?.(captureCanvas);
    });
  };

  return {
    get captureCount() {
      return captureCount;
    },
    get lastError() {
      return lastRasterError;
    },
    start() {
      if (running) return;
      running = true;
      captureNow();
      timer = window.setInterval(captureNow, intervalMs);
      observer = new MutationObserver(() => captureNow());
      observer.observe(element, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
    },
    stop() {
      running = false;
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      observer?.disconnect();
      observer = null;
    },
    captureNow,
    dispose() {
      this.stop();
    },
  };
}
