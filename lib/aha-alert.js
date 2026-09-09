/**
 * @ahaslides-product/design/aha-alert — the shared Alert primitive.
 *
 *   import '@ahaslides-product/design/aha-alert';   // registers <aha-alert> (+ <aha-icon>)
 *   <aha-alert type="success" heading="Saved">Your changes are live.</aha-alert>
 *
 * An inline, contextual feedback banner — info / success / warning / error. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. The status
 * glyph is summoned BY NAME from the shared icon library (no inline SVG). `closable` adds a
 * dismiss control that animates the banner out on a persistent node and emits a composed `close`.
 */
import './icons.js';   // registers <aha-icon> so the status/close glyphs resolve from the DS library

const STYLE = `
  :host{ display:block }
  .alert{ box-sizing:border-box; display:flex; align-items:flex-start; gap:10px; padding:10px 14px;
    border-radius:var(--aha-radius-default,8px);
    border:1px solid var(--aha-border-info,#BFD2FF); background:var(--aha-bg-informative,#F4F8FF);
    color:var(--aha-text-default,#1A1A1A);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:1.5;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([type="success"]) .alert{ background:var(--aha-bg-positive,#D8FAEF); border-color:var(--aha-border-success,#16C49A) }
  :host([type="warning"]) .alert{ background:var(--aha-bg-warning,#FFF5F0); border-color:var(--aha-border-warning,#FF7747) }
  :host([type="error"]) .alert{ background:var(--aha-bg-negative,#FFF1F0); border-color:var(--aha-border-error,#F5222D) }
  .icon{ flex:0 0 auto; line-height:0; margin-top:1px; color:var(--aha-color-info,#9BB3E9) }
  :host([type="success"]) .icon{ color:var(--aha-text-positive,#13A181) }
  :host([type="warning"]) .icon{ color:var(--aha-text-warning,#E65B29) }
  :host([type="error"]) .icon{ color:var(--aha-text-negative,#F5222D) }
  .body{ flex:1 1 auto; min-width:0 }
  .title{ font-weight:600; margin-bottom:2px }
  .close{ flex:0 0 auto; margin-left:6px; border:0; background:none; padding:0; line-height:0; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A); opacity:.7;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .close:hover{ opacity:1 }
  .alert.leaving{ opacity:0; transform:translateY(-4px) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const ICON = { info: 'system-info', success: 'system-check-circle', warning: 'system-warning-circle', error: 'system-x-circle' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class AhaAlert extends HTMLElement {
  static get observedAttributes() { return ['type', 'heading', 'closable', 'hide-icon']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const type = this.getAttribute('type') || 'info';
    const heading = this.getAttribute('heading');
    const icon = this.hasAttribute('hide-icon') ? '' : `<span class="icon"><aha-icon name="${ICON[type] || ICON.info}" size="18" decorative></aha-icon></span>`;
    const close = this.hasAttribute('closable') ? `<button class="close" part="close" aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></button>` : '';
    const title = heading ? `<div class="title" part="title">${esc(heading)}</div>` : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="alert" part="alert" role="alert">${icon}<div class="body">${title}<div class="msg" part="message"><slot></slot></div></div>${close}</div>`;
    const btn = this.shadowRoot.querySelector('.close');
    if (btn) btn.addEventListener('click', () => this._dismiss());
  }
  _dismiss() {
    const alert = this.shadowRoot.querySelector('.alert');   // persistent node — the leave transition fires on it
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    if (!alert) { this.remove(); return; }
    const done = () => this.remove();
    alert.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 400);
    alert.classList.add('leaving');
  }
}

export function defineAhaAlert(tag = 'aha-alert') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAlert);
  return true;
}
if (typeof window !== 'undefined') defineAhaAlert();

export default { AhaAlert, defineAhaAlert };
