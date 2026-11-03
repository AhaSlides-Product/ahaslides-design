/**
 * @ahaslides-product/design/aha-modal — the Modal as a web component, for code that cannot take the antd Modal.
 *
 *   import '@ahaslides-product/design/aha-modal';   // registers <aha-modal>
 *
 *   <aha-modal heading="Rename presentation" ok-text="Rename" open>
 *     …body, scrolls when taller than the cap…
 *   </aha-modal>
 *
 *   <aha-modal heading="Delete this team?" ok-text="Delete team" ok-danger>This can't be undone.</aha-modal>
 *
 * Reproduces the antd Modal as themed by modal-theme.js: a white dialog with radius 8 and 20/24 padding, an 18px SemiBold ink title
 * with the shared dismiss ✕ on its first line, a 14/22 body, Cancel (secondary) and OK (primary) buttons at 36 high on the right,
 * and a dimmed mask. `size` picks the DS tier (simple 504 · 75vh, complexity 720 · 80vh, rich 1280 · 90vh) and `width` overrides
 * the width; either way the dialog never grows past the viewport less 16 each side, and past the height cap the body scrolls.
 *
 * `ok-text`, `cancel-text`, `ok-disabled` and `confirm-loading` drive the default buttons. `ok-danger` is a destructive
 * confirmation (overlays C2, C7): OK turns secondary, Cancel becomes the primary, and a mask click never closes it.
 * While `confirm-loading` is set, OK shows its spinner and Cancel, ✕, Escape and the mask do nothing. `slot="footer"` replaces
 * both buttons; `no-footer` drops the footer. `closable="false"` hides the ✕, `mask-closable="false"` ignores a mask click and
 * `keyboard="false"` ignores Escape.
 *
 * OK emits a cancelable composed `ok`. Cancel, the ✕, Escape and the mask emit a cancelable composed `cancel`
 * ({ detail: { source } }). Unless cancelled, either goes on to the cancelable `close` (also from `close()`), then the modal
 * closes and emits `closed`; call `preventDefault()` on any of them to keep it open, for example while an async OK runs. While
 * open it traps Tab, locks page scroll and returns focus to whatever opened it. `contained` centres it in the nearest
 * positioned ancestor instead of the viewport; `inline` does the same as a static display with no trap, no scroll lock and no
 * keys (docs, previews).
 */
import './icons.js';
import './aha-button.js';
import { focusableWithin, deepActiveElement, lockPageScroll, unlockPageScroll, openModals, raiseLayer, lowerLayer } from './aha-audience-modal.js';

const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  :host([size=complexity]){ --aha-modal-width:720px; --aha-modal-max-height:80vh }
  :host([size=rich]){ --aha-modal-width:1280px; --aha-modal-max-height:90vh }
  .layer{ position:fixed; inset:0; z-index:var(--aha-layer-z, 1000); box-sizing:border-box; display:flex; flex-direction:column; align-items:center;
    justify-content:flex-start; padding:min(var(--aha-space-100, 100px), 10vh) var(--aha-space-16, 16px) var(--aha-space-24, 24px); pointer-events:none; visibility:hidden;
    transition:visibility var(--aha-motion-slow, .3s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([centered]) .layer{ justify-content:center; padding-top:var(--aha-space-24, 24px) }
  :host([open]) .layer{ visibility:visible; pointer-events:auto }
  :host([contained]) .layer, :host([inline]) .layer{ position:absolute; z-index:var(--aha-layer-z, 10) }
  :host([inline]) .layer{ pointer-events:none }
  .mask{ position:absolute; inset:0; background:var(--aha-bg-overlay, rgba(0,0,0,.4)); opacity:0; transition:opacity var(--aha-motion-slow, .3s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .mask{ opacity:1 }
  .panel{ position:relative; box-sizing:border-box; display:flex; flex-direction:column; width:min(var(--aha-modal-width, 504px), 100%);
    max-height:min(var(--aha-modal-max-height, 75vh), 100%); padding:var(--aha-space-20, 20px) var(--aha-space-24, 24px);
    background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); border-radius:var(--aha-radius-default, 8px); pointer-events:auto;
    box-shadow:0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05);
    opacity:0; transform:scale(.2);
    transition:transform var(--aha-motion-slow, .3s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)), opacity var(--aha-motion-slow, .3s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ opacity:1; transform:none }
  .panel:focus{ outline:none }
  .header{ flex:0 0 auto; display:flex; align-items:flex-start; gap:var(--aha-space-8, 8px); margin-bottom:var(--aha-space-8, 8px) }
  .panel.untitled .header{ justify-content:flex-end }
  .panel.untitled .title{ display:none }
  .panel.untitled.no-close .header{ display:none }
  .title{ flex:1 1 auto; min-width:0; margin:0; font-size:var(--aha-size-h6, 18px); line-height:1.5; font-weight:600; color:var(--aha-text-default, #1A1A1A); overflow-wrap:anywhere }
  .close{ --aha-close-line-height:27px }
  .panel.no-close .close{ display:none }
  .body{ flex:1 1 auto; min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain;
    font-size:var(--aha-size-default, 14px); line-height:22px; overflow-wrap:anywhere }
  .body:focus{ outline:none }
  .body:focus-visible{ outline:2px solid var(--aha-border-focus, #E70E68); outline-offset:2px }
  .footer{ flex:0 0 auto; margin-top:var(--aha-space-12, 12px); display:flex; justify-content:flex-end; align-items:center; gap:var(--aha-space-8, 8px) }
  :host([no-footer]) .footer{ display:none }
  .buttons{ display:flex; justify-content:flex-end; align-items:center; gap:var(--aha-space-8, 8px) }
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
      <div class="body" part="body" role="region"><slot></slot></div>
      <div class="footer" part="footer"><slot name="footer"><span class="buttons">
        <aha-button class="cancel" part="cancel-button" variant="secondary" size="md">Cancel</aha-button>
        <aha-button class="ok" part="ok-button" variant="primary" size="md">OK</aha-button>
      </span></slot></div>
    </div>
  </div>`;

const POPUP_TAGS = ['aha-select', 'aha-dropdown', 'aha-menu', 'aha-popover'];

const hasOpenPopup = (event, modal) => {
  const path = event.composedPath();
  const inside = path.indexOf(modal);
  return (inside === -1 ? path : path.slice(0, inside)).some((node) => node.nodeType === 1
    && ((node.getAttribute('aria-expanded') === 'true' && (node.hasAttribute('aria-haspopup') || node.getAttribute('role') === 'combobox')) || (POPUP_TAGS.includes(node.localName) && node.hasAttribute('open'))));
};

const fromOtherDialog = (event, modal) => {
  const path = event.composedPath();
  return !path.includes(modal) && path.some((node) => node.nodeType === 1 && node.getAttribute('aria-modal') === 'true');
};

const isOff = (element, name) => element.getAttribute(name) === 'false';
// React 18 writes a false prop on a custom element as the string "false".
const FLAGS = ['open', 'ok-danger', 'ok-disabled', 'confirm-loading', 'no-footer', 'centered', 'contained', 'inline'];
const isSet = (value) => value !== null && value !== 'false';
const isShown = (element) => (element.checkVisibility ? element.checkVisibility({ visibilityProperty: true }) : element.getClientRects().length > 0);
const toLength = (value) => (/^\d+(\.\d+)?$/.test(value) ? `${value}px` : value);
// The layer is still visibility:hidden on the frame show() runs, so the first focus() can be refused.
const FOCUS_ATTEMPTS = 4;

export class AhaModal extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'heading', 'label', 'close-label', 'width', 'size', 'ok-text', 'cancel-text', 'ok-disabled', 'ok-danger', 'confirm-loading', 'closable', 'no-footer', 'centered', 'contained', 'inline'];
  }

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
    this._okButton = this.shadowRoot.querySelector('.ok');
    this._cancelButton = this.shadowRoot.querySelector('.cancel');
    this._footer = this.shadowRoot.querySelector('.footer');
    this._titleSlot = this.shadowRoot.querySelector('slot[name=title]');
    this._onDocumentKey = (event) => this._onKey(event);
    this.shadowRoot.querySelector('.mask').addEventListener('click', () => {
      if (this.hasAttribute('ok-danger') || isOff(this, 'mask-closable')) return;
      this._cancel('mask');
    });
    this._closeButton.addEventListener('click', () => this._cancel('close-button'));
    this._cancelButton.addEventListener('click', () => this._cancel('cancel-button'));
    this._okButton.addEventListener('click', () => this._ok());
    this._titleSlot.addEventListener('slotchange', () => this._sync());
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open')) this._engage(); }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    if (next === 'false' && FLAGS.includes(name)) this.removeAttribute(name);
    this._sync();
    if (name !== 'open' || isSet(previous) === isSet(next)) return;
    if (!isSet(next)) this._onClosed(); else if (this.isConnected) this._engage();
  }

  get open() { return this.hasAttribute('open'); }
  set open(value) { this.toggleAttribute('open', Boolean(value) && value !== 'false'); }

  show() { this.setAttribute('open', ''); }

  /** Asks to close. Emits a cancelable `close`; unless it is cancelled the modal closes and emits `closed`. */
  close(source = 'method') {
    if (!this.hasAttribute('open')) return;
    const proceed = this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true, cancelable: true, detail: { source } }));
    if (!proceed) return;
    this._closedBy = source;
    this.removeAttribute('open');
  }

  _ok() {
    if (!this.hasAttribute('open') || this.hasAttribute('ok-disabled') || this.hasAttribute('confirm-loading')) return;
    if (this.dispatchEvent(new CustomEvent('ok', { bubbles: true, composed: true, cancelable: true }))) this.close('ok');
  }

  _cancel(source) {
    if (!this.hasAttribute('open') || this.hasAttribute('confirm-loading')) return;
    if (this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true, cancelable: true, detail: { source } }))) this.close(source);
  }

  _onClosed() {
    this._release();
    const source = this._closedBy || 'attribute';
    this._closedBy = null;
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true, detail: { source } }));
  }

  _sync() {
    const heading = this.getAttribute('heading') || '';
    this._heading.textContent = heading;
    const titled = Boolean(heading) || this._titleSlot.assignedNodes().length > 0;
    this._panel.classList.toggle('untitled', !titled);
    const label = this.getAttribute('label');
    if (!label && titled) {
      this._panel.removeAttribute('aria-label');
      this._panel.setAttribute('aria-labelledby', 'title');
    } else {
      this._panel.removeAttribute('aria-labelledby');
      this._panel.setAttribute('aria-label', label || 'Dialog');
    }
    this._body.setAttribute('aria-label', label || heading || 'Dialog');
    this._panel.classList.toggle('no-close', isOff(this, 'closable'));
    this._closeButton.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');

    this._okButton.textContent = this.getAttribute('ok-text') || 'OK';
    this._cancelButton.textContent = this.getAttribute('cancel-text') || 'Cancel';
    const danger = this.hasAttribute('ok-danger');
    const loading = this.hasAttribute('confirm-loading');
    this._okButton.setAttribute('variant', danger ? 'secondary' : 'primary');
    this._cancelButton.setAttribute('variant', danger ? 'primary' : 'secondary');
    this._okButton.toggleAttribute('loading', loading);
    this._okButton.toggleAttribute('disabled', this.hasAttribute('ok-disabled'));
    this._cancelButton.toggleAttribute('disabled', loading);
    this._closeButton.toggleAttribute('disabled', loading);

    const width = this.getAttribute('width');
    if (width) this.style.setProperty('--aha-modal-width', toLength(width));
    else this.style.removeProperty('--aha-modal-width');
  }

  _engage() {
    if (this.hasAttribute('inline') || this._engaged) return;
    this._engaged = true;
    this._opener = deepActiveElement();
    raiseLayer(this);
    openModals.push(this);
    this._lockedScroll = !this.hasAttribute('contained');
    if (this._lockedScroll) lockPageScroll();
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._body.scrollTop = 0;
    this._focusPanel(FOCUS_ATTEMPTS);
  }

  _focusPanel(attemptsLeft) {
    requestAnimationFrame(() => {
      if (!this.hasAttribute('open')) return;
      this._body.tabIndex = this._body.scrollHeight > this._body.clientHeight ? 0 : -1;
      this._panel.focus({ preventScroll: true });
      if (this.shadowRoot.activeElement !== this._panel && attemptsLeft > 1) this._focusPanel(attemptsLeft - 1);
    });
  }

  _release() {
    if (!this._engaged) return;
    this._engaged = false;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    const wasOnTop = openModals[openModals.length - 1] === this;
    openModals.splice(openModals.indexOf(this), 1);
    lowerLayer(this);
    if (this._lockedScroll) { this._lockedScroll = false; unlockPageScroll(); }
    const opener = this._opener;
    this._opener = null;
    if (wasOnTop && opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _tabStops() {
    const body = this._body.tabIndex === 0 ? [this._body] : [];
    return [...focusableWithin(this._header), ...body, ...focusableWithin(this), ...focusableWithin(this._footer)]
      .filter((element, index, all) => all.indexOf(element) === index && isShown(element));
  }

  _onKey(event) {
    if (openModals[openModals.length - 1] !== this || event.defaultPrevented) return;
    if (event.key === 'Escape' || event.key === 'Tab') { if (hasOpenPopup(event, this) || fromOtherDialog(event, this)) return; }
    if (event.key === 'Escape') {
      if (isOff(this, 'keyboard')) return;
      event.preventDefault();
      event.stopPropagation();
      this._cancel('escape');
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = this._tabStops();
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

export function defineAhaModal(tag = 'aha-modal') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaModal);
  return true;
}
if (typeof window !== 'undefined') defineAhaModal();

export default { AhaModal, defineAhaModal };
