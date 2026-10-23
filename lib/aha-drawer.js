/**
 * @ahaslides-product/design/aha-drawer — the side panel as a web component, for pages that cannot take the antd Drawer.
 *
 *   import '@ahaslides-product/design/aha-drawer';   // registers <aha-drawer>
 *
 *   <aha-drawer heading="Participant report" open>
 *     …body, scrolls when taller than the panel…
 *     <div slot="footer"><aha-button variant="primary">Save</aha-button></div>
 *   </aha-drawer>
 *
 * Reproduces the antd Drawer as themed by drawer-theme.js: a white panel 378 wide (`size="large"` 736, or `width`) that slides in
 * from the right (`placement="left"` mirrors it), a 16/24 header with a 16px SemiBold ink title and the shared dismiss ✕ (tertiary
 * icon-only xs <aha-button>), a 24 padded scrolling body, an optional footer slot, and a dimmed mask. Use the antd Drawer in React
 * and Vue 3 apps that already load antd; use this element on Vue 2 pages, plain HTML and anywhere else antd is not loaded.
 *
 * `heading` sets the title (or fill `slot="title"`); `label` overrides the accessible name. Escape, a click on the mask and the ✕
 * each emit a cancelable composed `close` ({ detail: { source } }); call `preventDefault()` to keep the drawer open, otherwise it
 * closes and emits `closed`. `static` stops the mask click from closing. While open the drawer traps Tab, locks page scroll and
 * returns focus to whatever opened it. `contained` fills the nearest positioned ancestor instead of the viewport; `inline` does the
 * same as a static display with no trap, no scroll lock and no keys (docs, previews).
 */
import './icons.js';
import './aha-button.js';
import { focusableWithin, deepActiveElement, lockPageScroll, unlockPageScroll, openModals } from './aha-audience-modal.js';


const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  .layer{ position:fixed; inset:0; z-index:1000; pointer-events:none; visibility:hidden;
    transition:visibility var(--aha-motion-slow, .3s) ease }
  :host([open]) .layer{ visibility:visible; pointer-events:auto }
  :host([contained]) .layer, :host([inline]) .layer{ position:absolute }
  :host([inline]) .layer{ pointer-events:none }
  :host([inline]) .mask{ display:none }
  .mask{ position:absolute; inset:0; background:var(--aha-bg-overlay, rgba(0,0,0,.4)); opacity:0; transition:opacity var(--aha-motion-slow, .3s) ease }
  :host([open]) .mask{ opacity:1 }
  .panel{ position:absolute; top:0; bottom:0; right:0; box-sizing:border-box; display:flex; flex-direction:column;
    width:var(--aha-drawer-width, 378px); max-width:100%; background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); pointer-events:auto;
    box-shadow:-6px 0 16px 0 rgba(0,0,0,.08), -3px 0 6px -4px rgba(0,0,0,.12), -9px 0 28px 8px rgba(0,0,0,.05);
    transform:translateX(100%); opacity:.7;
    transition:transform var(--aha-motion-slow, .3s) ease, opacity var(--aha-motion-slow, .3s) ease }
  :host([placement=left]) .panel{ right:auto; left:0; transform:translateX(-100%);
    box-shadow:6px 0 16px 0 rgba(0,0,0,.08), 3px 0 6px -4px rgba(0,0,0,.12), 9px 0 28px 8px rgba(0,0,0,.05) }
  :host([open]) .panel{ transform:none; opacity:1 }
  .panel:focus{ outline:none }
  .header{ flex:0 0 auto; display:flex; align-items:flex-start; gap:var(--aha-space-8, 8px); padding:var(--aha-space-16, 16px) var(--aha-space-24, 24px);
    border-bottom:1px solid var(--aha-split, #F1F1F1) }
  .title{ flex:1 1 auto; min-width:0; margin:0; font-size:var(--aha-size-l, 16px); line-height:var(--aha-line-height-body, 1.5); font-weight:600; overflow-wrap:anywhere }
  .close{ --aha-close-line-height:24px }
  .body{ flex:1 1 auto; min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; padding:var(--aha-space-24, 24px) }
  .footer{ display:none; flex:0 0 auto; padding:var(--aha-space-8, 8px) var(--aha-space-16, 16px); border-top:1px solid var(--aha-split, #F1F1F1) }
  .panel.has-footer .footer{ display:block }
  @media (prefers-reduced-motion: reduce){ .layer, .mask, .panel{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="layer" part="layer">
    <div class="mask" part="mask"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1">
      <div class="header" part="header">
        <h2 class="title" id="title" part="title"><slot name="title"><span class="heading"></span></slot></h2>
        <aha-button class="close" variant="tertiary" icon-only size="xs" corner aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
      </div>
      <div class="body" part="body" tabindex="0" role="region" aria-labelledby="title"><slot></slot></div>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
    </div>
  </div>`;

export class AhaDrawer extends HTMLElement {
  static get observedAttributes() { return ['open', 'heading', 'label', 'close-label', 'width', 'size']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._engaged = false;
    this._panel = this.shadowRoot.querySelector('.panel');
    this._header = this.shadowRoot.querySelector('.header');
    this._body = this.shadowRoot.querySelector('.body');
    this._heading = this.shadowRoot.querySelector('.heading');
    this._closeButton = this.shadowRoot.querySelector('.close');
    this._titleSlot = this.shadowRoot.querySelector('slot[name=title]');
    this._footerSlot = this.shadowRoot.querySelector('slot[name=footer]');
    this._onDocumentKey = (event) => this._onKey(event);
    this.shadowRoot.querySelector('.mask').addEventListener('click', () => { if (!this.hasAttribute('static')) this.close('mask'); });
    this._closeButton.addEventListener('click', () => this.close('close-button'));
    this._footerSlot.addEventListener('slotchange', () => this._panel.classList.toggle('has-footer', this._footerSlot.assignedElements().length > 0));
    this._titleSlot.addEventListener('slotchange', () => this._sync());
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open')) this._engage(); }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    this._sync();
    if (name !== 'open' || (previous === null) === (next === null)) return;
    if (next === null) this._onClosed(); else if (this.isConnected) this._engage();
  }

  get open() { return this.hasAttribute('open'); }
  set open(value) { if (value) this.setAttribute('open', ''); else this.removeAttribute('open'); }

  show() { this.setAttribute('open', ''); }

  /** Asks to close. Emits a cancelable `close`; unless it is cancelled the drawer closes and emits `closed`. */
  close(source = 'method') {
    if (!this.hasAttribute('open')) return;
    const proceed = this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true, cancelable: true, detail: { source } }));
    if (proceed) this.removeAttribute('open');
  }

  _onClosed() {
    this._release();
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }

  _sync() {
    const heading = this.getAttribute('heading') || '';
    this._heading.textContent = heading;
    const label = this.getAttribute('label');
    const named = !label && (heading || this._titleSlot.assignedNodes().length > 0);
    if (named) {
      this._panel.removeAttribute('aria-label');
      this._panel.setAttribute('aria-labelledby', 'title');
    } else {
      this._panel.removeAttribute('aria-labelledby');
      this._panel.setAttribute('aria-label', label || 'Drawer');
    }
    this._closeButton.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
    const width = this.getAttribute('width') || (this.getAttribute('size') === 'large' ? '736' : '');
    if (width) this.style.setProperty('--aha-drawer-width', /^\d+(\.\d+)?$/.test(width) ? `${width}px` : width);
    else this.style.removeProperty('--aha-drawer-width');
  }

  _engage() {
    if (this.hasAttribute('inline') || this._engaged) return;
    this._engaged = true;
    this._opener = deepActiveElement();
    openModals.push(this);
    this._lockedScroll = !this.hasAttribute('contained');
    if (this._lockedScroll) lockPageScroll();
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._body.scrollTop = 0;
    requestAnimationFrame(() => { if (this.hasAttribute('open')) this._panel.focus({ preventScroll: true }); });
  }

  _release() {
    if (!this._engaged) return;
    this._engaged = false;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    const wasOnTop = openModals[openModals.length - 1] === this;
    openModals.splice(openModals.indexOf(this), 1);
    if (this._lockedScroll) { this._lockedScroll = false; unlockPageScroll(); }
    const opener = this._opener;
    this._opener = null;
    if (wasOnTop && opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _onKey(event) {
    if (openModals[openModals.length - 1] !== this || event.defaultPrevented) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close('escape'); return; }
    if (event.key !== 'Tab') return;
    const stops = [...focusableWithin(this._header), this._body, ...focusableWithin(this)]
      .filter((element, index, all) => all.indexOf(element) === index && element.getClientRects().length > 0);
    if (!stops.length) { event.preventDefault(); return; }
    const index = stops.indexOf(deepActiveElement());
    const first = index <= 0;
    const last = index === stops.length - 1;
    if (index === -1 || (event.shiftKey && first) || (!event.shiftKey && last)) {
      event.preventDefault();
      stops[event.shiftKey ? stops.length - 1 : 0].focus();
    }
  }
}

export function defineAhaDrawer(tag = 'aha-drawer') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDrawer);
  return true;
}
if (typeof window !== 'undefined') defineAhaDrawer();

export default { AhaDrawer, defineAhaDrawer };
