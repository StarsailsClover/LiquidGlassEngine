import { LgeGlassElement } from './base';

const STYLE = `
lge-toolbar { display: inline-flex; vertical-align: middle; }
.lge-toolbar-surface {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  color: inherit;
}
.lge-toolbar-surface > button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: transparent;
  color: inherit;
  font: 600 14px/1.1 "Segoe UI", system-ui, sans-serif;
  cursor: pointer;
}
.lge-toolbar-surface > button:hover { background: rgba(255, 255, 255, 0.12); }
lge-toolbar[hidden] { display: none; }
`;

export class LgeToolbarElement extends LgeGlassElement {
  static observedAttributes = ['hidden'];
  private surfaceElement: HTMLDivElement | null = null;

  protected get glassTarget(): HTMLElement {
    return this;
  }

  protected initialize(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.prepend(style);
    const surface = document.createElement('div');
    surface.className = 'lge-toolbar-surface';
    for (const node of Array.from(this.childNodes)) {
      if (node !== style) surface.appendChild(node);
    }
    this.appendChild(surface);
    this.surfaceElement = surface;
    this.sync();
  }

  attributeChangedCallback(): void {
    this.attributeChanged();
  }

  protected sync(): void {
    if (this.surfaceElement) this.surfaceElement.hidden = this.hasAttribute('hidden');
  }
}
