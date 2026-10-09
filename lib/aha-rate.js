/**
 * @ahaslides-product/design/aha-rate — the shared Rate primitive.
 *
 *   import '@ahaslides-product/design/aha-rate';   // registers <aha-rate>
 *   <aha-rate value="3"></aha-rate>
 *   <aha-rate value="3.5" allow-half></aha-rate>
 *   <aha-rate value="4" icon="system-heart-straight"></aha-rate>   // custom DS character
 *   <aha-rate value="4.8" size="sm" readonly precision="exact"></aha-rate>   // 16px stars, 4.8 fills 80% of the fifth
 *
 * A star rating for capturing or displaying a score out of `count`. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Selection and hover-preview
 * toggle a class / set a --fill width on PERSISTENT star nodes (no subtree rebuild), so the fill
 * animates. Each star is two stacked glyphs — an empty base + a clipped filled overlay — which lets
 * a value fill a star to 50% (`allow-half`). Supply `icon` to swap the star for any DS icon by name
 * (drawn as an outline glyph tinted by the brand fill). `size="sm"` draws 16px stars (default 24px).
 * `precision="exact"` on a `readonly` rate fills the last star by the exact fraction (4.8 → 80%) instead of
 * rounding to a half. Emits a composed `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:inline-flex; color:var(--aha-color-primary,#E70E68); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .stars{ display:inline-flex; gap:4px; font-family:inherit }
  .star{ position:relative; display:inline-flex; padding:0; border:0; background:none; cursor:pointer; line-height:0; color:inherit;
    outline:2px solid transparent; outline-offset:2px; border-radius:var(--aha-radius-xs,4px);
    transition:transform var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .glyph{ display:inline-flex; line-height:0 }
  .glyph svg{ width:24px; height:24px }
  :host([size="sm"]) .stars, :host([size="small"]) .stars{ gap:var(--aha-space-2,2px) }
  :host([size="sm"]) .glyph svg, :host([size="small"]) .glyph svg{ width:16px; height:16px }
  /* solid star (default character): empty base + pink overlay */
  .star svg path{ fill:var(--aha-gray-40,#E3E3E3);
    transition:fill var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  /* reveal via clip-path (compositor-friendly), not width — no layout thrash */
  .fill{ position:absolute; inset:0; clip-path:inset(0 100% 0 0);
    transition:clip-path var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .fill svg path{ fill:currentColor }
  .star.on .fill{ clip-path:inset(0 0 0 0) }
  .star.half .fill{ clip-path:inset(0 50% 0 0) }
  .star.exact .fill{ clip-path:inset(0 calc((1 - var(--fraction,0)) * 100%) 0 0) }
  /* custom-icon character (outline glyph): empty grey base, filled overlay in the brand colour */
  .star aha-icon{ color:var(--aha-gray-40,#E3E3E3);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .fill aha-icon{ color:currentColor }
  .star:hover{ transform:scale(1.12) }
  .star:focus-visible{ outline-color:var(--aha-color-primary,#E70E68) }
  :host([readonly]) .star, :host([disabled]) .star{ cursor:default }
  :host([readonly]) .star:hover, :host([disabled]) .star:hover{ transform:none }
  :host([disabled]){ opacity:.4 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M18.3203 8.93578L14.7969 12.0108L15.8524 16.5889C15.9082 16.8282 15.8923 17.0787 15.8065 17.309C15.7208 17.5394 15.5691 17.7393 15.3703 17.8839C15.1716 18.0284 14.9346 18.1112 14.6891 18.1218C14.4436 18.1324 14.2004 18.0704 13.9899 17.9436L9.99689 15.5217L6.01252 17.9436C5.80203 18.0704 5.55881 18.1324 5.31328 18.1218C5.06775 18.1112 4.83079 18.0284 4.63204 17.8839C4.4333 17.7393 4.28157 17.5394 4.19584 17.309C4.1101 17.0787 4.09417 16.8282 4.15002 16.5889L5.20392 12.0155L1.6797 8.93578C1.49331 8.77502 1.35852 8.5628 1.29225 8.32574C1.22598 8.08868 1.23117 7.83733 1.30718 7.60321C1.38319 7.36909 1.52663 7.16262 1.71952 7.0097C1.9124 6.85678 2.14614 6.76421 2.39142 6.74359L7.03674 6.34125L8.85002 2.01625C8.94471 1.78931 9.10443 1.59546 9.30907 1.45911C9.51371 1.32276 9.75411 1.25 10 1.25C10.2459 1.25 10.4863 1.32276 10.691 1.45911C10.8956 1.59546 11.0553 1.78931 11.15 2.01625L12.9688 6.34125L17.6125 6.74359C17.8578 6.76421 18.0915 6.85678 18.2844 7.0097C18.4773 7.16262 18.6208 7.36909 18.6968 7.60321C18.7728 7.83733 18.778 8.08868 18.7117 8.32574C18.6454 8.5628 18.5106 8.77502 18.3242 8.93578H18.3203Z"/></svg>'; // ds-lint-allow: svg (star glyph — sub-glyph chrome drawn on the rating fill, not a catalogue icon)

export class AhaRate extends HTMLElement {
  static get observedAttributes() { return ['value', 'count', 'max', 'icon', 'allow-half', 'size', 'precision', 'disabled', 'readonly']; }
  attributeChangedCallback(name) {
    // count/icon/allow-half change the glyph set → rebuild; value/state changes just repaint.
    if (name === 'count' || name === 'max' || name === 'icon' || name === 'allow-half' || name === 'size' || name === 'precision') { this._render(); return; }
    this._paint(this.value); this._syncState();
  }

  get count() { return Math.max(1, parseInt(this.getAttribute('count') || this.getAttribute('max') || '5', 10)); }
  get max() { return this.count; }   // DS V3 names it `count`; `max` kept as an alias
  get value() { return parseFloat(this.getAttribute('value') || '0') || 0; }
  set value(v) { this.setAttribute('value', String(v)); }
  get allowHalf() { return this.hasAttribute('allow-half'); }
  get allowClear() { return this.hasAttribute('allow-clear'); }
  get icon() { return this.getAttribute('icon') || ''; }
  get small() { return ['sm', 'small'].includes(this.getAttribute('size')); }
  get exact() { return this.getAttribute('precision') === 'exact' && this.readonly; }
  get readonly() { return this.hasAttribute('readonly'); }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() { this._render(); }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const glyph = this.icon
      ? `<aha-icon name="${this.icon}" size="${this.small ? 16 : 24}" decorative></aha-icon>`
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
      const exact = this.exact && !filled && n > i;
      const half = !this.exact && !filled && (i + 0.5) <= n;
      btn.classList.toggle('on', filled);
      btn.classList.toggle('half', half);
      btn.classList.toggle('exact', exact);
      if (exact) btn.style.setProperty('--fraction', String(n - i)); else btn.style.removeProperty('--fraction');
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
