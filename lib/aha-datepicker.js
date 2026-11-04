/**
 * @ahaslides-product/design/aha-datepicker — the shared date field with a calendar (antd DatePicker, framework-free).
 *
 *   import '@ahaslides-product/design/aha-datepicker';   // registers <aha-datepicker>
 *   <aha-datepicker value="2026-11-04" min="2026-01-01" aria-label="Start date"></aha-datepicker>
 *   picker.addEventListener('change', (e) => e.detail.value);   // '2026-11-04', or null when cleared
 *
 * The <aha-input> field (tokens, three sizes, error status, disabled, label, error and info message) holding ONE
 * date, with a month calendar that opens below it. The value is an ISO `YYYY-MM-DD` string, or null when empty;
 * `valueAsDate` reads it as a UTC Date. The date can be typed (`YYYY-MM-DD`; one-digit months and days are
 * accepted) or picked: a click on the field or ArrowDown opens the calendar, a click on a day or Enter picks
 * it. Typed text that is not a real date inside `min` / `max` goes back to the last value when the field is
 * left. `input` and `change` fire on each commit that leaves a new value, with e.detail.value.
 *
 * Focus stays in the field, which is a role="combobox" over a role="grid" calendar (aria-activedescendant):
 * the arrow keys move a day or a week, PageUp / PageDown a month (Shift for a year), Home / End the start
 * or end of the week, Escape closes and restores the text. Days before `min` or after `max` are disabled.
 * Month and weekday names follow `locale` (else the nearest `lang`, else the browser); the week starts on
 * `week-start` (0 Sunday to 6 Saturday), else the locale's first day. Form-associated: `name` submits the
 * value, form reset restores the first value, a disabled fieldset disables it, and <aha-form-item> reads,
 * validates and resets it. Boolean attributes set to "false" read as off.
 */
import './icons.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DAY = 86400000;
const pad = (n, width = 2) => String(n).padStart(width, '0');
const toHalfWidth = (text) => text.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/[\uFF0D\u2010-\u2015\u2212]/g, '-');
const toIso = (time) => { const d = new Date(time); return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

/** The UTC midnight of a real calendar date written `YYYY-MM-DD`, else null. */
export function parseIsoDate(text) {
  const match = ISO.exec(toHalfWidth(String(text ?? '')).trim());
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.getTime() : null;
}
const utcDate = (year, month, day) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return date.getTime();
};
const monthStart = (time) => { const d = new Date(time); return utcDate(d.getUTCFullYear(), d.getUTCMonth(), 1); };
function addMonths(time, count) {
  const d = new Date(time);
  const target = new Date(utcDate(d.getUTCFullYear(), d.getUTCMonth() + count, 1));
  const last = new Date(utcDate(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return utcDate(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), last));
}
const FIRST = parseIsoDate('0000-01-01'), LAST = parseIsoDate('9999-12-31');
const today = () => { const now = new Date(); return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); };

function firstDayOf(locale) {
  try {
    const info = new Intl.Locale(locale);
    const week = typeof info.getWeekInfo === 'function' ? info.getWeekInfo() : info.weekInfo;
    if (week && week.firstDay) return week.firstDay % 7;
  } catch (_) { /* an unknown locale tag falls back to Monday */ }
  return 1;
}

const isOn = (host, name) => { const v = host.getAttribute(name); return v !== null && v !== 'false'; };
const supportsTopLayer = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';
const GAP = 4, EDGE = 8;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
let minted = 0;

const MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))';
const FAST = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const ENTER = 'var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; width:var(--aha-field-width,240px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .probe{ position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; visibility:hidden }
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px);
    height:40px; padding:0 var(--aha-space-8,8px) 0 var(--aha-space-12,12px); cursor:text;
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

  .end{ position:relative; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px }
  .glyph{ display:inline-flex; color:var(--aha-icon-muted,#8A8A8A); transition:opacity ${FAST} }
  aha-icon{ display:inline-flex; color:currentColor }
  .clear{ position:absolute; inset:0; display:inline-flex; align-items:center; justify-content:center; padding:0; margin:0; border:0;
    background:transparent; color:var(--aha-text-tertiary,#616161); cursor:pointer; border-radius:var(--aha-radius-sm,4px);
    opacity:0; pointer-events:none; transition:opacity ${FAST}, color ${FAST} }
  .clear:hover{ color:var(--aha-text-default,#1A1A1A) }
  :host([_clearable]) .wrap:hover .clear, :host([_clearable][_focused]) .clear{ opacity:1; pointer-events:auto }
  :host([_clearable]) .wrap:hover .glyph, :host([_clearable][_focused]) .glyph{ opacity:0 }

  .wrap:hover{ border-color:var(--aha-border-hover,#E70E68) }
  :host([_focused]) .wrap, :host([open]) .wrap{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  :host([_invalid]) .wrap{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([_invalid][_focused]) .wrap, :host([_invalid][open]) .wrap{ border-color:var(--aha-border-error,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }

  :host([_disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([_disabled]) .field{ cursor:not-allowed }
  :host([_disabled]) .glyph{ color:var(--aha-text-disabled,#B5B5B5) }

  .panel{ position:fixed; top:0; left:0; right:auto; bottom:auto; z-index:30; box-sizing:border-box; margin:0;
    width:max-content; padding:var(--aha-space-8,8px) var(--aha-space-12,12px) var(--aha-space-4,4px); color:var(--aha-text-default,#1A1A1A);
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border-secondary,#F1F1F1);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top left;
    transition:opacity ${ENTER}, transform ${ENTER}, visibility ${ENTER} }
  :host([open]) .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([_flip]) .panel{ transform-origin:bottom left; transform:translateY(4px) }
  :host([_flip][open]) .panel{ transform:translateY(0) }
  @starting-style{
    :host([open]) .panel{ opacity:0; visibility:hidden; transform:translateY(-4px) }
    :host([_flip][open]) .panel{ transform:translateY(4px) }
  }

  .head{ display:flex; align-items:center; justify-content:space-between; gap:var(--aha-space-8,8px); height:32px; margin-bottom:var(--aha-space-4,4px) }
  .title{ font-size:14px; line-height:21px; font-weight:var(--aha-weight-semibold,600); white-space:nowrap }
  .nav{ display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; margin:0; border:0;
    background:transparent; color:var(--aha-text-tertiary,#616161); cursor:pointer; border-radius:var(--aha-radius-sm,4px);
    transition:color ${FAST}, background ${FAST} }
  .nav:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  .nav:disabled{ color:var(--aha-text-disabled,#B5B5B5); background:transparent; cursor:not-allowed }

  .grid{ border-collapse:collapse; border-spacing:0 }
  .grid th{ width:36px; height:28px; padding:0; font-size:12px; line-height:18px; font-weight:var(--aha-weight-regular,400);
    color:var(--aha-text-secondary,#4A4A4A); text-align:center }
  .grid td{ width:36px; height:32px; padding:0; text-align:center }
  .day{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; width:32px; height:28px;
    font-size:14px; line-height:21px; font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A);
    border-radius:var(--aha-radius-sm,4px); cursor:pointer; user-select:none; transition:background ${FAST}, color ${FAST} }
  td:not([data-date]){ pointer-events:none }
  td:not([data-date]) .day{ visibility:hidden }
  td[aria-disabled="true"] .day{ color:var(--aha-text-disabled,#B5B5B5); background:var(--aha-bg-container-disabled,#F1F1F1); cursor:not-allowed }
  td[aria-disabled="true"] .day:hover{ color:var(--aha-text-disabled,#B5B5B5); background:var(--aha-bg-container-disabled,#F1F1F1) }
  td:not([aria-disabled="true"]) .day:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  td[data-today] .day{ box-shadow:inset 0 0 0 1px var(--aha-color-primary,#E70E68) }
  td[data-active] .day{ box-shadow:inset 0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  td[data-today][data-active] .day{ box-shadow:inset 0 0 0 1px var(--aha-color-primary,#E70E68), 0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  td[aria-selected="true"] .day, td[aria-selected="true"] .day:hover{ color:var(--aha-button-primary-text,#FFFFFF); background:var(--aha-button-primary-bg,#E70E68) }

  .foot{ display:flex; justify-content:center; padding:var(--aha-space-4,4px) 0; margin-top:var(--aha-space-4,4px); border-top:1px solid var(--aha-border-secondary,#F1F1F1) }
  .today{ padding:var(--aha-space-4,4px) var(--aha-space-8,8px); margin:0; border:0; background:transparent; cursor:pointer;
    font-family:inherit; font-size:14px; line-height:21px; color:var(--aha-text-link,#DB005B); border-radius:var(--aha-radius-sm,4px);
    transition:color ${FAST} }
  .today:hover{ color:var(--aha-text-link-hover,#DB005B); text-decoration:underline }
  .today:disabled{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaDatepicker extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'placeholder', 'disabled', 'status', 'invalid', 'size', 'allow-clear', 'label',
      'error-message', 'info-message', 'locale', 'week-start', 'previous-month-label', 'next-month-label', 'today-label',
      'clear-label', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required'];
  }
  static get formAssociated() { return true; }
  constructor() {
    super();
    // jsdom's attachInternals() has no form API (setFormValue, labels, form); treat it as unsupported
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._internals = internals && typeof internals.setFormValue === 'function' ? internals : null;
    this._formDisabled = false;
    this._uid = `aha-datepicker-${++minted}`;
  }

  get form() { return this._internals ? this._internals.form : this.closest('form'); }
  get labels() { return (this._internals && this._internals.labels) || []; }
  /** The ISO `YYYY-MM-DD` date, or null when empty or not a real date. */
  get value() { const t = parseIsoDate(this.getAttribute('value')); return t == null ? null : toIso(t); }
  set value(v) {
    if (v == null || v === '') this.removeAttribute('value'); else this.setAttribute('value', String(v));
    this._showValue();
  }
  get valueAsDate() { const t = parseIsoDate(this.getAttribute('value')); return t == null ? null : new Date(t); }
  get disabled() { return isOn(this, 'disabled') || this._formDisabled; }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { if (v) this._open(); else this._close(); }

  get _min() { return parseIsoDate(this.getAttribute('min')); }
  get _max() { return parseIsoDate(this.getAttribute('max')); }
  get _locale() {
    const scoped = this.closest('[lang]');
    const tag = this.getAttribute('locale') || (scoped && scoped.getAttribute('lang')) || (typeof navigator !== 'undefined' && navigator.language) || 'en';
    try { return Intl.getCanonicalLocales(tag)[0] || 'en'; } catch (_) { return 'en'; }
  }
  get _weekStart() {
    const n = Number(this.getAttribute('week-start'));
    return this.getAttribute('week-start') !== null && Number.isInteger(n) && n >= 0 && n <= 6 ? n : firstDayOf(this._locale);
  }

  connectedCallback() {
    upgradeProperties(this, ['value', 'disabled']);
    if (this.getAttribute('disabled') === 'false') this.removeAttribute('disabled');
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this._initialValue = this.getAttribute('value');
      this._build();
    }
    upgradeProperties(this, ['open']);
    this._onDocPointer = this._onDocPointer || ((event) => { if (this.open && !event.composedPath().includes(this)) this._close(); });
    document.addEventListener('pointerdown', this._onDocPointer, true);
    this._showValue();
    this._sync();
  }
  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    this._track(false, true);
    this.removeAttribute('open');
  }
  formResetCallback() { this.value = this._initialValue; }
  formDisabledCallback(disabled) { this._formDisabled = disabled; if (disabled) this._close(); this._sync(); }
  formStateRestoreCallback(state) { if (typeof state === 'string') this.value = state; }
  attributeChangedCallback(name, _old, next) {
    // the browser disables a form-associated element for any disabled attribute, "false" included
    if (name === 'disabled' && next === 'false') { this.removeAttribute('disabled'); return; }
    if (!this.shadowRoot) return;
    if (name === 'value') this._showValue();
    if (name === 'disabled' && this.disabled) this._close();
    this._sync();
    if (this.open && ['value', 'min', 'max', 'locale', 'week-start', 'previous-month-label', 'next-month-label', 'today-label'].includes(name)) this._renderMonth();
  }

  _build() {
    const grid = `${this._uid}-grid`, title = `${this._uid}-title`;
    const rows = Array.from({ length: 6 }, () => `<tr>${'<td role="gridcell"><span class="day" part="day"></span></td>'.repeat(7)}</tr>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<label class="label" part="label" for="field" hidden></label>` +
      `<div class="wrap" part="wrap">` +
        `<input class="field" id="field" part="field" type="text" role="combobox" aria-haspopup="grid" aria-expanded="false" aria-controls="${grid}" autocomplete="off" spellcheck="false"/>` +
        `<span class="end">` +
          `<span class="glyph" part="icon" aria-hidden="true"><aha-icon name="system-calendar-dot" size="16"></aha-icon></span>` +
          `<button class="clear" part="clear" type="button" tabindex="-1" aria-label="Clear date"><aha-icon name="system-x-circle" size="16" aria-hidden="true"></aha-icon></button>` +
        `</span>` +
      `</div>` +
      `<span class="probe" aria-hidden="true"></span>` +
      `<div class="panel" part="panel"${supportsTopLayer ? ' popover="manual"' : ''}>` +
        `<div class="head" part="panel-head">` +
          `<button class="nav prev" part="nav" type="button" tabindex="-1" aria-label="Previous month"><aha-icon name="system-caret-left" size="16" aria-hidden="true"></aha-icon></button>` +
          `<span class="title" id="${title}" aria-live="polite"></span>` +
          `<button class="nav next" part="nav" type="button" tabindex="-1" aria-label="Next month"><aha-icon name="system-caret-right" size="16" aria-hidden="true"></aha-icon></button>` +
        `</div>` +
        `<table class="grid" part="grid" id="${grid}" role="grid" aria-labelledby="${title}"><thead><tr>${'<th scope="col"></th>'.repeat(7)}</tr></thead><tbody>${rows}</tbody></table>` +
        `<div class="foot" part="panel-foot"><button class="today" part="today" type="button" tabindex="-1"></button></div>` +
      `</div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    const root = this.shadowRoot;
    const f = this._field = root.querySelector('.field');
    this._parts = {
      label: root.querySelector('.label'), wrap: root.querySelector('.wrap'), clear: root.querySelector('.clear'),
      panel: root.querySelector('.panel'), title: root.querySelector('.title'), prev: root.querySelector('.prev'),
      next: root.querySelector('.next'), today: root.querySelector('.today'), probe: root.querySelector('.probe'),
      heads: [...root.querySelectorAll('th')], cells: [...root.querySelectorAll('td')],
    };
    f.addEventListener('input', (event) => { event.stopPropagation(); this._edited = true; this._typed(); });
    f.addEventListener('change', (event) => event.stopPropagation());
    f.addEventListener('focus', () => { this.setAttribute('_focused', ''); this._syncName(); syncFieldError(this, f); });
    f.addEventListener('blur', () => { this.removeAttribute('_focused'); this._close(); this._commitText(); });
    f.addEventListener('keydown', (event) => this._key(event));
    this._parts.wrap.addEventListener('mousedown', (event) => {
      if (this.disabled || event.composedPath().includes(this._parts.clear)) return;
      if (event.target !== f) event.preventDefault();
      f.focus();
      if (this.open) this._close(); else this._open();
    });
    const keepFocus = (node) => node.addEventListener('mousedown', (event) => event.preventDefault());
    for (const node of [this._parts.clear, this._parts.panel]) keepFocus(node);
    this._parts.clear.addEventListener('click', () => { if (this.disabled) return; this._commit(null); this._showValue(); this._close(); f.focus(); });
    this._parts.prev.addEventListener('click', () => this._navigate(addMonths(this._active, -1)));
    this._parts.next.addEventListener('click', () => this._navigate(addMonths(this._active, 1)));
    this._parts.today.addEventListener('click', () => { const t = today(); if (this._allowed(t)) this._pick(t); });
    this._parts.panel.addEventListener('click', (event) => {
      const cell = event.composedPath().find((node) => node.localName === 'td');
      if (!cell || !cell.dataset.date || cell.getAttribute('aria-disabled') === 'true') return;
      this._pick(Number(cell.dataset.date));
    });
  }

  _allowed(time) {
    const min = this._min, max = this._max;
    return !(min != null && time < min) && !(max != null && time > max);
  }
  _showValue() { if (this._field) { this._field.value = this.value || ''; this._edited = false; } }
  _emit(type, value) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { value } })); }
  _commit(value) {
    if (value === this.value) return;
    this.value = value;
    this._emit('input', value);
    this._emit('change', value);
  }
  _commitText() {
    const text = this._field.value.trim();
    if (!text) this._commit(null);
    else {
      const time = parseIsoDate(text);
      if (time != null && this._allowed(time)) this._commit(toIso(time));
    }
    this._showValue();
  }
  _pick(time) {
    this._commit(toIso(time));
    this._showValue();
    this._close();
  }
  _typed() {
    const time = parseIsoDate(this._field.value);
    if (time != null && this.open) this._moveActive(time);
  }

  _key(event) {
    // 229 is the keydown Safari sends for the Enter that ends an IME composition
    if (event.isComposing || event.keyCode === 229 || this.disabled) return;
    const key = event.key;
    if (!this.open) {
      if (key === 'ArrowDown') { event.preventDefault(); this._open(); }
      else if (key === 'Enter') this._commitText();
      return;
    }
    if (key === 'ArrowUp' && event.altKey) { event.preventDefault(); this._close(); return; }
    const a = this._active;
    const weekday = (new Date(a).getUTCDay() - this._weekStart + 7) % 7;
    const moves = {
      ArrowLeft: () => a - DAY, ArrowRight: () => a + DAY, ArrowUp: () => a - 7 * DAY, ArrowDown: () => a + 7 * DAY,
      Home: () => a - weekday * DAY, End: () => a + (6 - weekday) * DAY,
      PageUp: () => addMonths(a, event.shiftKey ? -12 : -1), PageDown: () => addMonths(a, event.shiftKey ? 12 : 1),
    };
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
      if (event.altKey || event.ctrlKey || event.metaKey || (key !== 'Home' && key !== 'End' && event.shiftKey)) return;
    }
    if (moves[key]) { event.preventDefault(); this._navigate(moves[key]()); return; }
    if (key === 'Enter') {
      event.preventDefault();
      if (this._edited) { this._commitText(); this._close(); return; }
      if (this._allowed(a)) this._pick(a);
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this._close();
      this._showValue();
    } else if (key === 'Tab') this._close();
  }

  _open() {
    if (this.open || this.disabled || !this.shadowRoot) return;
    const typed = parseIsoDate(this._field.value);
    const start = typed ?? parseIsoDate(this.getAttribute('value')) ?? today();
    const min = this._min, max = this._max;
    this._active = min != null && start < min ? min : (max != null && start > max ? max : start);
    this._edited = false;
    this.setAttribute('open', '');
    this._field.setAttribute('aria-expanded', 'true');
    this._renderMonth();
    const panel = this._parts.panel;
    clearTimeout(this._hideTimer);
    if (panel.hasAttribute('popover') && panel.isConnected && !panel.matches(':popover-open')) panel.showPopover();
    this._track(true);
  }
  _close() {
    if (!this.open) return;
    this.removeAttribute('open');
    this._field.setAttribute('aria-expanded', 'false');
    this._field.removeAttribute('aria-activedescendant');
    this._track(false);
  }
  _navigate(time) { this._edited = false; this._moveActive(time); }
  _moveActive(time) {
    const min = this._min ?? FIRST, max = this._max ?? LAST;
    this._active = clamp(time, min, max);
    this._renderMonth();
  }
  _renderMonth() {
    const p = this._parts;
    if (!p || this._active == null) return;
    const locale = this._locale, start = this._weekStart;
    const first = monthStart(this._active);
    const firstDate = new Date(first);
    const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC', calendar: 'gregory' });
    const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC', calendar: 'gregory' });
    const dayFull = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC', calendar: 'gregory' });
    const cellName = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC', calendar: 'gregory' });
    p.title.textContent = monthTitle.format(firstDate);
    const sunday = Date.UTC(2023, 0, 1);
    p.heads.forEach((th, i) => {
      const day = sunday + ((start + i) % 7) * DAY;
      th.textContent = dayName.format(day);
      th.setAttribute('abbr', dayFull.format(day));
    });
    const lead = (firstDate.getUTCDay() - start + 7) % 7;
    const days = new Date(utcDate(firstDate.getUTCFullYear(), firstDate.getUTCMonth() + 1, 0)).getUTCDate();
    const selected = parseIsoDate(this.getAttribute('value')), now = today();
    let activeId = '';
    p.cells.forEach((td, i) => {
      const n = i - lead + 1;
      for (const attr of ['data-date', 'data-today', 'data-active', 'aria-selected', 'aria-disabled', 'aria-label', 'id', 'aria-current']) td.removeAttribute(attr);
      const day = td.firstElementChild;
      if (n < 1 || n > days) { day.textContent = ''; td.removeAttribute('role'); return; }
      td.setAttribute('role', 'gridcell');
      const time = first + (n - 1) * DAY;
      td.dataset.date = String(time);
      td.id = `${this._uid}-${toIso(time)}`;
      day.textContent = String(n);
      td.setAttribute('aria-label', cellName.format(time));
      td.setAttribute('aria-selected', String(time === selected));
      if (!this._allowed(time)) td.setAttribute('aria-disabled', 'true');
      if (time === now) { td.dataset.today = ''; td.setAttribute('aria-current', 'date'); }
      if (time === this._active) { td.dataset.active = ''; activeId = td.id; }
    });
    p.cells.slice(35).forEach((td) => { td.parentElement.hidden = lead + days <= 35; });
    if (activeId && this.open) this._field.setAttribute('aria-activedescendant', activeId);
    const min = this._min, max = this._max;
    p.prev.disabled = min != null && first <= monthStart(min);
    p.next.disabled = max != null && first >= monthStart(max);
    p.prev.setAttribute('aria-label', this.getAttribute('previous-month-label') || 'Previous month');
    p.next.setAttribute('aria-label', this.getAttribute('next-month-label') || 'Next month');
    p.today.textContent = this.getAttribute('today-label') || 'Today';
    p.today.disabled = !this._allowed(now);
    if (this._tracking) this._schedulePlace();
  }

  _track(on, immediately) {
    const panel = this._parts && this._parts.panel;
    if (on && !this._tracking) {
      this._tracking = true;
      this._schedulePlace = this._schedulePlace || (() => {
        if (this._placeFrame) return;
        this._placeFrame = requestAnimationFrame(() => { this._placeFrame = 0; this._place(); });
      });
      window.addEventListener('resize', this._schedulePlace);
      window.addEventListener('scroll', this._schedulePlace, true);
      this._place();
    } else if (!on && this._tracking) {
      this._tracking = false;
      window.removeEventListener('resize', this._schedulePlace);
      window.removeEventListener('scroll', this._schedulePlace, true);
      cancelAnimationFrame(this._placeFrame);
      this._placeFrame = 0;
      if (!panel || !panel.hasAttribute('popover')) return;
      // stays in the top layer until the exit fade ends, or the panel would vanish mid-transition
      const hide = () => { this._hideTimer = 0; if (!this.open && panel.matches(':popover-open')) panel.hidePopover(); };
      clearTimeout(this._hideTimer);
      const fadeSeconds = parseFloat(getComputedStyle(panel).transitionDuration) || 0;
      if (immediately || !fadeSeconds) hide(); else this._hideTimer = setTimeout(hide, fadeSeconds * 1000 + 50);
    }
  }
  // Without the Popover API a transformed ancestor becomes the fixed containing block; the probe cancels its offset.
  _place() {
    const { panel, wrap, probe } = this._parts || {};
    if (!panel || !this._tracking) return;
    const anchor = wrap.getBoundingClientRect();
    const width = panel.offsetWidth, height = panel.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
    const below = viewportHeight - anchor.bottom - GAP - EDGE, above = anchor.top - GAP - EDGE;
    const onTop = height > below && above > below;
    const top = clamp(onTop ? anchor.top - GAP - height : anchor.bottom + GAP, EDGE, Math.max(EDGE, viewportHeight - height - EDGE));
    const left = clamp(anchor.left, EDGE, Math.max(EDGE, viewportWidth - width - EDGE));
    const origin = panel.hasAttribute('popover') && panel.matches(':popover-open') ? { top: 0, left: 0 } : probe.getBoundingClientRect();
    panel.style.top = `${top - origin.top}px`;
    panel.style.left = `${left - origin.left}px`;
    this.toggleAttribute('_flip', onTop);
  }

  _sync() {
    const f = this._field;
    if (!f) return;
    const disabled = this.disabled, invalid = isInvalid(this);
    const value = this.value;
    this.toggleAttribute('_disabled', disabled);
    this.toggleAttribute('_invalid', invalid);
    this.toggleAttribute('_clearable', !disabled && !!value && this.getAttribute('allow-clear') !== 'false');
    f.disabled = disabled;
    f.placeholder = this.getAttribute('placeholder') ?? 'YYYY-MM-DD';
    if (invalid) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    const required = this.getAttribute('aria-required');
    if (required) f.setAttribute('aria-required', required); else f.removeAttribute('aria-required');
    const { label, clear } = this._parts;
    label.textContent = this.getAttribute('label') || '';
    label.hidden = !label.textContent;
    clear.setAttribute('aria-label', this.getAttribute('clear-label') || 'Clear date');
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

export function defineAhaDatepicker(tag = 'aha-datepicker') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDatepicker);
  return true;
}
if (typeof window !== 'undefined') defineAhaDatepicker();

export default { AhaDatepicker, defineAhaDatepicker };
