/**
 * @ahaslides-product/design/aha-segmented — the shared Segmented control.
 *
 *   import '@ahaslides-product/design/aha-segmented';   // registers <aha-segmented>
 *   <aha-segmented options="Day|Week|Month" value="Week"></aha-segmented>
 *
 * A single-choice switch between a few mutually-exclusive options, laid out inline. The DS V3
 * Segmented is a family, not a flat pill row: each item can be a label, a leading icon + label, or
 * an icon-only glyph (an aria-label is then required); an option can be disabled, or the whole
 * control disabled; it comes in three `size`s (small · medium · large) and a `block` mode that
 * stretches it full-width with flex-equal options.
 *
 * `options` accepts two forms:
 *   "Day|Week|Month"                                              a pipe-separated list of labels
 *   [{value,label?,icon?,disabled?,ariaLabel?}, …]               a JSON array (richer per-item API)
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Selection slides a PERSISTENT thumb (transform on a node that is never rebuilt),
 * so it animates. Icons are summoned by name from the DS icon library via <aha-icon> — never an
 * inline glyph. Emits a composed `change` CustomEvent<{value,index}>.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex }
  :host([block]){ display:flex; width:100% }
  .track{ position:relative; display:inline-flex; box-sizing:border-box; padding:2px; gap:0;
    background:var(--aha-gray-20,#F7F7F7); border-radius:var(--aha-radius-default,8px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([block]) .track{ display:flex; width:100% }
  .thumb{ position:absolute; top:2px; bottom:2px; left:2px; width:0;
    background:var(--aha-bg-container,#FFFFFF); border-radius:var(--aha-radius-sm,6px);
    box-shadow:0 1px 2px color-mix(in srgb, var(--aha-gray-100,#1A1A1A) 12%, transparent);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), width var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)) }
  .seg{ position:relative; z-index:1; box-sizing:border-box; border:0; background:none; cursor:pointer;
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:0 16px; height:32px; min-width:0; flex:1 1 auto; white-space:nowrap;
    font-family:inherit; font-size:14px; font-weight:600; color:var(--aha-text-secondary,#4A4A4A);
    border-radius:var(--aha-radius-sm,6px); outline:2px solid transparent; outline-offset:-2px;
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .seg aha-icon{ flex:0 0 auto; color:currentColor }
  .seg.icon-only{ padding:0 8px }
  .seg:not([disabled]):hover{ color:var(--aha-text-default,#1A1A1A) }
  .seg.on{ color:var(--aha-text-default,#1A1A1A) }
  .seg:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }
  .seg[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }

  /* sizes — height / padding / font / radius from the token scale */
  :host([size="small"]) .track{ border-radius:var(--aha-radius-sm,6px) }
  :host([size="small"]) .thumb{ border-radius:var(--aha-radius-xs,4px) }
  :host([size="small"]) .seg{ height:24px; padding:0 12px; font-size:12px; border-radius:var(--aha-radius-xs,4px) }
  :host([size="small"]) .seg.icon-only{ padding:0 6px }
  :host([size="large"]) .track{ border-radius:var(--aha-radius-lg,12px) }
  :host([size="large"]) .thumb{ border-radius:var(--aha-radius-default,8px) }
  :host([size="large"]) .seg{ height:40px; padding:0 20px; font-size:16px; border-radius:var(--aha-radius-default,8px) }
  :host([size="large"]) .seg.icon-only{ padding:0 12px }

  :host([disabled]){ opacity:.4 }
  :host([disabled]) .seg{ cursor:not-allowed }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSegmented extends HTMLElement {
  static get observedAttributes() { return ['options', 'value', 'size', 'block', 'disabled']; }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // value alone is a per-state toggle on persistent nodes (no rebuild → the thumb transition fires);
    // options/size/block/disabled change the structure → a full re-render (not a per-state toggle).
    if (name === 'value') this._select(this._values.indexOf(this.value), false);
    else this._render();
  }

  // options: pipe-string OR JSON array of {value,label?,icon?,disabled?,ariaLabel?}. Normalised to objects.
  get options() {
    const raw = this.getAttribute('options') || '';
    if (raw.trim().startsWith('[')) {
      try {
        return JSON.parse(raw).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
          .filter((o) => o && o.value != null);
      } catch { return []; }
    }
    return raw.split('|').map((s) => s.trim()).filter(Boolean).map((s) => ({ value: s, label: s }));
  }
  get _values() { return this.options.map((o) => String(o.value)); }
  get value() { return this.getAttribute('value') || this._values[0] || ''; }
  set value(v) { this.setAttribute('value', String(v)); }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }

  _render() {
    const opts = this.options;
    const wholeDisabled = this.disabled;
    const segs = opts.map((o, i) => {
      const label = o.label != null ? String(o.label) : '';
      const iconOnly = !!o.icon && !label;
      const icon = o.icon ? `<aha-icon name="${esc(o.icon)}" size="16" aria-hidden="true"></aha-icon>` : '';
      const aria = iconOnly ? ` aria-label="${esc(o.ariaLabel || o.value)}"` : '';
      const dis = (wholeDisabled || o.disabled) ? ' disabled' : '';
      return `<button class="seg${iconOnly ? ' icon-only' : ''}" type="button" part="segment" role="tab"` +
        ` data-i="${i}"${aria}${dis}>${icon}${iconOnly ? '' : `<span class="txt">${esc(label)}</span>`}</button>`;
    }).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="track" part="track" role="tablist"><span class="thumb" part="thumb"></span>${segs}</span>`;
    this._segs = Array.from(this.shadowRoot.querySelectorAll('.seg'));
    this._thumb = this.shadowRoot.querySelector('.thumb');
    const cur = this._values.indexOf(this.value);
    this._select(cur >= 0 ? cur : this._firstEnabled(), false);
    this._segs.forEach((seg) => seg.addEventListener('click', () => {
      if (seg.hasAttribute('disabled')) return;
      const i = Number(seg.dataset.i);
      this.setAttribute('value', this._values[i]);
      this._select(i, true);
    }));
    this.shadowRoot.querySelector('.track').addEventListener('keydown', (e) => this._onKey(e));
  }

  _firstEnabled() { return this.options.findIndex((o) => !o.disabled && !this.disabled); }
  _enabledIndexes() { return this.options.map((o, i) => (o.disabled || this.disabled) ? -1 : i).filter((i) => i >= 0); }

  _onKey(e) {
    const enabled = this._enabledIndexes();
    if (!enabled.length) return;
    const cur = this._values.indexOf(this.value);
    const pos = Math.max(0, enabled.indexOf(cur));
    let next;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = enabled[(pos + 1) % enabled.length]; break;
      case 'ArrowLeft': case 'ArrowUp': next = enabled[(pos - 1 + enabled.length) % enabled.length]; break;
      case 'Home': next = enabled[0]; break;
      case 'End': next = enabled[enabled.length - 1]; break;
      default: return;
    }
    e.preventDefault();
    this.setAttribute('value', this._values[next]);
    this._select(next, true, true);
  }

  _select(index, emit, focus) {
    if (!this._segs || index < 0 || index >= this._segs.length) return;
    this._segs.forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('on', on);
      s.setAttribute('aria-selected', String(on));
      s.tabIndex = on && !s.hasAttribute('disabled') ? 0 : -1;
    });
    const seg = this._segs[index];
    if (seg) { this._thumb.style.width = seg.offsetWidth + 'px'; this._thumb.style.transform = `translateX(${seg.offsetLeft - 2}px)`; }
    if (focus && seg) seg.focus();
    if (emit) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this._values[index], index } }));
  }
}

export function defineAhaSegmented(tag = 'aha-segmented') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSegmented);
  return true;
}
if (typeof window !== 'undefined') defineAhaSegmented();

export default { AhaSegmented, defineAhaSegmented };
