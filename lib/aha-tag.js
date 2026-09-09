/**
 * @ahaslides-product/design/aha-tag — the shared Tag primitive.
 *
 *   import '@ahaslides-product/design/aha-tag';   // registers <aha-tag>
 *   <aha-tag variant="primary">Poll</aha-tag>
 *
 * A small, low-emphasis label chip for categories, keywords, and states. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. `closable` shows a dismiss affordance and emits a composed `close` event.
 */
const STYLE = `
  :host{ display:inline-flex }
  .chip{ box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; height:22px; padding:0 8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600;
    border-radius:var(--aha-radius-sm,6px);
    background:var(--aha-gray-30,#F1F1F1); color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.15s) var(--aha-ease,ease), color var(--aha-motion-fast,.15s) var(--aha-ease,ease) }
  :host([variant="primary"]) .chip{ background:var(--aha-purple-10,#F9F5FF); color:var(--aha-purple-60,#6A1EBB) }
  :host([variant="success"]) .chip{ background:var(--aha-bg-positive,#D8FAEF); color:var(--aha-text-positive,#13A181) }
  :host([variant="warning"]) .chip{ background:var(--aha-bg-warning,#FFF5F0); color:var(--aha-text-warning,#E65B29) }
  :host([variant="error"]) .chip{ background:var(--aha-bg-negative,#FFF1F0); color:var(--aha-text-negative,#F5222D) }
  .x{ display:inline-flex; cursor:pointer; border:0; background:none; padding:0; color:inherit; opacity:.7; line-height:0;
    transition:opacity var(--aha-motion-fast,.15s) var(--aha-ease,ease) }
  .x:hover{ opacity:1 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const CLOSE = '<svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

export class AhaTag extends HTMLElement {
  static get observedAttributes() { return ['variant', 'closable']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const x = this.hasAttribute('closable') ? `<button class="x" part="close" aria-label="Remove">${CLOSE}</button>` : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="chip" part="chip"><slot></slot>${x}</span>`;
    const btn = this.shadowRoot.querySelector('.x');
    if (btn) btn.addEventListener('click', () => this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true })));
  }
}

export function defineAhaTag(tag = 'aha-tag') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTag);
  return true;
}
if (typeof window !== 'undefined') defineAhaTag();

export default { AhaTag, defineAhaTag };
