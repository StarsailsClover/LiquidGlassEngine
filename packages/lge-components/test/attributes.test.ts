// G  i   tHu  b@Sta rs   a   ilsC   lov  er
import { describe, expect, it } from 'vitest';
import { normalizeSize, normalizeVariant } from '../src/attributes';

describe('component attribute normalization', () => {
  it('normalizes button variants', () => {
    expect(normalizeVariant('prominent')).toBe('prominent');
    expect(normalizeVariant('regular')).toBe('regular');
    expect(normalizeVariant(null)).toBe('regular');
    expect(normalizeVariant('unexpected')).toBe('regular');
  });

  it('normalizes button sizes', () => {
    expect(normalizeSize('small')).toBe('small');
    expect(normalizeSize('large')).toBe('large');
    expect(normalizeSize('medium')).toBe('medium');
    expect(normalizeSize(null)).toBe('medium');
  });
});
