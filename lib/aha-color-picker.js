/**
 * @ahaslides-product/design/aha-color-picker — the shared Colour picker.
 *
 *   import '@ahaslides-product/design/aha-color-picker';   // registers <aha-color-picker>
 *   <aha-color-picker value="#6A1EBB"></aha-color-picker>
 *
 * A trigger swatch that opens a palette of preset colours (the DS brand ramp by default; override
 * with `swatches="#hex|#hex|…"`). The palette is SELECTABLE: the swatch matching `value` shows a
 * color-primary ring + a check glyph, and every swatch is a toggle button with `aria-pressed` synced
 * to selection (invisible-to-AT otherwise). Three `size`s (small · default · large) scale the trigger
 * and swatches; `disabled` blanks the whole control. ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens → byte-identical in React and Vue. Zero dependencies. Open/close toggles the `open`
 * attribute on a PERSISTENT panel (never rebuilt), so it animates. Emits a composed
 * `change` CustomEvent<{value}>. Icons summoned by name via <aha-icon> — never an inline glyph.
 */
const DEFAULT_SWATCHES = ['#6A1EBB', '#8644D4', '#A96FF0', '#FF4081', '#FF7747', '#FFE32C', '#20E8B5', '#13A181', '#9BB3E9', '#1A1A1A', '#8A8A8A', '#FFFFFF']; // ds-lint-allow: hex (preset brand palette VALUES the picker offers — data, not component styling)
const SIZES = { small: { cur: '16px', sw: '22px', pad: '3px 8px 3px 3px', font: '13px' }, default: { cur: '20px', sw: '28px', pad: '5px 10px 5px 5px', font: '14px' }, large: { cur: '24px', sw: '34px', pad: '7px 12px 7px 7px', font: '16px' } };
const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    --_cur:20px; --_sw:28px; --_pad:5px 10px 5px 5px; --_font:14px }
  :host([size="small"]){ --_cur:16px; --_sw:22px; --_pad:3px 8px 3px 3px; --_font:13px }
  :host([size="large"]){ --_cur:24px; --_sw:34px; --_pad:7px 12px 7px 7px; --_font:16px }
  .trigger{ display:inline-flex; align-items:center; gap:8px; box-sizing:border-box; cursor:pointer;
    padding:var(--_pad); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-sm,6px);
    font-family:inherit; font-size:var(--_font); color:var(--aha-text-default,#1A1A1A);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .trigger:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .trigger:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .current{ width:var(--_cur); height:var(--_cur); border-radius:var(--aha-radius-xs,4px); box-shadow:inset 0 0 0 1px rgba(26,26,46,.1) }
  /* disabled — the whole control is inert + greyed, no hover/open */
  :host([disabled]){ pointer-events:none }
  :host([disabled]) .trigger{ cursor:not-allowed; background:var(--aha-bg-container-disabled,#F1F1F1);
    border-color:var(--aha-border-disabled,#EBEBEB); color:var(--aha-text-disabled,#B5B5B5) }
  :host([disabled]) .current{ opacity:.5 }
  .panel{ position:absolute; z-index:20; top:calc(100% + 8px); left:0; box-sizing:border-box; padding:10px;
    display:grid; grid-template-columns:repeat(4,1fr); gap:8px; width:max-content;
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border,#E3E3E3);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 16px rgba(26,26,46,.12);
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  .swatch{ position:relative; width:var(--_sw); height:var(--_sw); padding:0; border:0; cursor:pointer; border-radius:var(--aha-radius-xs,4px);
    box-shadow:inset 0 0 0 1px rgba(26,26,46,.1); outline:2px solid transparent; outline-offset:2px;
    display:inline-flex; align-items:center; justify-content:center;
    transition:transform var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .swatch:hover{ transform:scale(1.1) }
  .swatch:focus-visible, .swatch.on{ outline-color:var(--aha-color-primary,#6A1EBB) }
  /* the selected swatch shows a check; colour flips to keep contrast on light vs dark chips */
  .swatch .tick{ opacity:0; color:var(--aha-text-inverse,#FFFFFF);
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .swatch.on .tick{ opacity:1 }
  .swatch.on.light .tick{ color:var(--aha-text-default,#1A1A1A) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaColorPicker extends HTMLElement {
  get value() { return this.getAttribute('value') || DEFAULT_SWATCHES[0]; }
  set value(v) { this.setAttribute('value', String(v)); this._paint(); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get size() { return this.getAttribute('size') || 'default'; }
  set size(v) { this.setAttribute('size', String(v)); }
  get swatches() { const s = this.getAttribute('swatches'); return s ? s.split('|').map(x => x.trim()).filter(Boolean) : DEFAULT_SWATCHES; }

  // `value`/`disabled` are observed so a controlled (framework-bound) or external attribute change
  // re-syncs the selected swatch + its aria-pressed / disabled state — not just the property setter.
  static get observedAttributes() { return ['value', 'disabled']; }
  attributeChangedCallback() { if (this.shadowRoot) this._paint(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const cells = this.swatches.map(c =>
      `<button class="swatch" type="button" part="swatch" data-c="${c}" aria-label="${c}" aria-pressed="false" style="background:${c}">` +
      `<aha-icon class="tick" name="system-check" size="14" aria-hidden="true"></aha-icon></button>`).join('');
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><button class="trigger" type="button" part="trigger" aria-haspopup="true"><span class="current" part="current"></span><span class="label">${this.value}</span></button><div class="panel" part="panel" role="group" aria-label="Colour swatches">${cells}</div>`;
    this._current = this.shadowRoot.querySelector('.current');
    this._label = this.shadowRoot.querySelector('.label');
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._cells = Array.from(this.shadowRoot.querySelectorAll('.swatch'));
    this._paint();
    this._trigger.addEventListener('click', (e) => { e.stopPropagation(); if (!this.disabled) this.open = !this.open; });
    this._cells.forEach(cell => cell.addEventListener('click', () => {
      if (this.disabled) return;
      this.setAttribute('value', cell.dataset.c);
      this._paint();
      this.open = false;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: cell.dataset.c } }));
    }));
    this._onDoc = (e) => { if (this.open && !this.contains(e.target)) this.open = false; };
    document.addEventListener('click', this._onDoc);
  }
  disconnectedCallback() { document.removeEventListener('click', this._onDoc); }

  // relative luminance of a #rgb/#rrggbb chip — used to flip the check glyph dark on pale swatches
  _isLight(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
  }
  _paint() {
    if (!this._current) return;
    this._current.style.background = this.value;
    this._label.textContent = this.value;
    if (this._trigger) this._trigger.disabled = this.disabled;
    this._cells.forEach(c => {
      const sel = c.dataset.c.toLowerCase() === this.value.toLowerCase();
      c.classList.toggle('on', sel);
      c.classList.toggle('light', this._isLight(c.dataset.c));
      c.setAttribute('aria-pressed', String(sel));   // which swatch is the current value — otherwise invisible to AT
      c.disabled = this.disabled;
    });
  }
}

export function defineAhaColorPicker(tag = 'aha-color-picker') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaColorPicker);
  return true;
}
if (typeof window !== 'undefined') defineAhaColorPicker();

export default { AhaColorPicker, defineAhaColorPicker };
