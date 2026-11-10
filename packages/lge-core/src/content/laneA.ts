export type LaneAController = {
  readonly supported: boolean;
  readonly captureCount: number;
  readonly paintEvents: number;
  readonly lastError: string | null;
  start(): void;
  stop(): void;
  requestPaint(): void;
  dispose(): void;
};

export type LaneAOptions = {
  drawable: HTMLElement;
  captureCanvas: HTMLCanvasElement;
  onCapture?: (canvas: HTMLCanvasElement) => void;
};

type HtmlInCanvasCanvas = HTMLCanvasElement & {
  requestPaint?: () => void;
};

type HtmlInCanvasContext2D = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, dx: number, dy: number) => void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  captureElementImage?: (element: Element) => unknown;
};

export function createLaneAController(options: LaneAOptions): LaneAController {
  const { drawable, captureCanvas, onCapture } = options;
  const owner = drawable.closest('canvas') as (HtmlInCanvasCanvas & HtmlInCanvasElement) | null;
  const ownerCtx = owner?.getContext('2d') as HtmlInCanvasContext2D | null;
  const outCtx = captureCanvas.getContext('2d');
  const supported =
    owner !== null &&
    ownerCtx !== null &&
    outCtx !== null &&
    (typeof ownerCtx.drawElementImage === 'function' ||
      typeof owner.captureElementImage === 'function');

  let running = false;
  let captureCount = 0;
  let paintEvents = 0;
  let lastError: string | null = null;
  let observer: MutationObserver | null = null;
  let retryTimer: number | null = null;

  const capture = () => {
    if (!supported || !owner || !ownerCtx || !outCtx) return;
    try {
      // Chrome's current implementation requires drawElementImage to run on
      // the context of the canvas that owns the drawable subtree.
      const rect = drawable.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (owner.width !== width) owner.width = width;
      if (owner.height !== height) owner.height = height;
      ownerCtx.clearRect(0, 0, owner.width, owner.height);
      if (typeof ownerCtx.drawElementImage === 'function') {
        ownerCtx.drawElementImage(drawable, 0, 0);
      } else if (typeof owner.captureElementImage === 'function') {
        ownerCtx.drawImage(owner.captureElementImage(drawable) as CanvasImageSource, 0, 0);
      }
      outCtx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
      outCtx.drawImage(owner, 0, 0, captureCanvas.width, captureCanvas.height);
      captureCount += 1;
      lastError = null;
      onCapture?.(captureCanvas);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  };

  const requestPaint = () => {
    owner?.requestPaint?.();
  };

  const handlePaint = () => {
    paintEvents += 1;
    capture();
  };

  return {
    get supported() {
      return supported;
    },
    get captureCount() {
      return captureCount;
    },
    get paintEvents() {
      return paintEvents;
    },
    get lastError() {
      return lastError;
    },
    start() {
      if (!supported || running) return;
      running = true;
      owner?.addEventListener('paint', handlePaint as EventListener);
      observer = new MutationObserver(requestPaint);
      observer.observe(drawable, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      document.fonts?.ready.then(requestPaint).catch(() => undefined);
      requestPaint();
      requestAnimationFrame(() => {
        requestPaint();
      });
      retryTimer = window.setInterval(() => {
        if (captureCount > 0 || !running) return;
        requestPaint();
        if (paintEvents > 0) capture();
      }, 250);
    },
    stop() {
      if (!running) return;
      running = false;
      owner?.removeEventListener('paint', handlePaint as EventListener);
      observer?.disconnect();
      observer = null;
      if (retryTimer !== null) window.clearInterval(retryTimer);
      retryTimer = null;
    },
    requestPaint,
    dispose() {
      this.stop();
    },
  };
}
