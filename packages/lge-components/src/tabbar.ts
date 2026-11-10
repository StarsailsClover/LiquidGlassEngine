import { LgeGlassElement } from './base';

const STYLE = `
lge-tabbar { display: inline-flex; vertical-align: middle; }
.lge-tabbar-surface {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border-radius: 999px;
  color: inherit;
}
.lge-tabbar-surface > button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 8px 15px;
  background: transparent;
  color: inherit;
  font: 600 13px/1.1 "Segoe UI", system-ui, sans-serif;
  cursor: pointer;
}
.lge-tabbar-surface > button[aria-selected="true"] {
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
}
lge-tabbar[hidden] { display: none; }
`;

export class LgeTabbarElement extends LgeGlassElement {
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
    surface.className = 'lge-tabbar-surface';
    surface.setAttribute('role', 'tablist');
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
