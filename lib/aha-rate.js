/**
 * @ahaslides-product/design/aha-rate — the shared Rate primitive.
 *
 *   import '@ahaslides-product/design/aha-rate';   // registers <aha-rate>
 *   <aha-rate value="3"></aha-rate>
 *   <aha-rate value="3.5" allow-half></aha-rate>
 *   <aha-rate value="4" icon="system-heart-straight"></aha-rate>   // custom DS character
 *
 * A star rating for capturing or displaying a score out of `count`. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Selection and hover-preview
 * toggle a class / set a --fill width on PERSISTENT star nodes (no subtree rebuild), so the fill
 * animates. Each star is two stacked glyphs — an empty base + a clipped filled overlay — which lets
 * a value fill a star to 50% (`allow-half`). Supply `icon` to swap the star for any DS icon by name
 * (drawn as an outline glyph tinted by the brand fill). Emits a composed `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:inline-flex; color:var(--aha-yellow-50,#FFE32C) }
  .stars{ display:inline-flex; gap:4px; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .star{ position:relative; display:inline-flex; padding:0; border:0; background:none; cursor:pointer; line-height:0; color:inherit;
    outline:2px solid transparent; outline-offset:2px; border-radius:var(--aha-radius-xs,4px);
    transition:transform var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .glyph{ display:inline-flex; line-height:0 }
  .glyph svg{ width:24px; height:24px }
  /* solid star (default character): empty base + gold overlay */
  .star svg path{ fill:var(--aha-gray-40,#E3E3E3);
    transition:fill var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .fill{ position:absolute; inset:0; overflow:hidden; width:0;
    transition:width var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .fill svg path{ fill:currentColor }
  .star.on .fill{ width:100% }
  .star.half .fill{ width:50% }
  /* custom-icon character (outline glyph): empty grey base, filled overlay in the brand colour */
  .star aha-icon{ color:var(--aha-gray-40,#E3E3E3);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .fill aha-icon{ color:currentColor }
  .star:hover{ transform:scale(1.12) }
  .star:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }
  :host([readonly]) .star, :host([disabled]) .star{ cursor:default }
  :host([readonly]) .star:hover, :host([disabled]) .star:hover{ transform:none }
  :host([disabled]){ opacity:.4 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94z"/></svg>'; // ds-lint-allow: svg (star glyph — sub-glyph chrome drawn on the rating fill, not a catalogue icon)

export class AhaRate extends HTMLElement {
  static get observedAttributes() { return ['value', 'count', 'max', 'icon', 'allow-half', 'disabled', 'readonly']; }
  attributeChangedCallback(name) {
    // count/icon/allow-half change the glyph set → rebuild; value/state changes just repaint.
    if (name === 'count' || name === 'max' || name === 'icon' || name === 'allow-half') { this._render(); return; }
    this._paint(this.value); this._syncState();
  }

  get count() { return Math.max(1, parseInt(this.getAttribute('count') || this.getAttribute('max') || '5', 10)); }
  get max() { return this.count; }   // DS V3 names it `count`; `max` kept as an alias
  get value() { return parseFloat(this.getAttribute('value') || '0') || 0; }
  set value(v) { this.setAttribute('value', String(v)); }
  get allowHalf() { return this.hasAttribute('allow-half'); }
  get allowClear() { return this.hasAttribute('allow-clear'); }
  get icon() { return this.getAttribute('icon') || ''; }
  get readonly() { return this.hasAttribute('readonly'); }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() { this._render(); }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const glyph = this.icon
      ? `<aha-icon name="${this.icon}" size="24" decorative></aha-icon>`
      : STAR;
    const stars = Array.from({ length: this.count }, (_, i) =>
      `<button class="star" type="button" part="star" role="radio" aria-label="${i + 1} of ${this.count}" data-i="${i + 1}">` +
      `<span class="glyph base">${glyph}</span><span class="glyph fill" aria-hidden="true">${glyph}</span></button>`).join('');
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
      btn.addEventListener('mousemove', (e) => this._paint(this._hoverValue(btn, n, e)));
      btn.addEventListener('mouseenter', (e) => this._paint(this._hoverValue(btn, n, e)));
      btn.addEventListener('click', (e) => this._commit(this._hoverValue(btn, n, e)));
    });
    const group = this.shadowRoot.querySelector('.stars');
    group.addEventListener('mouseleave', () => this._paint(this.value));
    group.addEventListener('keydown', (e) => this._onKey(e));
  }

  // The value a pointer over star `n` represents — its left half is n-0.5 when allow-half is on.
  _hoverValue(btn, n, e) {
    if (!this.allowHalf) return n;
    const r = btn.getBoundingClientRect();
    return (e && (e.clientX - r.left) < r.width / 2) ? n - 0.5 : n;
  }

  _commit(v) {
    // allow-clear: clicking the current value again clears the rating.
    const next = (this.allowClear && v === this.value) ? 0 : v;
    this.setAttribute('value', String(next));
    this._paint(next);
    this._syncState();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: next } }));
  }

  _onKey(e) {
    const max = this.count;
    const step = this.allowHalf ? 0.5 : 1;
    let v = this.value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': v = Math.min(max, v + step); break;
      case 'ArrowLeft': case 'ArrowDown': v = Math.max(0, v - step); break;
      case 'Home': v = step; break;
      case 'End': v = max; break;
      default: return;
    }
    e.preventDefault();
    this._commit(v);
    const focusIdx = Math.max(0, Math.ceil(v) - 1);
    if (this._buttons[focusIdx]) this._buttons[focusIdx].focus();
  }

  // Visual fill only — also used for hover preview, so it must not touch aria.
  _paint(n) {
    if (!this._buttons) return;
    this._buttons.forEach((btn, i) => {
      const filled = i + 1 <= n;
      const half = !filled && (i + 0.5) < n;   // this star is the half one
      btn.classList.toggle('on', filled);
      btn.classList.toggle('half', half);
    });
  }

  _syncState() {
    if (!this._buttons) return;
    const v = this.value;
    let checkedIdx = -1;
    this._buttons.forEach((btn, i) => {
      const checked = Math.ceil(v) === (i + 1);
      if (checked) checkedIdx = i;
      btn.setAttribute('aria-checked', checked ? 'true' : 'false');
      btn.tabIndex = checked ? 0 : -1;
    });
    if (checkedIdx === -1 && this._buttons[0]) this._buttons[0].tabIndex = 0;
  }
}

export function defineAhaRate(tag = 'aha-rate') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaRate);
  return true;
}
if (typeof window !== 'undefined') defineAhaRate();

export default { AhaRate, defineAhaRate };
