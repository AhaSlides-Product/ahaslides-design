/**
 * @ahaslides-product/design/aha-scale-slider — a rating scale: slider, end labels, live readout.
 *
 *   import '@ahaslides-product/design/aha-scale-slider';   // registers <aha-scale-slider>
 *   <aha-scale-slider min="1" max="5" value="3" low-label="Never" high-label="Always"
 *     step-labels='["Rarely","Sometimes","Often"]' accent="#E70E68"></aha-scale-slider>
 *   slider.addEventListener('change', (e) => e.detail.value);
 *
 * The native Rating Scales anatomy: the readout riding above the thumb (`value: label`, 16px
 * semibold), the low and high labels below as muted captions. A scale belongs to a statement, so pass `accent` from the deck palette BY
 * POSITION (presentationColorPalette[i % length]); without it the deck's first accent is used. The
 * rail carries the ink hairline and so does the filled part, so a fill never sinks into a same-hue
 * deck. `unset` shows a live handle but no number and no fill until a value is chosen. With
 * `commit-on-drag` a bare tap on the rail only previews: `change` fires on release after a real drag,
 * or on a key press. Built on a native range input, so the keyboard and the slider role are native;
 * the readout is its aria-valuetext. `lock-key` locks it (and restores the value) after a submission.
 */
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';

const LABEL_MAX_SPAN = 10;
const DRAG_THRESHOLD_PX = 4;

/** The label for a value: the end labels at the ends, the per-step label between, none past 10 steps. */
export function scaleStepLabel(value, min, max, lowLabel, highLabel, stepLabels = []) {
  if (value === min) return lowLabel;
  if (value === max) return highLabel;
  if (max - min > LABEL_MAX_SPAN) return '';
  return stepLabels[value - min - 1] ?? '';
}

const STYLE = DECK_STYLE + `
  :host{ display:block; width:100%; color:var(--_ink) }
  .readout{ position:relative; margin:0; height:24px; font-size:16px; line-height:24px; font-weight:600 }
  .readout-text{ position:absolute; top:0; white-space:nowrap }
  .control{ position:relative; display:flex; align-items:center; height:44px; margin-top:calc(-1 * var(--aha-space-6, 6px)) }
  .rail, .fill{ position:absolute; left:0; height:6px; box-sizing:border-box; border-radius:var(--aha-radius-pill, 999px);
    border:1px solid var(--_edge); pointer-events:none }
  .rail{ right:0; background:var(--_track); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost) }
  .fill{ background:var(--_slider-accent) }
  :host([unset]) .fill{ visibility:hidden }
  input{ position:relative; width:100%; height:44px; margin:0; background:transparent; -webkit-appearance:none; appearance:none; cursor:pointer }
  input:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px; border-radius:var(--aha-radius-default, 8px) }
  input::-webkit-slider-runnable-track{ height:8px; background:transparent }
  input::-moz-range-track{ height:8px; background:transparent }
  input::-webkit-slider-thumb{ -webkit-appearance:none; box-sizing:border-box; width:24px; height:24px; margin-top:calc(-1 * var(--aha-space-8, 8px));
    border-radius:var(--aha-radius-pill, 999px); border:3px solid var(--_slider-accent); background:var(--aha-white, #FFFFFF);
    transition:box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  input::-moz-range-thumb{ box-sizing:border-box; width:24px; height:24px; border-radius:var(--aha-radius-pill, 999px);
    border:3px solid var(--_slider-accent); background:var(--aha-white, #FFFFFF);
    transition:box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  input:hover::-webkit-slider-thumb{ box-shadow:0 0 0 6px color-mix(in srgb, var(--_slider-accent) 20%, transparent) }
  input:hover::-moz-range-thumb{ box-shadow:0 0 0 6px color-mix(in srgb, var(--_slider-accent) 20%, transparent) }
  .ends{ display:flex; align-items:flex-start; gap:var(--aha-space-12, 12px); font-size:12px; line-height:18px; color:var(--_ink-muted) }
  .ends span{ flex:1 1 0; min-width:0 }
  .ends span:last-child{ text-align:end }
  .hint{ margin:0; text-align:center; font-size:14px; line-height:20px; opacity:.6 }
  .hint[hidden]{ display:none }
  :host([disabled]) .control, :host([disabled]) .readout{ opacity:.45 }
  :host([disabled]) input{ cursor:default }
  :host{ --_slider-accent:var(--_accent) }
  @media (prefers-reduced-motion: reduce){ input::-webkit-slider-thumb{ transition:none } input::-moz-range-thumb{ transition:none } }
`;

export class AhaScaleSlider extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'value', 'min', 'max', 'step', 'low-label', 'high-label', 'step-labels',
      'disabled', 'unset', 'unset-hint', 'commit-on-drag', 'lock-key'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <p class="readout" part="readout" aria-hidden="true"><span class="readout-text"></span></p>
      <div class="control" dir="ltr"><span class="rail"></span><span class="fill" part="fill"></span><input type="range" part="input"></div>
      <p class="hint" part="hint"></p>
      <div class="ends" part="ends"><span class="low" dir="auto"></span><span class="high" dir="auto"></span></div>`));
    this._input = this.shadowRoot.querySelector('input');
    this._gate = { pressing: false, dragged: false, pending: null };
    this._onWindowMove = (event) => {
      if (!this._gate.pressing) return;
      if (Math.hypot(event.clientX - this._startX, event.clientY - this._startY) > DRAG_THRESHOLD_PX) this._gate.dragged = true;
    };
    this._onWindowUp = () => {
      if (!this._gate.pressing) return;
      const { dragged, pending } = this._gate;
      this._gate = { pressing: false, dragged: false, pending: null };
      if (dragged && (pending != null || this.hasAttribute('unset'))) this._commit(pending ?? Number(this._input.value));
      else this._sync();
    };
    this._input.addEventListener('pointerdown', (event) => {
      if (!this.hasAttribute('commit-on-drag') || this.hasAttribute('disabled')) return;
      this._startX = event.clientX;
      this._startY = event.clientY;
      this._gate = { pressing: true, dragged: false, pending: null };
    });
    // Picking the value the thumb already rests on fires no `input`, so an unset scale could never choose its minimum.
    const confirmUnset = () => { if (this.hasAttribute('unset') && !this.hasAttribute('disabled') && !this._gate.pressing) this._commit(Number(this._input.value)); };
    this._input.addEventListener('pointerup', () => { if (!this.hasAttribute('commit-on-drag')) setTimeout(confirmUnset); });
    this._input.addEventListener('keydown', (event) => {
      if (['Enter', ' ', 'ArrowLeft', 'ArrowDown', 'Home', 'PageDown'].includes(event.key)) setTimeout(confirmUnset);
    });
    this._input.addEventListener('input', () => {
      const value = Number(this._input.value);
      if (this._gate.pressing) { this._gate.pending = value; this._paint(value); return; }
      this._commit(value);
    });
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('pointermove', this._onWindowMove);
    window.addEventListener('pointerup', this._onWindowUp);
    window.addEventListener('pointercancel', this._onWindowUp);
    this._sync();
    this._watchLock();
  }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      if (record && typeof record.value === 'number') this.setAttribute('value', String(record.value));
      // The lock only ever adds `disabled`; a host's own `disabled` survives an empty or released lock.
      if (record || this._lockedByKey) this.toggleAttribute('disabled', !!record);
      this._lockedByKey = !!record;
    });
  }
  disconnectedCallback() {
    window.removeEventListener('pointermove', this._onWindowMove);
    window.removeEventListener('pointerup', this._onWindowUp);
    window.removeEventListener('pointercancel', this._onWindowUp);
    this._unwatchLock?.();
    this._unwatchLock = null;
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'lock-key' && this._unwatchLock) this._watchLock();
    if (this.isConnected) this._sync();
  }

  get value() { return Number(this.getAttribute('value') ?? this._range().min); }
  set value(next) { this.setAttribute('value', String(next)); }

  _range() {
    return { min: Number(this.getAttribute('min') ?? 1), max: Number(this.getAttribute('max') ?? 5), step: Number(this.getAttribute('step') ?? 1) };
  }
  _commit(value) {
    this.removeAttribute('unset');
    this.setAttribute('value', String(value));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value } }));
  }
  _paint(value) {
    const { min, max } = this._range();
    const share = max > min ? (value - min) / (max - min) : 0;
    this.shadowRoot.querySelector('.fill').style.width = `calc(12px + (100% - 24px) * ${share})`;
    let labels = [];
    try { labels = JSON.parse(this.getAttribute('step-labels') || '[]'); } catch { labels = []; }
    const low = this.getAttribute('low-label') || '';
    const high = this.getAttribute('high-label') || '';
    const label = scaleStepLabel(value, min, max, low, high, labels);
    const readout = this.shadowRoot.querySelector('.readout-text');
    // Rides above the thumb and leans inwards near the ends, so the text never spills past the rail.
    readout.style.left = `${share * 100}%`;
    readout.style.transform = `translateX(${-share * 100}%)`;
    readout.replaceChildren();
    if (!this.hasAttribute('unset')) {
      readout.append(String(value));
      if (label) { const bold = document.createElement('b'); bold.textContent = label; readout.append(': ', bold); }
    }
    this._input.setAttribute('aria-valuetext', this.hasAttribute('unset') ? (this.getAttribute('unset-hint') || 'Not set') : (label ? `${value}: ${label}` : String(value)));
  }
  _sync() {
    const { min, max, step } = this._range();
    Object.assign(this._input, { min, max, step });
    this._input.value = String(this.value);
    this._input.disabled = this.hasAttribute('disabled');
    const low = this.getAttribute('low-label') || '';
    const high = this.getAttribute('high-label') || '';
    this._input.setAttribute('aria-label', this.getAttribute('aria-label') || [low, high].filter(Boolean).join(' — ') || 'Scale');
    this.shadowRoot.querySelector('.low').textContent = low;
    this.shadowRoot.querySelector('.high').textContent = high;
    const hint = this.shadowRoot.querySelector('.hint');
    hint.textContent = this.getAttribute('unset-hint') || '';
    hint.hidden = !(this.hasAttribute('unset') && hint.textContent);
    this._paint(this.value);
  }
}

export function defineAhaScaleSlider(tag = 'aha-scale-slider') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaScaleSlider);
}
if (typeof window !== 'undefined') defineAhaScaleSlider();
export default { AhaScaleSlider, defineAhaScaleSlider, scaleStepLabel };
