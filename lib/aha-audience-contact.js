/**
 * @ahaslides-product/design/aha-audience-contact — a contact-details answer on the audience phone: name, email, phone and free-text fields.
 *
 *   import '@ahaslides-product/design/aha-audience-contact';   // registers <aha-audience-contact>
 *   <aha-audience-contact group-label="How can we reach you?" lock-key="slide-42"
 *     fields='[{"id":"name","kind":"name","label":"Name","required":true},{"id":"email","kind":"email","label":"Email","required":true}]'></aha-audience-contact>
 *   contact.addEventListener('change', (e) => e.detail);   // { value: { name: 'Mai', email: 'mai@example.com' }, valid: true }
 *
 * Each entry of `fields` is one <aha-audience-field> (label above) around an <aha-counted-input size="large">:
 * `kind` name, email, phone or text picks the phone keyboard, the autofill hint and the text direction
 * (email and phone stay left to right inside a right-to-left page). Without `fields` it shows a required
 * name and a required email. `dial-codes` (a JSON list of {label, value}) puts an <aha-select> in front of
 * the phone field; the phone value is then `<dial code> <number>`. The value is an object keyed by field id.
 * A required field (`required: true`) left empty, or an email or phone that is not one, shows its message under it in
 * <aha-field-error variant="respondent" icon>, linked to the input, once the participant leaves that field or
 * `showErrors()` runs. A field that is not required gets `optional-label` ("(optional)" unless set) after its label. `disabled` or a locked
 * `lock-key` disables every field and restores the submitted value.
 */
import './aha-counted-input.js';
import './aha-audience-field.js';
import './aha-select.js';
import './aha-field-error.js';
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';
import { upgradeProperties } from './upgrade-properties.js';

const STYLE = DECK_STYLE + `
  :host{ display:block; width:100% }
  .contact{ display:flex; flex-direction:column; gap:var(--aha-space-16, 16px); min-width:0 }
  aha-audience-field{ min-width:0 }
  .phone{ display:flex; align-items:stretch; gap:var(--aha-space-8, 8px); min-width:0 }
  .phone aha-counted-input{ flex:1 1 0; min-width:0 }
  .phone aha-select{ flex:none; --aha-field-width:88px }
  aha-field-error[hidden]{ display:none }
`;

const KINDS = {
  name: { type: 'text', autocomplete: 'name', inputmode: 'text', dir: 'auto', label: 'Name' },
  email: { type: 'email', autocomplete: 'email', inputmode: 'email', dir: 'ltr', label: 'Email' },
  phone: { type: 'tel', autocomplete: 'tel', inputmode: 'tel', dir: 'ltr', label: 'Phone' },
  text: { type: 'text', autocomplete: 'off', inputmode: 'text', dir: 'auto', label: '' },
};
const DEFAULT_FIELDS = [
  { id: 'name', kind: 'name', required: true },
  { id: 'email', kind: 'email', required: true },
];
const OPTIONAL_LABEL = '(optional)';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (text) => EMAIL.test(String(text).trim());
export const isPhone = (text) => {
  const digits = String(text).replace(/\D/g, '').length;
  return /^[+\d\s().-]+$/.test(String(text)) && digits >= 5 && digits <= 15;
};

function parseList(text) {
  try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : null; } catch { return null; }
}

export class AhaAudienceContact extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'fields', 'dial-codes', 'dial-code-label', 'value', 'group-label',
      'optional-label', 'required-message', 'email-message', 'phone-message', 'disabled', 'lock-key'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><div class="contact" part="contact" role="group"></div>`));
    this._group = this.shadowRoot.querySelector('.contact');
    this._rows = new Map();
    this._values = {};
    this._dial = '';
    this._touched = new Set();
    this._lockedRecord = null;
    this._builtKey = '';
    this._group.addEventListener('input', (event) => this._onInput(event));
    this._group.addEventListener('change', (event) => { if (event.target !== this) event.stopPropagation(); });
    this._group.addEventListener('focusout', (event) => this._onFocusOut(event));
  }
  connectedCallback() {
    upgradeProperties(this, ['value']);
    super.connectedCallback();
    this._build();
    this._sync();
    this._watchLock();
    queueMicrotask(() => this._syncInnerFields());
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record?.value) this._fillFrom(record.value);
      this._sync();
    });
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    if (name === 'value' && next !== JSON.stringify(this.value)) this._fillFrom(next);
    if (name === 'fields' || name === 'dial-codes') this._build();
    this._sync();
  }

  get fields() {
    const given = parseList(this.getAttribute('fields') || '');
    const list = given?.length ? given : DEFAULT_FIELDS;
    const seen = new Set();
    return list.filter((field) => {
      if (!field || typeof field.id !== 'string' || !field.id || seen.has(field.id)) return false;
      seen.add(field.id);
      return true;
    });
  }
  get dialCodes() { return parseList(this.getAttribute('dial-codes') || '') || []; }
  /** The answer, keyed by field id; a phone value carries its dial code first. */
  get value() {
    const out = {};
    for (const field of this.fields) out[field.id] = this._fieldValue(field);
    return out;
  }
  set value(next) { this._fillFrom(next); this._sync(); }
  get valid() { return this.fields.every((field) => !this._problem(field)); }
  get locked() { return !!this._lockedRecord; }
  /** Shows every field's error at once, as on a submit attempt, and returns `valid`. */
  showErrors() {
    for (const field of this.fields) this._touched.add(field.id);
    this._syncErrors();
    return this.valid;
  }

  _required(field) { return field.required === true; }
  _kind(field) { return KINDS[field.kind] ? field.kind : 'text'; }
  _fieldValue(field) {
    const typed = String(this._values[field.id] ?? '').trim();
    if (this._kind(field) === 'phone' && typed && this._dial && this.dialCodes.length) return `${this._dial} ${typed}`;
    return typed;
  }
  _fillFrom(source) {
    let data = source;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
    if (!data || typeof data !== 'object') data = {};
    const codes = this.dialCodes.map((code) => String(code.value)).sort((a, b) => b.length - a.length);
    for (const field of this.fields) {
      let text = String(data[field.id] ?? '');
      if (this._kind(field) === 'phone' && codes.length) {
        const code = codes.find((candidate) => text.startsWith(candidate + ' ') || text === candidate);
        if (code) { this._dial = code; text = text.slice(code.length).trim(); }
      }
      this._values[field.id] = text;
    }
    this._pushValues();
  }
  _pushValues() {
    for (const [id, row] of this._rows) {
      if (row.input.value !== (this._values[id] ?? '')) row.input.value = this._values[id] ?? '';
      if (row.select && row.select.value !== this._dial) row.select.value = this._dial;
    }
  }
  _problem(field) {
    const text = this._fieldValue(field);
    const kind = this._kind(field);
    if (!text) return this._required(field) ? 'required' : '';
    if (kind === 'email' && !isEmail(text)) return 'email';
    if (kind === 'phone' && !isPhone(this._values[field.id] ?? '')) return 'phone';
    return '';
  }
  _build() {
    const codes = this.dialCodes;
    const key = JSON.stringify([this.fields, codes]);
    if (key === this._builtKey) return;
    this._builtKey = key;
    this._warnDuplicateIds();
    if (!this._dial && codes.length) this._dial = String(codes[0].value);
    const rows = new Map();
    const nodes = [];
    for (const field of this.fields) {
      const kind = this._kind(field);
      const spec = KINDS[kind];
      const wrapper = document.createElement('aha-audience-field');
      wrapper.dataset.field = field.id;
      wrapper.setAttribute('part', `field ${kind}`);
      const input = document.createElement('aha-counted-input');
      input.dataset.field = field.id;
      input.setAttribute('size', 'large');
      input.setAttribute('maxlength', 'none');
      input.setAttribute('type', spec.type);
      input.setAttribute('inputmode', spec.inputmode);
      input.setAttribute('autocomplete', kind === 'phone' && codes.length ? 'tel-national' : spec.autocomplete);
      input.setAttribute('dir', spec.dir);
      let control = input;
      let select = null;
      if (kind === 'phone' && codes.length) {
        select = document.createElement('aha-select');
        select.setAttribute('size', 'lg');
        select.setAttribute('options', JSON.stringify(codes));
        select.setAttribute('value', this._dial);
        select.setAttribute('dir', 'ltr');
        select.addEventListener('change', (event) => {
          event.stopPropagation();
          this._dial = String(event.detail?.value ?? select.value);
          this._announce();
        });
        control = document.createElement('div');
        control.className = 'phone';
        control.setAttribute('role', 'group');
        control.setAttribute('dir', 'ltr');
        control.append(select, input);
      }
      const error = document.createElement('aha-field-error');
      error.setAttribute('variant', 'respondent');
      error.setAttribute('icon', '');
      error.hidden = true;
      wrapper.append(control, error);
      nodes.push(wrapper);
      rows.set(field.id, { field, wrapper, input, select, error });
    }
    this._rows = rows;
    this._group.replaceChildren(...nodes);
    this._pushValues();
  }
  _warnDuplicateIds() {
    const ids = (parseList(this.getAttribute('fields') || '') || []).map((field) => field?.id).filter(Boolean);
    const repeated = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (repeated.length) console.warn(`aha-audience-contact: duplicate field id ${repeated.join(', ')}; only the first of each is shown`);
  }
  _innerField(row) { return row.input.shadowRoot?.querySelector('.field') || null; }
  _syncInnerFields() {
    for (const [, row] of this._rows) {
      const field = this._innerField(row);
      if (!field) continue;
      if (this._required(row.field)) field.setAttribute('aria-required', 'true'); else field.removeAttribute('aria-required');
      const described = row.error.hidden ? null : [row.error];
      if ('ariaDescribedByElements' in field) field.ariaDescribedByElements = described;
    }
  }
  _onInput(event) {
    event.stopPropagation();
    if (!(event instanceof CustomEvent)) return;
    const id = event.target?.dataset?.field;
    if (!id || !this._rows.has(id)) return;
    this._values[id] = String(event.detail?.value ?? event.target.value);
    this._announce();
  }
  _announce() {
    this._syncErrors();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value, valid: this.valid } }));
  }
  _onFocusOut(event) {
    const row = event.target?.closest?.('aha-audience-field') || event.target?.getRootNode?.().host?.closest?.('aha-audience-field');
    const id = row?.dataset?.field;
    if (!id || row.contains(event.relatedTarget) || row.shadowRoot?.contains(event.relatedTarget)) return;
    this._touched.add(id);
    this._syncErrors();
  }
  _messageFor(problem) {
    if (problem === 'email') return this.getAttribute('email-message') || 'Enter a real email address';
    if (problem === 'phone') return this.getAttribute('phone-message') || 'Enter a real phone number';
    return this.getAttribute('required-message') || 'This field is required';
  }
  _syncErrors() {
    for (const [id, row] of this._rows) {
      const problem = this._touched.has(id) && !this.locked ? this._problem(row.field) : '';
      row.error.setAttribute('message', problem ? this._messageFor(problem) : '');
      row.error.hidden = !problem;
      if (problem) row.input.setAttribute('status', 'error'); else row.input.removeAttribute('status');
    }
    this._syncInnerFields();
  }
  _sync() {
    this._group.setAttribute('aria-label', this.getAttribute('group-label') || this.getAttribute('aria-label') || 'Contact details');
    const closed = this.locked || this.hasAttribute('disabled');
    const optional = this.getAttribute('optional-label') ?? OPTIONAL_LABEL;
    for (const [, row] of this._rows) {
      const { field } = row;
      const base = field.label || KINDS[this._kind(field)].label;
      row.wrapper.setAttribute('label', !this._required(field) && optional ? `${base} ${optional}` : base);
      row.input.setAttribute('aria-label', row.wrapper.getAttribute('label'));
      row.input.setAttribute('placeholder', field.placeholder || '');
      row.input.toggleAttribute('disabled', closed);
      row.select?.toggleAttribute('disabled', closed);
      row.select?.setAttribute('aria-label', this.getAttribute('dial-code-label') || 'Country code');
    }
    this._pushValues();
    this._syncErrors();
  }
}

export function defineAhaAudienceContact(tag = 'aha-audience-contact') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceContact);
}
if (typeof window !== 'undefined') defineAhaAudienceContact();
export default { AhaAudienceContact, defineAhaAudienceContact, isEmail, isPhone };
