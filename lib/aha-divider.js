/**
 * @ahaslides-product/design/aha-divider — the shared Divider primitive.
 *
 *   import '@ahaslides-product/design/aha-divider';   // registers <aha-divider>
 *   <aha-divider></aha-divider>
 *   <aha-divider>Section</aha-divider>
 *   <aha-divider orientation="vertical"></aha-divider>
 *
 * A thin separator between blocks of content — a full-width rule, an optional centred
 * label, or a vertical hairline between inline items. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 */
const STYLE = `
  :host{ display:block; margin:16px 0; color:var(--aha-text-secondary,#4A4A4A);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; line-height:22px }
  .divider{ display:flex; align-items:center; gap:12px }
  .line{ flex:1 1 auto; border-top:1px solid var(--aha-border,#E3E3E3) }
  :host([dashed]) .line{ border-top-style:dashed }
  .label{ flex:0 0 auto; font-weight:600; color:var(--aha-text-secondary,#4A4A4A) }
  :host([orientation="vertical"]){ display:inline-block; height:1em; margin:0 8px; vertical-align:middle }
  :host([orientation="vertical"]) .divider{ height:100% }
  :host([orientation="vertical"]) .line{ border-top:0; border-left:1px solid var(--aha-border,#E3E3E3); align-self:stretch }
`;

export class AhaDivider extends HTMLElement {
  static get observedAttributes() { return ['orientation', 'dashed', 'align']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const hasText = this.textContent.trim().length > 0 && this.getAttribute('orientation') !== 'vertical';
    const align = this.getAttribute('align') || 'center';
    const label = `<span class="label" part="label"><slot></slot></span>`;
    const line = `<span class="line" part="line"></span>`;
    const body = !hasText ? line
      : align === 'left' ? `${label}${line}`
      : align === 'right' ? `${line}${label}`
      : `${line}${label}${line}`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="divider" part="divider">${body}</div>`;
  }
}

export function defineAhaDivider(tag = 'aha-divider') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDivider);
  return true;
}
if (typeof window !== 'undefined') defineAhaDivider();

export default { AhaDivider, defineAhaDivider };
