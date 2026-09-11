/**
 * @ahaslides-product/design/aha-number-with-unit — a digit input with an inline unit + hover stepper.
 *
 *   import '@ahaslides-product/design/aha-number-with-unit';   // registers <aha-number-with-unit>
 *   <aha-number-with-unit value="20" unit="seconds" min="5" max="120" maxdigits="4"></aha-number-with-unit>
 *
 * The settings field for a number that carries a UNIT — a duration, points, a per-item count
 * (SETTINGS-45). It is a fixed-width digit input with the unit written IN FULL as an inline suffix
 * INSIDE the same field (rendered exactly as passed — `seconds`, `points` — muted grey via
 * --aha-text-tertiary; never truncated to a short label) — a bordered box beside the input would imply
 * the unit is selectable. A hover-revealed ▲/▼ tertiary
 * stepper (system-caret-up/down) nudges the value; a hard digit cap (`maxdigits`, default 4 — a 5th
 * keystroke is ignored); the value CLAMPS to min/max on change and on blur (not only on misuse); and
 * an `errormessage` prop draws a red border/ring plus a message line below. The host is the accessible
 * spinbutton (role="spinbutton", aria-valuenow/min/max, ArrowUp/Down + PageUp/Down step it). Motion
 * lives on persistent nodes; themed only by --aha-* tokens. Emits composed `input` / `change`.
 */
import './icons.js';   // registers <aha-icon> for the stepper carets

const STYLE = `
  :host{ display:inline-flex; flex-direction:column; gap:4px; width:140px }
  .wrap{ box-sizing:border-box; position:relative; width:100%; display:inline-flex; align-items:center; gap:6px;
    height:32px; padding:0 8px 0 12px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:40px }

  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; padding:0; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:inherit; background:transparent; border:0; outline:none; -moz-appearance:textfield }
  .field::-webkit-outer-spin-button, .field::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0 }
  .unit{ flex:0 0 auto; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    font-size:14px; line-height:21px; color:var(--aha-text-tertiary,#8A8A8A); user-select:none; white-space:nowrap }

  /* the ▲/▼ stepper — a persistent column revealed on hover/focus (opacity, no remount) */
  .stepper{ flex:0 0 auto; display:inline-flex; flex-direction:column; gap:0; opacity:0;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .wrap:hover .stepper, :host([_focused]) .stepper{ opacity:1 }
  .step{ display:inline-flex; align-items:center; justify-content:center; width:18px; height:14px;
    padding:0; margin:0; border:0; background:transparent; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A); border-radius:var(--aha-radius-xs,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .step:hover{ color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF) }
  .step:disabled{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; background:transparent }

  .wrap:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  :host([_error]) .wrap{ border-color:var(--aha-border-error,#F5222D) }
  :host([_error][_focused]) .wrap{ border-color:var(--aha-border-error,#F5222D);
    box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }
  .msg{ font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-color-error,#F5222D) }
  .msg[hidden]{ display:none }

  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field, :host([disabled]) .step{ cursor:not-allowed }
  :host([disabled]) .unit{ color:var(--aha-text-disabled,#B5B5B5) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaNumberWithUnit extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'unit', 'min', 'max', 'step', 'maxdigits', 'errormessage', 'disabled', 'size'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get _min() { const m = this.getAttribute('min'); return m == null ? -Infinity : Number(m); }
  get _max() { const m = this.getAttribute('max'); return m == null ? Infinity : Number(m); }
  get _step() { return Number(this.getAttribute('step') || 1); }
  get _maxDigits() { return Math.max(1, parseInt(this.getAttribute('maxdigits') || '4', 10)); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() {
    if (this.shadowRoot) this._sync();
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="wrap" part="wrap">` +
        `<input class="field" part="field" inputmode="numeric" />` +
        `<span class="unit" part="unit"></span>` +
        `<span class="stepper" part="stepper">` +
          `<button class="step step-up" part="step" type="button" tabindex="-1" aria-label="Increase"><aha-icon name="system-caret-up" size="12" aria-hidden="true"></aha-icon></button>` +
          `<button class="step step-down" part="step" type="button" tabindex="-1" aria-label="Decrease"><aha-icon name="system-caret-down" size="12" aria-hidden="true"></aha-icon></button>` +
        `</span>` +
      `</div>` +
      `<span class="msg" part="msg" role="alert"></span>`;
    this.setAttribute('role', 'spinbutton');
    const f = this.shadowRoot.querySelector('.field');
    f.addEventListener('input', () => {
      // hard digit cap — strip non-digits, cap at maxDigits (SETTINGS-45). Native maxLength blocks the
      // 5th keystroke, so this only rewrites on a paste/non-digit; preserve the caret across that
      // rewrite (re-assigning value snaps it to the end) by counting the kept digits before it.
      const digits = f.value.replace(/[^\d]/g, '').slice(0, this._maxDigits);
      if (f.value !== digits) {
        const caret = f.selectionStart || 0;
        const keptBefore = f.value.slice(0, caret).replace(/[^\d]/g, '').length;
        f.value = digits;
        const pos = Math.min(keptBefore, digits.length);
        try { f.setSelectionRange(pos, pos); } catch (_) { /* non-text input may reject selection */ }
      }
      this.setAttribute('value', digits);
      this._syncAria();
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: digits === '' ? null : Number(digits) } }));
    });
    // clamp on change AND blur — an immediate fallback, not only on deliberate misuse (SETTINGS-25)
    f.addEventListener('change', () => this._commit());
    f.addEventListener('blur', () => { this.removeAttribute('_focused'); this._commit(); });
    f.addEventListener('focus', () => this.setAttribute('_focused', ''));
    f.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); this._nudge(this._step); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); this._nudge(-this._step); }
      else if (e.key === 'PageUp') { e.preventDefault(); this._nudge(this._step * 10); }
      else if (e.key === 'PageDown') { e.preventDefault(); this._nudge(-this._step * 10); }
    });
    this.shadowRoot.querySelector('.step-up').addEventListener('click', () => { if (!this.disabled) this._nudge(this._step); });
    this.shadowRoot.querySelector('.step-down').addEventListener('click', () => { if (!this.disabled) this._nudge(-this._step); });
    this._sync();
  }
  _clamp(n) { return Math.min(this._max, Math.max(this._min, n)); }
  _commit() {
    if (this.value === '') return;
    const clamped = this._clamp(Number(this.value));
    if (String(clamped) !== this.value) { this.setAttribute('value', String(clamped)); }
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: clamped } }));
  }
  _nudge(delta) {
    const base = this.value === '' ? (this._min === -Infinity ? 0 : this._min) : Number(this.value);
    const next = this._clamp(base + delta);
    this.setAttribute('value', String(next));
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: next } }));
  }
  _syncAria() {
    if (this.value === '') this.removeAttribute('aria-valuenow');
    else this.setAttribute('aria-valuenow', this.value);
    if (this._min !== -Infinity) this.setAttribute('aria-valuemin', String(this._min));
    if (this._max !== Infinity) this.setAttribute('aria-valuemax', String(this._max));
  }
  _sync() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    if (f.value !== this.value) f.value = this.value;
    f.disabled = this.disabled;
    f.maxLength = this._maxDigits;
    this.shadowRoot.querySelector('.unit').textContent = this.getAttribute('unit') || '';
    const msg = this.shadowRoot.querySelector('.msg');
    const err = this.getAttribute('errormessage');
    if (err) { this.setAttribute('_error', ''); msg.hidden = false; msg.textContent = err; f.setAttribute('aria-invalid', 'true'); }
    else { this.removeAttribute('_error'); msg.hidden = true; f.removeAttribute('aria-invalid'); }
    const up = this.shadowRoot.querySelector('.step-up'), down = this.shadowRoot.querySelector('.step-down');
    const v = this.value === '' ? null : Number(this.value);
    up.disabled = this.disabled || (v != null && v >= this._max);
    down.disabled = this.disabled || (v != null && v <= this._min);
    if (this.disabled) this.setAttribute('aria-disabled', 'true'); else this.removeAttribute('aria-disabled');
    this._syncAria();
  }
}

export function defineAhaNumberWithUnit(tag = 'aha-number-with-unit') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaNumberWithUnit);
  return true;
}
if (typeof window !== 'undefined') defineAhaNumberWithUnit();

export default { AhaNumberWithUnit, defineAhaNumberWithUnit };
