export {
  detectCapabilities,
  type CapabilityEnv,
  type HtmlInCanvasCapability,
  type LgeCapabilities,
} from './capabilities';
export { createLaneAController, type LaneAController, type LaneAOptions } from './content/laneA';
export {
  buildForeignObjectSvg,
  createLaneBController,
  rasterizeElement,
  type LaneBController,
  type LaneBOptions,
} from './content/laneB';
export { computeGaussianKernel } from './math/gaussian';
export { OXYGEN_PRESET, SMALL_CONTROL_PRESET, type GlassPreset } from './presets/oxygen-26.0';
export type {
  GlassRendererLike,
  PanelSpec,
  PointerSpec,
  RendererKind,
  RendererShaders,
} from './renderer-types';
export {
  createLiquidGlassScene,
  type GlassSurface,
  type GlassSurfaceOptions,
  type LiquidGlassScene,
  type LiquidGlassSceneOptions,
  type SceneLane,
  type SceneRendererPreference,
} from './scene';
export { GlassRenderer, type GlassRendererInit } from './webgpu/glass-renderer';
export { expandWgslIncludes } from './webgpu/shader-include';
export { MAIN_UNIFORM_BYTES, packMainUniforms, type MainPassUniforms } from './webgpu/uniforms';
export { WebGL2GlassRenderer, type WebGL2GlassRendererInit } from './webgl2/glass-renderer';
