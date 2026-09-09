/**
 * @ahaslides-product/design/aha-csat — the shared CSAT (satisfaction) primitive.
 *
 *   import '@ahaslides-product/design/aha-csat';   // registers <aha-csat>
 *   <aha-csat prompt="Was this helpful?" source="editor_help"></aha-csat>
 *
 * The shared binary thumbs-up/down satisfaction prompt (feedback pattern) — do NOT build a
 * bespoke rating control. Pass a stable `source` per placement so analytics segmentation is
 * typo-proof; the element emits a composed `rate` CustomEvent<{rating,source}>. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens. The thumbs are the shared <aha-icon> BY NAME.
 * The selected/hover states animate on PERSISTENT button nodes (class toggle, no rebuild).
 */
import './icons.js';   // registers <aha-icon> + the registry (the thumbs come from it)

const STYLE = `
  :host{ display:inline-flex; align-items:center; gap:12px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .prompt{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-secondary,#4A4A4A) }
  .prompt:empty{ display:none }
  .btns{ display:inline-flex; gap:8px }
  .btn{ display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; padding:0;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-icon-muted,#8A8A8A); cursor:pointer;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .btn:hover{ transform:scale(1.08); border-color:var(--aha-border-hover,#D3B4FF); color:var(--aha-color-primary,#6A1EBB) }
  .btn:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .btn.selected{ border-color:var(--aha-color-primary,#6A1EBB); color:var(--aha-color-primary,#6A1EBB) }
  @media (prefers-reduced-motion: reduce){ .btn{ transition:none } .btn:hover{ transform:none } }
`;

export class AhaCsat extends HTMLElement {
  static get observedAttributes() { return ['prompt', 'value']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="prompt" part="prompt"></span>` +
        `<span class="btns"><button class="btn up" part="button" type="button" aria-label="Yes, helpful" aria-pressed="false"><aha-icon name="system-thumbs-up" size="20" decorative></aha-icon></button>` +
        `<button class="btn down" part="button" type="button" aria-label="No, not helpful" aria-pressed="false"><aha-icon name="system-thumbs-down" size="20" decorative></aha-icon></button></span>`;
      this.shadowRoot.querySelector('.up').addEventListener('click', () => this._rate('up'));
      this.shadowRoot.querySelector('.down').addEventListener('click', () => this._rate('down'));
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _rate(rating) {
    this.setAttribute('value', rating);
    this.dispatchEvent(new CustomEvent('rate', { bubbles: true, composed: true, detail: { rating, source: this.getAttribute('source') || '' } }));
  }
  _update() {
    this.shadowRoot.querySelector('.prompt').textContent = this.getAttribute('prompt') || '';
    const value = this.getAttribute('value');
    const up = this.shadowRoot.querySelector('.up'), down = this.shadowRoot.querySelector('.down');
    up.classList.toggle('selected', value === 'up');
    down.classList.toggle('selected', value === 'down');
    // toggle-button state — without it a screen reader can't tell which thumb is chosen (only the CSS .selected changed)
    up.setAttribute('aria-pressed', String(value === 'up'));
    down.setAttribute('aria-pressed', String(value === 'down'));
  }
}

export function defineAhaCsat(tag = 'aha-csat') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCsat);
  return true;
}
if (typeof window !== 'undefined') defineAhaCsat();

export default { AhaCsat, defineAhaCsat };
