export type GlassPreset = {
  refThickness: number;
  refDistance: number;
  refFactor: number;
  refDispersion: number;
  refFresnelRange: number;
  refFresnelHardness: number;
  refFresnelFactor: number;
  glareRange: number;
  glareHardness: number;
  glareConvergence: number;
  glareOppositeFactor: number;
  glareFactor: number;
  glareAngleDeg: number;
  blurRadius: number;
  blurEdge: boolean;
  tint: [number, number, number, number];
  shadowExpand: number;
  shadowFactor: number;
  shapeRoundness: number;
  shapeRadiusPercent: number;
  mergeRate: number;
};

/**
 * Organization reference preset (design pipeline 2026-11-09) mapped onto the
 * liquid-glass-studio parameter contract. UI-scale values are normalized the
 * same way as upstream: hardness/convergence/factors are divided by 100.
 */
export const OXYGEN_PRESET: GlassPreset = {
  refThickness: 20,
  refDistance: 0.05,
  refFactor: 1.5,
  refDispersion: 9.5,
  refFresnelRange: 33.5,
  refFresnelHardness: 0.5,
  refFresnelFactor: 0.2,
  glareRange: 30,
  glareHardness: 0.2,
  glareConvergence: 0.5,
  glareOppositeFactor: 0.8,
  glareFactor: 0.9,
  glareAngleDeg: -45,
  blurRadius: 30,
  blurEdge: true,
  tint: [1, 1, 1, 0],
  shadowExpand: 25,
  shadowFactor: 0.15,
  shapeRoundness: 7,
  shapeRadiusPercent: 100,
  mergeRate: 0.05,
};

export const SMALL_CONTROL_PRESET: GlassPreset = {
  ...OXYGEN_PRESET,
  shapeRoundness: 2,
};
