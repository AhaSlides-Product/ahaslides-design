/**
 * @ahaslides-product/design/aha-input-number — the shared number field (antd InputNumber, framework-free).
 *
 *   import '@ahaslides-product/design/aha-input-number';   // registers <aha-input-number>
 *   <aha-input-number value="12.5" min="0" max="100" step="0.5" placeholder="Any amount"></aha-input-number>
 *   <aha-input-number string-mode precision="2" aria-label="Price"></aha-input-number>
 *
 * The same field as <aha-input> (tokens, three sizes, error status, disabled, readonly, label, error and
 * info message) holding a number: decimals and negatives, `min` / `max` / `step` / `precision`, a hover-
 * revealed ▲/▼ stepper (`controls="false"` hides it) and ArrowUp / ArrowDown (Shift for ten steps).
 *
 * The value is a decimal STRING, worked out with exact decimal arithmetic, so 0.1 + 0.2 is 0.3 and a
 * 20-digit id keeps every digit; empty is null. `valueAsNumber` reads it as a number (NaN when empty).
 * While typing, the value follows the text whenever it is a number inside min / max; on blur or Enter the
 * text is committed: clamped to min / max, rounded to `precision` (half away from zero), and text that is
 * not a number goes back to the last value. `input` fires on every value change and `change` on each
 * commit or step; e.detail.value is the number, or the string under `string-mode`, or null when empty.
 *
 * The inner field is the role="spinbutton" (aria-valuenow / min / max), named by `aria-label`,
 * `aria-labelledby` (resolved across the shadow root), `label` or a `<label for>`. Form-associated: `name`
 * submits the value, form reset restores the first value, a disabled fieldset disables it, and
 * <aha-form-item> reads, validates and resets it. Boolean attributes set to "false" read as off.
 */
import './icons.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const NUMBER = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d{1,4}))?$/i;
const TEN = 10n;

function normalise(n, scale) {
  while (scale > 0 && n % TEN === 0n) { n /= TEN; scale -= 1; }
  return { n, scale };
}
function parseDecimal(input) {
  if (input == null) return null;
  const match = NUMBER.exec(String(input).trim());
  if (!match || !(match[2] || match[3])) return null;
  let digits = (match[2] || '') + (match[3] || '');
  let scale = (match[3] || '').length - Number(match[4] || 0);
  if (scale < 0) { digits += '0'.repeat(-scale); scale = 0; }
  const n = BigInt(digits || '0');
  return normalise(match[1] === '-' ? -n : n, scale);
}
const scaleTo = (d, scale) => d.n * TEN ** BigInt(scale - d.scale);
function add(a, b) {
  const scale = Math.max(a.scale, b.scale);
  return normalise(scaleTo(a, scale) + scaleTo(b, scale), scale);
}
function compare(a, b) {
  const scale = Math.max(a.scale, b.scale);
  const x = scaleTo(a, scale), y = scaleTo(b, scale);
  return x === y ? 0 : (x < y ? -1 : 1);
}
function times(d, k) { return normalise(d.n * BigInt(k), d.scale); }
function roundTo(d, places, cut) {
  if (d.scale <= places) return d;
  const factor = TEN ** BigInt(d.scale - places);
  const negative = d.n < 0n;
  const abs = negative ? -d.n : d.n;
  let q = abs / factor;
  if (!cut && (abs % factor) * 2n >= factor) q += 1n;
  return normalise(negative ? -q : q, places);
}
function toText(d, places = d.scale) {
  const negative = d.n < 0n;
  const digits = String((negative ? -d.n : d.n) * TEN ** BigInt(places - d.scale)).padStart(places + 1, '0');
  const whole = places ? `${digits.slice(0, -places)}.${digits.slice(-places)}` : digits;
  return negative ? `-${whole}` : whole;
}

const isOn = (host, name) => { const v = host.getAttribute(name); return v !== null && v !== 'false'; };
const ALLOWED = /[^\d.-]/g;
function cleanTyped(text) {
  let out = text.replace(ALLOWED, '');
  const negative = out.startsWith('-');
  out = out.replace(/-/g, '');
  const dot = out.indexOf('.');
  if (dot !== -1) out = out.slice(0, dot + 1) + out.slice(dot + 1).replace(/\./g, '');
  return (negative ? '-' : '') + out;
}

const MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))';
const FAST = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; width:var(--aha-field-width,240px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center;
    height:40px; padding:0 var(--aha-space-8,8px) 0 var(--aha-space-12,12px);
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:background ${MOTION}, border-color ${MOTION}, box-shadow ${MOTION} }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px; padding:0 var(--aha-space-4,4px) 0 var(--aha-space-8,8px) }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:48px }
  :host([size="lg"]) .field, :host([size="large"]) .field{ font-size:var(--aha-size-l,16px); line-height:24px }

  .label{ display:block; margin-bottom:var(--aha-space-4,4px); font-size:14px; line-height:21px; font-weight:var(--aha-weight-regular,400); color:var(--aha-text-default,#1A1A1A) }
  .label[hidden]{ display:none }
  :host([size="lg"]) .label, :host([size="large"]) .label{ font-size:var(--aha-size-l,16px); line-height:24px }
  :host([_disabled]) .label{ color:var(--aha-text-disabled,#B5B5B5) }

  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; padding:0; margin:0;
    font-family:inherit; font-size:14px; line-height:21px; font-variant-numeric:tabular-nums;
    color:inherit; background:transparent; border:0; outline:none }
  .field::placeholder{ color:var(--aha-text-tertiary,#616161) }

  .affix{ flex:0 0 auto; font-size:14px; line-height:21px; color:var(--aha-text-secondary,#4A4A4A); white-space:nowrap; user-select:none }
  .affix[hidden]{ display:none }
  .prefix{ margin-right:var(--aha-space-4,4px) }
  .suffix{ margin-left:var(--aha-space-4,4px) }
  :host([_disabled]) .affix{ color:var(--aha-text-disabled,#B5B5B5) }

  .stepper{ flex:0 0 auto; margin-left:var(--aha-space-6,6px); display:inline-flex; flex-direction:column; opacity:0; transition:opacity ${FAST} }
  .wrap:hover .stepper, :host([_focused]) .stepper{ opacity:1 }
  :host([_nocontrols]) .stepper, :host([_disabled]) .stepper, :host([_readonly]) .stepper{ display:none }
  .step{ display:inline-flex; align-items:center; justify-content:center; width:18px; height:14px;
    padding:0; margin:0; border:0; background:transparent; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A); border-radius:var(--aha-radius-xs,4px);
    transition:color ${FAST}, background ${FAST} }
  :host([size="sm"]) .step, :host([size="small"]) .step{ height:11px }
  .step:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-accent,#E70E680D) }
  .step:disabled{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; background:transparent }
  aha-icon{ display:inline-flex; color:currentColor }

  .wrap:hover{ border-color:var(--aha-border-hover,#E70E68) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  :host([_invalid]) .wrap{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([_invalid][_focused]) .wrap{ border-color:var(--aha-border-error,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }

  :host([_disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([_disabled]) .field{ cursor:not-allowed }
  :host([_readonly]) .wrap{ background:var(--aha-bg-container-secondary,#F7F7F7) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaInputNumber extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'precision', 'placeholder', 'disabled', 'readonly', 'status', 'invalid', 'size',
      'controls', 'string-mode', 'prefix', 'suffix', 'label', 'error-message', 'info-message', 'inputmode',
      'increase-label', 'decrease-label', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required'];
  }
  static get formAssociated() { return true; }
  constructor() {
    super();
    // jsdom's attachInternals() has no form API (setFormValue, labels, form); treat it as unsupported
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._internals = internals && typeof internals.setFormValue === 'function' ? internals : null;
    this._formDisabled = false;
    this._writing = false;
  }

  get form() { return this._internals ? this._internals.form : this.closest('form'); }
  get labels() { return (this._internals && this._internals.labels) || []; }
  /** The value as a decimal string, or null when empty. */
  get value() { const d = parseDecimal(this.getAttribute('value')); return d ? toText(d) : null; }
  set value(v) { if (v == null || v === '') this.removeAttribute('value'); else this.setAttribute('value', String(v)); }
  get valueAsNumber() { const v = this.value; return v == null ? NaN : Number(v); }
  get disabled() { return isOn(this, 'disabled') || this._formDisabled; }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  get readOnly() { return isOn(this, 'readonly'); }
  set readOnly(v) { this.toggleAttribute('readonly', !!v); }
  get stringMode() { return isOn(this, 'string-mode'); }
  get controls() { return this.getAttribute('controls') !== 'false'; }
  set controls(v) { if (v === false || v === 'false') this.setAttribute('controls', 'false'); else this.removeAttribute('controls'); }
  stepUp(times = 1) { this._step(Number(times) || 1, true); }
  stepDown(times = 1) { this._step(-(Number(times) || 1), true); }
  select() { this._field?.select(); }

  get _min() { return parseDecimal(this.getAttribute('min')); }
  get _max() { return parseDecimal(this.getAttribute('max')); }
  get _stepSize() { const d = parseDecimal(this.getAttribute('step')); return d && d.n > 0n ? d : { n: 1n, scale: 0 }; }
  get _precision() {
    const p = this.getAttribute('precision');
    if (p == null || p === '') return null;
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 100 ? n : null;
  }

  connectedCallback() {
    upgradeProperties(this, ['value', 'disabled', 'readOnly', 'controls']);
    if (this.getAttribute('disabled') === 'false') this.removeAttribute('disabled');
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this._initialValue = this.getAttribute('value');
      this._build();
    }
    this._committed = this.value;
    this._showValue();
    this._sync();
  }
  formResetCallback() { this.value = this._initialValue; }
  formDisabledCallback(disabled) { this._formDisabled = disabled; this._sync(); }
  formStateRestoreCallback(state) { if (typeof state === 'string') this.value = state; }
  attributeChangedCallback(name, _old, next) {
    // the browser disables a form-associated element for any disabled attribute, "false" included
    if (name === 'disabled' && next === 'false') { this.removeAttribute('disabled'); return; }
    if (!this.shadowRoot) return;
    if (name === 'value' && !this._writing) { this._committed = this.value; this._showValue(); }
    if (name === 'precision') this._showValue();
    this._sync();
  }

  _build() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<label class="label" part="label" for="field" hidden></label>` +
      `<div class="wrap" part="wrap">` +
        `<span class="affix prefix" part="prefix" hidden></span>` +
        `<input class="field" id="field" part="field" type="text" role="spinbutton" autocomplete="off" spellcheck="false"/>` +
        `<span class="stepper" part="stepper">` +
          `<button class="step step-up" part="step" type="button" tabindex="-1"><aha-icon name="system-caret-up" size="12" aria-hidden="true"></aha-icon></button>` +
          `<button class="step step-down" part="step" type="button" tabindex="-1"><aha-icon name="system-caret-down" size="12" aria-hidden="true"></aha-icon></button>` +
        `</span>` +
        `<span class="affix suffix" part="suffix" hidden></span>` +
      `</div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    const root = this.shadowRoot;
    const f = this._field = root.querySelector('.field');
    this._parts = {
      label: root.querySelector('.label'), prefix: root.querySelector('.prefix'), suffix: root.querySelector('.suffix'),
      up: root.querySelector('.step-up'), down: root.querySelector('.step-down'),
    };
    f.addEventListener('input', (event) => { event.stopPropagation(); this._typed(); });
    f.addEventListener('change', (event) => event.stopPropagation());
    f.addEventListener('focus', () => {
      this.setAttribute('_focused', '');
      this._syncName();
      syncFieldError(this, f);
    });
    f.addEventListener('blur', () => { this.removeAttribute('_focused'); this._commit(); });
    f.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        this._step((event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1));
      } else if (event.key === 'Enter') this._commit();
    });
    for (const [button, direction] of [[this._parts.up, 1], [this._parts.down, -1]]) {
      button.addEventListener('mousedown', (event) => { event.preventDefault(); if (!this.disabled) f.focus(); });
      button.addEventListener('click', () => this._step(direction));
    }
  }

  _inRange(d) {
    const min = this._min, max = this._max;
    return !(min && compare(d, min) < 0) && !(max && compare(d, max) > 0);
  }
  _clamp(d) {
    const min = this._min, max = this._max;
    if (min && compare(d, min) < 0) d = min;
    if (max && compare(d, max) > 0) d = max;
    const places = this._precision;
    if (places == null) return d;
    const rounded = roundTo(d, places, false);
    return this._inRange(rounded) ? rounded : roundTo(d, places, true);
  }
  _format(text) {
    const d = parseDecimal(text);
    if (!d) return '';
    const places = this._precision;
    return places == null ? toText(d) : toText(roundTo(d, places, false), places);
  }
  _showValue() { if (this._field) this._field.value = this._format(this.value); }
  _detail(value) { return { value: value == null ? null : (this.stringMode ? value : Number(value)) }; }
  _emit(type, value) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: this._detail(value) })); }
  _write(value) {
    if (value === this.value) return false;
    this._writing = true;
    try { this.value = value; } finally { this._writing = false; }
    this._sync();
    this._emit('input', value);
    return true;
  }

  _typed() {
    const f = this._field;
    const cleaned = cleanTyped(f.value);
    if (cleaned !== f.value) {
      const caret = f.selectionStart || 0;
      const keptBefore = cleanTyped(f.value.slice(0, caret)).length;
      f.value = cleaned;
      try { f.setSelectionRange(keptBefore, keptBefore); } catch (_) { /* a detached field rejects selection */ }
    }
    if (!cleaned.trim()) { this._write(null); return; }
    const d = parseDecimal(cleaned);
    if (d && this._inRange(d)) this._write(toText(d));
  }
  _commit() {
    if (!this._field) return;
    const text = this._field.value.trim();
    let next = this.value;
    if (!text) next = null;
    else {
      const d = parseDecimal(text);
      if (d) next = toText(this._clamp(d));
    }
    this._write(next);
    this._showValue();
    this._change();
  }
  _step(count, programmatic = false) {
    if (this.disabled || (this.readOnly && !programmatic)) return;
    const current = parseDecimal(this.value) || { n: 0n, scale: 0 };
    const next = toText(this._clamp(add(current, times(this._stepSize, count))));
    this._write(next);
    this._showValue();
    this._change();
  }
  _change() {
    const value = this.value;
    if (value === this._committed) return;
    this._committed = value;
    this._emit('change', value);
  }

  _sync() {
    const f = this._field;
    if (!f) return;
    const disabled = this.disabled, readOnly = this.readOnly, invalid = isInvalid(this);
    this.toggleAttribute('_disabled', disabled);
    this.toggleAttribute('_readonly', readOnly);
    this.toggleAttribute('_nocontrols', !this.controls);
    this.toggleAttribute('_invalid', invalid);
    f.disabled = disabled;
    f.readOnly = readOnly;
    f.placeholder = this.getAttribute('placeholder') || '';
    const min = this._min, max = this._max;
    const mode = this.getAttribute('inputmode') || (min && min.n >= 0n ? (this._precision === 0 ? 'numeric' : 'decimal') : '');
    if (mode) f.setAttribute('inputmode', mode); else f.removeAttribute('inputmode');
    const value = this.value;
    const d = parseDecimal(value);
    for (const [attribute, bound] of [['aria-valuenow', d], ['aria-valuemin', min], ['aria-valuemax', max]]) {
      if (bound) f.setAttribute(attribute, String(Number(toText(bound)))); else f.removeAttribute(attribute);
    }
    if (invalid) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    const required = this.getAttribute('aria-required');
    if (required) f.setAttribute('aria-required', required); else f.removeAttribute('aria-required');
    const { label, prefix, suffix, up, down } = this._parts;
    for (const [node, name] of [[prefix, 'prefix'], [suffix, 'suffix']]) {
      const text = this.getAttribute(name) || '';
      node.textContent = text;
      node.hidden = !text;
    }
    label.textContent = this.getAttribute('label') || '';
    label.hidden = !label.textContent;
    up.setAttribute('aria-label', this.getAttribute('increase-label') || 'Increase');
    down.setAttribute('aria-label', this.getAttribute('decrease-label') || 'Decrease');
    up.disabled = disabled || readOnly || !!(d && max && compare(d, max) >= 0);
    down.disabled = disabled || readOnly || !!(d && min && compare(d, min) <= 0);
    if (this._internals) this._internals.setFormValue(value ?? '');
    this._syncName();
    syncFieldError(this, f);
  }
  _syncName() {
    const f = this._field;
    if (!f) return;
    const root = this.getRootNode();
    let name = this.getAttribute('aria-label') || (this.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .map((id) => (root.getElementById ? root.getElementById(id) : null))
      .filter(Boolean).map((el) => el.textContent.trim()).filter(Boolean).join(' ');
    if (!name && !this.getAttribute('label')) name = [...this.labels].map((el) => el.textContent.trim()).filter(Boolean).join(' ');
    if (name) f.setAttribute('aria-label', name); else f.removeAttribute('aria-label');
  }
}

export function defineAhaInputNumber(tag = 'aha-input-number') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInputNumber);
  return true;
}
if (typeof window !== 'undefined') defineAhaInputNumber();

export default { AhaInputNumber, defineAhaInputNumber };
