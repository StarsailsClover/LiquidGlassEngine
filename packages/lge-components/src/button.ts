// GitHub@Starsa   il s Clove   r
import { normalizeSize, normalizeVariant } from './attributes';
import { LgeGlassElement } from './base';

const STYLE = `
lge-button { display: inline-block; vertical-align: middle; }
.lge-button-native {
  appearance: none;
  border: 0;
  margin: 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: 600 15px/1.1 "Segoe UI", system-ui, sans-serif;
  cursor: pointer;
}
.lge-button-native[data-size="small"] { padding: 6px 12px; font-size: 13px; }
.lge-button-native[data-size="large"] { padding: 11px 20px; font-size: 17px; }
.lge-button-native[data-variant="prominent"] { color: #fff; }
lge-button[hidden] { display: none; }
`;

export class LgeButtonElement extends LgeGlassElement {
  static observedAttributes = ['variant', 'size', 'disabled', 'hidden'];
  private button: HTMLButtonElement | null = null;

  protected get glassTarget(): HTMLElement {
    return this;
  }

  protected initialize(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.prepend(style);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lge-button-native';
    for (const node of Array.from(this.childNodes)) {
      if (node !== style) button.appendChild(node);
    }
    this.appendChild(button);
    this.button = button;
    this.sync();
  }

  attributeChangedCallback(): void {
    this.attributeChanged();
  }

  protected sync(): void {
    if (!this.button) return;
    this.button.disabled = this.hasAttribute('disabled');
    this.button.dataset.variant = normalizeVariant(this.getAttribute('variant'));
    this.button.dataset.size = normalizeSize(this.getAttribute('size'));
  }
}
