/**
 * @ahaslides-product/design/aha-progress-toast — the shared Progress toast primitive.
 *
 *   import '@ahaslides-product/design/aha-progress-toast';   // registers <aha-progress-toast> (+ <aha-progressbar>, <aha-button>, <aha-icon>)
 *   <aha-progress-toast heading="Quarterly review.pdf" value="42" caption="42%">
 *     <aha-icon slot="icon" name="system-file" size="24"></aha-icon>
 *     <button slot="action">Cancel</button>
 *   </aha-progress-toast>
 *
 * A card for ONE long-running background task (an import, an export, an upload) that updates in place
 * from start to finish: file/task icon, a heading, a determinate bar and a caption row. The card is a
 * pure view — the consumer owns the task, the copy and any auto-dismiss timer (a successful card is
 * usually dismissed ~2s after `state="success"`).
 *
 *   state        progress (default) | success | cancelled | offline | error
 *   heading      the task name (file name) — or a status headline for cancelled / offline / error
 *   description  one supporting line under the heading
 *   value        0–100 bar percent (hidden on success / cancelled / error; muted on offline)
 *   caption      bottom-left text beside the bar, e.g. "42%" or "12/40 slides"
 *   floating     pins the card bottom-right of the viewport (default is inline, for a host that places it)
 *   dismiss-label  accessible name of the ✕ (default "Dismiss"); the ✕ shows on terminal states only
 *
 * Slots: `icon` (24px leading glyph; defaults to the DS file glyph) · `action` (bottom-right control while
 * the task runs, e.g. Cancel) · `footer` (a block under the card body — a cancel confirmation, retry
 * buttons, or an <aha-csat> rating).
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The subtree is built once; state changes
 * only toggle attributes on persistent nodes, so the bar fill animates. The bar is the DS
 * <aha-progressbar> (role=progressbar, labelled by the heading). The card is a polite live region
 * (assertive on error).
 *
 * @fires dismiss  CustomEvent — the ✕ was pressed.
 */
import './icons.js';
import './aha-button.js';
import './aha-progressbar.js';

const STYLE = `
  :host{ display:block; box-sizing:border-box; width:320px; max-width:calc(100vw - 32px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([floating]){ position:fixed; right:var(--aha-space-24,24px); bottom:var(--aha-space-24,24px); z-index:1100 }
  .card{ box-sizing:border-box; padding:var(--aha-space-14,14px) var(--aha-space-16,16px) var(--aha-space-16,16px); background:var(--aha-bg-elevated,#FFFFFF);
    border-radius:var(--aha-radius-lg,12px); color:var(--aha-text-default,#1A1A1A);
    box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08);
    transition:box-shadow var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([state="error"]) .card{ box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 0 0 1px var(--aha-red-20,#FFCCC7) }
  .top{ display:flex; align-items:center; gap:var(--aha-space-10,10px) }
  .lead{ flex:0 0 auto; width:24px; height:24px; display:flex; align-items:center; justify-content:center }
  .texts{ flex:1 1 auto; min-width:0 }
  .title-row{ display:flex; align-items:center; gap:var(--aha-space-6,6px); min-width:0 }
  .heading{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    font-size:13px; line-height:1.3; font-weight:700 }
  :host([state="error"]) .heading{ color:var(--aha-text-negative,#F5222D) }
  .done{ flex:0 0 auto; line-height:0; color:var(--aha-icon-default,#4A4A4A) }
  .description{ margin-top:var(--aha-space-2,2px); font-size:12px; line-height:1.5; color:var(--aha-text-secondary,#4A4A4A) }
  .close{ flex:0 0 auto; margin-left:auto }
  .bar{ display:block; margin-top:var(--aha-space-10,10px); transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([state="offline"]) .bar{ opacity:.4 }
  .bottom{ display:flex; align-items:center; justify-content:space-between; gap:var(--aha-space-8,8px); margin-top:var(--aha-space-10,10px);
    font-size:12px; line-height:1.5; color:var(--aha-text-secondary,#4A4A4A) }
  .action{ flex:0 0 auto; margin-left:auto; font-weight:700 }
  ::slotted([slot="action"]){ font:inherit; font-weight:700; color:var(--aha-text-secondary,#4A4A4A); background:none; border:0; padding:var(--aha-space-0,0); cursor:pointer;
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  ::slotted([slot="action"]:hover){ color:var(--aha-color-primary,#6A1EBB) }
  .footer{ margin-top:var(--aha-space-12,12px) }
  [hidden]{ display:none !important }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TERMINAL = ['success', 'cancelled', 'error'];
const NO_BAR = ['success', 'cancelled', 'error'];

export class AhaProgressToast extends HTMLElement {
  static get observedAttributes() { return ['state', 'heading', 'description', 'value', 'caption', 'dismiss-label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>
        <div class="card" part="card" role="status" aria-live="polite">
          <div class="top">
            <div class="lead" part="icon"><slot name="icon"><aha-icon name="system-file" size="24" decorative></aha-icon></slot></div>
            <div class="texts">
              <div class="title-row"><div class="heading" part="heading"></div><span class="done" part="done" hidden><aha-icon name="system-check-circle" size="16" decorative></aha-icon></span></div>
              <div class="description" part="description" hidden></div>
            </div>
            <aha-button class="close" part="close" variant="tertiary" icon-only size="sm" hidden><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
          </div>
          <aha-progressbar class="bar" part="bar" size="small"></aha-progressbar>
          <div class="bottom" part="bottom"><span class="caption" part="caption"></span><span class="action"><slot name="action"></slot></span></div>
          <div class="footer" part="footer"><slot name="footer"></slot></div>
        </div>`;
      this.shadowRoot.querySelector('.close').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
      });
      const hideEmpty = () => this._syncSlots();
      this.shadowRoot.addEventListener('slotchange', hideEmpty);
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _syncSlots() {
    const root = this.shadowRoot;
    const hasAction = !!this.querySelector('[slot="action"]');
    const hasFooter = !!this.querySelector('[slot="footer"]');
    const caption = this.getAttribute('caption');
    root.querySelector('.bottom').hidden = !(caption || hasAction);
    root.querySelector('.footer').hidden = !hasFooter;
  }

  _sync() {
    const root = this.shadowRoot;
    const state = this.getAttribute('state') || 'progress';
    const heading = this.getAttribute('heading') || '';
    const description = this.getAttribute('description');

    root.querySelector('.card').setAttribute('role', state === 'error' ? 'alert' : 'status');
    root.querySelector('.card').setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
    root.querySelector('.heading').textContent = heading;
    root.querySelector('.done').hidden = state !== 'success';
    const descriptionNode = root.querySelector('.description');
    descriptionNode.textContent = description || '';
    descriptionNode.hidden = !description;

    const close = root.querySelector('.close');
    close.hidden = !TERMINAL.includes(state);
    close.setAttribute('aria-label', this.getAttribute('dismiss-label') || 'Dismiss');

    const bar = root.querySelector('.bar');
    bar.hidden = NO_BAR.includes(state);
    bar.setAttribute('label', heading || 'Progress');
    bar.setAttribute('value', this.getAttribute('value') || '0');

    root.querySelector('.caption').textContent = this.getAttribute('caption') || '';
    this._syncSlots();
  }
}

export function defineAhaProgressToast(tag = 'aha-progress-toast') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProgressToast);
  return true;
}
if (typeof window !== 'undefined') defineAhaProgressToast();

export default { AhaProgressToast, defineAhaProgressToast };
