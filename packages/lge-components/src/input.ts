// GitHub@Starsa   il s Clove   r
import { LgeGlassElement } from './base';

const STYLE = `
lge-input { display: inline-block; vertical-align: middle; min-width: 180px; }
.lge-input-native {
  width: 100%;
  box-sizing: border-box;
  appearance: none;
  border: 0;
  border-radius: 14px;
  padding: 10px 15px;
  background: transparent;
  color: inherit;
  font: 400 16px/1.3 "Segoe UI", system-ui, sans-serif;
  outline: none;
}
.lge-input-native::placeholder { color: rgba(255, 255, 255, 0.55); }
lge-input[hidden] { display: none; }
`;

export class LgeInputElement extends LgeGlassElement {
  static observedAttributes = ['placeholder', 'type', 'value', 'disabled', 'hidden'];
  private input: HTMLInputElement | null = null;

  protected get glassTarget(): HTMLElement {
    return this;
  }

  protected initialize(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.appendChild(style);
    const input = document.createElement('input');
    input.className = 'lge-input-native';
    input.addEventListener('input', () => {
      if (this.getAttribute('value') !== input.value) {
        this.setAttribute('value', input.value);
      }
    });
    this.appendChild(input);
    this.input = input;
    this.sync();
  }

  attributeChangedCallback(): void {
    this.attributeChanged();
  }

  get value(): string {
    return this.input?.value ?? this.getAttribute('value') ?? '';
  }

  set value(next: string) {
    this.setAttribute('value', next);
    if (this.input) this.input.value = next;
  }

  protected sync(): void {
    if (!this.input) return;
    this.input.placeholder = this.getAttribute('placeholder') ?? '';
    this.input.type = this.getAttribute('type') ?? 'text';
    this.input.disabled = this.hasAttribute('disabled');
    const value = this.getAttribute('value') ?? '';
    if (this.input.value !== value) this.input.value = value;
  }
}
