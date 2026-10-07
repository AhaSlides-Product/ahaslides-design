/**
 * @ahaslides-product/design/aha-countdown — a draining bar with the m:ss clock beside it.
 *
 *   import '@ahaslides-product/design/aha-countdown';   // registers <aha-countdown>
 *   <aha-countdown ends-at="1791363351000" total-ms="30000" urgent-below-ms="5000"></aha-countdown>
 *
 * Only for a FULL-CANVAS audience slide: in framed mode the host already paints the countdown above
 * the iframe, so a second one double-announces. `ends-at` is the host's absolute end instant (epoch
 * ms), not a duration, so every phone in the room reaches zero together and a late joiner starts the
 * bar part-way. The bar drains (full when the question opens, empty at zero) as one CSS animation,
 * never a per-frame redraw; only the digits tick, once a second, from the wall clock. `stopped`
 * freezes bar and digits where they are (the host closed submissions, it is not "time ran out").
 * `clock-only` drops the bar for a tight header; `hide-clock` drops the digits. Below
 * `urgent-below-ms` the bar and digits take the DS error colour. role="timer", named by `label`.
 */
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

/** `m:ss`, seconds zero-padded, never negative. */
export function formatClock(remainingMs) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const STYLE = DECK_STYLE + `
  :host{ display:flex; align-items:center; gap:var(--aha-space-12, 12px); width:100%; color:var(--_ink) }
  :host([clock-only]){ display:inline-flex; width:auto }
  .track{ position:relative; flex:1 1 auto; min-width:0; box-sizing:border-box; height:8px; overflow:hidden;
    border:1px solid var(--_edge); border-radius:var(--aha-radius-pill, 999px);
    background:color-mix(in srgb, var(--_ink) 15%, transparent); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost) }
  :host([clock-only]) .track, :host([hide-clock]:not([clock-only])) .clock{ display:none }
  .fill{ width:100%; height:100%; border-radius:inherit; background:var(--_accent);
    animation-name:aha-countdown-drain; animation-timing-function:linear; animation-fill-mode:forwards;
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([stopped]) .fill{ animation-play-state:paused }
  @keyframes aha-countdown-drain{ from{ width:100% } to{ width:0% } }
  .clock{ flex:0 0 auto; font-size:14px; line-height:20px; font-weight:600; font-variant-numeric:tabular-nums;
    transition:color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([data-urgent]) .fill{ background:var(--aha-color-error, #F5222D) }
  :host([data-urgent]) .clock{ color:var(--aha-color-error, #F5222D) }
  :host([data-finished]) .clock{ opacity:.75 }
  @media (prefers-reduced-motion: reduce){ .fill, .clock{ transition:none } }
`;

export class AhaCountdown extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'ends-at', 'total-ms', 'stopped', 'label', 'urgent-below-ms'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><div class="track" part="track"><div class="fill" part="fill"></div></div><span class="clock" part="clock">0:00</span>`));
    this._fill = this.shadowRoot.querySelector('.fill');
    this._now = Date.now();
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'timer');
    this._tick = setInterval(() => { if (!this.hasAttribute('stopped')) { this._now = Date.now(); this._syncClock(); } }, 1000);
    this._restartBar();
  }
  disconnectedCallback() { clearInterval(this._tick); }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (!this.isConnected) return;
    if (name === 'ends-at' || name === 'total-ms') this._restartBar();
    else if (name === 'stopped') { if (next !== null) { this._now = Date.now(); this._syncClock(); } else this._restartBar(); }
    else this._syncClock();
  }

  get remainingMs() { return Math.max(0, Number(this.getAttribute('ends-at') || 0) - this._now); }

  _restartBar() {
    this._now = Date.now();
    const total = Math.max(0, Number(this.getAttribute('total-ms') || 0));
    const elapsed = Math.min(total, Math.max(0, total - this.remainingMs));
    // An animation only restarts from `from` when it is removed and re-applied, so a reused element
    // starts each new question full rather than resuming the previous bar.
    this._fill.style.animationName = 'none';
    void this._fill.offsetWidth;
    this._fill.style.animationDuration = `${total}ms`;
    this._fill.style.animationDelay = `${-elapsed}ms`;
    this._fill.style.animationName = '';
    this._syncClock();
  }
  _syncClock() {
    const remaining = this.remainingMs;
    const clock = formatClock(remaining);
    const urgentBelow = this.getAttribute('urgent-below-ms');
    this.shadowRoot.querySelector('.clock').textContent = clock;
    this.toggleAttribute('data-finished', remaining <= 0);
    this.toggleAttribute('data-urgent', urgentBelow != null && remaining > 0 && remaining <= Number(urgentBelow));
    this.setAttribute('aria-label', `${this.getAttribute('label') || 'Time remaining'}: ${clock}`);
  }
}

export function defineAhaCountdown(tag = 'aha-countdown') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaCountdown);
}
if (typeof window !== 'undefined') defineAhaCountdown();
export default { AhaCountdown, defineAhaCountdown, formatClock };
