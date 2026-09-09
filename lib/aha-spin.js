/**
 * @ahaslides-product/design/aha-spin — the shared Spin (loading) primitive.
 *
 *   import '@ahaslides-product/design/aha-spin';   // registers <aha-spin>
 *   <aha-spin></aha-spin>
 *   <aha-spin size="large" tip="Loading results…"></aha-spin>
 *
 * A brand-coloured loading spinner for an indeterminate wait. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * ring is a pure-CSS rotation (no inline <svg>, no icon), so it never blocks on the registry.
 */
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-secondary,#4A4A4A) }
  .spinner{ box-sizing:border-box; width:20px; height:20px; border-radius:50%;
    border:2px solid var(--aha-purple-20,#E6D4FF);
    border-top-color:var(--aha-color-primary,#6A1EBB);
    animation:aha-spin-rotate 0.9s linear infinite }
  :host([size="small"]) .spinner{ width:14px; height:14px; border-width:2px }
  :host([size="large"]) .spinner{ width:32px; height:32px; border-width:3px }
  .tip{ color:var(--aha-text-secondary,#4A4A4A) }
  .tip:empty{ display:none }
  @keyframes aha-spin-rotate{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ .spinner{ animation-duration:2.4s } }
`;

export class AhaSpin extends HTMLElement {
  static get observedAttributes() { return ['size', 'tip']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="spinner" part="spinner" role="status" aria-label="Loading"></span><span class="tip" part="tip"></span>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() { this.shadowRoot.querySelector('.tip').textContent = this.getAttribute('tip') || ''; }
}

export function defineAhaSpin(tag = 'aha-spin') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSpin);
  return true;
}
if (typeof window !== 'undefined') defineAhaSpin();

export default { AhaSpin, defineAhaSpin };
