/**
 * @ahaslides-product/design/aha-audience-date — a date answer on the audience phone: day, month and year fields.
 *
 *   import '@ahaslides-product/design/aha-audience-date';   // registers <aha-audience-date>
 *   <aha-audience-date group-label="When did you join?" format="DMY" lock-key="slide-42"></aha-audience-date>
 *   date.addEventListener('change', (e) => e.detail);   // { value: '2026-11-02', valid: true }
 *
 * Three <aha-counted-input> fields (numeric keypad, autofill hints) in the order `format` names
 * (DMY, MDY or YMD), with `separator` between them. Typing a full day or month moves to the next
 * field. The value is ISO `YYYY-MM-DD`, or an empty string until all three make a real date. When
 * the participant leaves the group with a part-filled or impossible date, `error-message` shows under
 * it in <aha-field-error variant="respondent">, in the default ink. `disabled` or a locked `lock-key`
 * disables the fields and restores the submitted value. Pass translated `day-label`, `month-label`
 * and `year-label` (the fields' accessible names) and placeholders.
 */
import './aha-counted-input.js';
import './aha-field-error.js';
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';
import { upgradeProperties } from './upgrade-properties.js';

const STYLE = DECK_STYLE + `
  :host{ display:block; width:100% }
  .date{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px) }
  .parts{ display:flex; align-items:center; gap:var(--aha-space-8, 8px); min-width:0 }
  .part{ flex:2 1 0; min-width:0 }
  .part[data-part="year"]{ flex:3 1 0 }
  .separator{ flex:none; font-size:16px; line-height:24px; color:var(--_ink-secondary) }
  aha-field-error[hidden]{ display:none }
`;

const PARTS = {
  day: { length: 2, autocomplete: 'bday-day', label: 'Day', placeholder: 'DD' },
  month: { length: 2, autocomplete: 'bday-month', label: 'Month', placeholder: 'MM' },
  year: { length: 4, autocomplete: 'bday-year', label: 'Year', placeholder: 'YYYY' },
};
const ORDERS = { DMY: ['day', 'month', 'year'], MDY: ['month', 'day', 'year'], YMD: ['year', 'month', 'day'] };

/** `YYYY-MM-DD` for a real calendar date, else ''. */
export function isoDate(year, month, day) {
  const y = Number(year), m = Number(month), d = Number(day);
  if (!/^\d{4}$/.test(String(year)) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) return '';
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export class AhaAudienceDate extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'format', 'separator', 'value', 'group-label', 'day-label', 'month-label', 'year-label',
      'day-placeholder', 'month-placeholder', 'year-placeholder', 'error-message', 'disabled', 'lock-key'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <div class="date" part="date" role="group">
        <div class="parts" part="parts"></div>
        <aha-field-error variant="respondent" hidden></aha-field-error>
      </div>`));
    this._group = this.shadowRoot.querySelector('.date');
    this._partsRow = this.shadowRoot.querySelector('.parts');
    this._error = this.shadowRoot.querySelector('aha-field-error');
    this._fields = {};
    for (const name of Object.keys(PARTS)) {
      const field = document.createElement('aha-counted-input');
      field.className = 'part';
      field.dataset.part = name;
      field.setAttribute('part', `field ${name}`);
      field.setAttribute('size', 'large');
      field.setAttribute('maxlength', 'none');
      field.setAttribute('inputmode', 'numeric');
      field.setAttribute('autocomplete', PARTS[name].autocomplete);
      this._fields[name] = field;
    }
    this._partsRow.addEventListener('input', (event) => this._onInput(event));
    this._partsRow.addEventListener('change', (event) => { if (event.target !== this) event.stopPropagation(); });
    this._group.addEventListener('focusout', (event) => {
      if (!this._group.contains(event.relatedTarget) && !this.shadowRoot.contains(event.relatedTarget)) { this._touched = true; this._syncError(); }
    });
    this._builtOrder = '';
    this._lockedRecord = null;
    this._touched = false;
  }
  connectedCallback() {
    upgradeProperties(this, ['value']);
    super.connectedCallback();
    this._arrange();
    this._sync();
    this._watchLock();
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record && typeof record.value === 'string') this._fillFrom(record.value);
      this._sync();
    });
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    if (name === 'value' && next !== this.value) this._fillFrom(next);
    if (name === 'format' || name === 'separator') this._arrange();
    this._sync();
  }

  get order() { return ORDERS[(this.getAttribute('format') || '').toUpperCase()] || ORDERS.DMY; }
  /** ISO `YYYY-MM-DD`, or '' until the three fields make a real date. */
  get value() { return isoDate(this._fields.year.value, this._fields.month.value, this._fields.day.value); }
  set value(next) { this._fillFrom(next); this._sync(); }
  get valid() { return this.value !== ''; }
  get locked() { return !!this._lockedRecord; }

  _fillFrom(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    this._fields.year.value = match ? match[1] : '';
    this._fields.month.value = match ? match[2] : '';
    this._fields.day.value = match ? match[3] : '';
  }
  _arrange() {
    const key = `${this.order.join()}|${this.getAttribute('separator') ?? '/'}`;
    if (key === this._builtOrder) return;
    this._builtOrder = key;
    const nodes = [];
    this.order.forEach((name, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = this.getAttribute('separator') ?? '/';
        nodes.push(separator);
      }
      nodes.push(this._fields[name]);
    });
    this._partsRow.replaceChildren(...nodes);
  }
  _onInput(event) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent)) return;
    const field = event.target;
    const name = field?.dataset?.part;
    if (!name) return;
    const digits = String(event.detail?.value ?? field.value).replace(/\D/g, '').slice(0, PARTS[name].length);
    if (digits !== field.value) field.value = digits;
    if (digits.length === PARTS[name].length) {
      const next = this.order[this.order.indexOf(name) + 1];
      if (next) this._fields[next].shadowRoot?.querySelector('.field')?.focus();
    }
    this._syncError();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value, valid: this.valid } }));
  }
  _syncError() {
    const typed = Object.values(this._fields).some((field) => field.value);
    const show = this._touched && typed && !this.valid && !this.locked;
    this._error.setAttribute('message', this.getAttribute('error-message') || 'Enter a real date');
    this._error.hidden = !show;
    for (const field of Object.values(this._fields)) {
      if (show) field.setAttribute('status', 'error'); else field.removeAttribute('status');
    }
  }
  _sync() {
    this._group.setAttribute('aria-label', this.getAttribute('group-label') || this.getAttribute('aria-label') || 'Date');
    const closed = this.locked || this.hasAttribute('disabled');
    for (const [name, field] of Object.entries(this._fields)) {
      field.setAttribute('aria-label', this.getAttribute(`${name}-label`) || PARTS[name].label);
      field.setAttribute('placeholder', this.getAttribute(`${name}-placeholder`) || PARTS[name].placeholder);
      field.toggleAttribute('disabled', closed);
    }
    this._syncError();
  }
}

export function defineAhaAudienceDate(tag = 'aha-audience-date') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceDate);
}
if (typeof window !== 'undefined') defineAhaAudienceDate();
export default { AhaAudienceDate, defineAhaAudienceDate, isoDate };
