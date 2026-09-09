/**
 * @ahaslides-product/design/aha-tooltip — the shared Tooltip primitive.
 *
 *   import '@ahaslides-product/design/aha-tooltip';   // registers <aha-tooltip>
 *   <aha-tooltip text="Copy link"><aha-button icon-only aria-label="Copy">…</aha-button></aha-tooltip>
 *
 * A short, transient hint on hover/focus of its slotted trigger. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * dark-navy bubble with an arrow is the single shared tooltip the settings pattern references.
 * `open` forces the bubble visible (for demos/measurement); otherwise it shows on hover/focus.
 */
const STYLE = `
  :host{ position:relative; display:inline-flex }
  .bubble{ position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%) translateY(4px);
    box-sizing:border-box; max-width:240px; padding:6px 10px; white-space:nowrap;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-bg-dark,#1A1A2E);
    border-radius:var(--aha-radius-sm,6px); box-shadow:0 4px 12px rgba(26,26,46,.2);
    opacity:0; visibility:hidden;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1));
    z-index:10; pointer-events:none }
  .bubble::after{ content:""; position:absolute; top:100%; left:50%; transform:translateX(-50%);
    border:5px solid transparent; border-top-color:var(--aha-bg-dark,#1A1A2E) }
  :host(:hover) .bubble, :host(:focus-within) .bubble, :host([open]) .bubble{ opacity:1; visibility:visible; transform:translateX(-50%) translateY(0) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaTooltip extends HTMLElement {
  static get observedAttributes() { return ['text', 'open']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._bubble) this._build();
    this._sync();
  }
  attributeChangedCallback() { if (this._bubble) this._sync(); }

  _build() {
    // Build ONCE; `open` then drives :host([open]) on the persistent .bubble so its opacity/transform
    // transition fires. Rebuilding the subtree on open/text would make a fresh node with no "from"
    // state — the transition would never run (the Switch-click trap).
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><slot></slot><span class="bubble" part="bubble" role="tooltip"></span>`));
    this._bubble = this.shadowRoot.querySelector('.bubble');
  }
  _sync() { this._bubble.textContent = this.getAttribute('text') || ''; }
}

export function defineAhaTooltip(tag = 'aha-tooltip') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTooltip);
  return true;
}
if (typeof window !== 'undefined') defineAhaTooltip();

export default { AhaTooltip, defineAhaTooltip };
