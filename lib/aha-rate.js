/**
 * @ahaslides-product/design/aha-rate — the shared Rate primitive.
 *
 *   import '@ahaslides-product/design/aha-rate';   // registers <aha-rate>
 *   <aha-rate value="3"></aha-rate>
 *
 * A star rating for capturing or displaying a score out of `max`. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. Selection
 * and hover-preview toggle a class on PERSISTENT star nodes (no subtree rebuild), so the fill
 * animates. Emits a composed `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:inline-flex }
  .stars{ display:inline-flex; gap:4px; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .star{ display:inline-flex; padding:0; border:0; background:none; cursor:pointer; line-height:0;
    outline:2px solid transparent; outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .star svg{ width:24px; height:24px; fill:var(--aha-gray-40,#E3E3E3);
    transition:fill var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), transform var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .star.on svg{ fill:var(--aha-yellow-50,#FFE32C) }
  .star:hover svg{ transform:scale(1.12) }
  .star:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }
  :host([readonly]) .star, :host([disabled]) .star{ cursor:default }
  :host([disabled]){ opacity:.4 }
  :host([disabled]) .star:hover svg{ transform:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94z"/></svg>'; // ds-lint-allow: svg (star glyph — sub-glyph chrome drawn on the rating fill, not a catalogue icon)

export class AhaRate extends HTMLElement {
  static get observedAttributes() { return ['value']; }
  attributeChangedCallback() { this._paint(this.value); this._syncState(); }

  get max() { return Math.max(1, parseInt(this.getAttribute('max') || '5', 10)); }
  get value() { return parseFloat(this.getAttribute('value') || '0') || 0; }
  set value(v) { this.setAttribute('value', String(v)); this._paint(this.value); this._syncState(); }
  get readonly() { return this.hasAttribute('readonly'); }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const stars = Array.from({ length: this.max }, (_, i) =>
      `<button class="star" type="button" part="star" role="radio" aria-label="${i + 1} of ${this.max}" data-i="${i + 1}">${STAR}</button>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="stars" role="radiogroup">${stars}</span>`;
    this._buttons = Array.from(this.shadowRoot.querySelectorAll('.star'));
    this._paint(this.value);
    this._syncState();
    if (this.readonly || this.disabled) {
      this._buttons.forEach((btn) => { btn.tabIndex = -1; });
      return;
    }
    this._buttons.forEach((btn) => {
      const n = Number(btn.dataset.i);
      btn.addEventListener('mouseenter', () => this._paint(n));
      btn.addEventListener('click', () => {
        this.setAttribute('value', String(n));
        this._paint(n);
        this._syncState();
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: n } }));
      });
    });
    const group = this.shadowRoot.querySelector('.stars');
    group.addEventListener('mouseleave', () => this._paint(this.value));
    group.addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    const max = this.max;
    let v = this.value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': v = Math.min(max, v + 1); break;
      case 'ArrowLeft': case 'ArrowDown': v = Math.max(1, v - 1); break;
      case 'Home': v = 1; break;
      case 'End': v = max; break;
      default: return;
    }
    e.preventDefault();
    this.setAttribute('value', String(v));
    this._paint(v);
    this._syncState();
    if (this._buttons[v - 1]) this._buttons[v - 1].focus();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: v } }));
  }

  // Visual fill only — also used for hover preview, so it must not touch aria.
  _paint(n) {
    if (!this._buttons) return;
    this._buttons.forEach((btn, i) => btn.classList.toggle('on', i < n));
  }

  _syncState() {
    if (!this._buttons) return;
    const v = this.value;
    let hasChecked = false;
    this._buttons.forEach((btn, i) => {
      const checked = (i + 1) === v;
      if (checked) hasChecked = true;
      btn.setAttribute('aria-checked', checked ? 'true' : 'false');
      btn.tabIndex = checked ? 0 : -1;
    });
    if (!hasChecked && this._buttons[0]) this._buttons[0].tabIndex = 0;
  }
}

export function defineAhaRate(tag = 'aha-rate') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaRate);
  return true;
}
if (typeof window !== 'undefined') defineAhaRate();

export default { AhaRate, defineAhaRate };
