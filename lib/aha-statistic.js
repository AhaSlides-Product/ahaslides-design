/**
 * @ahaslides-product/design/aha-statistic — the shared Statistic primitive.
 *
 *   import '@ahaslides-product/design/aha-statistic';   // registers <aha-statistic>
 *   <aha-statistic label="Active players" value="1,284" suffix="live"></aha-statistic>
 *   <aha-statistic label="Response rate" value="92" suffix="%" trend="up"></aha-statistic>
 *
 * A single headline number with a caption, optional prefix/suffix, and an up/down trend colour.
 * A static display marker — no interactive state, so no motion (like Badge). ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 */
const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .label{ font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  .value{ display:flex; align-items:baseline; gap:4px;
    font-size:24px; line-height:32px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .affix{ font-size:14px; line-height:22px; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([trend="up"]) .value{ color:var(--aha-text-positive,#13A181) }
  :host([trend="down"]) .value{ color:var(--aha-text-negative,#F5222D) }
`;

export class AhaStatistic extends HTMLElement {
  static get observedAttributes() { return ['label', 'value', 'prefix', 'suffix']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const label = this.getAttribute('label') || '';
    const value = this.getAttribute('value') || '';
    const prefix = this.getAttribute('prefix');
    const suffix = this.getAttribute('suffix');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="label" part="label">${label}</div>
      <div class="value" part="value">${prefix ? `<span class="affix" part="prefix">${prefix}</span>` : ''}<span part="number">${value}</span>${suffix ? `<span class="affix" part="suffix">${suffix}</span>` : ''}</div>`;
  }
}

export function defineAhaStatistic(tag = 'aha-statistic') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatistic);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatistic();

export default { AhaStatistic, defineAhaStatistic };
