/**
 * @ahaslides-product/design/aha-collapse — the shared Collapse (accordion) primitive.
 *
 *   import '@ahaslides-product/design/aha-collapse';   // registers <aha-collapse>
 *   <aha-collapse open><span slot="header">Advanced settings</span>Panel body</aha-collapse>
 *
 * A single expandable panel: a header row with a chevron, and a body that animates open/closed.
 * The `open` attribute IS the state — clicking the header toggles it and CSS animates the body
 * height + chevron on a PERSISTENT node (no subtree rebuild, so the transition always fires).
 * `open` is a controlled prop too: it's observed, and attributeChangedCallback keeps BOTH the
 * visuals (CSS :host([open])) and the header's aria-expanded in sync — so a screen reader always
 * hears the real state, not a frozen one.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Emits a composed `toggle` event with { open }.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .panel{ border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    overflow:hidden; background:var(--aha-bg-container,#FFFFFF) }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%;
    box-sizing:border-box; padding:14px 16px; border:0; background:none; cursor:pointer; text-align:left;
    font-family:inherit; font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .head:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .chev{ flex:none; width:8px; height:8px; border-right:2px solid var(--aha-icon-default,#4A4A4A);
    border-bottom:2px solid var(--aha-icon-default,#4A4A4A); transform:rotate(-45deg); margin-right:4px;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .chev{ transform:rotate(45deg) }
  .body{ display:grid; grid-template-rows:0fr;
    transition:grid-template-rows var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .body{ grid-template-rows:1fr }
  .clip{ overflow:hidden }
  .inner{ padding:0 16px 14px; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
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
  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (this._head) { this._syncOpen(); return; }
    const style = document.createElement('style');
    style.textContent = STYLE;
    const chev = el('span', { class: 'chev', part: 'chev' });
    const headerSlot = el('slot', { name: 'header' }, 'Section');
    const head = el('button', { class: 'head', part: 'head', type: 'button' },
      chev, el('span', { class: 'ttl' }, headerSlot));
    const body = el('div', { class: 'body', part: 'body' },
      el('div', { class: 'clip' }, el('div', { class: 'inner' }, el('slot', {}))));
    const panel = el('div', { class: 'panel', part: 'panel' }, head, body);
    this.shadowRoot.append(style, panel);
    this._head = head;
    this._syncOpen();
    head.addEventListener('click', () => {
      const open = this.toggleAttribute('open');   // fires attributeChangedCallback → aria stays in sync
      this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true, detail: { open } }));
    });
  }

  // controlled `open` prop: keep aria-expanded honest for a screen reader; visuals follow :host([open]).
  attributeChangedCallback(name) { if (name === 'open') this._syncOpen(); }

  _syncOpen() { if (this._head) this._head.setAttribute('aria-expanded', String(this.hasAttribute('open'))); }
}

export function defineAhaCollapse(tag = 'aha-collapse') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCollapse);
  return true;
}
if (typeof window !== 'undefined') defineAhaCollapse();

export default { AhaCollapse, defineAhaCollapse };
