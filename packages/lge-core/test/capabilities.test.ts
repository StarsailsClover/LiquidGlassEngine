import { describe, expect, it } from 'vitest';
import { detectCapabilities } from '../src/capabilities';

describe('detectCapabilities', () => {
  it('reports modern html-in-canvas when content + snapshot APIs exist', async () => {
    const capabilities = await detectCapabilities({
      env: {
        hasWebGpu: true,
        hasContentAttribute: true,
        hasDrawElementImage: true,
        hasCaptureElementImage: true,
      },
    });
    expect(capabilities.htmlInCanvas.supported).toBe(true);
    expect(capabilities.htmlInCanvas.version).toBe('modern');
    expect(capabilities.webgpu.supported).toBe(true);
    expect(capabilities.webgl2).toBe(false);
  });

  it('requires the content attribute for lane A', async () => {
    const capabilities = await detectCapabilities({
      env: {
        hasWebGpu: true,
        hasContentAttribute: false,
        hasDrawElementImage: true,
      },
    });
    expect(capabilities.htmlInCanvas.supported).toBe(false);
    expect(capabilities.htmlInCanvas.version).toBe('none');
  });

  it('passes through reduced-motion and reduced-transparency flags', async () => {
    const capabilities = await detectCapabilities({
      env: { reducedMotion: true, reducedTransparency: true },
    });
    expect(capabilities.reducedMotion).toBe(true);
    expect(capabilities.reducedTransparency).toBe(true);
  });
});
