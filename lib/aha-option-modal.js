/**
 * @ahaslides-product/design/aha-option-modal — the audience modal card that shows one option in full.
 *
 *   import '@ahaslides-product/design/aha-option-modal';   // registers <aha-option-modal>
 *   <aha-option-modal open image="https://…/photo.jpg">The whole option text, however long.</aha-option-modal>
 *
 * Open it from the `expand` event of <aha-answer-option expandable> or <aha-rank-list expandable> (More or the picture). It is a
 * centred card with the picture on top and the full text below; the body scrolls when the card is taller than its container, so
 * it fits a short iframe. There is no dark backdrop, because a backdrop is cut off inside an iframe: the card carries a border
 * and shadow to read on the deck, and a tap outside it (an invisible hit layer) closes it. It also closes on the close button
 * and Escape, then emits composed `close`; the host removes `open` itself. While open it traps Tab inside the card and gives
 * focus back to whatever opened it. `inline` draws the card in the page flow; `contained` centres it inside the nearest positioned
 * ancestor (a phone-sized frame in docs and previews) instead of the viewport. `<aha-bottom-sheet>` is a deprecated alias.
 */
import './icons.js';
import './aha-button.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openModals = [];
let lockedOverflow = null;

const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  .layer{ position:fixed; inset:0; z-index:1000; box-sizing:border-box; display:flex; align-items:center; justify-content:center; padding:var(--aha-space-16, 16px); visibility:hidden;
    transition:visibility var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .layer{ visibility:visible; transition:none }
  .hit{ position:absolute; inset:0; background:transparent }
  .panel{ position:relative; box-sizing:border-box; display:flex; flex-direction:column; width:100%; max-width:480px; max-height:100%;
    background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); --aha-deck-ink:var(--aha-text-default, #1A1A1A); font-family:inherit;
    border:1px solid var(--aha-border-default, #E5E5E5); border-radius:var(--aha-radius-default, 8px); box-shadow:0 8px 24px var(--aha-ink-a30, rgba(0,0,0,.3));
    opacity:0; transform:scale(.96);
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ opacity:1; transform:none }
  .panel:focus{ outline:none }
  .head{ flex:0 0 auto; display:flex; align-items:center; justify-content:flex-end; min-height:var(--aha-space-40, 40px); padding:var(--aha-space-8, 8px) var(--aha-space-8, 8px) 0 }
  .body{ flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 var(--aha-space-24, 24px) var(--aha-space-24, 24px) }
  .picture{ display:none; width:100%; height:auto; max-height:none; margin:0 0 var(--aha-space-16, 16px); border-radius:var(--aha-radius-default, 8px); object-fit:contain }
  :host([image]) .picture{ display:block }
  .text{ font-size:16px; line-height:24px; overflow-wrap:anywhere; white-space:pre-wrap }
  :host([contained]) .layer{ position:absolute; z-index:10 }
  :host([inline]) .layer{ position:static; z-index:auto; display:block; padding:0; visibility:visible }
  :host([inline]) .hit{ display:none }
  :host([inline]) .panel{ max-width:none; max-height:none; opacity:1; transform:none; box-shadow:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="layer" part="layer">
    <div class="hit" part="hit"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1">
      <div class="head"><aha-button class="close" variant="tertiary-deck" size="md" icon-only sheet aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button></div>
      <div class="body" part="body"><img class="picture" alt=""><div class="text" dir="auto"><slot></slot></div></div>
    </div>
  </div>`;

export class AhaOptionModal extends HTMLElement {
  static get observedAttributes() { return ['open', 'image', 'image-alt', 'label', 'close-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._panel = this.shadowRoot.querySelector('.panel');
    this._body = this.shadowRoot.querySelector('.body');
    this._picture = this.shadowRoot.querySelector('.picture');
    this._closeButton = this.shadowRoot.querySelector('.close');
    this._onDocumentKey = (event) => this._onKey(event);
    this.shadowRoot.querySelector('.hit').addEventListener('click', () => this._dismiss());
    this._closeButton.addEventListener('click', () => this._dismiss());
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open') && this._previousOverflow === undefined) this._engage(); }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    this._sync();
    if (name === 'open' && (previous === null) !== (next === null)) next === null ? this._release() : this._engage();
  }

  /** Opens the modal. Same as setting the `open` attribute. */
  show() { this.setAttribute('open', ''); }
  /** Closes the modal and emits `close`. */
  hide() { this._dismiss(); }

  _dismiss() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  _sync() {
    this._panel.setAttribute('aria-label', this.getAttribute('label') || 'Option details');
    this._closeButton.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
    const image = this.getAttribute('image');
    if (image && this._picture.getAttribute('src') !== image) this._picture.setAttribute('src', image);
    this._picture.setAttribute('alt', this.getAttribute('image-alt') || '');
  }

  _engage() {
    if (this.hasAttribute('inline')) return;
    this._opener = deepActiveElement();
    this._previousOverflow = '';
    openModals.push(this);
    if (!this.hasAttribute('contained') && lockedOverflow === null) {
      lockedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._body.scrollTop = 0;
    requestAnimationFrame(() => { if (this.hasAttribute('open')) this._panel.focus({ preventScroll: true }); });
  }

  _release() {
    if (this._previousOverflow === undefined) return;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    openModals.splice(openModals.indexOf(this), 1);
    if (lockedOverflow !== null && !openModals.some((modal) => !modal.hasAttribute('contained'))) {
      document.documentElement.style.overflow = lockedOverflow;
      lockedOverflow = null;
    }
    this._previousOverflow = undefined;
    const opener = this._opener;
    this._opener = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _onKey(event) {
    if (openModals[openModals.length - 1] !== this) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this._dismiss(); return; }
    if (event.key !== 'Tab') return;
    const stops = [...focusableWithin(this._panel), ...focusableWithin(this)];
    if (!stops.length) { event.preventDefault(); return; }
    const active = deepActiveElement();
    const index = stops.indexOf(active);
    const next = event.shiftKey ? (index <= 0 ? stops.length - 1 : index - 1) : (index === stops.length - 1 ? 0 : index + 1);
    if (index === -1 || (event.shiftKey && index <= 0) || (!event.shiftKey && index === stops.length - 1)) {
      event.preventDefault();
      stops[next].focus();
    }
  }
}

function focusableWithin(root) {
  const found = [];
  for (const element of root.querySelectorAll('*')) {
    if (element.matches(FOCUSABLE)) found.push(element);
    if (element.shadowRoot) found.push(...focusableWithin(element.shadowRoot));
  }
  return found;
}

function deepActiveElement() {
  let active = document.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function defineAhaOptionModal(tag = 'aha-option-modal') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaOptionModal);
  return true;
}
if (typeof window !== 'undefined') defineAhaOptionModal();

export default { AhaOptionModal, defineAhaOptionModal };
