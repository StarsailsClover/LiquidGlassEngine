// GitHub@Star sai ls  C   l over
import { describe, expect, it } from 'vitest';
import { buildForeignObjectSvg } from '../src/content/laneB';

describe('lane B snapshot serialisation', () => {
  it('builds a foreignObject SVG with the requested size', () => {
    const svg = buildForeignObjectSvg('<p>实时 DOM</p>', 320, 200, 'p{margin:0}');
    expect(svg).toContain('<svg');
    expect(svg).toContain('<foreignObject');
    expect(svg).toContain('width="320"');
    expect(svg).toContain('height="200"');
    expect(svg).toContain('<p>实时 DOM</p>');
    expect(svg).toContain('p{margin:0}');
  });

  it('clamps degenerate sizes to at least one pixel', () => {
    const svg = buildForeignObjectSvg('<span>x</span>', 0, -4);
    expect(svg).toContain('width="1"');
    expect(svg).toContain('height="1"');
  });
});
