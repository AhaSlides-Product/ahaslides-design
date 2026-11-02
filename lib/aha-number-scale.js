/**
 * @ahaslides-product/design/aha-number-scale — a row of tappable numbers on the audience phone (NPS 0–10 by default).
 *
 *   import '@ahaslides-product/design/aha-number-scale';   // registers <aha-number-scale>
 *   <aha-number-scale group-label="How likely are you to recommend us to a friend?"
 *     low-label="Not at all likely" high-label="Extremely likely" lock-key="slide-42"></aha-number-scale>
 *   scale.addEventListener('change', (e) => e.detail.value);   // 9
 *
 * One button per whole number from `min` to `max` (0–10 unless set), a radio group with arrow keys,
 * Home and End (mirrored in right-to-left). Every number gets an equal share of one row; when that
 * share would fall under 40px (an 11-point scale on a phone) the numbers wrap to six per row. The
 * end labels sit under the numbers. The pick fills with the deck accent. `disabled` or a locked
 * `lock-key` mutes the other numbers and restores the submitted value. The element draws no
 * detractor / promoter colours: a consumer that needs them passes its own label text.
 */
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';
import { upgradeProperties } from './upgrade-properties.js';

const EASE = 'var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1))';
const STYLE = DECK_STYLE + `
  :host{ display:block; width:100%; container-type:inline-size }
  .scale{ display:grid; grid-template-columns:repeat(var(--_count, 11), minmax(0, 1fr)); gap:var(--aha-space-4, 4px) }
  @container (max-width: 479px){ .scale[data-wrap]{ grid-template-columns:repeat(6, minmax(0, 1fr)) } }
  .number{ box-sizing:border-box; min-width:0; height:48px; margin:0; padding:0; border:1px solid var(--_stroke); border-radius:var(--aha-radius-default, 8px);
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    font-size:16px; line-height:24px; font-weight:var(--aha-weight-semibold, 600); color:var(--_ink); cursor:pointer;
    transition:background ${EASE}, border-color ${EASE}, color ${EASE}, opacity ${EASE} }
  .number:hover:not([aria-disabled="true"]){ background:var(--_surface-hover); border-color:var(--_stroke-hover) }
  .number:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .number[aria-checked="true"]{ background:var(--_accent); border-color:var(--_accent); color:var(--_accent-ink) }
  .number[aria-checked="true"]:hover:not([aria-disabled="true"]){ background:var(--_mark-hover); border-color:var(--_mark-hover) }
  .number[aria-disabled="true"]{ cursor:default }
  .number[aria-disabled="true"]:not([aria-checked="true"]){ opacity:.55 }
  .ends{ display:flex; justify-content:space-between; gap:var(--aha-space-16, 16px); margin-top:var(--aha-space-8, 8px);
    font-size:14px; line-height:20px; color:var(--_ink-secondary) }
  .ends[hidden]{ display:none }
  .end{ min-width:0; overflow-wrap:anywhere }
  .end-high{ text-align:end }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const toInt = (text, fallback) => { const n = Number.parseInt(text, 10); return Number.isFinite(n) ? n : fallback; };

export class AhaNumberScale extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'min', 'max', 'value', 'low-label', 'high-label', 'group-label', 'disabled', 'lock-key'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <div class="scale" part="scale" role="radiogroup"></div>
      <div class="ends" part="labels"><span class="end end-low" dir="auto"></span><span class="end end-high" dir="auto"></span></div>`));
    this._scale = this.shadowRoot.querySelector('.scale');
    this._ends = this.shadowRoot.querySelector('.ends');
    this._scale.addEventListener('click', (event) => {
      const button = event.target.closest('.number');
      if (button) this._pick(Number(button.dataset.value));
    });
    this._scale.addEventListener('keydown', (event) => this._onKey(event));
    this._value = undefined;
    this._lockedRecord = null;
    this._builtRange = '';
  }
  connectedCallback() {
    upgradeProperties(this, ['value']);
    super.connectedCallback();
    this._ensureNumbers();
    this._sync();
    this._watchLock();
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record && Number.isFinite(Number(record.value))) this._value = Number(record.value);
      this._sync();
    });
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'value') this._value = undefined;
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    if (name === 'min' || name === 'max') this._ensureNumbers();
    this._sync();
  }

  get min() { return toInt(this.getAttribute('min'), 0); }
  get max() { return Math.max(this.min, toInt(this.getAttribute('max'), 10)); }
  /** The picked number, or `null` before a pick. */
  get value() {
    if (this._value !== undefined) return this._value;
    const fromAttribute = this.getAttribute('value');
    return fromAttribute == null || fromAttribute === '' ? null : toInt(fromAttribute, null);
  }
  set value(next) { this._value = next == null || next === '' ? null : Number(next); this._sync(); }
  get locked() { return !!this._lockedRecord; }
  get _closed() { return this.locked || this.hasAttribute('disabled'); }

  _pick(number) {
    if (this._closed || !Number.isFinite(number)) return;
    this._value = number;
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: number } }));
  }
  _onKey(event) {
    const buttons = [...this._scale.children];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let target = null;
    if (event.key === forward || event.key === 'ArrowDown') target = Math.min(buttons.length - 1, index + 1);
    else if (event.key === back || event.key === 'ArrowUp') target = Math.max(0, index - 1);
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = buttons.length - 1;
    else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); this._pick(Number(event.target.dataset.value)); return; }
    if (target == null) return;
    event.preventDefault();
    buttons[target].focus();
    this._pick(Number(buttons[target].dataset.value));
  }
  _build() {
    const fragment = document.createDocumentFragment();
    for (let number = this.min; number <= this.max; number++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'number';
      button.setAttribute('part', 'number');
      button.setAttribute('role', 'radio');
      button.dataset.value = String(number);
      button.textContent = String(number);
      fragment.append(button);
    }
    this._scale.replaceChildren(fragment);
  }
  _ensureNumbers() {
    const range = `${this.min}:${this.max}`;
    if (range !== this._builtRange) { this._builtRange = range; this._build(); }
  }
  _sync() {
    const count = this.max - this.min + 1;
    this._scale.style.setProperty('--_count', String(count));
    this._scale.toggleAttribute('data-wrap', count > 6);
    this._scale.setAttribute('aria-label', this.getAttribute('group-label') || this.getAttribute('aria-label') || 'Score');
    const low = this.getAttribute('low-label') || '';
    const high = this.getAttribute('high-label') || '';
    this._ends.querySelector('.end-low').textContent = low;
    this._ends.querySelector('.end-high').textContent = high;
    this._ends.hidden = !low && !high;
    const value = this.value;
    const buttons = [...this._scale.children];
    const focusable = buttons.find((b) => Number(b.dataset.value) === value) || buttons[0];
    for (const button of buttons) {
      const number = Number(button.dataset.value);
      button.setAttribute('aria-checked', String(number === value));
      button.setAttribute('aria-disabled', String(this._closed));
      button.tabIndex = button === focusable ? 0 : -1;
      const ends = number === this.min ? low : number === this.max ? high : '';
      if (ends) button.setAttribute('aria-label', `${number}, ${ends}`); else button.removeAttribute('aria-label');
    }
  }
}

export function defineAhaNumberScale(tag = 'aha-number-scale') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaNumberScale);
}
if (typeof window !== 'undefined') defineAhaNumberScale();
export default { AhaNumberScale, defineAhaNumberScale };
