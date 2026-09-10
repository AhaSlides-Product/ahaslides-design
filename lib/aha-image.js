/**
 * @ahaslides-product/design/aha-image — the shared Image primitive.
 *
 *   import '@ahaslides-product/design/aha-image';   // registers <aha-image>
 *   <aha-image src="/cover.jpg" alt="Deck cover" width="240" height="150"></aha-image>
 *
 * A framed image with rounded corners and a hover mask that invites a preview. The image scales
 * and the mask fades in on hover — both animate on a PERSISTENT node via the shared motion tokens.
 * The mask is a real promise: clicking (or Enter/Space on) the frame opens a modal preview overlay
 * — role="dialog", aria-modal, focus moved in and restored on close; Escape, the close button, and
 * a backdrop click all dismiss it. The overlay is a persistent node too, faded/scaled in on the
 * shared tokens (never rebuilt on open), so its transition always fires.
 *
 * The DS V3 Image matches antd's matrix:
 *   width / height  — size the frame (px).
 *   preview         — click-to-zoom on by default; `preview="false"` renders a plain framed picture
 *                     (no mask, no click, no dialog).
 *   placeholder     — a loading skeleton shown until the image `load`s (shimmer on a persistent node).
 *   fallback        — a broken-src error state: on the image `error` the frame swaps to a
 *                     system-image glyph + label (also honoured for an empty `src`).
 *   radius          — the frame corner from the DS scale (`xs 4 · sm 6 · default 8 · lg 12 · xl 16`).
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * The close ✕ and the broken glyph are shared DS icons called BY NAME (system-x, system-image-square).
 */
import './icons.js';   // registers <aha-icon> (the close glyph comes from the shared registry)

const STYLE = `
  :host{ display:inline-block; --_r:var(--aha-radius-default,8px) }
  :host([radius="xs"]){ --_r:var(--aha-radius-xs,4px) }
  :host([radius="sm"]){ --_r:var(--aha-radius-sm,6px) }
  :host([radius="lg"]){ --_r:var(--aha-radius-lg,12px) }
  :host([radius="xl"]){ --_r:var(--aha-radius-xl,16px) }
  :host([radius="pill"]){ --_r:var(--aha-radius-pill,999px) }
  .frame{ position:relative; display:block; overflow:hidden; cursor:pointer;
    border-radius:var(--_r); background:var(--aha-bg-container-secondary,#F7F7F7) }
  .frame:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  /* preview off — a plain framed picture: no zoom cursor, no mask, no scale */
  :host([preview="false"]) .frame{ cursor:default }
  .img{ display:block; width:100%; height:100%; object-fit:cover;
    transition:transform var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .mask{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-bg-overlay,rgba(26,26,46,.7)); opacity:0;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .frame:not([data-preview="off"]):hover .img{ transform:scale(1.06) }
  .frame:not([data-preview="off"]):hover .mask{ opacity:1 }
  :host([preview="false"]) .mask{ display:none }

  /* loading placeholder — a skeleton on a persistent node that pulses; .loaded fades it out */
  .placeholder{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    color:var(--aha-icon-muted,#8A8A8A); background:var(--aha-bg-container-secondary,#F7F7F7);
    opacity:1; transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1));
    animation:aha-img-pulse 1.4s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }
  @keyframes aha-img-pulse{ 0%,100%{ background:var(--aha-bg-container-secondary,#F7F7F7) } 50%{ background:var(--aha-bg-container-disabled,#F1F1F1) } }
  .frame[data-state="loaded"] .placeholder{ opacity:0; animation:none; pointer-events:none }
  .frame[data-state="loaded"] .img{ opacity:1 }
  .frame[data-state="loading"] .img{ opacity:0 }

  /* fallback / broken-src error state — a system glyph + label, revealed on the image error */
  .fallback{ position:absolute; inset:0; display:none; flex-direction:column; gap:6px;
    align-items:center; justify-content:center; color:var(--aha-text-tertiary,#8A8A8A);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; font-weight:600;
    background:var(--aha-bg-container-secondary,#F7F7F7) }
  .frame[data-state="error"] .fallback{ display:flex }
  .frame[data-state="error"] .img,
  .frame[data-state="error"] .placeholder,
  .frame[data-state="error"] .mask{ display:none }

  /* the preview overlay — a persistent node; open/close only toggles the .show class */
  .pv{ position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center;
    padding:32px; box-sizing:border-box; background:var(--aha-bg-overlay,rgba(26,26,46,.7));
    opacity:0; visibility:hidden; pointer-events:none;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      visibility var(--aha-motion-mid,.2s) linear }
  .pv.show{ opacity:1; visibility:visible; pointer-events:auto }
  .pv-panel{ position:relative; max-width:90vw; max-height:90vh; transform:scale(.96);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .pv.show .pv-panel{ transform:scale(1) }
  .pv-img{ display:block; max-width:90vw; max-height:90vh; object-fit:contain;
    border-radius:var(--aha-radius-lg,12px) }
  .pv-close{ position:absolute; top:-14px; right:-14px; width:32px; height:32px; display:flex;
    align-items:center; justify-content:center; padding:0; border:0; cursor:pointer;
    border-radius:var(--aha-radius-pill,999px); background:var(--aha-bg-container,#FFFFFF);
    color:var(--aha-icon-strong,#1A1A1A); box-shadow:0 2px 8px rgba(26,26,46,.28);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .pv-close:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .pv-close:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  @media (prefers-reduced-motion: reduce){
    .img,.mask,.pv,.pv-panel,.pv-close,.placeholder{ transition:none !important }
    .placeholder{ animation:none !important }
    .frame:hover .img{ transform:none }
  }
`;

export class AhaImage extends HTMLElement {
  static get observedAttributes() { return ['src', 'alt', 'width', 'height', 'preview', 'radius', 'placeholder', 'fallback']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  disconnectedCallback() { this._teardown(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _previewOff() { return this.getAttribute('preview') === 'false'; }

  _render() {
    const src = this.getAttribute('src') || '';
    const alt = this.getAttribute('alt') || '';
    const w = this.getAttribute('width'), h = this.getAttribute('height');
    const size = `${w ? `width:${Number(w)}px;` : ''}${h ? `height:${Number(h)}px;` : ''}`;
    const previewOff = this._previewOff();
    const label = `Preview${alt ? `: ${alt}` : ''}`;
    const showPlaceholder = this.hasAttribute('placeholder');
    // start in the error state for an empty src; otherwise loading (placeholder) or ready
    const initState = !src ? 'error' : (showPlaceholder ? 'loading' : 'loaded');
    const frameAttrs = previewOff
      ? `part="frame" data-preview="off" aria-label="${escAttr(alt)}"`
      : `part="frame" role="button" tabindex="0" aria-label="${escAttr(label)}"`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="frame" ${frameAttrs} data-state="${initState}" style="${size}">
        <img class="img" part="img" src="${escAttr(src)}" alt="${escAttr(alt)}"/>
        ${showPlaceholder ? `<div class="placeholder" part="placeholder" aria-hidden="true"></div>` : ''}
        <div class="fallback" part="fallback" role="img" aria-label="${escAttr(alt || 'Image failed to load')}">
          <aha-icon name="system-image-square" size="24" decorative></aha-icon>
          <span>${escAttr(this.getAttribute('fallback') || 'Image unavailable')}</span>
        </div>
        ${previewOff ? '' : `<div class="mask" part="mask" aria-hidden="true"><slot>Preview</slot></div>`}
      </div>
      <div class="pv" part="preview" role="dialog" aria-modal="true" aria-label="${escAttr(label)}">
        <div class="pv-panel" part="preview-panel">
          <button class="pv-close" part="preview-close" type="button" aria-label="Close preview">
            <aha-icon name="system-x" size="18" decorative></aha-icon>
          </button>
          <img class="pv-img" part="preview-img" src="${escAttr(src)}" alt="${escAttr(alt)}"/>
        </div>
      </div>`;

    const frame = this.shadowRoot.querySelector('.frame');
    const img = this.shadowRoot.querySelector('.img');
    // load/error drive the placeholder→loaded and →error state on the persistent frame node
    img.addEventListener('load', () => { if (frame.dataset.state !== 'error') frame.dataset.state = 'loaded'; });
    img.addEventListener('error', () => { frame.dataset.state = 'error'; });
    if (src && img.complete && img.naturalWidth === 0) frame.dataset.state = 'error';  // already-failed cache
    else if (src && img.complete) frame.dataset.state = 'loaded';

    if (!previewOff) {
      frame.addEventListener('click', () => this._open());
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._open(); }
      });
    }
    const pv = this.shadowRoot.querySelector('.pv');
    pv.addEventListener('click', (e) => { if (e.target === pv) this._close(); });
    this.shadowRoot.querySelector('.pv-close').addEventListener('click', () => this._close());
    if (this._isOpen) this._close();   // a re-render (attribute change) resets to the closed state
  }

  _open() {
    if (this._isOpen || this._previewOff() || !this.getAttribute('src')) return;
    if (this.shadowRoot.querySelector('.frame').dataset.state === 'error') return;
    this._isOpen = true;
    this._lastFocus = this.shadowRoot.querySelector('.frame');
    const pv = this.shadowRoot.querySelector('.pv');
    pv.classList.add('show');
    this.shadowRoot.querySelector('.pv-close').focus();
    this._onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this._close(); }
      // one focusable control in the dialog: keep focus on it, so Tab never escapes the modal
      else if (e.key === 'Tab') { e.preventDefault(); this.shadowRoot.querySelector('.pv-close').focus(); }
    };
    document.addEventListener('keydown', this._onKey, true);
  }

  _close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.shadowRoot.querySelector('.pv').classList.remove('show');
    this._teardown();
    if (this._lastFocus && this._lastFocus.isConnected) this._lastFocus.focus();
  }

  _teardown() {
    if (this._onKey) { document.removeEventListener('keydown', this._onKey, true); this._onKey = null; }
  }
}

const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function defineAhaImage(tag = 'aha-image') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImage);
  return true;
}
if (typeof window !== 'undefined') defineAhaImage();

export default { AhaImage, defineAhaImage };
