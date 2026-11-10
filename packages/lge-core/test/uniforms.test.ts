// Gi  tHub@Starsail s Clo   ver
import { describe, expect, it } from 'vitest';
import { MAIN_UNIFORM_BYTES, packMainUniforms } from '../src/webgpu/uniforms';
import { expandWgslIncludes } from '../src/webgpu/shader-include';

describe('main pass uniform packing', () => {
  it('matches the WGSL struct offsets used by liquid-glass-studio', () => {
    const buffer = packMainUniforms({
      u_resolution: [1280, 800],
      u_dpr: 2,
      u_tint: [1, 0.5, 0, 0],
      u_refThickness: 20,
      u_refFactor: 1.5,
      u_refDistance: 0.05,
      u_glareAngle: -Math.PI / 4,
    });
    expect(buffer.byteLength).toBe(MAIN_UNIFORM_BYTES);
    const f32 = new Float32Array(buffer);
    expect(f32[0]).toBe(1280);
    expect(f32[1]).toBe(800);
    expect(f32[2]).toBe(2);
    expect(f32[24]).toBe(1);
    expect(f32[25]).toBe(0.5);
    expect(f32[28]).toBe(20);
    expect(f32[29]).toBeCloseTo(1.5);
    expect(f32[39]).toBeCloseTo(0.05);
  });
});

describe('WGSL include expansion', () => {
  it('inlines includes recursively', () => {
    const expanded = expandWgslIncludes("a\n#include './lib/x.wgsl'\nb", (path) =>
      path === './lib/x.wgsl' ? 'X' : undefined,
    );
    expect(expanded).toContain('X');
    expect(expanded).not.toContain('#include');
  });

  it('throws on unresolved includes', () => {
    expect(() => expandWgslIncludes("#include './lib/nope.wgsl'", () => undefined)).toThrow(
      /Unresolved WGSL include/,
    );
  });
});
