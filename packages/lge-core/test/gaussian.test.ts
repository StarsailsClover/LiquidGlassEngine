// G it  Hu b@S tarsa i  lsClov   e  r
import { describe, expect, it } from 'vitest';
import { computeGaussianKernel } from '../src/math/gaussian';

describe('computeGaussianKernel', () => {
  it('normalizes the kernel', () => {
    const kernel = computeGaussianKernel(15);
    expect(kernel.length).toBe(16);
    const sum = kernel.reduce((acc, value, index) => acc + (index === 0 ? value : value * 2), 0);
    expect(sum).toBeCloseTo(1);
  });

  it('handles radius zero and clamps the maximum', () => {
    expect(Array.from(computeGaussianKernel(0))).toEqual([1]);
    expect(computeGaussianKernel(999).length).toBe(201);
  });
});
