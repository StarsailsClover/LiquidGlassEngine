// Git  Hu b@St a  r  s   ails Cl o   ver
import { computeGaussianKernel } from '../math/gaussian';
import type { GlassPreset } from '../presets/oxygen-26.0';
import type {
  GlassRendererLike,
  PanelSpec,
  PointerSpec,
  RendererKind,
  RendererShaders,
} from '../renderer-types';
import { expandWgslIncludes } from './shader-include';
import { MAIN_UNIFORM_BYTES, packMainUniforms, type MainPassUniforms } from './uniforms';

export type GlassRendererInit = {
  canvas: HTMLCanvasElement;
  device: GPUDevice;
  format?: GPUTextureFormat;
  shaders: RendererShaders;
};

const VERTICES = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const BLUR_UNIFORM_BYTES = 16;
const MAX_BLUR_RADIUS = 200;
const WEIGHTS_BYTES = (MAX_BLUR_RADIUS + 1) * 4 + 12;
const OFFSCREEN_FORMAT: GPUTextureFormat = 'rgba16float';

export class GlassRenderer implements GlassRendererLike {
  readonly kind: RendererKind = 'webgpu';
  readonly canvas: HTMLCanvasElement;
  private readonly device: GPUDevice;
  private readonly context: GPUCanvasContext;
  private readonly format: GPUTextureFormat;
  private readonly sampler: GPUSampler;
  private readonly bgPipeline: GPURenderPipeline;
  private readonly vBlurPipeline: GPURenderPipeline;
  private readonly hBlurPipeline: GPURenderPipeline;
  private readonly mainPipeline: GPURenderPipeline;
  private readonly mainUniform: GPUBuffer;
  private readonly blurUniform: GPUBuffer;
  private readonly weightsBuffer: GPUBuffer;
  private readonly vertexBuffer: GPUBuffer;
  private sourceTexture: GPUTexture | null = null;
  private bgTexture: GPUTexture | null = null;
  private vBlurTexture: GPUTexture | null = null;
  private hBlurTexture: GPUTexture | null = null;
  private bgBind: GPUBindGroup | null = null;
  private vBlurBind: GPUBindGroup | null = null;
  private hBlurBind: GPUBindGroup | null = null;
  private mainBind: GPUBindGroup | null = null;
  private offscreenWidth = 0;
  private offscreenHeight = 0;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private weightsRadius = -1;
  private destroyed = false;

  constructor(init: GlassRendererInit) {
    this.canvas = init.canvas;
    this.device = init.device;
    const context = init.canvas.getContext('webgpu');
    if (!context) throw new Error('WebGPU canvas context unavailable');
    this.context = context;
    this.format = init.format ?? navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    const resolve = (path: string) => init.shaders.libs[path];
    const module = (source: string) =>
      this.device.createShaderModule({ code: expandWgslIncludes(source, resolve) });
    const vertexModule = module(init.shaders.vertex);
    const bgModule = module(init.shaders.bg);
    const vBlurModule = module(init.shaders.vBlur);
    const hBlurModule = module(init.shaders.hBlur);
    const mainModule = module(init.shaders.main);

    this.bgPipeline = this.createPipeline(vertexModule, bgModule, OFFSCREEN_FORMAT, false);
    this.vBlurPipeline = this.createPipeline(vertexModule, vBlurModule, OFFSCREEN_FORMAT, false);
    this.hBlurPipeline = this.createPipeline(vertexModule, hBlurModule, OFFSCREEN_FORMAT, false);
    this.mainPipeline = this.createPipeline(vertexModule, mainModule, this.format, true);

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    this.mainUniform = this.device.createBuffer({
      size: MAIN_UNIFORM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.blurUniform = this.device.createBuffer({
      size: BLUR_UNIFORM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.weightsBuffer = this.device.createBuffer({
      size: WEIGHTS_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.vertexBuffer = this.device.createBuffer({
      size: VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, VERTICES);
  }

  private createPipeline(
    vertexModule: GPUShaderModule,
    fragmentModule: GPUShaderModule,
    format: GPUTextureFormat,
    blend: boolean,
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: vertexModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 8,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          },
        ],
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: blend
              ? {
                  color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                  alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                }
              : undefined,
          },
        ],
      },
      primitive: { topology: 'triangle-strip' },
    });
  }

  private invalidateBindGroups(): void {
    this.bgBind = null;
    this.vBlurBind = null;
    this.hBlurBind = null;
    this.mainBind = null;
  }

  private ensureOffscreen(): void {
    const width = Math.max(1, this.canvas.width);
    const height = Math.max(1, this.canvas.height);
    if (this.bgTexture && this.offscreenWidth === width && this.offscreenHeight === height) {
      return;
    }
    this.bgTexture?.destroy();
    this.vBlurTexture?.destroy();
    this.hBlurTexture?.destroy();
    const usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
    this.bgTexture = this.device.createTexture({ size: [width, height], format: OFFSCREEN_FORMAT, usage });
    this.vBlurTexture = this.device.createTexture({ size: [width, height], format: OFFSCREEN_FORMAT, usage });
    this.hBlurTexture = this.device.createTexture({ size: [width, height], format: OFFSCREEN_FORMAT, usage });
    this.offscreenWidth = width;
    this.offscreenHeight = height;
    this.invalidateBindGroups();
  }

  private ensureSource(width: number, height: number): void {
    if (this.sourceTexture && this.sourceWidth === width && this.sourceHeight === height) return;
    this.sourceTexture?.destroy();
    this.sourceTexture = this.device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.sourceWidth = width;
    this.sourceHeight = height;
    this.invalidateBindGroups();
  }

  resize(): void {
    this.ensureOffscreen();
  }

  uploadSource(canvas: HTMLCanvasElement): void {
    if (this.destroyed) return;
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    this.ensureSource(width, height);
    if (!this.sourceTexture) return;
    this.device.queue.copyExternalImageToTexture(
      { source: canvas, flipY: false },
      { texture: this.sourceTexture },
      [width, height],
    );
  }

  private getBgBind(): GPUBindGroup | null {
    if (!this.bgTexture || !this.sourceTexture) return null;
    if (!this.bgBind) {
      this.bgBind = this.device.createBindGroup({
        layout: this.bgPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.mainUniform } },
          { binding: 1, resource: this.sourceTexture.createView() },
          { binding: 2, resource: this.sampler },
        ],
      });
    }
    return this.bgBind;
  }

  private getBlurBind(kind: 'v' | 'h'): GPUBindGroup | null {
    const input = kind === 'v' ? this.bgTexture : this.vBlurTexture;
    if (!input) return null;
    const cached = kind === 'v' ? this.vBlurBind : this.hBlurBind;
    if (cached) return cached;
    const pipeline = kind === 'v' ? this.vBlurPipeline : this.hBlurPipeline;
    const bind = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.blurUniform } },
        { binding: 1, resource: input.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: this.weightsBuffer } },
      ],
    });
    if (kind === 'v') this.vBlurBind = bind;
    else this.hBlurBind = bind;
    return bind;
  }

  private getMainBind(): GPUBindGroup | null {
    if (!this.bgTexture || !this.hBlurTexture) return null;
    if (!this.mainBind) {
      this.mainBind = this.device.createBindGroup({
        layout: this.mainPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.mainUniform } },
          { binding: 1, resource: this.hBlurTexture.createView() },
          { binding: 2, resource: this.bgTexture.createView() },
          { binding: 3, resource: this.sampler },
        ],
      });
    }
    return this.mainBind;
  }

  private writeUniforms(preset: GlassPreset, panel: PanelSpec, pointer: PointerSpec): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const centerX = (panel.x + panel.width / 2) * dpr;
    const centerY = (panel.y + panel.height / 2) * dpr;
    const uniforms: MainPassUniforms = {
      u_resolution: [width, height],
      u_dpr: dpr,
      u_mouse: [pointer.x * dpr, pointer.y * dpr],
      u_mouseSpring: [centerX, height - centerY],
      u_shapeWidth: panel.width,
      u_shapeHeight: panel.height,
      u_shapeRadius: (Math.min(panel.width, panel.height) / 2) * (preset.shapeRadiusPercent / 100),
      u_shapeRoundness: preset.shapeRoundness,
      u_mergeRate: preset.mergeRate,
      u_glareAngle: (preset.glareAngleDeg * Math.PI) / 180,
      u_shadowExpand: preset.shadowExpand,
      u_shadowFactor: preset.shadowFactor,
      u_shadowPosition: [0, 0],
      u_bgTextureRatio: this.sourceWidth / Math.max(1, this.sourceHeight),
      u_bgType: 11,
      u_bgTextureReady: 1,
      u_showShape1: 0,
      u_blurRadius: preset.blurRadius,
      u_blurEdge: preset.blurEdge ? 1 : 0,
      u_tint: preset.tint,
      u_refThickness: preset.refThickness,
      u_refFactor: preset.refFactor,
      u_refDispersion: preset.refDispersion,
      u_refFresnelRange: preset.refFresnelRange,
      u_refFresnelHardness: preset.refFresnelHardness,
      u_refFresnelFactor: preset.refFresnelFactor,
      u_glareRange: preset.glareRange,
      u_glareHardness: preset.glareHardness,
      u_glareConvergence: preset.glareConvergence,
      u_glareOppositeFactor: preset.glareOppositeFactor,
      u_glareFactor: preset.glareFactor,
      u_refDistance: preset.refDistance,
    };
    this.device.queue.writeBuffer(this.mainUniform, 0, packMainUniforms(uniforms));

    const blurData = new ArrayBuffer(BLUR_UNIFORM_BYTES);
    new Float32Array(blurData, 0, 2).set([width, height]);
    new Int32Array(blurData, 8, 2).set([preset.blurRadius, 0]);
    this.device.queue.writeBuffer(this.blurUniform, 0, blurData);

    if (this.weightsRadius !== preset.blurRadius) {
      const kernel = computeGaussianKernel(preset.blurRadius);
      const weights = new Float32Array(WEIGHTS_BYTES / 4);
      weights.set(kernel);
      this.device.queue.writeBuffer(this.weightsBuffer, 0, weights);
      this.weightsRadius = preset.blurRadius;
    }
  }

  render(
    preset: GlassPreset,
    panel: PanelSpec,
    pointer: PointerSpec,
    options?: { clear?: boolean },
  ): void {
    if (this.destroyed) return;
    this.ensureOffscreen();
    const bgBind = this.getBgBind();
    const vBlurBind = this.getBlurBind('v');
    const hBlurBind = this.getBlurBind('h');
    const mainBind = this.getMainBind();
    if (!bgBind || !vBlurBind || !hBlurBind || !mainBind) return;
    if (!this.bgTexture || !this.vBlurTexture || !this.hBlurTexture) return;

    this.writeUniforms(preset, panel, pointer);
    const encoder = this.device.createCommandEncoder();

    const runPass = (
      pipeline: GPURenderPipeline,
      bindGroup: GPUBindGroup,
      view: GPUTextureView,
    ) => {
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.draw(4);
      pass.end();
    };

    runPass(this.bgPipeline, bgBind, this.bgTexture.createView());
    runPass(this.vBlurPipeline, vBlurBind, this.vBlurTexture.createView());
    runPass(this.hBlurPipeline, hBlurBind, this.hBlurTexture.createView());

    const mainPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: options?.clear === false ? 'load' : 'clear',
          storeOp: 'store',
        },
      ],
    });
    mainPass.setPipeline(this.mainPipeline);
    mainPass.setBindGroup(0, mainBind);
    mainPass.setVertexBuffer(0, this.vertexBuffer);
    mainPass.draw(4);
    mainPass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  clear(): void {
    if (this.destroyed) return;
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    this.destroyed = true;
    this.sourceTexture?.destroy();
    this.bgTexture?.destroy();
    this.vBlurTexture?.destroy();
    this.hBlurTexture?.destroy();
    this.mainUniform.destroy();
    this.blurUniform.destroy();
    this.weightsBuffer.destroy();
    this.vertexBuffer.destroy();
  }
}
