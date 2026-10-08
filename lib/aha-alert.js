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
 *   closable  the shared <aha-close-button> ✕, pinned to the first line; animates the banner out
 *   action    a trailing slot="action" for a button/link
 *
 * `closable` emits a composed `close`. Hover, dismiss and the leave animation ride the shared motion
 * tokens on a PERSISTENT node (a class toggles — the subtree is never rebuilt on the animated state).
 * Icons are summoned by name from the DS icon library via <aha-icon> — never an inline glyph.
 */
import './icons.js';
import './aha-close-button.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .alert{ box-sizing:border-box; display:flex; align-items:flex-start; gap:10px; padding:10px 14px;
    border-radius:var(--aha-radius-default,8px);
    border:0; background:var(--aha-gray-25,#F3F3F3);
    color:var(--aha-text-default,#1A1A1A);
    font-family:inherit; font-size:14px; line-height:1.5;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([type="branding"]) .alert{ background:var(--aha-bg-accent,#FEF3F7); border:1px solid var(--aha-border-focus,#E70E68) }
  .icon{ flex:0 0 auto; line-height:0; margin-top:var(--aha-space-2,2px); color:var(--aha-icon-default,#4A4A4A) }
  :host([type="branding"]) .icon{ color:var(--aha-color-primary,#E70E68) }
  .body{ flex:1 1 auto; min-width:0 }
  .title{ font-weight:600; margin-bottom:2px }
  .action{ flex:0 0 auto; display:flex; align-items:center; margin-left:6px }
  .action.empty{ display:none }
  .close{ --aha-close-line-height:21px }
  [hidden]{ display:none !important }
  .alert.leaving{ opacity:0; transform:translateY(-4px) }

  /* small size — compact padding + type scale */
  :host([size="small"]) .alert{ padding:6px 10px; gap:8px; font-size:13px }
  :host([size="small"]) .close{ --aha-close-line-height:19.5px }

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
export class AhaAlert extends HTMLElement {
  static get observedAttributes() { return ['type', 'heading', 'closable', 'hide-icon', 'size', 'banner']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="alert" part="alert">` +
          `<span class="icon"><aha-icon decorative></aha-icon></span>` +
          `<div class="body"><div class="title" part="title" hidden></div><div class="msg" part="message"><slot></slot></div></div>` +
          `<div class="action" part="action"><slot name="action"></slot></div>` +
          `<aha-close-button class="close" part="close" hidden></aha-close-button>` +
        `</div>`;
      this.shadowRoot.querySelector('.close').addEventListener('click', () => this._dismiss());
      this.shadowRoot.querySelector('slot[name="action"]').addEventListener('slotchange', () => this._syncAction());
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }
  _sync() {
    const root = this.shadowRoot;
    const type = this.getAttribute('type') || 'info';
    const heading = this.getAttribute('heading');
    const icon = root.querySelector('.icon aha-icon');
    icon.setAttribute('name', ICON[type] || ICON.info);
    icon.setAttribute('size', '16');
    root.querySelector('.icon').hidden = this.hasAttribute('hide-icon');
    const title = root.querySelector('.title');
    title.textContent = heading || '';
    title.hidden = !heading;
    root.querySelector('.close').hidden = !this.hasAttribute('closable');
    // error/warning interrupt assertively (role=alert); info/success/branding are polite (role=status) so they don't barge in
    root.querySelector('.alert').setAttribute('role', (type === 'error' || type === 'warning') ? 'alert' : 'status');
    this._syncAction();
  }
  _syncAction() {
    this.shadowRoot.querySelector('.action').classList.toggle('empty', !this.querySelector('[slot="action"]'));
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
