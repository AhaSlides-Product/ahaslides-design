/**
 * @ahaslides-product/design/aha-add-item-button — the full-width "+ Add" affordance.
 *
 *   import '@ahaslides-product/design/aha-add-item-button';   // registers <aha-add-item-button>
 *   <aha-add-item-button label="Add option"></aha-add-item-button>
 *   <aha-add-item-button label="Add question" disabled></aha-add-item-button>
 *
 * The full-width add row that sits under a settings list (OptionRow / QuestionList). It IS the DS
 * secondary Button (<aha-button variant="secondary" size="md" block>): white fill, 1px #E3E3E3 border,
 * radius 8, 36 high, a leading system-plus glyph + the label in 14/600 default text, and the Button's
 * own hover, press, focus and disabled states. On click it emits a composed `add` CustomEvent so the
 * host can append a new item. When it hits the max item count the host sets `disabled`.
 *
 * Shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. The `+` icon is
 * decorative; the label carries the accessible name.
 */
import './aha-button.js';
import './icons.js';

const STYLE = `
  :host{ display:block; width:100%; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  aha-icon{ display:inline-flex; color:currentColor }
`;

export class AhaAddItemButton extends HTMLElement {
  static get observedAttributes() { return ['label', 'disabled']; }

  get label() { return this.getAttribute('label') ?? 'Add'; }
  set label(v) { this.setAttribute('label', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._button) this._render();
    this._sync();
  }
  attributeChangedCallback() { this._sync(); }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<aha-button part="button" variant="secondary" size="md" block>` +
        `<aha-icon slot="icon" name="system-plus" size="16" decorative></aha-icon>` +
        `<span class="label" part="label"></span>` +
      `</aha-button>`;
    this._button = this.shadowRoot.querySelector('aha-button');
    this._button.addEventListener('click', (e) => {
      if (this.disabled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      this.dispatchEvent(new CustomEvent('add', { bubbles: true, composed: true, detail: {} }));
    });
  }
  _sync() {
    if (!this._button) return;
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') ?? 'Add';
    this._button.toggleAttribute('disabled', this.disabled);
    if (this.disabled) this._button.setAttribute('aria-disabled', 'true'); else this._button.removeAttribute('aria-disabled');
  }
}

export function defineAhaAddItemButton(tag = 'aha-add-item-button') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAddItemButton);
  return true;
}
if (typeof window !== 'undefined') defineAhaAddItemButton();

export default { AhaAddItemButton, defineAhaAddItemButton };
