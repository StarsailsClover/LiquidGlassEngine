// G  itH ub@S  t a   rsail s   Cl  ov er
import { detectCapabilities, type LgeCapabilities } from './capabilities';
import { createLaneAController, type LaneAController } from './content/laneA';
import { createLaneBController, type LaneBController } from './content/laneB';
import { OXYGEN_PRESET, SMALL_CONTROL_PRESET, type GlassPreset } from './presets/oxygen-26.0';
import type { GlassRendererLike, PanelSpec, PointerSpec, RendererKind } from './renderer-types';
import { UPSTREAM_GLSL_SHADERS, UPSTREAM_SHADERS } from './shaders/index';
import { GlassRenderer } from './webgpu/glass-renderer';
import { WebGL2GlassRenderer } from './webgl2/glass-renderer';

export type SceneLane = 'auto' | 'A' | 'B';
export type SceneRendererPreference = 'auto' | 'webgpu' | 'webgl2';

export type LiquidGlassSceneOptions = {
  container?: HTMLElement;
  content?: HTMLElement;
  capture?: HTMLElement;
  renderer?: SceneRendererPreference;
  lane?: SceneLane;
  preset?: GlassPreset;
};

export type GlassSurfaceOptions = {
  preset?: GlassPreset;
  presetPatch?: Partial<GlassPreset>;
  padding?: number;
  /**
   * Keep the native control's text/icons crisp above the glass material.
   * Default true: the real element is visually suppressed for the backdrop
   * capture and a sharp mirror snapshot is composited above the glass.
   */
  contentAbove?: boolean;
};

export type GlassSurface = {
  readonly element: Element;
  update(options: GlassSurfaceOptions): void;
  destroy(): void;
};

export type LiquidGlassScene = {
  readonly capabilities: LgeCapabilities;
  readonly lane: 'A' | 'B';
  readonly rendererKind: RendererKind | null;
  readonly canvas: HTMLCanvasElement | null;
  readonly captureCount: number;
  readonly frameCount: number;
  readonly captureDebug: {
    paintEvents: number;
    lastError: string | null;
  };
  attach(element: Element, options?: GlassSurfaceOptions): GlassSurface;
  destroy(): void;
};

type SurfaceRecord = {
  element: Element;
  options: GlassSurfaceOptions;
  mirror: HTMLCanvasElement | null;
  mirrorController: LaneBController | null;
  savedStyle: {
    opacity: string;
    background: string;
    borderColor: string;
    boxShadow: string;
  } | null;
};

function applyFixedOverlayStyle(canvas: HTMLCanvasElement, zIndex: string): void {
  const style = canvas.style;
  style.position = 'fixed';
  style.top = '0';
  style.left = '0';
  style.right = '0';
  style.bottom = '0';
  style.width = '100%';
  style.height = '100%';
  style.pointerEvents = 'none';
  style.zIndex = zIndex;
}

/**
 * Creates a zero-CSS Liquid Glass scene: the library owns the capture canvas,
 * the glass overlay and all layout wiring. Attach any native element and it
 * receives a glass surface without adding a stylesheet.
 */
export async function createLiquidGlassScene(
  options: LiquidGlassSceneOptions = {},
): Promise<LiquidGlassScene> {
  const container = options.container ?? document.body;
  const capabilities = await detectCapabilities();
  const content = options.content ?? null;

  const captureCanvas = document.createElement('canvas');
  // Ensure the canvas has a rendering context before it is ever passed to
  // copyExternalImageToTexture (lane B may not have drawn its first snapshot).
  captureCanvas.getContext('2d');
  const syncCaptureSize = () => {
    const width = Math.min(1920, Math.max(320, Math.round(window.innerWidth)));
    const height = Math.min(1200, Math.max(240, Math.round(window.innerHeight)));
    if (captureCanvas.width !== width) captureCanvas.width = width;
    if (captureCanvas.height !== height) captureCanvas.height = height;
  };
  syncCaptureSize();

  let uploadNeeded = false;
  const onCapture = () => {
    uploadNeeded = true;
  };

  let sourceCanvas: HTMLCanvasElement | null = null;
  let lane: 'A' | 'B' = 'B';
  let controller: LaneAController | LaneBController;
  const wantLaneA =
    options.lane !== 'B' && capabilities.htmlInCanvas.supported && content !== null;
  if (wantLaneA && content) {
    lane = 'A';
    sourceCanvas = document.createElement('canvas');
    sourceCanvas.setAttribute('content', 'drawable');
    sourceCanvas.setAttribute('data-lge-internal', '');
    applyFixedOverlayStyle(sourceCanvas, '0');
    sourceCanvas.style.pointerEvents = 'auto';
    content.setAttribute('drawable', '');
    sourceCanvas.appendChild(content);
    container.appendChild(sourceCanvas);
    controller = createLaneAController({ drawable: content, captureCanvas, onCapture });
  } else {
    if (content && !content.isConnected) container.appendChild(content);
    controller = createLaneBController({
      element: options.capture ?? content ?? container,
      captureCanvas,
      intervalMs: 350,
      onCapture,
    });
  }
  controller.start();

  const glassCanvas = document.createElement('canvas');
  glassCanvas.setAttribute('data-lge-internal', '');
  applyFixedOverlayStyle(glassCanvas, '2147483000');
  container.appendChild(glassCanvas);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    glassCanvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    glassCanvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    syncCaptureSize();
    renderer?.resize();
    uploadNeeded = true;
  };

  let renderer: GlassRendererLike | null = null;
  let rendererKind: RendererKind | null = null;
  const preference = options.renderer ?? 'auto';
  if (preference !== 'webgl2' && capabilities.webgpu.supported) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error('no GPU adapter');
      const device = await adapter.requestDevice();
      renderer = new GlassRenderer({ canvas: glassCanvas, device, shaders: UPSTREAM_SHADERS });
      rendererKind = 'webgpu';
    } catch {
      renderer = null;
    }
  }
  if (!renderer && capabilities.webgl2) {
    renderer = new WebGL2GlassRenderer({ canvas: glassCanvas, shaders: UPSTREAM_GLSL_SHADERS });
    rendererKind = 'webgl2';
  }
  resize();

  const surfaces: SurfaceRecord[] = [];
  const pointer: PointerSpec = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('resize', resize);

  const collectPanels = (): Array<{ preset: GlassPreset; panel: PanelSpec }> => {
    const result: Array<{ preset: GlassPreset; panel: PanelSpec }> = [];
    for (const surface of surfaces) {
      const rect = surface.element.getBoundingClientRect();
      const padding = surface.options.padding ?? 0;
      const width = rect.width + padding * 2;
      const height = rect.height + padding * 2;
      if (width <= 1 || height <= 1) continue;
      const base =
        surface.options.preset ??
        (Math.min(rect.width, rect.height) <= 96
          ? SMALL_CONTROL_PRESET
          : options.preset ?? OXYGEN_PRESET);
      const preset = { ...base, ...(surface.options.presetPatch ?? {}) };
      result.push({
        preset,
        panel: { x: rect.left - padding, y: rect.top - padding, width, height },
      });
    }
    return result;
  };

  let frameCount = 0;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      resize();
    }
    if (!renderer) return;
    for (const surface of surfaces) {
      if (!surface.mirror) continue;
      const rect = surface.element.getBoundingClientRect();
      surface.mirror.style.left = `${rect.left}px`;
      surface.mirror.style.top = `${rect.top}px`;
      surface.mirror.style.width = `${rect.width}px`;
      surface.mirror.style.height = `${rect.height}px`;
    }
    if (uploadNeeded) {
      renderer.uploadSource(captureCanvas);
      uploadNeeded = false;
    }
    const panels = collectPanels();
    if (panels.length === 0) {
      renderer.clear();
    } else {
      panels.forEach((entry, index) => {
        renderer?.render(entry.preset, entry.panel, pointer, { clear: index === 0 });
      });
    }
    frameCount += 1;
  };
  raf = requestAnimationFrame(loop);

  return {
    capabilities,
    get lane() {
      return lane;
    },
    get rendererKind() {
      return rendererKind;
    },
    get canvas() {
      return renderer ? glassCanvas : null;
    },
    get captureCount() {
      return controller.captureCount;
    },
    get frameCount() {
      return frameCount;
    },
    get captureDebug() {
      return {
        paintEvents: 'paintEvents' in controller ? controller.paintEvents : 0,
        lastError: 'lastError' in controller ? controller.lastError : null,
      };
    },
    attach(element: Element, surfaceOptions: GlassSurfaceOptions = {}): GlassSurface {
      const record: SurfaceRecord = {
        element,
        options: { ...surfaceOptions },
        mirror: null,
        mirrorController: null,
        savedStyle: null,
      };
      const contentAbove =
        surfaceOptions.contentAbove !== false && element instanceof HTMLElement;
      if (contentAbove) {
        record.savedStyle = {
          opacity: element.style.opacity,
          background: element.style.background,
          borderColor: element.style.borderColor,
          boxShadow: element.style.boxShadow,
        };
        // Keep layout and hit testing intact while excluding the control from
        // the backdrop texture. The crisp copy is rendered by the mirror.
        element.style.opacity = '0.001';
        element.style.background = 'transparent';
        element.style.borderColor = 'transparent';
        element.style.boxShadow = 'none';
        const mirror = document.createElement('canvas');
        mirror.setAttribute('data-lge-internal', '');
        mirror.style.position = 'fixed';
        mirror.style.pointerEvents = 'none';
        mirror.style.zIndex = '2147483001';
        mirror.style.left = '0px';
        mirror.style.top = '0px';
        mirror.style.width = '0px';
        mirror.style.height = '0px';
        container.appendChild(mirror);
        const mirrorCapture = document.createElement('canvas');
        mirrorCapture.getContext('2d');
        const mirrorController = createLaneBController({
          element,
          captureCanvas: mirrorCapture,
          intervalMs: 250,
          onCapture: () => {
            const rect = element.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.round(rect.width * dpr));
            const height = Math.max(1, Math.round(rect.height * dpr));
            if (mirror.width !== width) mirror.width = width;
            if (mirror.height !== height) mirror.height = height;
            mirror.style.left = `${rect.left}px`;
            mirror.style.top = `${rect.top}px`;
            mirror.style.width = `${rect.width}px`;
            mirror.style.height = `${rect.height}px`;
            const context = mirror.getContext('2d');
            if (!context) return;
            context.clearRect(0, 0, width, height);
            context.drawImage(mirrorCapture, 0, 0, width, height);
          },
        });
        mirrorController.start();
        record.mirror = mirror;
        record.mirrorController = mirrorController;
      }
      surfaces.push(record);
      return {
        element,
        update(next: GlassSurfaceOptions) {
          record.options = { ...record.options, ...next };
        },
        destroy() {
          const index = surfaces.indexOf(record);
          if (index >= 0) surfaces.splice(index, 1);
          record.mirrorController?.stop();
          record.mirror?.remove();
          if (record.savedStyle && element instanceof HTMLElement) {
            element.style.opacity = record.savedStyle.opacity;
            element.style.background = record.savedStyle.background;
            element.style.borderColor = record.savedStyle.borderColor;
            element.style.boxShadow = record.savedStyle.boxShadow;
          }
        },
      };
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      controller.stop();
      renderer?.destroy();
      renderer = null;
      rendererKind = null;
      glassCanvas.remove();
      if (sourceCanvas) {
        if (content && content.parentElement === sourceCanvas) {
          content.removeAttribute('drawable');
          container.appendChild(content);
        }
        sourceCanvas.remove();
      }
    },
  };
}
