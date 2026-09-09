/**
 * @ahaslides-product/design/aha-alert — the shared Alert primitive.
 *
 *   import '@ahaslides-product/design/aha-alert';   // registers <aha-alert> (+ <aha-icon>)
 *   <aha-alert type="success" heading="Saved">Your changes are live.</aha-alert>
 *
 * An inline, contextual feedback banner — info / success / warning / error / branding. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. The status glyph
 * is summoned BY NAME from the shared icon library (no inline SVG).
 *
 * The DS V3 Alert is a FAMILY, not one box:
 *   type      info | success | warning | error | branding   tone + status glyph + surface/border tokens
 *   heading   optional bold title above the message
 *   size      regular (default) | small                     compact padding + type scale
 *   banner    full-width, square-cornered, edge-to-edge page notice (the DS "Alert-banner" set)
 *   hide-icon suppresses the leading status glyph (the showIcon toggle)
 *   closable  a ✕ dismiss control (chrome) that animates the banner out on a persistent node
 *   action    a trailing slot="action" for a button/link
 *
 * `closable` emits a composed `close`. Hover, dismiss and the leave animation ride the shared motion
 * tokens on a PERSISTENT node (a class toggles — the subtree is never rebuilt on the animated state).
 * Icons are summoned by name from the DS icon library via <aha-icon> — never an inline glyph.
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
  :host([type="branding"]) .alert{ background:var(--aha-bg-accent,#F9F5FF); border-color:var(--aha-border-focus,#D3B4FF) }
  .icon{ flex:0 0 auto; line-height:0; margin-top:1px; color:var(--aha-color-info,#9BB3E9) }
  :host([type="success"]) .icon{ color:var(--aha-text-positive,#13A181) }
  :host([type="warning"]) .icon{ color:var(--aha-text-warning,#E65B29) }
  :host([type="error"]) .icon{ color:var(--aha-text-negative,#F5222D) }
  :host([type="branding"]) .icon{ color:var(--aha-color-primary,#6A1EBB) }
  .body{ flex:1 1 auto; min-width:0 }
  .title{ font-weight:600; margin-bottom:2px }
  .action{ flex:0 0 auto; display:flex; align-items:center; margin-left:6px }
  .action.empty{ display:none }
  .close{ flex:0 0 auto; margin-left:6px; border:0; background:none; padding:0; line-height:0; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A); opacity:.7;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .close:hover{ opacity:1 }
  .alert.leaving{ opacity:0; transform:translateY(-4px) }

  /* small size — compact padding + type scale */
  :host([size="small"]) .alert{ padding:6px 10px; gap:8px; font-size:13px }
  :host([size="small"]) .icon{ margin-top:0 }

  /* banner — full-width, square-cornered, edge-to-edge page notice (the DS Alert-banner set) */
  :host([banner]) .alert{ border-radius:0; border-left:0; border-right:0; border-top:0 }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const ICON = {
  info: 'system-info',
  success: 'system-check-circle',
  warning: 'system-warning-circle',
  error: 'system-x-circle',
  branding: 'system-sparkle',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class AhaAlert extends HTMLElement {
  static get observedAttributes() { return ['type', 'heading', 'closable', 'hide-icon', 'size', 'banner']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const type = this.getAttribute('type') || 'info';
    const heading = this.getAttribute('heading');
    const iconSize = this.getAttribute('size') === 'small' ? 16 : 18;
    const icon = this.hasAttribute('hide-icon') ? '' : `<span class="icon"><aha-icon name="${ICON[type] || ICON.info}" size="${iconSize}" decorative></aha-icon></span>`;
    const close = this.hasAttribute('closable') ? `<button class="close" part="close" aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></button>` : '';
    const title = heading ? `<div class="title" part="title">${esc(heading)}</div>` : '';
    // a trailing action (button/link) travels through a named slot; the wrapper hides when empty
    const hasAction = !!this.querySelector('[slot="action"]');
    const action = `<div class="action${hasAction ? '' : ' empty'}" part="action"><slot name="action"></slot></div>`;
    // error/warning interrupt assertively (role=alert); info/success/branding are polite (role=status) so they don't barge in
    const role = (type === 'error' || type === 'warning') ? 'alert' : 'status';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="alert" part="alert" role="${role}">${icon}<div class="body">${title}<div class="msg" part="message"><slot></slot></div></div>${action}${close}</div>`;
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
