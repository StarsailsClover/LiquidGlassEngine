import { computeGaussianKernel } from '../math/gaussian';
import type { GlassPreset } from '../presets/oxygen-26.0';
import type {
  GlassRendererLike,
  PanelSpec,
  PointerSpec,
  RendererKind,
  RendererShaders,
} from '../renderer-types';
import { expandWgslIncludes } from '../webgpu/shader-include';

export type WebGL2GlassRendererInit = {
  canvas: HTMLCanvasElement;
  shaders: RendererShaders;
};

const VERTICES = new Float32Array([
  -1, -1, 0, 1,
  1, -1, 0, 1,
  -1, 1, 0, 1,
  1, 1, 0, 1,
]);
const MAX_BLUR_RADIUS = 200;

type UniformMap = Map<string, WebGLUniformLocation>;

type CompiledProgram = {
  program: WebGLProgram;
  uniforms: UniformMap;
};

type RenderTarget = {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
};

export class WebGL2GlassRenderer implements GlassRendererLike {
  readonly kind: RendererKind = 'webgl2';
  readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly bgProgram: CompiledProgram;
  private readonly vBlurProgram: CompiledProgram;
  private readonly hBlurProgram: CompiledProgram;
  private readonly mainProgram: CompiledProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly sourceTexture: WebGLTexture;
  private bgTarget: RenderTarget | null = null;
  private vBlurTarget: RenderTarget | null = null;
  private hBlurTarget: RenderTarget | null = null;
  private targetWidth = 0;
  private targetHeight = 0;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private destroyed = false;

  constructor(init: WebGL2GlassRendererInit) {
    this.canvas = init.canvas;
    const gl = init.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl;

    const resolve = (path: string) => init.shaders.libs[path];
    const expand = (source: string) => expandWgslIncludes(source, resolve);
    this.bgProgram = this.createProgram(expand(init.shaders.vertex), expand(init.shaders.bg));
    this.vBlurProgram = this.createProgram(expand(init.shaders.vertex), expand(init.shaders.vBlur));
    this.hBlurProgram = this.createProgram(expand(init.shaders.vertex), expand(init.shaders.hBlur));
    this.mainProgram = this.createProgram(expand(init.shaders.vertex), expand(init.shaders.main));

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Failed to create WebGL2 VAO');
    this.vao = vao;
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Failed to create WebGL2 vertex buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.bindVertexArray(null);

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create WebGL2 source texture');
    this.sourceTexture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private compileShader(type: number, source: string, label: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error(`Failed to create ${label} shader`);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? 'unknown shader error';
      gl.deleteShader(shader);
      throw new Error(`${label} shader compile failed: ${log}`);
    }
    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): CompiledProgram {
    const gl = this.gl;
    const vertex = this.compileShader(gl.VERTEX_SHADER, vertexSource, 'vertex');
    const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource, 'fragment');
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create WebGL2 program');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'a_position');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? 'unknown link error';
      gl.deleteProgram(program);
      throw new Error(`WebGL2 program link failed: ${log}`);
    }
    const uniforms: UniformMap = new Map();
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i += 1) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      const location = gl.getUniformLocation(program, info.name);
      if (!location) continue;
      uniforms.set(info.name, location);
      if (info.name.endsWith('[0]')) {
        uniforms.set(info.name.slice(0, -3), location);
      }
    }
    return { program, uniforms };
  }

  private setFloat(
    compiled: CompiledProgram,
    name: string,
    value: number | number[] | Float32Array,
  ): void {
    const gl = this.gl;
    const location = compiled.uniforms.get(name);
    if (!location) return;
    if (typeof value === 'number') {
      gl.uniform1f(location, value);
      return;
    }
    if (value instanceof Float32Array) {
      gl.uniform1fv(location, value);
      return;
    }
    switch (value.length) {
      case 2:
        gl.uniform2fv(location, value);
        break;
      case 3:
        gl.uniform3fv(location, value);
        break;
      case 4:
        gl.uniform4fv(location, value);
        break;
      default:
        gl.uniform1fv(location, value);
    }
  }

  private setInt(compiled: CompiledProgram, name: string, value: number): void {
    const location = compiled.uniforms.get(name);
    if (!location) return;
    this.gl.uniform1i(location, value);
  }

  private createTarget(width: number, height: number): RenderTarget {
    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    if (!framebuffer || !texture) throw new Error('Failed to create WebGL2 render target');
    const floatOk = Boolean(gl.getExtension('EXT_color_buffer_float'));
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      floatOk ? gl.RGBA16F : gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      floatOk ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`WebGL2 framebuffer incomplete: ${status}`);
    }
    return { framebuffer, texture, width, height };
  }

  private disposeTarget(target: RenderTarget | null): void {
    if (!target) return;
    this.gl.deleteFramebuffer(target.framebuffer);
    this.gl.deleteTexture(target.texture);
  }

  private ensureTargets(): void {
    const width = Math.max(1, this.canvas.width);
    const height = Math.max(1, this.canvas.height);
    if (this.bgTarget && this.targetWidth === width && this.targetHeight === height) return;
    this.disposeTarget(this.bgTarget);
    this.disposeTarget(this.vBlurTarget);
    this.disposeTarget(this.hBlurTarget);
    this.bgTarget = this.createTarget(width, height);
    this.vBlurTarget = this.createTarget(width, height);
    this.hBlurTarget = this.createTarget(width, height);
    this.targetWidth = width;
    this.targetHeight = height;
  }

  resize(): void {
    this.ensureTargets();
  }

  uploadSource(canvas: HTMLCanvasElement): void {
    if (this.destroyed) return;
    const gl = this.gl;
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.sourceWidth = width;
    this.sourceHeight = height;
  }

  private bindTexture(texture: WebGLTexture, unit: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  private drawQuad(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  private beginTarget(target: RenderTarget, clearColor: [number, number, number, number]): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private drawBg(preset: GlassPreset, panel: PanelSpec, pointer: PointerSpec): void {
    if (!this.bgTarget) return;
    const gl = this.gl;
    this.beginTarget(this.bgTarget, [0, 0, 0, 1]);
    const program = this.bgProgram;
    gl.useProgram(program.program);
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.setFloat(program, 'u_resolution', [width, height]);
    this.setFloat(program, 'u_dpr', dpr);
    this.setFloat(program, 'u_mouse', [pointer.x * dpr, pointer.y * dpr]);
    this.setFloat(program, 'u_mouseSpring', [
      (panel.x + panel.width / 2) * dpr,
      height - (panel.y + panel.height / 2) * dpr,
    ]);
    this.setFloat(program, 'u_time', performance.now() / 1000);
    this.setFloat(program, 'u_mergeRate', preset.mergeRate);
    this.setFloat(program, 'u_shapeWidth', panel.width);
    this.setFloat(program, 'u_shapeHeight', panel.height);
    this.setFloat(
      program,
      'u_shapeRadius',
      (Math.min(panel.width, panel.height) / 2) * (preset.shapeRadiusPercent / 100),
    );
    this.setFloat(program, 'u_shapeRoundness', preset.shapeRoundness);
    this.setFloat(program, 'u_shadowExpand', preset.shadowExpand);
    this.setFloat(program, 'u_shadowFactor', preset.shadowFactor);
    this.setFloat(program, 'u_shadowPosition', [0, 0]);
    this.setInt(program, 'u_bgType', 11);
    this.setFloat(program, 'u_bgTextureRatio', this.sourceWidth / Math.max(1, this.sourceHeight));
    this.setInt(program, 'u_bgTextureReady', 1);
    this.setInt(program, 'u_showShape1', 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    this.setInt(program, 'u_bgTexture', 0);
    this.drawQuad();
  }

  private drawBlur(
    program: CompiledProgram,
    input: WebGLTexture,
    target: RenderTarget,
    radius: number,
  ): void {
    this.beginTarget(target, [0, 0, 0, 1]);
    const gl = this.gl;
    gl.useProgram(program.program);
    this.setFloat(program, 'u_resolution', [this.canvas.width, this.canvas.height]);
    this.setInt(program, 'u_blurRadius', radius);
    const kernel = computeGaussianKernel(radius);
    const weights = new Float32Array(MAX_BLUR_RADIUS + 1);
    weights.set(kernel);
    this.setFloat(program, 'u_blurWeights', weights);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input);
    this.setInt(program, 'u_prevPassTexture', 0);
    this.drawQuad();
  }

  private drawMain(
    preset: GlassPreset,
    panel: PanelSpec,
    pointer: PointerSpec,
    clear: boolean,
  ): void {
    if (!this.bgTarget || !this.hBlurTarget) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const program = this.mainProgram;
    gl.useProgram(program.program);
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.setFloat(program, 'u_resolution', [width, height]);
    this.setFloat(program, 'u_dpr', dpr);
    this.setFloat(program, 'u_mouse', [pointer.x * dpr, pointer.y * dpr]);
    this.setFloat(program, 'u_mouseSpring', [
      (panel.x + panel.width / 2) * dpr,
      height - (panel.y + panel.height / 2) * dpr,
    ]);
    this.setFloat(program, 'u_mergeRate', preset.mergeRate);
    this.setFloat(program, 'u_shapeWidth', panel.width);
    this.setFloat(program, 'u_shapeHeight', panel.height);
    this.setFloat(
      program,
      'u_shapeRadius',
      (Math.min(panel.width, panel.height) / 2) * (preset.shapeRadiusPercent / 100),
    );
    this.setFloat(program, 'u_shapeRoundness', preset.shapeRoundness);
    this.setFloat(program, 'u_tint', preset.tint);
    this.setFloat(program, 'u_refThickness', preset.refThickness);
    this.setFloat(program, 'u_refDistance', preset.refDistance);
    this.setFloat(program, 'u_refFactor', preset.refFactor);
    this.setFloat(program, 'u_refDispersion', preset.refDispersion);
    this.setFloat(program, 'u_refFresnelRange', preset.refFresnelRange);
    this.setFloat(program, 'u_refFresnelFactor', preset.refFresnelFactor);
    this.setFloat(program, 'u_refFresnelHardness', preset.refFresnelHardness);
    this.setFloat(program, 'u_glareRange', preset.glareRange);
    this.setFloat(program, 'u_glareConvergence', preset.glareConvergence);
    this.setFloat(program, 'u_glareOppositeFactor', preset.glareOppositeFactor);
    this.setFloat(program, 'u_glareFactor', preset.glareFactor);
    this.setFloat(program, 'u_glareHardness', preset.glareHardness);
    this.setFloat(program, 'u_glareAngle', (preset.glareAngleDeg * Math.PI) / 180);
    this.setInt(program, 'u_blurEdge', preset.blurEdge ? 1 : 0);
    this.setInt(program, 'u_showShape1', 0);
    this.setInt(program, 'STEP', 9);
    this.bindTexture(this.bgTarget.texture, 0);
    this.bindTexture(this.hBlurTarget.texture, 1);
    this.setInt(program, 'u_bg', 0);
    this.setInt(program, 'u_blurredBg', 1);
    this.drawQuad();
    gl.disable(gl.BLEND);
  }

  render(
    preset: GlassPreset,
    panel: PanelSpec,
    pointer: PointerSpec,
    options?: { clear?: boolean },
  ): void {
    if (this.destroyed) return;
    this.ensureTargets();
    if (!this.bgTarget || !this.vBlurTarget || !this.hBlurTarget) return;
    const clear = options?.clear !== false;
    this.drawBg(preset, panel, pointer);
    this.drawBlur(this.vBlurProgram, this.bgTarget.texture, this.vBlurTarget, preset.blurRadius);
    this.drawBlur(this.hBlurProgram, this.vBlurTarget.texture, this.hBlurTarget, preset.blurRadius);
    this.drawMain(preset, panel, pointer, clear);
  }

  clear(): void {
    if (this.destroyed) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  destroy(): void {
    this.destroyed = true;
    const gl = this.gl;
    this.disposeTarget(this.bgTarget);
    this.disposeTarget(this.vBlurTarget);
    this.disposeTarget(this.hBlurTarget);
    gl.deleteTexture(this.sourceTexture);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.bgProgram.program);
    gl.deleteProgram(this.vBlurProgram.program);
    gl.deleteProgram(this.hBlurProgram.program);
    gl.deleteProgram(this.mainProgram.program);
  }
}
