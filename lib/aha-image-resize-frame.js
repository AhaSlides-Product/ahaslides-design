/**
 * @ahaslides-product/design/aha-image-resize-frame — the on-canvas image resize frame.
 *
 *   import '@ahaslides-product/design/aha-image-resize-frame';   // registers <aha-image-resize-frame>
 *   <aha-image-resize-frame width="60"><img src="photo.jpg" alt="Team photo"></aha-image-resize-frame>
 *   <aha-image-resize-frame width="60" selected>…</aha-image-resize-frame>   // handles shown
 *   <aha-image-resize-frame>
 *     <img src="photo.jpg" alt="">
 *     <aha-button slot="actions" variant="secondary" icon-only aria-label="Replace image">…</aha-button>   // replaces the default Preview and Delete
 *   </aha-image-resize-frame>
 *
 * Wraps the host's image, which fills the frame. The host element is the 100% reference; the frame
 * takes `width` percent of it. Click (or Enter / Space on the focused frame) selects: a 2px Vivid Pink
 * outline and four corner handles appear. Dragging a handle resizes; each handle is also a
 * role="slider" that Arrow keys move by `step`, Home / End to the floor / ceiling. The width never
 * drops below max(`min-width` %, `min-width-px`) and never upscales past the image's natural width.
 * Hover, keyboard focus or selection reveals a 50% ink mask carrying Preview and Delete buttons (the
 * `actions` slot replaces them). The element owns no lightbox and no confirm: it emits `preview`,
 * `delete`, `select-change`, `width-input` (live, during a drag) and `width-change` (committed).
 * Shadow-DOM CSS themed only by --aha-* tokens; the shadow tree is built once.
 */
import './aha-button.js';
import './icons.js';

const CORNERS = ['nw', 'ne', 'sw', 'se'];
const isLeftCorner = (corner) => corner === 'nw' || corner === 'sw';

const STYLE = `
  :host{ display:block; line-height:0 }
  :host([hidden]){ display:none !important }
  .frame{ position:relative; display:inline-block; box-sizing:border-box; max-width:100%; vertical-align:top;
    border-radius:var(--aha-radius-default,8px); outline:2px solid transparent; outline-offset:0;
    transition:outline-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host(:not([disabled])) .frame{ cursor:pointer }
  .frame:focus-visible{ outline-color:var(--aha-color-primary,#E70E68); outline-offset:2px }
  :host([selected]) .frame{ outline-color:var(--aha-color-primary,#E70E68); outline-offset:0 }
  ::slotted(img){ display:block; width:100%; height:auto; border-radius:var(--aha-radius-default,8px) }

  .mask{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:var(--aha-space-12,12px);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-ink-a50,rgba(0,0,0,.5));
    opacity:0; pointer-events:none; line-height:normal;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  @media (hover: hover){ :host(:not([disabled])) .frame:hover .mask{ opacity:1 } }
  :host(:not([disabled])) .frame:focus-visible .mask,
  :host(:not([disabled])) .frame:has(:focus-visible) .mask,
  :host(:not([disabled]):has(:focus-visible)) .mask,
  :host([selected]:not([disabled])) .mask{ opacity:1 }
  .mask > *, ::slotted([slot="actions"]){ pointer-events:auto }
  :host([disabled]) .mask > *, :host([disabled]) ::slotted([slot="actions"]){ pointer-events:none }

  .handle{ position:absolute; z-index:2; box-sizing:border-box; width:12px; height:12px; touch-action:none;
    background:var(--aha-white,#FFFFFF); border:1.5px solid var(--aha-color-primary,#E70E68);
    border-radius:var(--aha-radius-xs,4px); box-shadow:0 0 0 1px var(--aha-white-a50,rgba(255,255,255,.5));
    opacity:0; visibility:hidden;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      visibility var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([selected]:not([disabled])) .handle{ opacity:1; visibility:visible }
  .handle:focus-visible{ outline:2px solid var(--aha-color-primary,#E70E68); outline-offset:2px }
  .handle[data-corner="nw"]{ top:-6px; left:-6px; cursor:nwse-resize }
  .handle[data-corner="ne"]{ top:-6px; right:-6px; cursor:nesw-resize }
  .handle[data-corner="sw"]{ bottom:-6px; left:-6px; cursor:nesw-resize }
  .handle[data-corner="se"]{ bottom:-6px; right:-6px; cursor:nwse-resize }
  @media (prefers-reduced-motion: reduce){ .frame, .mask, .handle{ transition:none !important } }
`;

const numberAttribute = (el, name, fallback) => {
  const value = parseFloat(el.getAttribute(name));
  return Number.isFinite(value) ? value : fallback;
};

export class AhaImageResizeFrame extends HTMLElement {
  static get observedAttributes() {
    return ['width', 'min-width', 'min-width-px', 'selected', 'disabled', 'label', 'resize-label', 'preview-label', 'delete-label'];
  }

  get width() { return Math.min(100, Math.max(0, numberAttribute(this, 'width', 100))); }
  set width(value) { this.setAttribute('width', String(value)); }
  get selected() { return this.hasAttribute('selected'); }
  set selected(value) { this.toggleAttribute('selected', !!value); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) this._build();
    this._sync();
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onDocumentPointerDown);
    this._endDrag();
  }

  attributeChangedCallback(name) {
    if (!this._built) return;
    if (name === 'selected') {
      if (this.selected) document.addEventListener('pointerdown', this._onDocumentPointerDown);
      else document.removeEventListener('pointerdown', this._onDocumentPointerDown);
    }
    this._sync();
  }

  _build() {
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>` +
      `<div class="frame" part="frame" role="group" tabindex="0">` +
        `<slot></slot>` +
        `<div class="mask" part="mask"><slot name="actions">` +
          `<aha-button class="action-preview" variant="secondary" icon-only><aha-icon name="system-eye" size="16" decorative></aha-icon></aha-button>` +
          `<aha-button class="action-delete" variant="secondary" icon-only><aha-icon name="system-trash" size="16" decorative></aha-icon></aha-button>` +
        `</slot></div>` +
        CORNERS.map((corner) => `<span class="handle" part="handle" data-corner="${corner}" role="slider" aria-orientation="horizontal" tabindex="0"></span>`).join('') +
      `</div>`));
    this._built = true;
    this._frame = this.shadowRoot.querySelector('.frame');
    this._handles = [...this.shadowRoot.querySelectorAll('.handle')];
    this._previewButton = this.shadowRoot.querySelector('.action-preview');
    this._deleteButton = this.shadowRoot.querySelector('.action-delete');

    this._onDocumentPointerDown = (event) => { if (!event.composedPath().includes(this)) this._setSelected(false); };
    this._onImageLoad = (event) => { if (event.target instanceof HTMLImageElement) this._naturalWidth = event.target.naturalWidth || undefined; };

    this.addEventListener('load', this._onImageLoad, true);
    this.shadowRoot.querySelector('slot:not([name])').addEventListener('slotchange', () => this._readNaturalWidth());
    this._frame.addEventListener('click', (event) => this._onFrameClick(event));
    this._frame.addEventListener('keydown', (event) => this._onFrameKeyDown(event));
    this._previewButton.addEventListener('click', (event) => { event.stopPropagation(); this._emit('preview'); });
    this._deleteButton.addEventListener('click', (event) => { event.stopPropagation(); this._emit('delete'); });
    for (const handle of this._handles) {
      handle.addEventListener('pointerdown', (event) => this._startDrag(event, handle.dataset.corner));
      handle.addEventListener('keydown', (event) => this._onHandleKeyDown(event));
      handle.addEventListener('click', (event) => event.stopPropagation());
    }
    if (this.selected) document.addEventListener('pointerdown', this._onDocumentPointerDown);
    this._readNaturalWidth();
  }

  _sync() {
    const disabled = this.hasAttribute('disabled');
    this._frame.style.width = `${this._dragWidth ?? this.width}%`;
    this._frame.setAttribute('aria-label', this.getAttribute('label') || 'Image');
    this._frame.tabIndex = disabled ? -1 : 0;
    this._previewButton.setAttribute('aria-label', this.getAttribute('preview-label') || 'Preview image');
    this._deleteButton.setAttribute('aria-label', this.getAttribute('delete-label') || 'Delete image');
    const { floor, ceiling } = this._bounds();
    for (const handle of this._handles) {
      handle.setAttribute('aria-label', this.getAttribute('resize-label') || 'Resize image');
      handle.setAttribute('aria-valuemin', String(floor));
      handle.setAttribute('aria-valuemax', String(ceiling));
      handle.setAttribute('aria-valuenow', String(Math.round(this._dragWidth ?? this.width)));
    }
  }

  _readNaturalWidth() {
    const image = this.querySelector(':scope > img');
    this._naturalWidth = image && image.complete ? image.naturalWidth || undefined : undefined;
    if (this._built) this._sync();
  }

  // Bounds in percent of the host: never upscaled past the natural width, never below the floor
  // unless the image is smaller than the floor itself.
  _bounds() {
    const hostWidth = this.getBoundingClientRect().width;
    const minimumPercent = numberAttribute(this, 'min-width', 15);
    if (!(hostWidth > 0)) return { floor: Math.round(minimumPercent), ceiling: 100 };
    const ceilingPx = this._naturalWidth ? Math.min(this._naturalWidth, hostWidth) : hostWidth;
    const floorPx = Math.min(Math.max(numberAttribute(this, 'min-width-px', 120), (minimumPercent / 100) * hostWidth), ceilingPx);
    return { floor: Math.round((floorPx / hostWidth) * 100), ceiling: Math.min(100, Math.round((ceilingPx / hostWidth) * 100)) };
  }

  _clamp(percent) {
    const { floor, ceiling } = this._bounds();
    return Math.min(ceiling, Math.max(floor, Math.round(percent)));
  }

  _onFrameClick(event) {
    if (this.hasAttribute('disabled')) return;
    if (event.composedPath().some((node) => node.slot === 'actions')) return;
    this._setSelected(true);
  }

  _onFrameKeyDown(event) {
    if (event.key === 'Escape' && this.selected) {
      this._setSelected(false);
      this._frame.focus();
      return;
    }
    if (this.hasAttribute('disabled') || event.composedPath()[0] !== this._frame) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._setSelected(!this.selected);
    }
  }

  _onHandleKeyDown(event) {
    const step = numberAttribute(this, 'step', 5);
    const { floor, ceiling } = this._bounds();
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = this.width + step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = this.width - step;
    else if (event.key === 'Home') next = floor;
    else if (event.key === 'End') next = ceiling;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    this._commit(this._clamp(next));
  }

  _startDrag(event, corner) {
    if (this.hasAttribute('disabled') || !this.selected) return;
    event.preventDefault();
    event.stopPropagation();
    this._endDrag();
    const hostWidth = this.getBoundingClientRect().width;
    const startWidthPx = this._frame.getBoundingClientRect().width;
    if (!(hostWidth > 0) || !(startWidthPx > 0)) return;
    const startX = event.clientX;
    const widthAt = (clientX) => {
      const deltaX = isLeftCorner(corner) ? startX - clientX : clientX - startX;
      return this._clamp(((startWidthPx + deltaX) / hostWidth) * 100);
    };
    const onMove = (moveEvent) => {
      const width = widthAt(moveEvent.clientX);
      if (width === this._dragWidth) return;
      this._dragWidth = width;
      this._sync();
      this._emit('width-input', { width });
    };
    const onUp = (upEvent) => {
      const width = widthAt(upEvent.clientX);
      this._endDrag();
      this._commit(width);
    };
    this._drag = { onMove, onUp };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  _endDrag() {
    if (this._drag) {
      window.removeEventListener('pointermove', this._drag.onMove);
      window.removeEventListener('pointerup', this._drag.onUp);
      window.removeEventListener('pointercancel', this._drag.onUp);
      this._drag = null;
    }
    this._dragWidth = undefined;
  }

  _commit(width) {
    const changed = width !== this.width;
    this.setAttribute('width', String(width));
    if (!this.hasAttribute('width') || changed) this._emit('width-change', { width });
    else this._sync();
  }

  _setSelected(selected) {
    if (selected === this.selected) return;
    this.toggleAttribute('selected', selected);
    this._emit('select-change', { selected });
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }
}

export function defineAhaImageResizeFrame(tag = 'aha-image-resize-frame') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImageResizeFrame);
  return true;
}
if (typeof window !== 'undefined') defineAhaImageResizeFrame();

export default { AhaImageResizeFrame, defineAhaImageResizeFrame };
