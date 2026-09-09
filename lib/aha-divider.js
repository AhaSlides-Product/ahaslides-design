/**
 * @ahaslides-product/design/aha-divider — the shared Divider primitive.
 *
 *   import '@ahaslides-product/design/aha-divider';   // registers <aha-divider>
 *   <aha-divider></aha-divider>
 *   <aha-divider>Section</aha-divider>
 *   <aha-divider align="left" plain>note</aha-divider>
 *   <aha-divider dashed></aha-divider>
 *   <aha-divider orientation="vertical"></aha-divider>
 *
 * A thin separator between blocks of content — a full-width rule, an optional label, or a
 * vertical hairline between inline items. The DS V3 Divider is a small matrix:
 *   orientation  horizontal (default) · vertical (inline hairline)
 *   variant      solid (default) · `dashed`
 *   text         a slotted label sitting in the rule, `align` left · center (default) · right,
 *                with heading emphasis (default — bold, text-default) or `plain` (regular, secondary)
 * A divider is a static marker with no interactive state, so it carries no motion (the gate
 * exempts static markers). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies.
 */
const STYLE = `
  :host{ display:block; margin:16px 0; color:var(--aha-text-secondary,#4A4A4A);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; line-height:22px }
  .divider{ display:flex; align-items:center; gap:12px }
  .line{ flex:1 1 auto; border-top:1px solid var(--aha-border,#E3E3E3) }
  :host([dashed]) .line{ border-top-style:dashed }
  /* label — heading emphasis by default (bold, text-default); [plain] drops to a quiet regular note */
  .label{ flex:0 0 auto; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  :host([plain]) .label{ font-weight:400; color:var(--aha-text-secondary,#4A4A4A) }
  /* a left/right label hugs its edge — the short leg of the rule shrinks to a small stub */
  .line.stub{ flex:0 0 24px }
  :host([orientation="vertical"]){ display:inline-block; height:1em; margin:0 8px; vertical-align:middle }
  :host([orientation="vertical"]) .divider{ height:100% }
  :host([orientation="vertical"]) .line{ border-top:0; border-left:1px solid var(--aha-border,#E3E3E3); align-self:stretch }
`;

export class AhaDivider extends HTMLElement {
  static get observedAttributes() { return ['orientation', 'dashed', 'align', 'plain']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const hasText = this.textContent.trim().length > 0 && this.getAttribute('orientation') !== 'vertical';
    const align = this.getAttribute('align') || 'center';
    const label = `<span class="label" part="label"><slot></slot></span>`;
    const line = `<span class="line" part="line"></span>`;
    const stub = `<span class="line stub" part="line"></span>`;   // short leg beside an edge-aligned label
    const body = !hasText ? line
      : align === 'left' ? `${stub}${label}${line}`
      : align === 'right' ? `${line}${label}${stub}`
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
