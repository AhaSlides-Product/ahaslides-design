/**
 * @ahaslides-product/design/aha-badge — the shared Badge primitive.
 *
 *   import '@ahaslides-product/design/aha-badge';   // registers <aha-badge>
 *   <aha-badge count="5"><button>Inbox</button></aha-badge>   // count over a wrapped child
 *   <aha-badge count="128" overflow-count="99"></aha-badge>   // 99+
 *   <aha-badge dot><aha-icon name="system-bell"></aha-icon></aha-badge>
 *   <aha-badge dot status="active"></aha-badge>     // dot colour: default · disabled · active
 *
 * The DS V3 Badge is a FAMILY, not one shape:
 *   • count   — a number pill on the top-right of a wrapped child (or standalone)
 *   • dot     — a bare marker, no number; status default · disabled · active
 *   • color   — a custom colour overriding the semantic default
 *   • ribbon  — a corner ribbon banner wrapping a card, `placement="end"` (top-right, default) or
 *               `placement="start"` (top-left); `text` is the ribbon label, colour from color/status
 *   • plan    — a PLAN preset badge (free·edu·essential·pro·enterprise); `cycle` = monthly|yearly.
 *   • session — a "Session N" badge; the slotted/`text` label is the session name.
 *
 *   • kind    — a NEW tag (Vivid Pink 5% fill, Darker Pink label) / BETA tag (grey); size sm.
 *
 *   BADGE SIZE — `size="default"` (28px, 14px label semibold, radius sm, 16px icon, 8px padding) or `size="sm"`
 *   (20px, 12px label regular 400, radius xs, 12px icon, 4px padding). plan defaults to `default`;
 *   session and kind default to `sm`.
 *
 * `count` over `overflowCount` renders as `N+`; `showZero` keeps a `0` visible; otherwise a
 * zero count hides the pill. The count/dot animates in via a scale on a
 * PERSISTENT node (a class toggles — the pill node is never rebuilt on a count change, so the
 * transition actually fires). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies.
 */
const STATUS_COLOR = {
  success: 'var(--aha-color-success,#1A1A1A)',
  processing: 'var(--aha-color-primary,#E70E68)',
  error: 'var(--aha-color-error,#1A1A1A)',
  warning: 'var(--aha-vivid-pink-30,#E70E684D)',
  default: 'var(--aha-text-tertiary,#8A8A8A)',
  primary: 'var(--aha-color-primary,#E70E68)',
};
const COUNT_COLOR = {
  default: 'var(--aha-color-error,#1A1A1A)',
  primary: STATUS_COLOR.primary,
  processing: STATUS_COLOR.primary,
};
const DOT_COLOR = {
  default: 'var(--aha-icon-strong,#1A1A1A)',
  disabled: 'var(--aha-icon-disabled,#B5B5B5)',
  active: 'var(--aha-icon-active,#E70E68)',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; position:relative; line-height:1; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* the wrapper holds slotted content the badge marks; the pill floats over its top-right */
  .wrap{ display:inline-flex }
  .marker{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    height:18px; min-width:18px; padding:0 6px;
    font-family:inherit; font-size:11px; line-height:18px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-badge-color,var(--aha-color-error,#1A1A1A));
    border-radius:var(--aha-radius-pill,999px);
    transform:scale(1); transform-origin:center;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .marker.soft{ background:var(--aha-bg-accent,#E70E680D); color:var(--aha-text-link-hover,#DB005B) }
  /* hidden count (zero, no showZero) collapses via scale on the SAME persistent node */
  .marker.hidden{ transform:scale(0) }
  /* dot — a bare marker, no number */
  :host([dot]) .marker{ width:6px; height:6px; min-width:0; padding:0 }
  :host([dot][size="sm"]) .marker{ width:4px; height:4px }
  /* when a child is wrapped, the marker floats to the top-right corner */
  :host(.has-child) .marker{ position:absolute; top:0; right:0; transform-origin:100% 0;
    transform:translate(50%,-50%) scale(1); box-shadow:0 0 0 1px var(--aha-bg-container,#FFFFFF) }
  :host(.has-child) .marker.hidden{ transform:translate(50%,-50%) scale(0) }
  :host(.has-child) .marker, :host(.has-child) .marker.soft{ isolation:isolate; background:var(--aha-bg-container,#FFFFFF) }
  :host(.has-child) .marker::before{ content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; background:var(--aha-badge-color,var(--aha-color-error,#1A1A1A)) }
  :host(.has-child) .marker.soft::before{ background:var(--aha-bg-accent,#E70E680D) }
  :host([ribbon][status="warning"]) .ribbon{ color:var(--aha-text-default,#1A1A1A) }

  /* ribbon — a corner banner wrapping a card; the wrapper anchors the ribbon over the child's top corner */
  .ribbon-wrap{ position:relative; display:block }
  .ribbon{ box-sizing:border-box; position:absolute; top:8px; height:22px; line-height:22px; padding:0 8px;
    font-family:inherit; font-size:12px; font-weight:600; white-space:nowrap;
    color:var(--aha-text-inverse,#FFFFFF); isolation:isolate; background:var(--aha-bg-container,#FFFFFF) }
  .ribbon::before{ content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; background:var(--aha-badge-color,var(--aha-color-primary,#E70E68)) }
  /* the triangular fold under the ribbon end — CSS borders in a darkened ribbon colour (chrome, not a glyph) */
  .ribbon::after{ content:""; position:absolute; top:100%; border:4px solid var(--aha-badge-color,var(--aha-color-primary,#E70E68));
    filter:brightness(75%) }
  /* end (default, top-right): ribbon flush to the right edge, radius on its left corners, fold on the right */
  :host([placement="end"]) .ribbon, :host(:not([placement="start"])) .ribbon{ right:-8px;
    border-radius:var(--aha-radius-xs,4px) 0 0 var(--aha-radius-xs,4px) }
  :host([placement="end"]) .ribbon::after, :host(:not([placement="start"])) .ribbon::after{ right:0;
    border-color:var(--aha-badge-color,var(--aha-color-primary,#E70E68)) transparent transparent var(--aha-badge-color,var(--aha-color-primary,#E70E68)) }
  /* start (top-left): ribbon flush to the left edge, radius on its right corners, fold on the left */
  :host([placement="start"]) .ribbon{ left:-8px; border-radius:0 var(--aha-radius-xs,4px) var(--aha-radius-xs,4px) 0 }
  :host([placement="start"]) .ribbon::after{ left:0;
    border-color:var(--aha-badge-color,var(--aha-color-primary,#E70E68)) var(--aha-badge-color,var(--aha-color-primary,#E70E68)) transparent transparent }

  /* ===== label / preset badges — plan · session =====
     Colour comes from --_cbg (background) + --_cfg (foreground), each set per family/variant
     below and bound to an --aha-* token. */
  .chip{ box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 var(--aha-space-8,8px); max-width:100%;
    font-family:inherit; font-size:14px; line-height:20px; font-weight:600;
    border-radius:var(--aha-radius-sm,6px); white-space:nowrap;
    background:var(--_cbg,var(--aha-gray-30,#F1F1F1)); color:var(--_cfg,var(--aha-text-default,#1A1A1A)) }
  .chip.sm{ height:20px; padding:0 var(--aha-space-4,4px); gap:var(--aha-space-4,4px); font-size:12px; line-height:16px; font-weight:400; border-radius:var(--aha-radius-xs,4px) }
  .chip .chip-label{ overflow:hidden; text-overflow:ellipsis }
  .chip aha-icon{ flex:0 0 auto; color:currentColor }

  /* --- plan presets --- */
  :host([plan]) .chip{ --_cbg:var(--aha-gray-30,#F1F1F1); --_cfg:var(--aha-text-default,#1A1A1A) }
  :host([plan="enterprise"]) .chip{ --_cbg:var(--aha-bg-accent,#E70E680D) }

  /* --- new / beta tags --- */
  :host([kind="new"]) .chip{ --_cbg:var(--aha-bg-accent,#E70E680D); --_cfg:var(--aha-text-link-hover,#DB005B) }
  :host([kind="beta"]) .chip{ --_cbg:var(--aha-gray-30,#F1F1F1); --_cfg:var(--aha-text-default,#1A1A1A) }

  @media (prefers-reduced-motion: reduce){ *,*::after{ transition:none !important; animation:none !important } }
`;

export class AhaBadge extends HTMLElement {
  static get observedAttributes() { return ['count', 'max', 'overflow-count', 'dot', 'status', 'text', 'color', 'show-zero', 'ribbon', 'placement', 'plan', 'session', 'kind', 'cycle', 'size']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // count-only change → toggle the persistent pill (text + hidden class), so the scale transition fires
    if (name === 'count' && this.shadowRoot.querySelector('.marker')) this._syncCount();
    else this._render();
  }
  // a preset badge family — plan · session · kind
  _isChip() { return this.hasAttribute('plan') || this.hasAttribute('session') || this.hasAttribute('kind'); }
  // the default text a preset shows when the consumer supplies none (slot/text always wins)
  _chipDefaultLabel() {
    if (this.hasAttribute('kind')) return this.getAttribute('kind') === 'beta' ? 'Beta' : 'New';
    if (this.hasAttribute('session')) {
      const s = this.getAttribute('session');
      return s && s.trim() ? `Session ${esc(s)}` : 'Session';
    }
    if (this.hasAttribute('plan')) {
      const p = this.getAttribute('plan');
      const names = { free: 'Free', edu: 'Edu', essential: 'Essential', pro: 'Pro', enterprise: 'Enterprise' };
      const base = names[p] || (p ? esc(p) : '');
      const cyc = this.getAttribute('cycle');
      return cyc === 'yearly' ? `${base} · Yearly` : cyc === 'monthly' ? `${base} · Monthly` : base;
    }
    return '';
  }
  // the DS icon a preset leads with (by name — never an inline glyph); '' = no icon
  _chipIcon() {
    return '';
  }
  _chipSize() {
    const size = this.getAttribute('size');
    if (size === 'sm' || size === 'default') return size;
    return this.hasAttribute('plan') ? 'default' : 'sm';
  }
  _overflow() {
    const raw = this.getAttribute('overflow-count') || this.getAttribute('max') || 99;
    const n = Number(raw); return Number.isFinite(n) ? n : 99;
  }
  _countText() {
    const count = Number(this.getAttribute('count') || 0);
    const max = this._overflow();
    return count > max ? `${max}+` : String(count);
  }
  _isHidden() {
    if (this.hasAttribute('dot')) return false;
    return Number(this.getAttribute('count') || 0) === 0 && !this.hasAttribute('show-zero');
  }
  _color() {
    const custom = this.getAttribute('color');
    if (custom) return custom;                                   // custom colour wins (consumer-supplied)
    const st = this.getAttribute('status');
    if (this.hasAttribute('dot')) return DOT_COLOR[st] || DOT_COLOR.default;
    if (st && this.hasAttribute('ribbon')) return STATUS_COLOR[st] || STATUS_COLOR.error;
    if (st) return COUNT_COLOR[st] || COUNT_COLOR.default;
    // no status: ribbon defaults to primary (antd Ribbon convention); count/dot default → error
    return this.hasAttribute('ribbon') ? STATUS_COLOR.primary : STATUS_COLOR.error;
  }
  _syncCount() {
    const m = this.shadowRoot.querySelector('.marker');
    if (!m) return;
    m.textContent = this.hasAttribute('dot') ? '' : this._countText();
    m.classList.toggle('hidden', this._isHidden());
  }
  _render() {
    if (this._isChip()) {
      this.classList.remove('has-child');
      const icon = this._chipIcon();
      const small = this._chipSize() === 'sm';
      const lead = icon ? `<aha-icon name="${icon}" size="${small ? 12 : 16}" aria-hidden="true"></aha-icon>` : '';
      const supplied = this.getAttribute('text');
      const hasSlotted = this.childNodes.length > 0;
      const labelHtml = hasSlotted ? '<slot></slot>' : esc(supplied != null ? supplied : this._chipDefaultLabel());
      const chip = `<span class="chip${small ? ' sm' : ''}" part="chip">${lead}<span class="chip-label">${labelHtml}</span></span>`;
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>${chip}`;
      return;
    }

    // ribbon — a corner banner wrapping the slotted child (a card); placement start/end
    if (this.hasAttribute('ribbon')) {
      this.classList.remove('has-child');
      const label = esc(this.getAttribute('text') || '');
      this.style.setProperty('--aha-badge-color', this._color());
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<span class="ribbon-wrap" part="wrap"><slot></slot>` +
        `<span class="ribbon" part="ribbon" role="status">${label}</span></span>`;
      return;
    }

    const hasChild = this.childNodes.length > 0;
    this.classList.toggle('has-child', hasChild);

    this.style.setProperty('--aha-badge-color', this._color());
    const text = this.hasAttribute('dot') ? '' : this._countText();
    const soft = !this.hasAttribute('dot') && !this.getAttribute('color') && COUNT_COLOR[this.getAttribute('status')] === STATUS_COLOR.primary;
    const hiddenCls = (this._isHidden() ? ' hidden' : '') + (soft ? ' soft' : '');
    const marker = `<span class="marker${hiddenCls}" part="badge" role="status" aria-live="polite">${text}</span>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      (hasChild ? `<span class="wrap" part="wrap"><slot></slot></span>${marker}` : marker);
  }
}

export function defineAhaBadge(tag = 'aha-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaBadge();

export default { AhaBadge, defineAhaBadge };
