/**
 * @ahaslides-product/design/aha-card — the shared Card primitive.
 *
 *   import '@ahaslides-product/design/aha-card';   // registers <aha-card>
 *   <aha-card card-title="Live poll">Body content</aha-card>
 *
 * A bordered surface that groups related content — a title header, a body, and an optional
 * hover elevation. ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical
 * in React and Vue. Zero dependencies. `hoverable` lifts the card on hover; `card-title` renders
 * the header; slot `extra` sits on the right of the header for an action.
 */
const STYLE = `
  :host{ display:block }
  .card{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-lg,12px); overflow:hidden;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    transition:box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:16px 20px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:16px; line-height:24px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .body{ padding:20px; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  :host([hoverable]) .card{ cursor:pointer }
  :host([hoverable]:hover) .card{ border-color:var(--aha-border-hover,#D3B4FF); box-shadow:0 4px 12px var(--aha-ink-a10,rgba(26,26,46,.1)) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaCard extends HTMLElement {
  static get observedAttributes() { return ['card-title']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const title = this.getAttribute('card-title');
    const head = title
      ? `<div class="head" part="head"><span>${title}</span><span class="extra"><slot name="extra"></slot></span></div>`
      : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="card" part="card">${head}<div class="body" part="body"><slot></slot></div></div>`;
  }
}

export function defineAhaCard(tag = 'aha-card') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCard);
  return true;
}
if (typeof window !== 'undefined') defineAhaCard();

export default { AhaCard, defineAhaCard };
