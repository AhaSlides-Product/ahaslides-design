/**
 * @ahaslides-product/design/aha-slider — the shared slider (antd Slider, single thumb, framework-free).
 *
 *   import '@ahaslides-product/design/aha-slider';   // registers <aha-slider>
 *   <aha-slider min="0" max="100" value="40" aria-label="Overlay opacity"></aha-slider>
 *   <aha-slider min="1" max="3" step="0.01" aria-labelledby="zoom-label"></aha-slider>
 *   const percent = new Intl.NumberFormat(locale, { style: 'percent' });
 *   slider.valueText = (value) => percent.format(value);
 *
 * The antd Slider look (4px gray-30 rail, brand track, 14px white handle with a brand ring) on one thumb:
 * drag anywhere on the rail, or use the keyboard on the handle. The value is a number between `min` and
 * `max`, snapped to `step`; with no value it sits at `min`. `input` fires on every change while dragging
 * (antd onChange) and `change` once on release (antd onChangeComplete); each key press fires both.
 * e.detail.value is the number.
 *
 * The handle is the role="slider" (aria-valuemin / max / now), named by `aria-label`, `aria-labelledby`
 * (resolved across the shadow root) or a `<label for>`. `valueText` is a function (value) => string: it
 * writes the value label shown above the handle while dragging, on mouse hover and on keyboard focus, and
 * the handle's aria-valuetext; an empty string falls back to the number. `tooltip="false"` hides the label, and
 * a disabled slider shows none. Right to left: the rail fills from the
 * right and ArrowLeft / ArrowRight swap. Form-associated: `name` submits the value, form reset restores the
 * first value, a disabled fieldset disables it, and <aha-form-item> reads and resets it. Boolean
 * attributes set to "false" read as off.
 */
import { describeField, isInvalid } from './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const isOn = (host, name) => { const v = host.getAttribute(name); return v !== null && v !== 'false'; };
const finite = (text, fallback) => { const n = text == null || text === '' ? NaN : Number(text); return Number.isFinite(n) ? n : fallback; };
function places(n) {
  const match = /(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(n));
  return Math.max(0, (match[1] || '').length - Number(match[2] || 0));
}

const FAST = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .control{ position:relative; height:24px; margin:0 calc(var(--aha-space-14,14px) / 2); cursor:pointer; touch-action:pan-y; user-select:none; -webkit-user-select:none }
  .rail, .track{ position:absolute; top:10px; height:4px; border-radius:var(--aha-radius-pill,999px) }
  .rail{ inset-inline:0; background:var(--aha-gray-30,#F1F1F1); transition:background ${FAST} }
  .track{ inset-inline-start:0; width:var(--_pos,0%); background:var(--aha-color-primary,#E70E68); transition:background ${FAST} }
  .handle{ position:absolute; top:5px; inset-inline-start:var(--_pos,0%); width:14px; height:14px; translate:-50% 0;
    box-sizing:border-box; border-radius:50%; background:var(--aha-white,#FFFFFF);
    box-shadow:0 0 0 2px var(--aha-color-primary,#E70E68); outline:none; cursor:grab;
    transition:scale ${FAST}, box-shadow ${FAST} }
  :host(:dir(rtl)) .handle{ translate:50% 0 }
  :host(:not([_disabled])) .control:hover .rail{ background:var(--aha-gray-40,#E3E3E3) }
  :host(:not([_disabled])) .control:hover .track{ background:var(--aha-color-primary-hover,#DB005B) }
  :host(:not([_disabled])) .handle:hover, :host([_dragging]) .handle{ scale:1.143; box-shadow:0 0 0 2px var(--aha-color-primary-active,#DB005B) }
  .handle:focus-visible{ box-shadow:0 0 0 2px var(--aha-color-primary-active,#DB005B), 0 0 0 6px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  :host([_dragging]) .control, :host([_dragging]) .handle{ cursor:grabbing }

  .bubble{ position:absolute; bottom:calc(100% + 2px); inset-inline-start:var(--_pos,0%); transform:translateX(-50%);
    box-sizing:border-box; padding:var(--aha-space-6,6px) var(--aha-space-10,10px); border-radius:var(--aha-radius-sm,6px);
    background:var(--aha-bg-dark,#1A1A1A); color:var(--aha-text-inverse,#FFFFFF);
    font-size:12px; line-height:18px; font-weight:var(--aha-weight-regular,400); font-variant-numeric:tabular-nums; white-space:nowrap;
    pointer-events:none; opacity:0; visibility:hidden; transition:opacity ${FAST}, visibility ${FAST} }
  :host(:dir(rtl)) .bubble{ transform:translateX(50%) }
  .bubble::after{ content:""; position:absolute; top:calc(100% - 5px); left:calc(50% - 4px); width:8px; height:8px;
    background:inherit; transform:rotate(45deg) }
  :host([_dragging]) .bubble, .handle:focus-visible + .bubble{ opacity:1; visibility:visible }
  @media (hover: hover) and (pointer: fine){ .handle:hover + .bubble{ opacity:1; visibility:visible } }
  :host([tooltip="false"]) .bubble, :host([_disabled]) .bubble{ display:none }

  :host([_disabled]) .control, :host([_disabled]) .handle{ cursor:not-allowed }
  :host([_disabled]) .track{ background:var(--aha-icon-disabled,#B5B5B5) }
  :host([_disabled]) .handle{ box-shadow:0 0 0 2px var(--aha-icon-disabled,#B5B5B5) }

  @media (prefers-reduced-motion: reduce){ *, *::after{ transition:none !important } }
`;

export class AhaSlider extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'disabled', 'tooltip', 'status', 'invalid',
      'aria-label', 'aria-labelledby', 'aria-describedby'];
  }
  static get formAssociated() { return true; }
  constructor() {
    super();
    // jsdom's attachInternals() has no form API (setFormValue, labels, form); treat it as unsupported
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._internals = internals && typeof internals.setFormValue === 'function' ? internals : null;
    this._formDisabled = false;
    this._valueText = null;
  }

  get form() { return this._internals ? this._internals.form : this.closest('form'); }
  get labels() { return (this._internals && this._internals.labels) || []; }
  get min() { return finite(this.getAttribute('min'), 0); }
  set min(v) { this.setAttribute('min', String(v)); }
  get max() { const max = finite(this.getAttribute('max'), 100); return Math.max(max, this.min); }
  set max(v) { this.setAttribute('max', String(v)); }
  get step() { const step = finite(this.getAttribute('step'), 1); return step > 0 ? step : 1; }
  set step(v) { this.setAttribute('step', String(v)); }
  /** The value as a number: clamped to min / max and snapped to step; min when unset. */
  get value() { return this._snap(finite(this.getAttribute('value'), this.min)); }
  set value(v) { if (v == null || v === '') this.removeAttribute('value'); else this.setAttribute('value', String(v)); }
  get disabled() { return isOn(this, 'disabled') || this._formDisabled; }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  /** (value) => string for the value label and aria-valuetext; null shows the plain number. */
  get valueText() { return this._valueText; }
  set valueText(fn) { this._valueText = typeof fn === 'function' ? fn : null; this._sync(); }

  connectedCallback() {
    upgradeProperties(this, ['value', 'min', 'max', 'step', 'disabled', 'valueText']);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this._initialValue = this.getAttribute('value');
      this._build();
    }
    this._sync();
  }
  formResetCallback() { this.value = this._initialValue; }
  formDisabledCallback(disabled) { this._formDisabled = disabled; this._sync(); }
  formStateRestoreCallback(state) { if (typeof state === 'string') this.value = state; }
  attributeChangedCallback(name, _old, next) {
    // the browser disables a form-associated element for any disabled attribute, "false" included
    if (name === 'disabled' && next === 'false') { this.removeAttribute('disabled'); return; }
    if (name === 'value') this._syncValue(); else this._sync();
  }

  _build() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="control" part="control">` +
        `<span class="rail" part="rail"></span>` +
        `<span class="track" part="track"></span>` +
        `<span class="handle" part="handle" role="slider" tabindex="0"></span>` +
        `<span class="bubble" part="tooltip" aria-hidden="true"></span>` +
      `</div>`;
    const root = this.shadowRoot;
    this._control = root.querySelector('.control');
    this._rail = root.querySelector('.rail');
    this._handle = root.querySelector('.handle');
    this._bubble = root.querySelector('.bubble');
    const control = this._control;
    control.addEventListener('pointerdown', (event) => {
      if (this.disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      this._handle.focus({ preventScroll: true });
      try { control.setPointerCapture(event.pointerId); } catch (_) { /* a synthetic pointer has no capture */ }
      this._dragFrom = this.value;
      this._dragRtl = this._rtl();
      this.setAttribute('_dragging', '');
      this._fromPointer(event);
    });
    control.addEventListener('pointermove', (event) => { if (this.hasAttribute('_dragging')) this._fromPointer(event); });
    const end = () => {
      if (!this.hasAttribute('_dragging')) return;
      this.removeAttribute('_dragging');
      if (this.value !== this._dragFrom) this._emit('change');
    };
    control.addEventListener('pointerup', end);
    control.addEventListener('pointercancel', end);
    control.addEventListener('lostpointercapture', end);
    this._handle.addEventListener('focus', () => this._syncName());
    this._handle.addEventListener('keydown', (event) => this._key(event));
  }

  _snap(n) {
    const min = this.min, max = this.max, step = this.step;
    if (!(n > min)) return min;
    if (n >= max) n = max;
    let count = Math.round((n - min) / step);
    if (min + count * step > max + 1e-9) count -= 1;
    return Math.min(max, Number((min + count * step).toFixed(Math.max(places(step), places(min)))));
  }
  _rtl() { return getComputedStyle(this).direction === 'rtl'; }
  _fromPointer(event) {
    const rect = this._rail.getBoundingClientRect();
    if (!rect.width) return;
    let ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    if (this._dragRtl) ratio = 1 - ratio;
    this._set(this.min + ratio * (this.max - this.min));
  }
  _key(event) {
    if (this.disabled) return;
    const step = this.step, value = this.value;
    const page = Math.max(step, Math.round((this.max - this.min) / 10 / step) * step);
    const flip = this._rtl() ? -1 : 1;
    const next = {
      ArrowRight: value + step * flip, ArrowLeft: value - step * flip, ArrowUp: value + step, ArrowDown: value - step,
      PageUp: value + page, PageDown: value - page, Home: this.min, End: this.max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    if (this._set(next)) this._emit('change');
  }
  _set(n) {
    const value = this._snap(n);
    if (value === this.value) return false;
    this.setAttribute('value', String(value));
    this._emit('input');
    return true;
  }
  _emit(type) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { value: this.value } })); }
  _text(value) {
    if (!this._valueText) return null;
    try { const text = this._valueText(value); return text == null || text === '' ? null : String(text); } catch (_) { return null; }
  }

  _sync() {
    const handle = this._handle;
    if (!handle) return;
    const disabled = this.disabled;
    this.toggleAttribute('_disabled', disabled);
    if (disabled) this.removeAttribute('_dragging');
    handle.setAttribute('aria-valuemin', String(this.min));
    handle.setAttribute('aria-valuemax', String(this.max));
    handle.tabIndex = disabled ? -1 : 0;
    if (disabled) handle.setAttribute('aria-disabled', 'true'); else handle.removeAttribute('aria-disabled');
    if (isInvalid(this)) handle.setAttribute('aria-invalid', 'true'); else handle.removeAttribute('aria-invalid');
    this._syncName();
    describeField(this, handle);
    this._syncValue();
  }
  _syncValue() {
    const handle = this._handle;
    if (!handle) return;
    const min = this.min, max = this.max, value = this.value;
    this._control.style.setProperty('--_pos', `${max > min ? ((value - min) / (max - min)) * 100 : 0}%`);
    handle.setAttribute('aria-valuenow', String(value));
    const text = this._text(value);
    if (text != null) handle.setAttribute('aria-valuetext', text); else handle.removeAttribute('aria-valuetext');
    this._bubble.textContent = text ?? String(value);
    if (this._internals) this._internals.setFormValue(String(value));
  }
  _syncName() {
    const handle = this._handle;
    if (!handle) return;
    const root = this.getRootNode();
    let name = this.getAttribute('aria-label') || (this.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .map((id) => (root.getElementById ? root.getElementById(id) : null))
      .filter(Boolean).map((el) => el.textContent.trim()).filter(Boolean).join(' ');
    if (!name) name = [...this.labels].map((el) => el.textContent.trim()).filter(Boolean).join(' ');
    if (name) handle.setAttribute('aria-label', name); else handle.removeAttribute('aria-label');
  }
}

export function defineAhaSlider(tag = 'aha-slider') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSlider);
  return true;
}
if (typeof window !== 'undefined') defineAhaSlider();

export default { AhaSlider, defineAhaSlider };
