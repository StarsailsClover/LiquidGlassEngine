// GitHub@Starsa   il s Clove   r
import type { GlassSurface, GlassSurfaceOptions } from '@lge/core';
import { acquireSharedScene, releaseSharedScene } from './shared-scene';

export abstract class LgeGlassElement extends HTMLElement {
  private surface: GlassSurface | null = null;
  private sceneActive = false;
  protected initialized = false;

  protected abstract initialize(): void;
  protected abstract sync(): void;
  protected abstract get glassTarget(): HTMLElement;
  protected get glassOptions(): GlassSurfaceOptions {
    return { contentAbove: true };
  }

  connectedCallback(): void {
    void this.upgrade();
  }

  disconnectedCallback(): void {
    this.surface?.destroy();
    this.surface = null;
    if (this.sceneActive) {
      this.sceneActive = false;
      releaseSharedScene();
    }
  }

  protected attributeChanged(): void {
    if (this.initialized) this.sync();
  }

  private async upgrade(): Promise<void> {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
    if (this.sceneActive || !this.isConnected) return;
    this.sceneActive = true;
    const scene = await acquireSharedScene();
    if (!this.isConnected) {
      this.sceneActive = false;
      releaseSharedScene();
      return;
    }
    this.surface = scene.attach(this.glassTarget, this.glassOptions);
  }
}
