/**
 * @ahaslides-product/design/aha-list — the shared List primitive.
 *
 *   import '@ahaslides-product/design/aha-list';   // registers <aha-list>
 *   <aha-list list-title="Recent decks">
 *     <div>Team offsite</div>
 *     <div>Q3 review</div>
 *   </aha-list>
 *
 * A bordered, evenly-divided vertical list. Each light-DOM child becomes a row; the last row
 * drops its divider and rows highlight on hover. ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 */
const STYLE = `
  :host{ display:block }
  .list{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-lg,12px); overflow:hidden;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .head{ padding:14px 20px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  ::slotted(*){ display:block; box-sizing:border-box; padding:12px 20px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  ::slotted(*:last-child){ border-bottom:none }
  ::slotted(*:hover){ background:var(--aha-bg-hover,#F7F7F7) }
  @media (prefers-reduced-motion: reduce){ ::slotted(*){ transition:none !important } }
`;

export class AhaList extends HTMLElement {
  static get observedAttributes() { return ['list-title']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const title = this.getAttribute('list-title');
    const head = title ? `<div class="head" part="head">${title}</div>` : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="list" part="list">${head}<slot></slot></div>`;
  }
}

export function defineAhaList(tag = 'aha-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaList);
  return true;
}
if (typeof window !== 'undefined') defineAhaList();

export default { AhaList, defineAhaList };
