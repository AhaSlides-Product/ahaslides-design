/**
 * @ahaslides-product/design/aha-popover — the shared Popover primitive.
 *
 *   import '@ahaslides-product/design/aha-popover';   // registers <aha-popover>
 *   <aha-popover placement="bottom">
 *     <button slot="trigger">Options</button>
 *     <div>Rich floating content…</div>
 *   </aha-popover>
 *
 * A click-triggered floating panel anchored to its trigger — richer than a Tooltip (it holds
 * interactive content). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies. Open/close toggles the `open` attribute on a
 * PERSISTENT panel (never rebuilt), so opacity + lift animate. Emits composed `open`/`close` events.
 */
const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .pop{ position:absolute; z-index:20; min-width:180px; box-sizing:border-box; padding:12px 16px;
    background:var(--aha-bg-elevated,#FFFFFF); color:var(--aha-text-default,#1A1A1A);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    box-shadow:0 6px 16px rgba(26,26,46,.12); font-size:14px; line-height:21px;
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .pop{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([placement="bottom"]) .pop{ top:calc(100% + 8px); left:0 }
  :host([placement="top"]) .pop{ bottom:calc(100% + 8px); left:0; transform:translateY(4px) }
  :host([placement="top"][open]) .pop{ transform:translateY(0) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaPopover extends HTMLElement {
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this.hasAttribute('placement')) this.setAttribute('placement', 'bottom');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="trigger" part="trigger"><slot name="trigger"></slot></span><div class="pop" part="panel" role="dialog"><slot></slot></div>`;
    const trigger = this.shadowRoot.querySelector('.trigger');
    trigger.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(); });
    this._onDoc = (e) => { if (this.open && !this.contains(e.target)) this._set(false); };
    document.addEventListener('click', this._onDoc);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.open) this._set(false); });
  }
  disconnectedCallback() { document.removeEventListener('click', this._onDoc); }

  _toggle() { this._set(!this.open); }
  _set(next) {
    if (next === this.open) return;
    this.open = next;
    this.dispatchEvent(new CustomEvent(next ? 'open' : 'close', { bubbles: true, composed: true }));
  }
}

export function defineAhaPopover(tag = 'aha-popover') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPopover);
  return true;
}
if (typeof window !== 'undefined') defineAhaPopover();

export default { AhaPopover, defineAhaPopover };
