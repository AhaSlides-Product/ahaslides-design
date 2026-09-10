/**
 * @ahaslides-product/design/aha-result — the shared Result (operation feedback) primitive.
 *
 *   import '@ahaslides-product/design/aha-result';   // registers <aha-result>
 *   <aha-result status="success" result-title="Payment received" subtitle="A receipt is on its way.">
 *     <aha-button slot="extra">Back to dashboard</aha-button>
 *   </aha-result>
 *
 * A full-block result state — success / error / info / warning / 404 / 403 / 500 — with a DS icon,
 * a title, a subtitle and a slot for follow-up actions. ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens. The status glyph is the shared <aha-icon> BY NAME, never an inline <svg>; an
 * `icon` attribute overrides the status glyph with any DS icon name.
 */
import './icons.js';   // registers <aha-icon> + the registry (the status glyph comes from it)

const GLYPH = {
  success: 'system-check-circle',
  error: 'system-x-circle',
  info: 'system-info',
  warning: 'system-warning-circle',
  '404': 'system-magnifying-glass-exclamation',
  '403': 'system-lock',
  '500': 'system-cloud-disconnected',
};

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    text-align:center; padding:24px 16px }
  .icon{ display:inline-flex; color:var(--aha-color-primary,#6A1EBB); margin-bottom:16px;
    transition:color var(--aha-motion-fast,.12s) var(--aha-ease-out,cubic-bezier(0,0,.2,1)) }
  :host([status="success"]) .icon{ color:var(--aha-color-success,#16C49A) }
  :host([status="error"]) .icon,:host([status="500"]) .icon{ color:var(--aha-color-error,#F5222D) }
  :host([status="warning"]) .icon,:host([status="403"]) .icon{ color:var(--aha-color-warning,#FF7747) }
  :host([status="info"]) .icon,:host([status="404"]) .icon{ color:var(--aha-color-info,#9BB3E9) }
  .title{ font-size:24px; line-height:32px; font-weight:600; color:var(--aha-text-default,#1A1A1A); margin:0 }
  .subtitle{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A); margin:8px 0 0 }
  .subtitle:empty{ display:none }
  .extra{ margin-top:24px; display:flex; gap:8px; justify-content:center }
  ::slotted([slot="extra"]){ display:inline-flex }
`;

export class AhaResult extends HTMLElement {
  static get observedAttributes() { return ['status', 'result-title', 'subtitle', 'icon']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="icon" part="icon"><aha-icon size="48" decorative></aha-icon></span>` +
        `<h2 class="title" part="title"></h2><p class="subtitle" part="subtitle"></p>` +
        `<div class="extra" part="extra"><slot name="extra"></slot></div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() {
    const status = this.getAttribute('status') || 'info';
    const glyph = this.getAttribute('icon') || GLYPH[status] || GLYPH.info;
    this.shadowRoot.querySelector('aha-icon').setAttribute('name', glyph);
    this.shadowRoot.querySelector('.title').textContent = this.getAttribute('result-title') || '';
    this.shadowRoot.querySelector('.subtitle').textContent = this.getAttribute('subtitle') || '';
  }
}

export function defineAhaResult(tag = 'aha-result') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaResult);
  return true;
}
if (typeof window !== 'undefined') defineAhaResult();

export default { AhaResult, defineAhaResult };
