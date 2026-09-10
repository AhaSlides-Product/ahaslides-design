/**
 * @ahaslides-product/design/aha-collapse — the shared Collapse (accordion) primitive.
 *
 *   import '@ahaslides-product/design/aha-collapse';   // registers <aha-collapse>
 *   import '@ahaslides-product/design/icons';          // registers <aha-icon> (the caret glyph)
 *   <aha-collapse open><span slot="header">Advanced settings</span>Panel body</aha-collapse>
 *
 * A single expandable panel: a header row with a caret, and a body that animates open/closed.
 * The `open` attribute IS the state — clicking the header toggles it and CSS animates the body
 * height + caret on a PERSISTENT node (no subtree rebuild, so the transition always fires).
 * `open` is a controlled prop too: it's observed, and attributeChangedCallback keeps BOTH the
 * visuals (CSS :host([open])) and the header's aria-expanded in sync — so a screen reader always
 * hears the real state, not a frozen one.
 *
 * The DS V3 Collapse is a FAMILY (a Collapse container + Collapse-Item), so one panel carries the
 * whole matrix as attributes:
 *   bordered (default) vs `ghost`     borderless, seamless-on-page variant
 *   `size="small"`                    a denser header/body
 *   `icon-position="end"`             caret on the trailing edge (default: start)
 *   `disabled`                        a non-interactive, dimmed panel
 *   `accordion`                       opening this panel closes sibling accordion panels
 *                                     under the same parent (one-open-at-a-time)
 *   slot="extra"                      a trailing accessory in the header (a tag, a count)
 *
 * The caret is summoned by name from the DS icon library via <aha-icon> — never an inline glyph.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Emits a composed `toggle` event with { open }.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .panel{ border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    overflow:hidden; background:var(--aha-bg-container,#FFFFFF) }
  /* ghost — borderless, transparent surface that sits seamlessly on the page */
  :host([ghost]) .panel{ border:0; border-radius:0; background:transparent }

  .head{ display:flex; align-items:center; gap:12px; width:100%;
    box-sizing:border-box; padding:14px 16px; border:0; background:none; cursor:pointer; text-align:left;
    font-family:inherit; font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .head:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  :host([ghost]) .head:hover{ background:color-mix(in srgb, var(--aha-bg-hover,#F7F7F7) 60%, transparent) }
  .head:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }
  /* small size — denser header + body */
  :host([size="small"]) .head{ padding:8px 12px; font-size:14px; line-height:20px }

  .ttl{ flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .caret{ flex:none; display:inline-flex; color:var(--aha-icon-default,#4A4A4A);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .caret{ transform:rotate(90deg) }
  /* icon position: default start (leading), end (trailing edge) */
  :host([icon-position="end"]) .caret{ order:3 }
  .extra{ flex:none; display:inline-flex; align-items:center }
  :host([icon-position="end"]) .extra{ order:2 }

  /* disabled panel — dimmed + non-interactive */
  :host([disabled]) .head{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
  :host([disabled]) .head:hover{ background:none }
  :host([disabled]) .caret{ color:var(--aha-text-disabled,#B5B5B5) }

  .body{ display:grid; grid-template-rows:0fr;
    transition:grid-template-rows var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .body{ grid-template-rows:1fr }
  .clip{ overflow:hidden }
  .inner{ padding:0 16px 14px; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  :host([size="small"]) .inner{ padding:0 12px 10px }
  :host([ghost]) .inner{ padding-left:0; padding-right:0 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

// build via DOM APIs — the tree is created ONCE and never rebuilt on a state change, so the
// open/close transition always has a persistent node to animate across.
function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  n.append(...kids);
  return n;
}

export class AhaCollapse extends HTMLElement {
  static get observedAttributes() { return ['open', 'disabled']; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (this._head) { this._syncOpen(); return; }
    const style = document.createElement('style');
    style.textContent = STYLE;
    // caret from the DS icon library (rotates 0°→90° on open) — never an inline glyph.
    const caret = el('span', { class: 'caret', part: 'caret' },
      el('aha-icon', { name: 'system-caret-right', size: '14', 'aria-hidden': 'true' }));
    const headerSlot = el('slot', { name: 'header' }, 'Section');
    const extra = el('span', { class: 'extra', part: 'extra' }, el('slot', { name: 'extra' }));
    const head = el('button', { class: 'head', part: 'head', type: 'button' },
      caret, el('span', { class: 'ttl' }, headerSlot), extra);
    const body = el('div', { class: 'body', part: 'body' },
      el('div', { class: 'clip' }, el('div', { class: 'inner' }, el('slot', {}))));
    const panel = el('div', { class: 'panel', part: 'panel' }, head, body);
    this.shadowRoot.append(style, panel);
    this._head = head;
    this._syncOpen();
    head.addEventListener('click', () => {
      if (this.hasAttribute('disabled')) return;
      const open = this.toggleAttribute('open');   // fires attributeChangedCallback → aria stays in sync
      if (open) this._closeSiblings();             // accordion: one panel open at a time
      this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true, detail: { open } }));
    });
  }

  // controlled `open`/`disabled` props: keep aria honest for a screen reader; visuals follow :host([…]).
  attributeChangedCallback() { this._syncOpen(); }

  _syncOpen() {
    if (!this._head) return;
    this._head.setAttribute('aria-expanded', String(this.hasAttribute('open')));
    const disabled = this.hasAttribute('disabled');
    this._head.setAttribute('aria-disabled', String(disabled));
    if (disabled) this._head.setAttribute('tabindex', '-1');
    else this._head.removeAttribute('tabindex');
  }

  // accordion: close sibling accordion panels under the same parent, so only this one stays open.
  _closeSiblings() {
    if (!this.hasAttribute('accordion') || !this.parentElement) return;
    for (const sib of this.parentElement.children) {
      if (sib !== this && sib.tagName === this.tagName && sib.hasAttribute('accordion')) {
        sib.removeAttribute('open');
      }
    }
  }
}

export function defineAhaCollapse(tag = 'aha-collapse') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCollapse);
  return true;
}
if (typeof window !== 'undefined') defineAhaCollapse();

export default { AhaCollapse, defineAhaCollapse };
