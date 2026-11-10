// Git Hub@St   ars  ai l  s C  lo ver
import { LgeGlassElement } from './base';

const STYLE = `
lge-toggle { display: inline-flex; vertical-align: middle; }
.lge-toggle-native {
  appearance: none;
  position: relative;
  width: 64px;
  height: 28px;
  margin: 0;
  border: 0;
  border-radius: 28px;
  background: rgba(120, 120, 128, 0.28);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  cursor: pointer;
  transition: background 160ms ease, box-shadow 160ms ease;
}
.lge-toggle-native::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.32);
  transition: transform 160ms ease, width 120ms ease;
}
.lge-toggle-native:checked { background: rgba(52, 199, 89, 0.82); }
.lge-toggle-native:checked::after { transform: translateX(36px); }
.lge-toggle-native:active::after { width: 28px; }
.lge-toggle-native:checked:active::after { transform: translateX(32px); }
.lge-toggle-native:focus-visible { outline: 2px solid #7fb6ff; outline-offset: 2px; }
.lge-toggle-native:disabled { opacity: 0.5; cursor: default; }
@media (prefers-color-scheme: light) {
  .lge-toggle-native { background: rgba(120, 120, 128, 0.22); }
  .lge-toggle-native::after { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18); }
}
@media (prefers-reduced-motion: reduce) {
  .lge-toggle-native, .lge-toggle-native::after { transition: none; }
}
lge-toggle[hidden] { display: none; }
`;

export class LgeToggleElement extends LgeGlassElement {
  static observedAttributes = ['checked', 'disabled', 'hidden'];
  private input: HTMLInputElement | null = null;

  protected get glassTarget(): HTMLElement {
    return this;
  }

  protected initialize(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.appendChild(style);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'lge-toggle-native';
    input.setAttribute('role', 'switch');
    input.addEventListener('change', () => {
      this.toggleAttribute('checked', input.checked);
    });
    this.appendChild(input);
    this.input = input;
    this.sync();
  }

  attributeChangedCallback(): void {
    this.attributeChanged();
  }

  get checked(): boolean {
    return this.input?.checked ?? this.hasAttribute('checked');
  }

  set checked(next: boolean) {
    this.toggleAttribute('checked', next);
    if (this.input) this.input.checked = next;
  }

  protected sync(): void {
    if (!this.input) return;
    this.input.checked = this.hasAttribute('checked');
    this.input.disabled = this.hasAttribute('disabled');
  }
}
