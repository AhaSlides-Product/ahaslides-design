/**
 * @ahaslides-product/design/aha-descriptions — the shared Descriptions primitive.
 *
 *   import '@ahaslides-product/design/aha-descriptions';   // registers <aha-descriptions>
 *   <aha-descriptions desc-title="Account">
 *     <div label="Plan">Pro</div>
 *     <div label="Seats">25 of 50</div>
 *   </aha-descriptions>
 *
 * A read-only label/value grid for summarising an entity's fields. Each light-DOM child supplies
 * one row via its `label` attribute + its content. ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .desc{ border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    overflow:hidden; background:var(--aha-bg-container,#FFFFFF) }
  .title{ padding:12px 16px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .grid{ display:grid; grid-template-columns:auto 1fr }
  .cell{ padding:12px 16px; border-bottom:1px solid var(--aha-split,#F1F1F1); font-size:14px; line-height:22px }
  .label{ color:var(--aha-text-secondary,#4A4A4A); background:var(--aha-bg-container-secondary,#F7F7F7);
    font-weight:600; border-right:1px solid var(--aha-split,#F1F1F1); white-space:nowrap }
  .value{ color:var(--aha-text-default,#1A1A1A) }
  .grid > .cell:nth-last-child(-n+2){ border-bottom:none }
`;

export class AhaDescriptions extends HTMLElement {
  static get observedAttributes() { return ['desc-title']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const rows = [...this.children].map((c) =>
      `<div class="cell label" part="label">${c.getAttribute('label') || ''}</div><div class="cell value" part="value">${c.innerHTML}</div>`).join('');
    const title = this.getAttribute('desc-title');
    const head = title ? `<div class="title" part="title">${title}</div>` : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="desc" part="desc">${head}<div class="grid">${rows}</div></div>`;
  }
}

export function defineAhaDescriptions(tag = 'aha-descriptions') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDescriptions);
  return true;
}
if (typeof window !== 'undefined') defineAhaDescriptions();

export default { AhaDescriptions, defineAhaDescriptions };
