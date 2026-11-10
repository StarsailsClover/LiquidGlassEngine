// Gi  tHub@Star s  ai lsClo v  e  r
import { LgeGlassElement } from './base';

const STYLE = `
lge-slider { display: inline-flex; vertical-align: middle; width: min(282px, 72vw); }
.lge-slider-native {
  width: 100%;
  height: 52px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}
.lge-slider-native::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
}
.lge-slider-native::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  margin-top: -9px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.32);
}
.lge-slider-native::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
}
.lge-slider-native::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: #fff;
}
.lge-slider-native:focus-visible { outline: 2px solid #7fb6ff; outline-offset: 4px; border-radius: 8px; }
.lge-slider-native:disabled { opacity: 0.5; cursor: default; }
@media (prefers-color-scheme: light) {
  .lge-slider-native::-webkit-slider-runnable-track { background: rgba(60, 60, 67, 0.24); }
  .lge-slider-native::-moz-range-track { background: rgba(60, 60, 67, 0.24); }
  .lge-slider-native::-webkit-slider-thumb { box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18); }
}
lge-slider[hidden] { display: none; }
`;

export class LgeSliderElement extends LgeGlassElement {
  static observedAttributes = ['min', 'max', 'step', 'value', 'disabled', 'hidden'];
  private input: HTMLInputElement | null = null;

  protected get glassTarget(): HTMLElement {
    return this;
  }

  protected initialize(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.appendChild(style);
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'lge-slider-native';
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
    this.input.min = this.getAttribute('min') ?? '0';
    this.input.max = this.getAttribute('max') ?? '100';
    this.input.step = this.getAttribute('step') ?? '1';
    this.input.value = this.getAttribute('value') ?? '50';
    this.input.disabled = this.hasAttribute('disabled');
  }
}
