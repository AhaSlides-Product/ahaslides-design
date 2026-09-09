/**
 * @ahaslides-product/design/aha-badge — the shared Badge primitive.
 *
 *   import '@ahaslides-product/design/aha-badge';   // registers <aha-badge>
 *   <aha-badge count="5"></aha-badge>
 *   <aha-badge dot status="success"></aha-badge>
 *
 * A small count or status marker — a notification count, an unread dot, a status colour.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. `count` over `max` renders as `max+`; `dot` renders a bare status dot.
 */
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle }
  .badge{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    height:18px; min-width:18px; padding:0 6px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:11px; line-height:18px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-color-error,#F5222D);
    border-radius:var(--aha-radius-pill,999px);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([status="success"]) .badge{ background:var(--aha-color-success,#16C49A) }
  :host([status="warning"]) .badge{ background:var(--aha-color-warning,#FF7747) }
  :host([status="primary"]) .badge{ background:var(--aha-color-primary,#6A1EBB) }
  :host([dot]) .badge{ width:8px; height:8px; min-width:0; padding:0 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaBadge extends HTMLElement {
  static get observedAttributes() { return ['count', 'max', 'dot', 'status']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    let text = '';
    if (!this.hasAttribute('dot')) {
      const count = Number(this.getAttribute('count') || 0);
      const max = Number(this.getAttribute('max') || 99);
      text = count > max ? `${max}+` : String(count);
    }
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="badge" part="badge">${text}</span>`;
  }
}

export function defineAhaBadge(tag = 'aha-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaBadge();

export default { AhaBadge, defineAhaBadge };
