/**
 * @ahaslides-product/design/aha-swipe-card — a card the participant throws left or right to answer.
 *
 *   import '@ahaslides-product/design/aha-swipe-card';   // registers <aha-swipe-card>
 *   <aha-swipe-card aria-label="Statement"><p>A hot dog is a sandwich.</p></aha-swipe-card>
 *   card.addEventListener('swipe', (e) => e.detail.direction);   // "left" | "right"
 *
 * The swipe-card shape (this-or-that, would-you-rather, a sorting deck): one thing at a time, thrown
 * to answer. The body is a slot, centred in 16px semibold; `hint` adds a muted "← hint →" line above it.
 * The card owns the surface and the gesture. The surface is the frosted deck panel washed 5% with the
 * ink, with the ink hairline, so it reads on a light deck, a dark deck and a photograph, which an
 * opaque white card does not. It lifts onto an ink-tinted shadow only while dragged (`flat` never does). A throw commits past
 * 72px of travel OR on a fast flick; below both it springs back and nothing is emitted. A second
 * finger (a pinch) cancels the drag. Left / Right arrow keys commit the same outcome, so the card is
 * answerable without a pointer. `static` turns the gesture off. The tilt is capped at 8 degrees and the
 * blur is dropped while the card moves, to hold 60fps.
 */
import './icons.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const THRESHOLD_PX = 72;
const FLICK_PX_PER_MS = 0.6;
const MAX_TILT_DEG = 8;

/** What a drag meant: `direction` null below both the distance and the flick threshold. */
export function swipeOutcome(dx, velocity = 0, threshold = THRESHOLD_PX) {
  const distance = Math.abs(dx);
  if (distance >= threshold || (Math.abs(velocity) >= FLICK_PX_PER_MS && distance > 12)) return { direction: dx < 0 ? 'left' : 'right', progress: 1 };
  return { direction: null, progress: Math.min(1, distance / threshold) };
}

const STYLE = DECK_STYLE + `
  :host{ display:block; width:100% }
  .card{ position:relative; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:var(--aha-space-12, 12px);
    padding:var(--aha-space-24, 24px); text-align:center; font-size:16px; line-height:24px; font-weight:600;
    color:var(--_ink); border:1px solid var(--_edge); border-radius:var(--aha-radius-lg, 12px);
    background:color-mix(in srgb, var(--_ink) 5%, var(--_surface)); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    touch-action:pan-y; cursor:grab; outline:none; will-change:transform;
    transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .card:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .card[data-moving]:not([data-flat]){ box-shadow:0 2px 12px color-mix(in srgb, var(--_ink) 18%, transparent) }
  .hint{ display:inline-flex; align-items:center; gap:var(--aha-space-4, 4px); font-size:12px; line-height:18px; font-weight:400; color:var(--_ink-muted) }
  .hint[hidden]{ display:none }
  :host([static]) .card{ touch-action:auto; cursor:default }
  .card[data-moving]{ transition:none; -webkit-backdrop-filter:none; backdrop-filter:none; cursor:grabbing }
  @media (prefers-reduced-motion: reduce){ .card{ transition:none } }
`;

const INTERACTIVE = 'a[href], button, input, select, textarea, label, [contenteditable="true"], [tabindex], [role="button"], [role="slider"]';
function fromInteractiveChild(event, host) {
  const path = event.composedPath();
  return path.slice(0, path.indexOf(host)).some((node) => node instanceof Element && node.getRootNode() !== host.shadowRoot && node.matches(INTERACTIVE));
}

export class AhaSwipeCard extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'static', 'aria-label', 'hint', 'flat']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><div class="card" part="card"><span class="hint" part="hint" aria-hidden="true" hidden>` +
      `<aha-icon name="system-arrow-left" size="16" decorative></aha-icon><span class="hint-text" dir="auto"></span>` +
      `<aha-icon name="system-arrow-right" size="16" decorative></aha-icon></span><slot></slot></div>`));
    this._card = this.shadowRoot.querySelector('.card');
    this._drag = null;
    this._card.addEventListener('pointerdown', (event) => this._down(event));
    this._card.addEventListener('pointermove', (event) => this._move(event));
    this._card.addEventListener('pointerup', (event) => this._up(event));
    this._card.addEventListener('pointercancel', () => this._reset());
    this._card.addEventListener('keydown', (event) => {
      const direction = { ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
      if (!direction || this.hasAttribute('static') || fromInteractiveChild(event, this)) return;
      event.preventDefault();
      this._emit(direction);
    });
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) { super.attributeChangedCallback(name, previous, next); this._sync(); }

  _sync() {
    const swipeable = !this.hasAttribute('static');
    this._card.setAttribute('role', 'group');
    const label = this.getAttribute('aria-label');
    if (label) this._card.setAttribute('aria-label', label); else this._card.removeAttribute('aria-label');
    this._card.tabIndex = swipeable ? 0 : -1;
    this._card.toggleAttribute('data-flat', this.hasAttribute('flat'));
    const hint = this.getAttribute('hint') || '';
    this.shadowRoot.querySelector('.hint-text').textContent = hint;
    this.shadowRoot.querySelector('.hint').hidden = !hint;
    if (swipeable) this._card.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight');
    else this._card.removeAttribute('aria-keyshortcuts');
  }
  _down(event) {
    if (this.hasAttribute('static') || fromInteractiveChild(event, this)) return;
    if (!event.isPrimary) { if (this._drag) this._reset(); return; }
    if (this._drag) return;
    this._drag = { startX: event.clientX, dx: 0, lastX: event.clientX, lastTime: event.timeStamp, velocity: 0 };
    this._card.setPointerCapture?.(event.pointerId);
    this._card.setAttribute('data-moving', '');
  }
  _move(event) {
    if (!this._drag || !event.isPrimary) return;
    const drag = this._drag;
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    drag.velocity = (event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    drag.dx = event.clientX - drag.startX;
    this._paint(drag.dx);
  }
  _up(event) {
    if (!this._drag || !event.isPrimary) return;
    const { direction } = swipeOutcome(this._drag.dx, this._drag.velocity);
    this._reset();
    if (direction) this._emit(direction);
  }
  _reset() {
    this._drag = null;
    this._card.removeAttribute('data-moving');
    this._paint(0);
  }
  _paint(dx) {
    const tilt = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, dx / 24));
    this._card.style.transform = dx ? `translateX(${dx}px) rotate(${tilt}deg)` : '';
    this._card.style.opacity = dx ? String(1 - Math.min(0.35, Math.abs(dx) / 900)) : '';
  }
  _emit(direction) {
    this.dispatchEvent(new CustomEvent('swipe', { bubbles: true, composed: true, detail: { direction } }));
  }
}

export function defineAhaSwipeCard(tag = 'aha-swipe-card') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaSwipeCard);
}
if (typeof window !== 'undefined') defineAhaSwipeCard();
export default { AhaSwipeCard, defineAhaSwipeCard, swipeOutcome };
