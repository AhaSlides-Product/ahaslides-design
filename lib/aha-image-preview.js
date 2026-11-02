/**
 * @ahaslides-product/design/aha-image-preview — a full-screen image lightbox the host opens and closes.
 *
 *   import '@ahaslides-product/design/aha-image-preview';   // registers <aha-image-preview>
 *   <aha-image-preview src="/photo.jpg" alt="Team photo" toolbar open></aha-image-preview>
 *
 * The same overlay <aha-image> opens on click, as its own element with no frame, so a host can open it
 * from any trigger (an eye button on an image mask, a menu item) by setting `open`.
 *
 * Attributes:
 *   src, alt   the image to show
 *   open       shows the lightbox; the host owns it (set and remove it, or use show() / close())
 *   toolbar    adds the zoom out / zoom in / rotate left / rotate right / flip horizontal / flip vertical bar
 *   label, close-label, zoom-in-label, zoom-out-label, rotate-left-label, rotate-right-label,
 *   flip-horizontal-label, flip-vertical-label
 *              accessible names, for a translated host (English defaults)
 *
 * Events:
 *   close   cancelable, detail { source: 'escape' | 'mask' | 'close-button' | 'method' }; unless the host
 *           cancels it the element removes `open` itself
 *   closed  after `open` is removed, whoever removed it
 *
 * While open it is role="dialog" aria-modal, traps Tab, locks page scroll and gives focus back to whatever
 * opened it. Zoom, rotation and flip reset on every open and on a new `src`.
 */
import './icons.js';
import './aha-button.js';
import { focusableWithin, deepActiveElement, lockPageScroll, unlockPageScroll, openModals, raiseLayer, lowerLayer } from './aha-audience-modal.js';

const ZOOM_STEP = 0.5;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;

const LABELS = {
  label: 'Image preview',
  'close-label': 'Close preview',
  'zoom-out-label': 'Zoom out',
  'zoom-in-label': 'Zoom in',
  'rotate-left-label': 'Rotate left',
  'rotate-right-label': 'Rotate right',
  'flip-horizontal-label': 'Flip horizontally',
  'flip-vertical-label': 'Flip vertically',
};

const TOOLS = [
  ['zoom-out', 'system-minus'],
  ['zoom-in', 'system-plus'],
  ['rotate-left', 'system-arrow-counter-clockwise'],
  ['rotate-right', 'system-arrow-clockwise'],
  ['flip-horizontal', 'system-arrows-left-right'],
  ['flip-vertical', 'system-arrows-down-up'],
];

const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .pv{ position:fixed; inset:0; z-index:var(--aha-layer-z,1000); display:flex; align-items:center; justify-content:center;
    padding:var(--aha-space-32,32px); box-sizing:border-box; background:var(--aha-bg-overlay,rgba(0,0,0,.4));
    opacity:0; visibility:hidden; pointer-events:none;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      visibility var(--aha-motion-mid,.2s) linear }
  :host([open]) .pv{ opacity:1; visibility:visible; pointer-events:auto }
  .pv-panel{ position:relative; max-width:90vw; max-height:90vh; transform:scale(.96);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .pv-panel{ transform:scale(1) }
  .pv-panel:focus{ outline:none }
  .pv-img{ display:block; max-width:90vw; max-height:90vh; object-fit:contain;
    border-radius:var(--aha-radius-lg,12px); transform:var(--_view,none);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([toolbar]) .pv-img{ max-height:calc(90vh - 64px) }
  .pv-close{ position:absolute; top:11px; right:15px; width:var(--aha-space-20,20px); height:var(--aha-space-20,20px); display:flex;
    align-items:center; justify-content:center; padding:0; border:0; cursor:pointer;
    border-radius:var(--aha-radius-sm,6px); background:var(--aha-bg-container,#FFFFFF);
    color:var(--aha-icon-muted,#8A8A8A);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .pv-close:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  .pv-close:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:0 }
  .bar{ position:absolute; left:50%; bottom:var(--aha-space-16,16px); transform:translateX(-50%);
    display:none; gap:var(--aha-space-4,4px); padding:var(--aha-space-4,4px);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF) }
  :host([toolbar]) .bar{ display:flex }
  @media (prefers-reduced-motion: reduce){
    .pv,.pv-panel,.pv-img,.pv-close{ transition:none !important }
  }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="pv" part="preview" role="dialog" aria-modal="true">
    <div class="pv-panel" part="preview-panel" tabindex="-1">
      <button class="pv-close" part="preview-close" type="button">
        <aha-icon name="system-x" size="16" decorative></aha-icon>
      </button>
      <img class="pv-img" part="preview-img" alt=""/>
    </div>
    <div class="bar" part="toolbar" role="toolbar">
      ${TOOLS.map(([tool, icon]) => `<aha-button variant="tertiary" icon-only size="sm" data-tool="${tool}"><aha-icon name="${icon}" size="16" decorative></aha-icon></aha-button>`).join('')}
    </div>
  </div>`;

// The layer is still visibility:hidden on the frame the lightbox opens, so the first focus() can be refused.
const FOCUS_ATTEMPTS = 4;

export class AhaImagePreview extends HTMLElement {
  static get observedAttributes() { return ['open', 'src', 'alt', 'toolbar', ...Object.keys(LABELS)]; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._overlay = this.shadowRoot.querySelector('.pv');
    this._panel = this.shadowRoot.querySelector('.pv-panel');
    this._image = this.shadowRoot.querySelector('.pv-img');
    this._closeButton = this.shadowRoot.querySelector('.pv-close');
    this._toolButtons = [...this.shadowRoot.querySelectorAll('[data-tool]')];
    this._engaged = false;
    this._resetView();
    this._onDocumentKey = (event) => this._onKey(event);
    this._overlay.addEventListener('click', (event) => { if (event.target === this._overlay) this.close('mask'); });
    this._closeButton.addEventListener('click', () => this.close('close-button'));
    this._toolButtons.forEach((button) => button.addEventListener('click', () => this._applyTool(button.dataset.tool)));
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open')) this._engage(); }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    if (name === 'src' && previous !== next) this._resetView();
    this._sync();
    if (name !== 'open' || (previous === null) === (next === null)) return;
    if (next === null) this._onClosed();
    else if (this.isConnected) { this._resetView(); this._engage(); }
  }

  get open() { return this.hasAttribute('open'); }
  set open(value) { if (value) this.setAttribute('open', ''); else this.removeAttribute('open'); }

  show() { this.setAttribute('open', ''); }

  /** Asks to close. Emits a cancelable `close`; unless it is cancelled the lightbox closes and emits `closed`. */
  close(source = 'method') {
    if (!this.hasAttribute('open')) return;
    const proceed = this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true, cancelable: true, detail: { source } }));
    if (proceed) this.removeAttribute('open');
  }

  _label(name) { return this.getAttribute(name) || LABELS[name]; }

  _sync() {
    const src = this.getAttribute('src') || '';
    if (this._image.getAttribute('src') !== src) this._image.setAttribute('src', src);
    this._image.setAttribute('alt', this.getAttribute('alt') || '');
    this._overlay.setAttribute('aria-label', this._label('label'));
    this._closeButton.setAttribute('aria-label', this._label('close-label'));
    this._toolButtons.forEach((button) => button.setAttribute('aria-label', this._label(`${button.dataset.tool}-label`)));
    this._paintView();
  }

  _resetView() { this._view = { scale: 1, rotate: 0, flipX: 1, flipY: 1 }; if (this._image) this._paintView(); }

  _applyTool(tool) {
    const view = this._view;
    if (tool === 'zoom-in') view.scale = Math.min(ZOOM_MAX, view.scale + ZOOM_STEP);
    else if (tool === 'zoom-out') view.scale = Math.max(ZOOM_MIN, view.scale - ZOOM_STEP);
    else if (tool === 'rotate-left') view.rotate -= 90;
    else if (tool === 'rotate-right') view.rotate += 90;
    else if (tool === 'flip-horizontal') view.flipX *= -1;
    else if (tool === 'flip-vertical') view.flipY *= -1;
    this._paintView();
  }

  _paintView() {
    const { scale, rotate, flipX, flipY } = this._view;
    this._image.style.setProperty('--_view', `scale(${scale * flipX}, ${scale * flipY}) rotate(${rotate}deg)`);
    this._toolButtons.forEach((button) => {
      const atLimit = (button.dataset.tool === 'zoom-in' && scale >= ZOOM_MAX) || (button.dataset.tool === 'zoom-out' && scale <= ZOOM_MIN);
      button.toggleAttribute('disabled', atLimit);
    });
  }

  _onClosed() {
    this._release();
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }

  _engage() {
    if (this._engaged) return;
    this._engaged = true;
    this._opener = deepActiveElement();
    raiseLayer(this);
    openModals.push(this);
    lockPageScroll();
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._focusClose(FOCUS_ATTEMPTS);
  }

  _focusClose(attemptsLeft) {
    requestAnimationFrame(() => {
      if (!this.hasAttribute('open')) return;
      this._closeButton.focus({ preventScroll: true });
      if (this.shadowRoot.activeElement !== this._closeButton && attemptsLeft > 1) this._focusClose(attemptsLeft - 1);
    });
  }

  _release() {
    if (!this._engaged) return;
    this._engaged = false;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    const wasOnTop = openModals[openModals.length - 1] === this;
    openModals.splice(openModals.indexOf(this), 1);
    lowerLayer(this);
    unlockPageScroll();
    const opener = this._opener;
    this._opener = null;
    if (wasOnTop && opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _onKey(event) {
    if (openModals[openModals.length - 1] !== this || event.defaultPrevented) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close('escape'); return; }
    if (event.key !== 'Tab') return;
    const stops = [this._closeButton, ...focusableWithin(this.shadowRoot.querySelector('.bar'))]
      .filter((element, index, all) => all.indexOf(element) === index && element.getClientRects().length > 0);
    const index = stops.indexOf(deepActiveElement());
    if (index === -1 || (event.shiftKey && index === 0) || (!event.shiftKey && index === stops.length - 1)) {
      event.preventDefault();
      stops[event.shiftKey ? stops.length - 1 : 0].focus();
    }
  }
}

export function defineAhaImagePreview(tag = 'aha-image-preview') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImagePreview);
  return true;
}
if (typeof window !== 'undefined') defineAhaImagePreview();

export default { AhaImagePreview, defineAhaImagePreview };
