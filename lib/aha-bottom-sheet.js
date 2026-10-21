/**
 * @ahaslides-product/design/aha-bottom-sheet — the audience bottom sheet that shows one option in full.
 *
 *   import '@ahaslides-product/design/aha-bottom-sheet';   // registers <aha-bottom-sheet>
 *   <aha-bottom-sheet open image="https://…/photo.jpg">The whole option text, however long.</aha-bottom-sheet>
 *
 * Open it from the `expand` event of <aha-answer-option expandable> or <aha-rank-list expandable> (More or the picture). The picture sits on
 * top, the full text below, and the whole body scrolls when it is taller than 75% of the screen. It closes on the
 * backdrop, the close button, Escape and a swipe down, then emits composed `close`; the host removes `open`
 * itself. While open it traps Tab inside the sheet and gives focus back to whatever opened it. `inline` draws the
 * panel in the page flow with no backdrop, for docs and previews.
 */
import './icons.js';
import './aha-button.js';

const CLOSE_DISTANCE = 96;
const CLOSE_VELOCITY = 0.5;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  .layer{ position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-end; justify-content:center; visibility:hidden;
    transition:visibility var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .layer{ visibility:visible; transition:none }
  .backdrop{ position:absolute; inset:0; background:var(--aha-bg-overlay, rgba(0, 0, 0, .4)); opacity:0;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .backdrop{ opacity:1 }
  .panel{ position:relative; box-sizing:border-box; display:flex; flex-direction:column; width:100%; max-width:560px; max-height:75vh; max-height:75dvh;
    background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); font-family:inherit;
    border-radius:var(--aha-radius-xl, 16px) var(--aha-radius-xl, 16px) 0 0; transform:translateY(100%);
    transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ transform:translateY(0) }
  .panel[data-dragging]{ transition:none }
  .panel:focus{ outline:none }
  .head{ flex:0 0 auto; display:flex; align-items:center; justify-content:flex-end; min-height:var(--aha-space-40, 40px); padding:var(--aha-space-8, 8px) var(--aha-space-8, 8px) 0; touch-action:none; cursor:grab }
  .grab{ position:absolute; top:var(--aha-space-8, 8px); left:50%; width:var(--aha-space-40, 40px); height:var(--aha-space-4, 4px); transform:translateX(-50%);
    border-radius:var(--aha-radius-pill, 999px); background:var(--aha-text-placeholder, #BFBFBF); pointer-events:none }
  .body{ flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 var(--aha-space-24, 24px) var(--aha-space-24, 24px) }
  .picture{ display:none; width:100%; height:auto; max-height:none; margin:0 0 var(--aha-space-16, 16px); border-radius:var(--aha-radius-default, 8px); object-fit:contain }
  :host([image]) .picture{ display:block }
  .text{ font-size:16px; line-height:24px; overflow-wrap:anywhere; white-space:pre-wrap }
  :host([inline]) .layer{ position:static; z-index:auto; display:block; visibility:visible }
  :host([inline]) .backdrop{ display:none }
  :host([inline]) .panel{ max-width:none; max-height:none; transform:none; border-radius:var(--aha-radius-xl, 16px); border:1px solid var(--aha-border-default, #E5E5E5) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="layer" part="layer">
    <div class="backdrop" part="backdrop"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1">
      <span class="grab"></span>
      <div class="head"><aha-button class="close" variant="tertiary-deck" size="md" icon-only sheet aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button></div>
      <div class="body" part="body"><img class="picture" alt=""><div class="text" dir="auto"><slot></slot></div></div>
    </div>
  </div>`;

export class AhaBottomSheet extends HTMLElement {
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
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this._dismiss());
    this._closeButton.addEventListener('click', () => this._dismiss());
    this._bindDrag();
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open') && this._previousOverflow === undefined) this._engage(); }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    this._sync();
    if (name === 'open' && (previous === null) !== (next === null)) next === null ? this._release() : this._engage();
  }

  /** Opens the sheet. Same as setting the `open` attribute. */
  show() { this.setAttribute('open', ''); }
  /** Closes the sheet and emits `close`. */
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
    this._previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._body.scrollTop = 0;
    requestAnimationFrame(() => { if (this.hasAttribute('open')) this._panel.focus({ preventScroll: true }); });
  }

  _release() {
    if (this._previousOverflow === undefined) return;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    document.documentElement.style.overflow = this._previousOverflow;
    this._previousOverflow = undefined;
    const opener = this._opener;
    this._opener = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _onKey(event) {
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

  _bindDrag() {
    let start = null;
    const begin = (y) => { start = { y, time: performance.now(), distance: 0 }; };
    const move = (y, event) => {
      if (!start) return;
      start.distance = Math.max(0, y - start.y);
      if (start.distance > 0 && event.cancelable) event.preventDefault();
      this._panel.dataset.dragging = '';
      this._panel.style.transform = `translateY(${start.distance}px)`;
    };
    const end = () => {
      if (!start) return;
      const { distance, time } = start;
      start = null;
      delete this._panel.dataset.dragging;
      this._panel.style.transform = '';
      const velocity = distance / Math.max(1, performance.now() - time);
      if (distance > CLOSE_DISTANCE || (distance > 24 && velocity > CLOSE_VELOCITY)) this._dismiss();
    };
    const head = this.shadowRoot.querySelector('.head');
    head.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.close') || this.hasAttribute('inline')) return;
      head.setPointerCapture(event.pointerId);
      begin(event.clientY);
    });
    head.addEventListener('pointermove', (event) => move(event.clientY, event));
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
    this._body.addEventListener('touchstart', (event) => { if (this._body.scrollTop <= 0 && !this.hasAttribute('inline')) begin(event.touches[0].clientY); else start = null; }, { passive: true });
    this._body.addEventListener('touchmove', (event) => { if (start) move(event.touches[0].clientY, event); }, { passive: false });
    this._body.addEventListener('touchend', end);
    this._body.addEventListener('touchcancel', end);
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

export function defineAhaBottomSheet(tag = 'aha-bottom-sheet') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBottomSheet);
  return true;
}
if (typeof window !== 'undefined') defineAhaBottomSheet();

export default { AhaBottomSheet, defineAhaBottomSheet };
