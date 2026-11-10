export type MainPassUniforms = {
  u_resolution?: [number, number];
  u_dpr?: number;
  u_mouse?: [number, number];
  u_mouseSpring?: [number, number];
  u_shapeWidth?: number;
  u_shapeHeight?: number;
  u_shapeRadius?: number;
  u_shapeRoundness?: number;
  u_mergeRate?: number;
  u_glareAngle?: number;
  u_shadowExpand?: number;
  u_shadowFactor?: number;
  u_shadowPosition?: [number, number];
  u_bgTextureRatio?: number;
  u_bgType?: number;
  u_bgTextureReady?: number;
  u_showShape1?: number;
  u_blurRadius?: number;
  u_blurEdge?: number;
  u_tint?: [number, number, number, number];
  u_refThickness?: number;
  u_refFactor?: number;
  u_refDispersion?: number;
  u_refFresnelRange?: number;
  u_refFresnelHardness?: number;
  u_refFresnelFactor?: number;
  u_glareRange?: number;
  u_glareHardness?: number;
  u_glareConvergence?: number;
  u_glareOppositeFactor?: number;
  u_glareFactor?: number;
  u_refDistance?: number;
};

export const MAIN_UNIFORM_BYTES = 160;

/**
 * Ported from liquid-glass-studio `GPUUtils.createMainUniformBuffer`
 * (MIT, Copyright (c) 2024 Charles Yin). Field offsets match the WGSL
 * `Uniforms` struct in fragment-main.wgsl exactly.
 */
export function packMainUniforms(uniforms: MainPassUniforms): ArrayBuffer {
  const data = new ArrayBuffer(MAIN_UNIFORM_BYTES);
  const f32 = new Float32Array(data);
  const i32 = new Int32Array(data);

  const res = uniforms.u_resolution ?? [0, 0];
  f32[0] = res[0];
  f32[1] = res[1];
  f32[2] = uniforms.u_dpr ?? 1;
  f32[3] = 0;
  const mouse = uniforms.u_mouse ?? [0, 0];
  f32[4] = mouse[0];
  f32[5] = mouse[1];
  const mouseSpring = uniforms.u_mouseSpring ?? [0, 0];
  f32[6] = mouseSpring[0];
  f32[7] = mouseSpring[1];
  f32[8] = uniforms.u_shapeWidth ?? 200;
  f32[9] = uniforms.u_shapeHeight ?? 200;
  f32[10] = uniforms.u_shapeRadius ?? 80;
  f32[11] = uniforms.u_shapeRoundness ?? 5;
  f32[12] = uniforms.u_mergeRate ?? 0.05;
  f32[13] = uniforms.u_glareAngle ?? 0;
  f32[14] = uniforms.u_shadowExpand ?? 25;
  f32[15] = uniforms.u_shadowFactor ?? 0.15;
  const shadowPosition = uniforms.u_shadowPosition ?? [0, 0];
  f32[16] = shadowPosition[0];
  f32[17] = shadowPosition[1];
  f32[18] = uniforms.u_bgTextureRatio ?? 1;
  i32[19] = uniforms.u_bgType ?? 0;
  i32[20] = uniforms.u_bgTextureReady ?? 0;
  i32[21] = uniforms.u_showShape1 ?? 1;
  i32[22] = uniforms.u_blurRadius ?? 1;
  i32[23] = uniforms.u_blurEdge ?? 1;
  const tint = uniforms.u_tint ?? [1, 1, 1, 0];
  f32[24] = tint[0];
  f32[25] = tint[1];
  f32[26] = tint[2];
  f32[27] = tint[3];
  f32[28] = uniforms.u_refThickness ?? 20;
  f32[29] = uniforms.u_refFactor ?? 1.4;
  f32[30] = uniforms.u_refDispersion ?? 7;
  f32[31] = uniforms.u_refFresnelRange ?? 30;
  f32[32] = uniforms.u_refFresnelHardness ?? 0.2;
  f32[33] = uniforms.u_refFresnelFactor ?? 0.2;
  f32[34] = uniforms.u_glareRange ?? 30;
  f32[35] = uniforms.u_glareHardness ?? 0.2;
  f32[36] = uniforms.u_glareConvergence ?? 0.5;
  f32[37] = uniforms.u_glareOppositeFactor ?? 0.8;
  f32[38] = uniforms.u_glareFactor ?? 0.9;
  f32[39] = uniforms.u_refDistance ?? 0.05;

  return data;
}
