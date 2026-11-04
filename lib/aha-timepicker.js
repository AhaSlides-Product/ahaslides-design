/**
 * @ahaslides-product/design/aha-timepicker — the shared 24-hour time field (antd TimePicker, framework-free).
 *
 *   import '@ahaslides-product/design/aha-timepicker';   // registers <aha-timepicker>
 *   <aha-timepicker value="09:30" aria-label="Deadline time"></aha-timepicker>
 *   picker.addEventListener('change', (e) => e.detail.value);   // '09:30', or null when cleared
 *
 * The <aha-datepicker> field (tokens, three sizes, error status, disabled, label, error and info message)
 * holding ONE time, with an hour column and a minute column that open below it. The value is a 24-hour `HH:mm`
 * string, or null when empty; seconds in a value are dropped. The time can be typed (`9:30`, `09.30` and `0930` are accepted too) or picked: a
 * click on the field or ArrowDown opens the columns, and a click on a row commits at once, so there is no OK
 * button. An hour leaves the columns open for the minute; a minute closes them. Typed text that is not a real
 * time goes back to the last value when the field is left, and so does an emptied field under
 * allow-clear="false". `input` and `change` fire on each commit that leaves a new value, with e.detail.value.
 *
 * Focus stays in the field, which is a role="combobox" over two role="listbox" columns
 * (aria-activedescendant): ArrowUp / ArrowDown move a row, wrapping round the clock, ArrowLeft / ArrowRight
 * change column, Home / End go to the first or last row, PageUp / PageDown move five rows, Enter commits and
 * Escape closes and restores the text. Hours sit left of minutes in every direction, as a time reads.
 * Form-associated: `name` submits the value, form reset restores the first value, a disabled fieldset disables
 * it, and <aha-form-item> reads, validates and resets it. Boolean attributes set to "false" read as off.
 */
import './icons.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const TIME = /^(\d{1,2})[:.]?(\d{2})(?:[:.](\d{2}))?$/;
const pad = (n) => String(n).padStart(2, '0');
const toAsciiTime = (text) => text
  .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
  .replace(/[٠-٩]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x630))
  .replace(/[۰-۹]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x6C0))
  .replace(/：/g, ':');

/** Minutes since midnight of a real 24-hour time, else null. */
export function parseTime(text) {
  const match = TIME.exec(toAsciiTime(String(text ?? '')).trim());
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour < 24 && minute < 60 && Number(match[3] ?? 0) < 60 ? hour * 60 + minute : null;
}
const toRows = (time) => [Math.floor(time / 60), time % 60];
const formatTime = (hour, minute) => `${pad(hour)}:${pad(minute)}`;

const isOn = (host, name) => { const v = host.getAttribute(name); return v !== null && v !== 'false'; };
const supportsTopLayer = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';
const GAP = 4, EDGE = 8, PAGE = 5;
const COLUMNS = [24, 60];
const HOUR = 0, MINUTE = 1;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))';
const FAST = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const ENTER = 'var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; box-sizing:border-box; width:var(--aha-field-width,240px); max-width:100%; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .probe{ position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; visibility:hidden }
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px);
    height:40px; padding-inline:var(--aha-space-12,12px) var(--aha-space-8,8px); cursor:text;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:background ${MOTION}, border-color ${MOTION}, box-shadow ${MOTION} }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:32px; padding-inline:var(--aha-space-8,8px); gap:var(--aha-space-6,6px) }
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
  .clear{ position:absolute; inset:-2px; display:inline-flex; align-items:center; justify-content:center; padding:0; margin:0; border:0;
    background:transparent; color:var(--aha-text-tertiary,#616161); cursor:pointer; border-radius:var(--aha-radius-sm,4px);
    opacity:0; pointer-events:none; transition:opacity ${FAST}, color ${FAST} }
  :host([_clearable][_focused]) .clear{ opacity:1; pointer-events:auto }
  :host([_clearable][_focused]) .glyph{ opacity:0 }

  :host([_focused]) .wrap, :host([open]) .wrap{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  :host([_invalid]) .wrap{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([_invalid][_focused]) .wrap, :host([_invalid][open]) .wrap{ border-color:var(--aha-border-error,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }

  :host([_disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([_disabled]) .field{ cursor:not-allowed }
  :host([_disabled]) .glyph{ color:var(--aha-text-disabled,#B5B5B5) }

  .panel{ position:fixed; top:0; left:0; right:auto; bottom:auto; z-index:30; box-sizing:border-box; margin:0;
    width:max-content; padding:var(--aha-space-4,4px); color:var(--aha-text-default,#1A1A1A);
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border-secondary,#F1F1F1);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top center;
    transition:opacity ${ENTER}, transform ${ENTER}, visibility ${ENTER} }
  :host([open]) .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([_flip]) .panel{ transform-origin:bottom center; transform:translateY(4px) }
  :host([_flip][open]) .panel{ transform:translateY(0) }
  @starting-style{
    :host([open]) .panel{ opacity:0; visibility:hidden; transform:translateY(-4px) }
    :host([_flip][open]) .panel{ transform:translateY(4px) }
  }

  .columns{ display:flex; gap:var(--aha-space-4,4px) }
  .list{ position:relative; box-sizing:border-box; width:64px; height:210px; max-height:calc(100dvh - 2 * var(--aha-space-16,16px));
    overflow-y:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--aha-border-default,#E3E3E3) transparent; outline:none }
  .list + .list{ border-inline-start:1px solid var(--aha-border-secondary,#F1F1F1); padding-inline-start:var(--aha-space-4,4px); width:69px }
  .option{ box-sizing:border-box; display:flex; align-items:center; justify-content:center; width:48px; height:28px;
    font-size:14px; line-height:21px; font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A);
    border-radius:var(--aha-radius-sm,4px); cursor:pointer; user-select:none; transition:background ${FAST}, color ${FAST}, box-shadow ${FAST} }
  .option[data-cursor]{ background:var(--aha-bg-hover,#F7F7F7) }
  .option[aria-selected="true"]{ color:var(--aha-button-primary-text,#FFFFFF); background:var(--aha-button-primary-bg,#E70E68) }
  :host([_keys]) .option[data-active]{ box-shadow:inset 0 0 0 2px var(--aha-color-primary,#E70E68) }
  :host([_keys]) .option[data-active][aria-selected="true"]{ box-shadow:inset 0 0 0 2px var(--aha-button-primary-text,#FFFFFF) }

  @media (hover:hover){
    .wrap:hover{ border-color:var(--aha-border-hover,#E70E68) }
    .clear:hover{ color:var(--aha-text-default,#1A1A1A) }
    :host([_clearable]) .wrap:hover .clear{ opacity:1; pointer-events:auto }
    :host([_clearable]) .wrap:hover .glyph{ opacity:0 }
    .option:hover{ background:var(--aha-bg-hover,#F7F7F7) }
    .option[aria-selected="true"]:hover{ background:var(--aha-button-primary-bg,#E70E68) }
  }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaTimepicker extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'disabled', 'status', 'invalid', 'size', 'allow-clear', 'label',
      'error-message', 'info-message', 'hour-label', 'minute-label', 'clear-label',
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required'];
  }
  static get formAssociated() { return true; }
  constructor() {
    super();
    // jsdom's attachInternals() has no form API (setFormValue, labels, form); treat it as unsupported
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._internals = internals && typeof internals.setFormValue === 'function' ? internals : null;
    this._formDisabled = false;
    this._cursor = [0, 0];
    this._column = HOUR;
  }

  get form() { return this._internals ? this._internals.form : this.closest('form'); }
  get labels() { return (this._internals && this._internals.labels) || []; }
  /** The 24-hour `HH:mm` time, or null when empty or not a real time. */
  get value() {
    const time = parseTime(this.getAttribute('value'));
    return time == null ? null : formatTime(...toRows(time));
  }
  set value(v) {
    if (v == null || v === '') this.removeAttribute('value'); else this.setAttribute('value', String(v));
    this._showValue();
  }
  get disabled() { return isOn(this, 'disabled') || this._formDisabled; }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { if (v) this._open(); else this._close(); }

  connectedCallback() {
    upgradeProperties(this, ['value', 'disabled']);
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
    if (this.open && !this._tracking) { this.removeAttribute('open'); this._open(); }
  }
  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    this._close();
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
    if (this.open && name === 'value') {
      const time = parseTime(next);
      if (time != null) this._cursor = toRows(time);
      this._renderColumns();
    }
  }

  _build() {
    const ids = ['hours', 'minutes'];
    const column = (index, count) => `<div class="list" part="column" id="${ids[index]}" role="listbox" tabindex="-1">` +
      Array.from({ length: count }, (_, i) => `<div class="option" part="option" role="option" id="${ids[index]}-${i}" data-column="${index}" data-index="${i}">${pad(i)}</div>`).join('') +
      `</div>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<label class="label" part="label" for="field" hidden></label>` +
      `<div class="wrap" part="wrap">` +
        `<input class="field" id="field" part="field" type="text" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${ids.join(' ')}" autocomplete="off" spellcheck="false"/>` +
        `<span class="end">` +
          `<span class="glyph" part="icon" aria-hidden="true"><aha-icon name="system-clock" size="16"></aha-icon></span>` +
          `<button class="clear" part="clear" type="button" tabindex="-1" aria-label="Clear time"><aha-icon name="system-x-circle" size="16" aria-hidden="true"></aha-icon></button>` +
        `</span>` +
      `</div>` +
      `<span class="probe" aria-hidden="true"></span>` +
      `<div class="panel" part="panel"${supportsTopLayer ? ' popover="manual"' : ''}>` +
        `<div class="columns" dir="ltr">${COLUMNS.map((count, index) => column(index, count)).join('')}</div>` +
      `</div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    const root = this.shadowRoot;
    const f = this._field = root.querySelector('.field');
    const lists = [...root.querySelectorAll('.list')];
    this._parts = {
      label: root.querySelector('.label'), wrap: root.querySelector('.wrap'), clear: root.querySelector('.clear'),
      panel: root.querySelector('.panel'), probe: root.querySelector('.probe'),
      lists, options: lists.map((list) => [...list.children]),
    };
    f.addEventListener('input', (event) => { event.stopPropagation(); this._edited = true; this._typed(); });
    f.addEventListener('change', (event) => event.stopPropagation());
    f.addEventListener('focus', () => { this.setAttribute('_focused', ''); this._syncName(); syncFieldError(this, f); });
    f.addEventListener('blur', () => { this.removeAttribute('_focused'); this._close(); this._commitText(); });
    f.addEventListener('keydown', (event) => this._key(event));
    this._parts.wrap.addEventListener('mousedown', (event) => {
      if (event.button || this.disabled || event.composedPath().includes(this._parts.clear)) return;
      if (event.target !== f) event.preventDefault();
      f.focus();
      if (this.open) this._close(); else this._open();
    });
    const keepFocus = (node) => node.addEventListener('mousedown', (event) => event.preventDefault());
    for (const node of [this._parts.clear, this._parts.panel]) keepFocus(node);
    this._parts.clear.addEventListener('click', () => { if (this.disabled) return; this._commit(null); this._close(); f.focus(); });
    this._parts.panel.addEventListener('click', (event) => {
      const option = event.target.closest('.option');
      if (option) this._pickRow(Number(option.dataset.column), Number(option.dataset.index));
    });
  }

  get _allowClear() { return this.getAttribute('allow-clear') !== 'false'; }
  _showValue() { if (this._field) { this._field.value = this.value || ''; this._edited = false; } }
  _emit(type, value) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { value } })); }
  _commit(value) {
    if (value !== this.value) {
      this.value = value;
      this._emit('input', value);
      this._emit('change', value);
    }
    this._showValue();
  }
  _commitText() {
    const text = this._field.value.trim(), time = parseTime(text);
    if (time != null) this._commit(formatTime(...toRows(time)));
    else if (!text && this._allowClear) this._commit(null);
    else this._showValue();
  }
  _pickRow(column, index) {
    this.removeAttribute('_keys');
    this._cursor[column] = index;
    this._commit(formatTime(...this._cursor));
    if (column === MINUTE) { this._close(); return; }
    this._column = MINUTE;
    this._renderColumns();
  }
  _typed() {
    const time = parseTime(this._field.value);
    if (time == null || !this.open) return;
    this._cursor = toRows(time);
    this._renderColumns();
  }

  _key(event) {
    // 229 is the keydown Safari sends for the Enter that ends an IME composition
    if (event.isComposing || event.keyCode === 229 || this.disabled) return;
    const key = event.key;
    if (!this.open) {
      if (key === 'ArrowDown') { event.preventDefault(); this.setAttribute('_keys', ''); this._open(); }
      else if (key === 'Enter') this._commitText();
      else if (key === 'Escape') this._showValue();
      return;
    }
    if (key === 'ArrowUp' && event.altKey) { event.preventDefault(); this._close(); return; }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (this._edited || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      this._edited = false;
      this.setAttribute('_keys', '');
      this._column = key === 'ArrowLeft' ? HOUR : MINUTE;
      this._renderColumns();
      return;
    }
    const count = COLUMNS[this._column], at = this._cursor[this._column];
    const moves = {
      ArrowUp: () => (at - 1 + count) % count, ArrowDown: () => (at + 1) % count,
      Home: () => 0, End: () => count - 1,
      PageUp: () => Math.max(at - PAGE, 0), PageDown: () => Math.min(at + PAGE, count - 1),
    };
    if (moves[key]) {
      if ((key === 'Home' || key === 'End') && (this._edited || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      this._edited = false;
      this.setAttribute('_keys', '');
      this._cursor[this._column] = moves[key]();
      this._renderColumns();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      if (this._edited || !this.hasAttribute('_keys')) this._commitText();
      else this._commit(formatTime(...this._cursor));
      this._close();
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this._close();
      this._showValue();
    } else if (key === 'Tab') this._close();
  }

  _open() {
    if (this.open || this.disabled || !this.shadowRoot) return;
    const time = parseTime(this._field.value) ?? parseTime(this.getAttribute('value')) ?? 0;
    this._cursor = toRows(time);
    this._column = HOUR;
    this._edited = false;
    this.setAttribute('open', '');
    this._field.setAttribute('aria-expanded', 'true');
    const panel = this._parts.panel;
    clearTimeout(this._hideTimer);
    if (panel.hasAttribute('popover') && panel.isConnected && !panel.matches(':popover-open')) panel.showPopover();
    this._track(true);
    this._renderColumns(true);
  }
  _close() {
    this.removeAttribute('open');
    if (!this._tracking) return;
    this.removeAttribute('_keys');
    this._field.setAttribute('aria-expanded', 'false');
    this._field.removeAttribute('aria-activedescendant');
    this._track(false);
  }
  _renderColumns(centre) {
    const { lists, options } = this._parts;
    const selected = (parseTime(this.getAttribute('value')) ?? -1);
    const picked = selected < 0 ? [-1, -1] : [Math.floor(selected / 60), selected % 60];
    const names = [this.getAttribute('hour-label') || 'Hour', this.getAttribute('minute-label') || 'Minute'];
    options.forEach((rows, column) => {
      lists[column].setAttribute('aria-label', names[column]);
      rows.forEach((row, index) => {
        const cursor = index === this._cursor[column], active = cursor && column === this._column;
        row.setAttribute('aria-label', `${names[column]} ${pad(index)}`);
        row.setAttribute('aria-selected', String(index === picked[column]));
        row.toggleAttribute('data-cursor', cursor);
        row.toggleAttribute('data-active', active);
        if (active && this.open) this._field.setAttribute('aria-activedescendant', row.id);
      });
      this._reveal(lists[column], rows[this._cursor[column]], centre);
    });
  }
  // scrollTop, not scrollIntoView: scrollIntoView would also scroll the page behind a popover
  _reveal(list, row, centre) {
    const top = row.offsetTop, bottom = top + row.offsetHeight;
    if (centre) list.scrollTop = top - (list.clientHeight - row.offsetHeight) / 2;
    else if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  _track(on) {
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
      if (!fadeSeconds) hide(); else this._hideTimer = setTimeout(hide, fadeSeconds * 1000 + 50);
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
    const start = getComputedStyle(this).direction === 'rtl' ? anchor.right - width : anchor.left;
    const left = clamp(start, EDGE, Math.max(EDGE, viewportWidth - width - EDGE));
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
    this.toggleAttribute('_clearable', !disabled && !!value && this._allowClear);
    f.disabled = disabled;
    f.placeholder = this.getAttribute('placeholder') ?? 'HH:MM';
    if (invalid) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    const required = this.getAttribute('aria-required');
    if (required) f.setAttribute('aria-required', required); else f.removeAttribute('aria-required');
    const { label, clear } = this._parts;
    label.textContent = this.getAttribute('label') || '';
    label.hidden = !label.textContent;
    clear.setAttribute('aria-label', this.getAttribute('clear-label') || 'Clear time');
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

export function defineAhaTimepicker(tag = 'aha-timepicker') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTimepicker);
  return true;
}
if (typeof window !== 'undefined') defineAhaTimepicker();

export default { AhaTimepicker, defineAhaTimepicker };
