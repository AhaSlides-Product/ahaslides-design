/**
 * @ahaslides-product/design/aha-badge — the shared Badge primitive.
 *
 *   import '@ahaslides-product/design/aha-badge';   // registers <aha-badge>
 *   <aha-badge count="5"><button>Inbox</button></aha-badge>   // count over a wrapped child
 *   <aha-badge count="128" overflow-count="99"></aha-badge>   // 99+
 *   <aha-badge dot><aha-icon name="system-bell"></aha-icon></aha-badge>
 *   <aha-badge status="processing" text="In progress"></aha-badge>  // standalone dot + label
 *
 * The DS V3 Badge is a FAMILY, not one shape:
 *   • count   — a number pill on the top-right of a wrapped child (or standalone)
 *   • dot     — a bare marker, no number
 *   • status  — a standalone semantic dot + text label (success/processing/error/default/warning)
 *   • color   — a custom colour overriding the semantic default
 * `count` over `overflowCount` renders as `N+`; `showZero` keeps a `0` visible; otherwise a
 * zero count hides the pill. `processing` pulses; the count/dot animates in via a scale on a
 * PERSISTENT node (a class toggles — the pill node is never rebuilt on a count change, so the
 * transition actually fires). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies.
 */
const STATUS_COLOR = {
  success: 'var(--aha-color-success,#16C49A)',
  processing: 'var(--aha-color-primary,#6A1EBB)',
  error: 'var(--aha-color-error,#F5222D)',
  warning: 'var(--aha-color-warning,#FF7747)',
  default: 'var(--aha-text-tertiary,#8A8A8A)',
  primary: 'var(--aha-color-primary,#6A1EBB)',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; position:relative; line-height:1 }
  /* the wrapper holds slotted content the badge marks; the pill floats over its top-right */
  .wrap{ display:inline-flex }
  .marker{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    height:18px; min-width:18px; padding:0 6px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:11px; line-height:18px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-badge-color,var(--aha-color-error,#F5222D));
    border-radius:var(--aha-radius-pill,999px);
    transform:scale(1); transform-origin:center;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  /* hidden count (zero, no showZero) collapses via scale on the SAME persistent node */
  .marker.hidden{ transform:scale(0) }
  /* dot — a bare marker, no number */
  :host([dot]) .marker{ width:8px; height:8px; min-width:0; padding:0 }
  /* when a child is wrapped, the marker floats to the top-right corner */
  :host(.has-child) .marker{ position:absolute; top:0; right:0; transform-origin:100% 0;
    transform:translate(50%,-50%) scale(1); box-shadow:0 0 0 1px var(--aha-bg-container,#FFFFFF) }
  :host(.has-child) .marker.hidden{ transform:translate(50%,-50%) scale(0) }

  /* standalone status — a semantic dot + a text label, no wrapping */
  .status{ display:inline-flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; color:var(--aha-text-default,#1A1A1A) }
  .status .status-dot{ width:6px; height:6px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-badge-color,var(--aha-text-tertiary,#8A8A8A)); flex:0 0 auto; position:relative }
  /* processing — a pulsing ring on a persistent node */
  .status .status-dot::after{ content:""; position:absolute; inset:0; border-radius:inherit;
    background:inherit; opacity:0; animation:none }
  :host([status="processing"]) .status .status-dot::after{ animation:aha-badge-pulse 1.2s var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) infinite }
  @keyframes aha-badge-pulse{ 0%{ transform:scale(1); opacity:.5 } 100%{ transform:scale(2.6); opacity:0 } }

  @media (prefers-reduced-motion: reduce){ *,*::after{ transition:none !important; animation:none !important } }
`;

export class AhaBadge extends HTMLElement {
  static get observedAttributes() { return ['count', 'max', 'overflow-count', 'dot', 'status', 'text', 'color', 'show-zero']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // count-only change → toggle the persistent pill (text + hidden class), so the scale transition fires
    if (name === 'count' && !this._isStandalone() && this.shadowRoot.querySelector('.marker')) this._syncCount();
    else this._render();
  }
  // a standalone status badge (dot + text, no count/dot marker over a child)
  _isStandalone() { return this.hasAttribute('status') && !this.hasAttribute('count') && !this.hasAttribute('dot'); }
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
    return STATUS_COLOR[st] || STATUS_COLOR.error;               // count/dot default → error
  }
  _syncCount() {
    const m = this.shadowRoot.querySelector('.marker');
    if (!m) return;
    m.textContent = this.hasAttribute('dot') ? '' : this._countText();
    m.classList.toggle('hidden', this._isHidden());
  }
  _render() {
    const hasChild = this.childNodes.length > 0 && !this._isStandalone();
    this.classList.toggle('has-child', hasChild);

    if (this._isStandalone()) {
      const label = esc(this.getAttribute('text') || '');
      this.style.setProperty('--aha-badge-color', this._color());
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<span class="status" part="status" role="status"><span class="status-dot" part="dot"></span>` +
        `<span class="status-text" part="text">${label}</span></span>`;
      return;
    }

    this.style.setProperty('--aha-badge-color', this._color());
    const text = this.hasAttribute('dot') ? '' : this._countText();
    const hiddenCls = this._isHidden() ? ' hidden' : '';
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
