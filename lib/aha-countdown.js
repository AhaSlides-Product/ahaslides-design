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
 *
 * `variant="points"` (opt-in) is the score bar of a self-paced quiz: no clock, `min` printed at the
 * left end and `max` at the right, each through `label-format` ("{n} pts" → "500 pts"; {n} is grouped by the element's language, so 1,000), and
 * `spoken-format` ("{n} points", default label-format) feeds the announced aria-valuetext. The bar starts full
 * (max points) and drains toward `min` off the same `ends-at` / `total-ms` sync; `progress` (0-100)
 * pins it instead. `value` reads the points still available; role="progressbar" carries them. The fill keeps
 * the deck accent down to `min`: `urgent-below-ms` does not apply, since a dark deck's error colour hides the bar.
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
    border:1px solid var(--_stroke); border-radius:var(--aha-radius-pill, 999px);
    background:var(--_track); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost) }
  :host([clock-only]) .track, :host([hide-clock]:not([clock-only])) .clock{ display:none }
  .fill{ width:100%; height:100%; border-radius:inherit; background:var(--_accent);
    animation-name:aha-countdown-drain; animation-timing-function:linear; animation-fill-mode:forwards;
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([stopped]) .fill{ animation-play-state:paused }
  @keyframes aha-countdown-drain{ from{ width:100% } to{ width:0% } }
  .clock{ flex:0 0 auto; font-size:14px; line-height:20px; font-weight:600; font-variant-numeric:tabular-nums;
    transition:color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([data-urgent]) .fill{ background:var(--aha-color-error,#1A1A1A) }
  :host([data-urgent]) .clock{ color:var(--aha-color-error,#1A1A1A) }
  :host([data-finished]) .clock{ opacity:.75 }
  @media (prefers-reduced-motion: reduce){ .fill, .clock{ transition:none } }
`;

const POINTS_STYLE = `
  :host([variant="points"]){ display:flex; width:100% }
  :host([variant="points"]) .track{ display:block }
  :host([variant="points"]) .clock, :host(:not([variant="points"])) .end{ display:none }
  :host([variant="points"][progress]) .fill{ transition-property:width, background }
  .end{ flex:0 0 auto; font-size:14px; line-height:20px; font-weight:600; font-variant-numeric:tabular-nums }
`;

export class AhaCountdown extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'ends-at', 'total-ms', 'stopped', 'label', 'urgent-below-ms',
      'variant', 'min', 'max', 'label-format', 'spoken-format', 'progress'];
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
    this._syncVariant();
    this._tick = setInterval(() => { if (!this.hasAttribute('stopped')) { this._now = Date.now(); this._syncClock(); } }, 1000);
    this._restartBar();
  }
  disconnectedCallback() { clearInterval(this._tick); }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (!this.isConnected) return;
    if (name === 'ends-at' || name === 'total-ms') this._restartBar();
    else if (name === 'variant' || (name === 'progress' && this.isPoints)) { this._syncVariant(); this._restartBar(); }
    else if (name === 'stopped') { if (next !== null) { this._now = Date.now(); this._syncClock(); } else this._restartBar(); }
    else this._syncClock();
  }

  get remainingMs() { return Math.max(0, Number(this.getAttribute('ends-at') || 0) - this._now); }

  get isPoints() { return this.getAttribute('variant') === 'points'; }

  get fraction() {
    if (this.isPoints && this.hasAttribute('progress')) return Math.min(1, Math.max(0, Number(this.getAttribute('progress')) / 100 || 0));
    const total = Number(this.getAttribute('total-ms') || 0);
    return total > 0 ? Math.min(1, this.remainingMs / total) : 0;
  }

  get value() {
    const min = Number(this.getAttribute('min') || 0);
    const max = Number(this.getAttribute('max') ?? 100);
    return Math.round(min + (max - min) * this.fraction);
  }

  _syncVariant() {
    if (!this.isPoints) {
      if (!this._ends) return;
      this.setAttribute('role', 'timer');
      for (const a of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) this.removeAttribute(a);
      return;
    }
    if (!this._ends) {
      const track = this.shadowRoot.querySelector('.track');
      track.insertAdjacentHTML('beforebegin', `<style>${POINTS_STYLE}</style><span class="end min" part="min"></span>`);
      track.insertAdjacentHTML('afterend', '<span class="end max" part="max"></span>');
      this._ends = [this.shadowRoot.querySelector('.min'), this.shadowRoot.querySelector('.max')];
    }
    this.setAttribute('role', 'progressbar');
  }

  _formatPoints(n, attr = 'label-format') {
    const lang = this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en';
    let grouped;
    try { grouped = new Intl.NumberFormat(lang).format(n); } catch { grouped = new Intl.NumberFormat('en').format(n); }
    const format = this.getAttribute(attr) || this.getAttribute('label-format') || '{n}';
    return format.replaceAll('{n}', grouped);
  }

  _syncPoints() {
    const min = Number(this.getAttribute('min') || 0);
    const max = Number(this.getAttribute('max') ?? 100);
    const value = this.value;
    this._ends[0].textContent = this._formatPoints(min);
    this._ends[1].textContent = this._formatPoints(max);
    this.setAttribute('aria-valuemin', String(min));
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    this.setAttribute('aria-valuetext', this._formatPoints(value, 'spoken-format'));
    this.setAttribute('aria-label', this.getAttribute('label') || 'Points available');
  }

  _restartBar() {
    this._now = Date.now();
    if (this.isPoints && this.hasAttribute('progress')) {
      this._fill.style.animationName = 'none';
      this._fill.style.width = `${this.fraction * 100}%`;
      this._syncClock();
      return;
    }
    if (this._ends) this._fill.style.width = '';
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
    this.toggleAttribute('data-urgent', !this.isPoints && urgentBelow != null && remaining > 0 && remaining <= Number(urgentBelow));
    this.setAttribute('aria-label', `${this.getAttribute('label') || 'Time remaining'}: ${clock}`);
    if (this.isPoints) this._syncPoints();
  }
}

export function defineAhaCountdown(tag = 'aha-countdown') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaCountdown);
}
if (typeof window !== 'undefined') defineAhaCountdown();
export default { AhaCountdown, defineAhaCountdown, formatClock };
