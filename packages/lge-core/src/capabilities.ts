export type HtmlInCanvasCapability = {
  supported: boolean;
  version: 'modern' | 'legacy' | 'none';
  contentAttribute: boolean;
  drawElementImage: boolean;
  captureElementImage: boolean;
  texElementSubImage2D: boolean;
  drawElementImageToTexture: boolean;
};

export type LgeCapabilities = {
  webgpu: {
    supported: boolean;
    reason?: string;
  };
  webgl2: boolean;
  htmlInCanvas: HtmlInCanvasCapability;
  reducedMotion: boolean;
  reducedTransparency: boolean;
};

export type CapabilityEnv = {
  hasWebGpu?: boolean;
  hasWebGl2?: boolean;
  hasContentAttribute?: boolean;
  hasDrawElementImage?: boolean;
  hasCaptureElementImage?: boolean;
  hasTexElementSubImage2D?: boolean;
  hasDrawElementImageToTexture?: boolean;
  reducedMotion?: boolean;
  reducedTransparency?: boolean;
};

function matchMediaFlag(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

function defaultEnv(): CapabilityEnv {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const canvas2d = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : null;
  const webgl2 = typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext.prototype : null;
  const gpuQueue = typeof GPUQueue !== 'undefined' ? GPUQueue.prototype : null;
  const htmlCanvas = typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement.prototype : null;

  return {
    hasWebGpu: typeof navigator !== 'undefined' && 'gpu' in navigator,
    hasWebGl2: webgl2 !== null,
    hasContentAttribute: canvas !== null && 'content' in canvas,
    hasDrawElementImage: canvas2d !== null && 'drawElementImage' in canvas2d,
    hasCaptureElementImage: htmlCanvas !== null && 'captureElementImage' in htmlCanvas,
    hasTexElementSubImage2D: webgl2 !== null && 'texElementSubImage2D' in webgl2,
    hasDrawElementImageToTexture: gpuQueue !== null && 'drawElementImageToTexture' in gpuQueue,
    reducedMotion: matchMediaFlag('(prefers-reduced-motion: reduce)'),
    reducedTransparency: matchMediaFlag('(prefers-reduced-transparency: reduce)'),
  };
}

export async function detectCapabilities(options?: {
  env?: CapabilityEnv;
  requestAdapter?: boolean;
}): Promise<LgeCapabilities> {
  const env = options?.env ?? defaultEnv();
  const htmlInCanvas: HtmlInCanvasCapability = {
    contentAttribute: env.hasContentAttribute === true,
    drawElementImage: env.hasDrawElementImage === true,
    captureElementImage: env.hasCaptureElementImage === true,
    texElementSubImage2D: env.hasTexElementSubImage2D === true,
    drawElementImageToTexture: env.hasDrawElementImageToTexture === true,
    supported: false,
    version: 'none',
  };
  const modern =
    htmlInCanvas.drawElementImage ||
    htmlInCanvas.captureElementImage ||
    htmlInCanvas.texElementSubImage2D ||
    htmlInCanvas.drawElementImageToTexture;
  htmlInCanvas.supported = htmlInCanvas.contentAttribute && modern;
  htmlInCanvas.version = htmlInCanvas.supported ? 'modern' : 'none';

  const webgpu: LgeCapabilities['webgpu'] = { supported: env.hasWebGpu === true };
  if (webgpu.supported && !options?.env && options?.requestAdapter !== false) {
    try {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) {
        webgpu.supported = false;
        webgpu.reason = 'no-adapter';
      }
    } catch (error) {
      webgpu.supported = false;
      webgpu.reason = error instanceof Error ? error.message : 'adapter-error';
    }
  }

  return {
    webgpu,
    webgl2: env.hasWebGl2 === true,
    htmlInCanvas,
    reducedMotion: env.reducedMotion === true,
    reducedTransparency: env.reducedTransparency === true,
  };
}
