/**
 * @ahaslides-product/design/aha-carousel — the shared carousel (antd Carousel without slick, framework-free).
 *
 *   import '@ahaslides-product/design/aha-carousel';   // registers <aha-carousel>
 *   <aha-carousel arrows adaptive-height aria-label="Course photos"><img …><img …></aha-carousel>
 *   carousel.addEventListener('change', (e) => e.detail.index);         // the destination, as the move starts
 *   carousel.addEventListener('after-change', (e) => e.detail.index);   // the resting slide, once the move ends
 *   carousel.dotLabel = (position, total) => t('gallery.goToImage', { position, total });
 *   carousel.positionText = (position, total) => t('gallery.imageOf', { position, total });
 *
 * Each child element is one slide. There is one track and no cloned slides, so an id, a form field or an
 * image in a slide exists once. Slides that are not showing are `inert`, so Tab and a screen reader skip them.
 * `index` is the position, zero-based, and always the truth: it moves as a move starts, together with the
 * dots, the arrows and the spoken position. Reading `carousel.index` needs no bookkeeping.
 *
 * The carouselTheme look: 16x4 grey 70 rest dots, a 28 wide brand active dot, 8 between them, on a 24px
 * target. The dots sit under the slides, so they read on any picture. `arrows` adds <aha-button> controls over
 * the slides; `dots="false"` removes the dots. `adaptive-height` makes the height follow the showing slide;
 * without it the height is the tallest slide's. One slide, or none, shows no arrows and no dots.
 *
 * `change` fires once per move with { index, from }. `after-change` fires once when the track comes to rest
 * with { index }: a second press during a move retargets it, so two presses give two `change` and one
 * `after-change`. Setting `index` moves the track and fires neither; goTo(), next() and prev() act as the
 * user does and fire both. Without `loop` the ends stop and the arrow there turns disabled; with `loop` the
 * ends wrap, and the track runs back across the slides because nothing is cloned.
 *
 * Swipe or drag sideways past 72px (or a quarter of the width, if smaller), or flick. Vertical movement stays
 * with the page, and a drag that starts on a control inside a slide is left to that control. On an arrow or a
 * dot, ArrowLeft / ArrowRight step and Home / End jump; left and right swap right to left, and the dots are
 * one tab stop. Under prefers-reduced-motion a move is instant and the events still fire.
 * Copy: `prev-label`, `next-label`, `dotLabel` and `positionText`; default English, override all four to translate.
 */
import './aha-button.js';      // registers <aha-button> for the arrows
import './aha-live-region.js'; // registers <aha-live-region> for the spoken position
import './icons.js';           // registers <aha-icon> for the arrow glyphs
import { upgradeProperties } from './upgrade-properties.js';

const isOn = (host, name) => { const v = host.getAttribute(name); return v !== null && v !== 'false'; };

const SWIPE_PX = 72;
const FLICK_PX_PER_MS = 0.6;
const FLICK_MIN_PX = 12;
const DRAG_START_PX = 6;
const EDGE_RESISTANCE = 0.3;

const FAST = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const MOVE = 'var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:block; min-width:0; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  :host(:dir(rtl)){ --_dir:-1 }
  .stage{ position:relative }
  .viewport{ overflow:hidden; overflow:clip; border-radius:var(--aha-radius-default,8px); touch-action:pan-y }
  .track{ display:flex; transform:translateX(calc(var(--_index,0) * -100% * var(--_dir,1) + var(--_drag,0px))) }
  ::slotted(*){ flex:0 0 100%; min-width:0; box-sizing:border-box }
  :host([_adaptive]) .track{ align-items:flex-start }
  :host([_ready]) .track{ transition:transform ${MOVE} }
  :host([_ready]) .viewport{ transition:height ${MOVE} }
  :host([_movable]) .viewport{ cursor:grab }
  :host([_dragging]) .viewport{ cursor:grabbing }
  :host([_dragging]) .track{ transition:none; user-select:none; -webkit-user-select:none }

  .arrow{ position:absolute; top:50%; translate:0 -50%; border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-elevated,#FFFFFF); box-shadow:0 6px 16px var(--aha-ink-a10,rgba(0,0,0,.1)) }
  .arrow[disabled]{ box-shadow:none }
  .prev{ inset-inline-start:var(--aha-space-12,12px) }
  .next{ inset-inline-end:var(--aha-space-12,12px) }
  :host(:dir(rtl)) .arrow aha-icon{ scale:-1 1 }

  .dots{ display:flex; flex-wrap:wrap; justify-content:center; margin-top:var(--aha-space-8,8px) }
  .dots[hidden]{ display:none }
  .dot{ appearance:none; display:block; height:24px; margin:0; padding:0 var(--aha-space-4,4px); border:0; background:none; cursor:pointer; outline:none }
  .bar{ display:block; width:16px; height:4px; border-radius:var(--aha-radius-pill,999px); background:var(--aha-gray-70,#8A8A8A);
    transition:width ${FAST}, background ${FAST} }
  .dot:hover .bar{ background:var(--aha-gray-80,#616161) }
  .dot[aria-current="true"] .bar{ width:28px; background:var(--aha-color-primary,#E70E68) }
  .dot[aria-current="true"]:hover .bar{ background:var(--aha-color-primary-hover,#DB005B) }
  .dot:active .bar{ background:var(--aha-gray-90,#4A4A4A) }
  .dot[aria-current="true"]:active .bar{ background:var(--aha-color-primary-active,#DB005B) }
  .dot:focus-visible .bar{ outline:2px solid var(--aha-focus-ring,#E70E68); outline-offset:2px }

  @media (prefers-reduced-motion: reduce){ .track, .viewport, .bar{ transition:none !important } }
`;

const arrow = (side, glyph) => `<aha-button class="arrow ${side}" part="arrow ${side}" variant="secondary" size="lg" icon-only hidden>` +
  `<aha-icon name="system-caret-${glyph}" size="16" decorative></aha-icon></aha-button>`;

const INTERACTIVE = 'a[href], button, input, select, textarea, label, [contenteditable="true"], [tabindex], [role="button"], [role="slider"]';
function fromInteractiveChild(event, host) {
  const path = event.composedPath();
  return path.slice(0, path.indexOf(host)).some((node) => node instanceof Element && node.getRootNode() !== host.shadowRoot && node.matches(INTERACTIVE));
}

export class AhaCarousel extends HTMLElement {
  static get observedAttributes() {
    return ['index', 'arrows', 'dots', 'loop', 'adaptive-height', 'prev-label', 'next-label', 'aria-label', 'aria-labelledby'];
  }
  constructor() {
    super();
    this._slides = [];
    this._dots = [];
    this._dotLabel = null;
    this._positionText = null;
    this._spoken = '';
  }

  /** The number of slides. */
  get count() { return this._slides.length; }
  /** The showing slide, zero-based; clamped to the slides there are. */
  get index() {
    const n = Number.parseInt(this.getAttribute('index'), 10);
    return Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), Math.max(0, this.count - 1));
  }
  set index(v) { if (v == null || v === '') this.removeAttribute('index'); else this.setAttribute('index', String(v)); }
  /** (position, total) => the name of one dot; position counts from 1. */
  get dotLabel() { return this._dotLabel; }
  set dotLabel(fn) { this._dotLabel = typeof fn === 'function' ? fn : null; this._syncDots(); }
  /** (position, total) => the spoken position; position counts from 1. */
  get positionText() { return this._positionText; }
  set positionText(fn) { this._positionText = typeof fn === 'function' ? fn : null; this._syncStatus(); }

  goTo(index) { return this._go(Math.min(Math.max(0, Number(index) || 0), Math.max(0, this.count - 1))); }
  next() { return this._go(this._neighbour(1)); }
  prev() { return this._go(this._neighbour(-1)); }

  connectedCallback() {
    upgradeProperties(this, ['index', 'dotLabel', 'positionText']);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this._build();
    }
    if (typeof ResizeObserver !== 'undefined') {
      this._resize = new ResizeObserver(() => this._syncHeight());
      this._resize.observe(this._viewport);
    }
    this._syncSlides();
    (window.requestAnimationFrame || setTimeout)(() => this.setAttribute('_ready', ''));
  }
  disconnectedCallback() {
    clearTimeout(this._settleTimer);
    this._endDrag(false);
    if (this._resize) this._resize.disconnect();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot || !this._viewport) return;
    if (name === 'index') { this._syncPosition(); this._settleLater(); } else this._sync();
  }

  _build() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="carousel" part="carousel" role="group">` +
        `<div class="stage">` +
          `<div class="viewport" part="viewport"><div class="track" part="track"><slot></slot></div></div>` +
          arrow('prev', 'left') + arrow('next', 'right') +
        `</div>` +
        `<div class="dots" part="dots" hidden></div>` +
        `<aha-live-region part="status" politeness="polite"></aha-live-region>` +
      `</div>`;
    const root = this.shadowRoot;
    this._group = root.querySelector('.carousel');
    this._viewport = root.querySelector('.viewport');
    this._track = root.querySelector('.track');
    this._slot = root.querySelector('slot');
    this._prev = root.querySelector('.prev');
    this._next = root.querySelector('.next');
    this._dotRow = root.querySelector('.dots');
    this._live = root.querySelector('aha-live-region');
    this._slot.addEventListener('slotchange', () => this._syncSlides());
    this._prev.addEventListener('click', () => this.prev());
    this._next.addEventListener('click', () => this.next());
    this._group.addEventListener('keydown', (event) => this._key(event));
    const viewport = this._viewport;
    viewport.addEventListener('pointerdown', (event) => this._dragStart(event));
    viewport.addEventListener('pointermove', (event) => this._dragMove(event));
    viewport.addEventListener('pointerup', (event) => this._endDrag(true, event));
    viewport.addEventListener('pointercancel', () => this._endDrag(false));
    // taking capture from a touch's implicit target loses it there, and that event bubbles up from the slide
    viewport.addEventListener('lostpointercapture', (event) => { if (event.target === viewport) this._endDrag(false); });
    viewport.addEventListener('dragstart', (event) => event.preventDefault());
    viewport.addEventListener('click', (event) => {
      if (!this._swiped) return;
      this._swiped = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }

  _neighbour(delta) {
    const to = this.index + delta, last = this.count - 1;
    if (to >= 0 && to <= last) return to;
    if (!isOn(this, 'loop') || last < 1) return null;
    return to < 0 ? last : 0;
  }
  _go(to) {
    const from = this.index;
    if (to == null || to === from || to >= this.count) return false;
    this._afterPending = true;
    this.setAttribute('index', String(to));
    this._emit('change', { index: to, from });
    return true;
  }
  _settleLater() {
    clearTimeout(this._settleTimer);
    const seconds = parseFloat(getComputedStyle(this._track).transitionDuration) || 0;
    this._settleTimer = setTimeout(() => {
      if (!this._afterPending) return;
      this._afterPending = false;
      this._emit('after-change', { index: this.index });
    }, seconds * 1000);
  }
  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail })); }
  _rtl() { return getComputedStyle(this).direction === 'rtl'; }

  _key(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !this.shadowRoot.contains(event.target)) return;
    const flip = this._rtl() ? -1 : 1;
    const to = {
      ArrowRight: () => this._neighbour(flip), ArrowLeft: () => this._neighbour(-flip),
      Home: () => 0, End: () => this.count - 1,
    }[event.key];
    if (!to) return;
    event.preventDefault();
    const target = to();
    this._go(target);
    if (target != null && this._dots.includes(event.target)) this._dots[target].focus();
  }

  _dragStart(event) {
    this._swiped = false;
    if (this.count < 2) return;
    if (!event.isPrimary) { this._endDrag(false); return; }
    if ((event.pointerType === 'mouse' && event.button !== 0) || fromInteractiveChild(event, this)) return;
    this._drag = { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp, dx: 0, active: false };
  }
  _dragMove(event) {
    const drag = this._drag;
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.active) {
      if (Math.abs(dx) < DRAG_START_PX) return;
      if (Math.abs(event.clientY - drag.y) > Math.abs(dx)) { this._drag = null; return; }
      drag.active = true;
      try { this._viewport.setPointerCapture(event.pointerId); } catch (_) { /* a synthetic pointer has no capture */ }
      this.setAttribute('_dragging', '');
    }
    drag.dx = dx;
    const to = this.index + this._dragDelta(dx);
    const atEdge = to < 0 || to >= this.count;
    this._track.style.setProperty('--_drag', `${atEdge ? dx * EDGE_RESISTANCE : dx}px`);
  }
  _dragDelta(dx) { return (dx < 0) === this._rtl() ? -1 : 1; }
  _endDrag(commit, event) {
    const drag = this._drag;
    this._drag = null;
    if (!drag || !drag.active) return;
    this.removeAttribute('_dragging');
    this._track.style.removeProperty('--_drag');
    this._swiped = true;
    if (!commit) return;
    const distance = Math.abs(drag.dx);
    const speed = distance / Math.max(1, event.timeStamp - drag.at);
    const swiped = distance >= Math.min(SWIPE_PX, this._viewport.clientWidth / 4) || (speed >= FLICK_PX_PER_MS && distance > FLICK_MIN_PX);
    if (swiped) this._go(this._neighbour(this._dragDelta(drag.dx)));
  }

  _syncSlides() {
    const slides = this._slot.assignedElements();
    for (const slide of this._slides) if (!slides.includes(slide)) slide.removeAttribute('inert');
    this._slides = slides;
    if (this._resize) {
      this._resize.disconnect();
      this._resize.observe(this._viewport);
      for (const slide of slides) this._resize.observe(slide);
    }
    this._sync();
  }
  _sync() {
    const count = this.count, many = count > 1;
    this.toggleAttribute('_movable', many);
    this.toggleAttribute('_adaptive', isOn(this, 'adaptive-height'));
    this._prev.hidden = this._next.hidden = !(many && isOn(this, 'arrows'));
    this._prev.setAttribute('aria-label', this.getAttribute('prev-label') || 'Previous slide');
    this._next.setAttribute('aria-label', this.getAttribute('next-label') || 'Next slide');
    this._dotRow.hidden = !many || this.getAttribute('dots') === 'false';
    const root = this.getRootNode();
    const name = this.getAttribute('aria-label') || (this.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .map((id) => (root.getElementById ? root.getElementById(id) : null))
      .filter(Boolean).map((el) => el.textContent.trim()).filter(Boolean).join(' ');
    if (name) this._group.setAttribute('aria-label', name); else this._group.removeAttribute('aria-label');
    while (this._dots.length < count) this._dots.push(this._newDot(this._dots.length));
    while (this._dots.length > count) this._dots.pop().remove();
    this._syncDots();
    this._syncPosition();
  }
  _newDot(position) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.setAttribute('part', 'dot');
    dot.innerHTML = '<span class="bar"></span>';
    dot.addEventListener('click', () => this._go(position));
    this._dotRow.append(dot);
    return dot;
  }
  _syncDots() {
    const total = this.count;
    this._dots.forEach((dot, position) => {
      dot.setAttribute('aria-label', this._copy(this._dotLabel, position + 1, total) ?? `Go to slide ${position + 1} of ${total}`);
    });
  }
  _syncPosition() {
    const index = this.index;
    const focused = this.shadowRoot.activeElement;
    this._track.style.setProperty('--_index', String(index));
    this._slides.forEach((slide, position) => slide.toggleAttribute('inert', position !== index));
    this._dots.forEach((dot, position) => {
      const current = position === index;
      dot.tabIndex = current ? 0 : -1;
      if (current) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
    const loop = isOn(this, 'loop');
    this._prev.toggleAttribute('disabled', !loop && index === 0);
    this._next.toggleAttribute('disabled', !loop && index === this.count - 1);
    if (focused === this._prev && this._prev.hasAttribute('disabled')) this._next.focus();
    if (focused === this._next && this._next.hasAttribute('disabled')) this._prev.focus();
    this._syncHeight();
    this._syncStatus();
  }
  _syncHeight() {
    const slide = this._slides[this.index];
    this._viewport.style.height = slide && isOn(this, 'adaptive-height') ? `${slide.offsetHeight}px` : '';
  }
  _syncStatus() {
    if (!this._live) return;
    const position = this.index + 1, total = this.count;
    const text = total > 1 ? (this._copy(this._positionText, position, total) ?? `Slide ${position} of ${total}`) : '';
    if (text === this._spoken) return;
    // a live region stays silent for the position a carousel opens on; only a move is news
    if (this._spoken) this._live.announce(text); else this._live.textContent = text;
    this._spoken = text;
  }
  _copy(fn, position, total) {
    if (!fn) return null;
    try { const text = fn(position, total); return text == null || text === '' ? null : String(text); } catch (_) { return null; }
  }
}

export function defineAhaCarousel(tag = 'aha-carousel') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCarousel);
  return true;
}
if (typeof window !== 'undefined') defineAhaCarousel();

export default { AhaCarousel, defineAhaCarousel };
