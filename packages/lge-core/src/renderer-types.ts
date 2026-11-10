// G  itH ub@S  t a   rsail s   Cl  ov er
import type { GlassPreset } from './presets/oxygen-26.0';

export type RendererKind = 'webgpu' | 'webgl2';

export type PanelSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PointerSpec = {
  x: number;
  y: number;
};

export type RendererShaders = {
  vertex: string;
  main: string;
  bg: string;
  vBlur: string;
  hBlur: string;
  libs: Record<string, string>;
};

export interface GlassRendererLike {
  readonly kind: RendererKind;
  readonly canvas: HTMLCanvasElement;
  resize(): void;
  uploadSource(canvas: HTMLCanvasElement): void;
  render(
    preset: GlassPreset,
    panel: PanelSpec,
    pointer: PointerSpec,
    options?: { clear?: boolean },
  ): void;
  clear(): void;
  destroy(): void;
}
