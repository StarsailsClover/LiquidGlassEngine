import {
  GLSL_BG,
  GLSL_COLOR_LIB,
  GLSL_HBLUR,
  GLSL_MAIN,
  GLSL_MATH_LIB,
  GLSL_SDF_LIB,
  GLSL_VBLUR,
  GLSL_VERTEX,
  WGSL_BG,
  WGSL_COLOR_LIB,
  WGSL_HBLUR,
  WGSL_MAIN,
  WGSL_MATH_LIB,
  WGSL_SDF_LIB,
  WGSL_VBLUR,
  WGSL_VERTEX,
} from './generated';

export const UPSTREAM_SHADER_ORIGIN =
  'iyinchao/liquid-glass-studio (MIT, Copyright (c) 2024 Charles Yin)';

export const UPSTREAM_SHADERS = {
  vertex: WGSL_VERTEX,
  main: WGSL_MAIN,
  bg: WGSL_BG,
  vBlur: WGSL_VBLUR,
  hBlur: WGSL_HBLUR,
  libs: {
    './lib/color.wgsl': WGSL_COLOR_LIB,
    './lib/math.wgsl': WGSL_MATH_LIB,
    './lib/sdf.wgsl': WGSL_SDF_LIB,
  } as Record<string, string>,
};

export const UPSTREAM_GLSL_SHADERS = {
  vertex: GLSL_VERTEX,
  main: GLSL_MAIN,
  bg: GLSL_BG,
  vBlur: GLSL_VBLUR,
  hBlur: GLSL_HBLUR,
  libs: {
    './lib/color.glsl': GLSL_COLOR_LIB,
    './lib/math.glsl': GLSL_MATH_LIB,
    './lib/sdf.glsl': GLSL_SDF_LIB,
  } as Record<string, string>,
};
