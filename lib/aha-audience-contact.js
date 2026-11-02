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
 * name and a required email. `dial-codes` (a JSON list of {label?, value, country?, dial?, name?}) puts an <aha-select> in front of
 * the phone field; the phone value is then `<dial code> <number>`. An entry with `country` (ISO 3166 alpha-2) reads
 * "🇻🇳 +84" closed and "🇻🇳 Vietnam (+84)" in the open list: the flag comes from `country`, the dial code from `dial`
 * (else the `+…` in `label`), the name from `name`, else Intl.DisplayNames in `locale` (else the nearest `lang`, else
 * English). `label` defaults to the flag and dial code. The value is an object keyed by field id.
 * A required field (`required: true`) left empty, or an email or phone that is not one, shows its message under it in
 * <aha-field-error variant="respondent" icon>, linked to the input, once the participant leaves that field or
 * `showErrors()` runs. A field that is not required gets the optional label ("(optional)" unless set) after its label. `disabled` or a locked
 * `lock-key` disables every field and restores the submitted value.
 *
 * Copy: every built-in text is a key of `contactStrings.en`; pass translations through `strings` (an object property,
 * or the same keys as a JSON `strings` attribute), as on aha-chart. A dedicated attribute (`optional-label`,
 * `required-message`, `email-message`, `phone-message`, `dial-code-label`, `group-label`) still wins over `strings`.
 *
 * Test hooks: `testid="<prefix>"` stamps data-testid `<prefix>-<id>` on each field, `<prefix>-<id>-input` on its text
 * box (`<prefix>-<id>-number` on a phone box behind a dial code), `<prefix>-<id>-country` on the dial code Select and
 * `<prefix>-<id>-error` on the error. Parts: contact, field (plus the kind), phone, dial-code, input, error.
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
  name: { type: 'text', autocomplete: 'name', inputmode: 'text', dir: 'auto' },
  email: { type: 'email', autocomplete: 'email', inputmode: 'email', dir: 'ltr' },
  phone: { type: 'tel', autocomplete: 'tel', inputmode: 'tel', dir: 'ltr' },
  text: { type: 'text', autocomplete: 'off', inputmode: 'text', dir: 'auto' },
};
const DEFAULT_FIELDS = [
  { id: 'name', kind: 'name', required: true },
  { id: 'email', kind: 'email', required: true },
];

/** Built-in copy. Pass `strings` to override any key with the host app's translations. */
export const contactStrings = {
  en: {
    groupLabel: 'Contact details',
    optionalLabel: '(optional)',
    requiredMessage: 'This field is required',
    emailMessage: 'Enter a real email address',
    phoneMessage: 'Enter a real phone number',
    dialCodeLabel: 'Country code',
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
  },
};
const ATTRIBUTE_FOR = {
  groupLabel: 'group-label', optionalLabel: 'optional-label', requiredMessage: 'required-message',
  emailMessage: 'email-message', phoneMessage: 'phone-message', dialCodeLabel: 'dial-code-label',
};
const KIND_LABEL = { name: 'nameLabel', email: 'emailLabel', phone: 'phoneLabel' };

const regionNames = new Map();
function regionName(locale, code) {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') return '';
  if (!regionNames.has(locale)) {
    let names = null;
    try { names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' }); } catch { names = null; }
    regionNames.set(locale, names);
  }
  try { return regionNames.get(locale)?.of(code) || ''; } catch { return ''; }
}
export function countryName(code, locale = 'en') {
  const region = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) return '';
  return regionName(locale, region) || (locale === 'en' ? '' : regionName('en', region));
}
const flagOf = (code) => {
  const region = String(code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(region) ? String.fromCodePoint(...[...region].map((letter) => 0x1F1A5 + letter.charCodeAt(0))) : '';
};
const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

export const isEmail = (text) => {
  const address = String(text).trim();
  if (/\s/.test(address)) return false;
  const at = address.indexOf('@');
  if (at < 1 || at !== address.lastIndexOf('@')) return false;
  const domain = address.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
};
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
      'optional-label', 'required-message', 'email-message', 'phone-message', 'disabled', 'lock-key',
      'strings', 'locale', 'testid'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><div class="contact" part="contact" role="group"></div>`));
    this._group = this.shadowRoot.querySelector('.contact');
    this._rows = new Map();
    this._values = {};
    this._dials = {};
    this._pendingValue = null;
    this._edited = false;
    this._touched = new Set();
    this._lockedRecord = null;
    this._builtKey = '';
    this._stringsValue = null;
    this._group.addEventListener('input', (event) => this._onInput(event));
    this._group.addEventListener('change', (event) => { if (event.target !== this) event.stopPropagation(); });
    this._group.addEventListener('focusout', (event) => this._onFocusOut(event));
  }
  connectedCallback() {
    upgradeProperties(this, ['value', 'strings']);
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
    if (name === 'strings') this._stringsValue = null;
    if (name === 'value') { this._pendingValue = next; this._edited = false; if (next !== JSON.stringify(this.value)) this._fillFrom(next); }
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
  /** Overrides for `contactStrings.en`, as an object property or a JSON `strings` attribute. */
  get strings() {
    if (this._stringsValue) return this._stringsValue;
    const attribute = this.getAttribute('strings');
    if (!attribute) return null;
    if (this._stringsAttribute !== attribute) {
      let parsed = null;
      try { parsed = JSON.parse(attribute); } catch { parsed = null; }
      this._stringsAttribute = attribute;
      this._stringsParsed = isObject(parsed) ? parsed : null;
    }
    return this._stringsParsed;
  }
  set strings(next) { this._stringsValue = isObject(next) ? next : null; this._sync(); }
  /** The answer, keyed by field id; a phone value carries its dial code first. */
  get value() {
    const out = {};
    for (const field of this.fields) out[field.id] = this._fieldValue(field);
    return out;
  }
  set value(next) { this._pendingValue = next; this._edited = false; this._fillFrom(next); this._sync(); }
  get valid() { return this.fields.every((field) => !this._problem(field)); }
  get locked() { return !!this._lockedRecord; }
  /** Shows every field's error at once, as on a submit attempt, and returns `valid`. */
  showErrors() {
    for (const field of this.fields) this._touched.add(field.id);
    this._syncErrors();
    return this.valid;
  }

  _text(key) {
    const attribute = ATTRIBUTE_FOR[key];
    if (attribute && this.hasAttribute(attribute)) {
      const given = this.getAttribute(attribute);
      if (given || key === 'optionalLabel') return given;
    }
    const override = this.strings?.[key];
    return typeof override === 'string' ? override : contactStrings.en[key];
  }
  _locale() { return this.getAttribute('locale') || this.closest?.('[lang]')?.getAttribute('lang') || 'en'; }
  _dialOptions() {
    const locale = this._locale();
    return this.dialCodes.map((code) => {
      const option = isObject(code) ? { ...code } : { value: String(code) };
      option.value = String(option.value ?? '');
      const flag = flagOf(option.country);
      const dial = String(option.dial || String(option.label ?? '').match(/\+\d[\d-]*/)?.[0] || '');
      option.label = String(option.label ?? ([flag, dial].filter(Boolean).join(' ') || option.value));
      const name = typeof option.name === 'string' && option.name ? option.name : countryName(option.country, locale);
      if (name) option.listLabel = [flag, name, dial && `(${dial})`].filter(Boolean).join(' ');
      return option;
    });
  }
  /** aha-select shows one label both closed and in the list, so the list rows are relabelled in place. */
  _syncDialRows(row, options) {
    const list = row.select?.shadowRoot?.querySelector('[part~="listbox"]');
    if (!list) return;
    const byValue = new Map(options.map((option) => [option.value, option]));
    for (const node of list.querySelectorAll('[part~="option"]')) {
      const option = byValue.get(node.dataset.value);
      const label = node.querySelector('.label');
      const text = option?.listLabel || option?.label;
      if (label && text && label.textContent !== text) label.textContent = text;
    }
  }
  _required(field) { return field.required === true; }
  _kind(field) { return KINDS[field.kind] ? field.kind : 'text'; }
  _fieldValue(field) {
    const typed = String(this._values[field.id] ?? '').trim();
    const dial = this._dials[field.id];
    if (this._kind(field) === 'phone' && typed && dial && this.dialCodes.length) return `${dial} ${typed}`;
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
        if (code) { this._dials[field.id] = code; text = text.slice(code.length).trim(); }
      }
      this._values[field.id] = text;
    }
    this._pushValues();
  }
  _pushValues() {
    for (const [id, row] of this._rows) {
      if (row.input.value !== (this._values[id] ?? '')) row.input.value = this._values[id] ?? '';
      const dial = this._dials[id] ?? '';
      if (row.select && row.select.value !== dial) row.select.value = dial;
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
    const rows = new Map();
    const nodes = [];
    for (const field of this.fields) {
      const kind = this._kind(field);
      if (kind === 'phone' && codes.length && !this._dials[field.id]) this._dials[field.id] = String(codes[0].value);
      const spec = KINDS[kind];
      const wrapper = document.createElement('aha-audience-field');
      wrapper.dataset.field = field.id;
      wrapper.setAttribute('part', `field ${kind}`);
      const input = document.createElement('aha-counted-input');
      input.dataset.field = field.id;
      input.setAttribute('part', 'input');
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
        select.setAttribute('part', 'dial-code');
        select.setAttribute('size', 'lg');
        select.setAttribute('value', this._dials[field.id] ?? '');
        select.setAttribute('dir', 'ltr');
        select.addEventListener('change', (event) => {
          event.stopPropagation();
          this._dials[field.id] = String(event.detail?.value ?? select.value);
          this._edited = true;
          this._announce();
        });
        control = document.createElement('div');
        control.className = 'phone';
        control.setAttribute('part', 'phone');
        control.setAttribute('role', 'group');
        control.setAttribute('dir', 'ltr');
        control.append(select, input);
      }
      const error = document.createElement('aha-field-error');
      error.setAttribute('part', 'error');
      error.setAttribute('variant', 'respondent');
      error.setAttribute('icon', '');
      error.hidden = true;
      wrapper.append(control, error);
      nodes.push(wrapper);
      rows.set(field.id, { field, wrapper, input, select, error });
    }
    this._rows = rows;
    this._group.replaceChildren(...nodes);
    if (this._pendingValue != null && !this._edited) this._fillFrom(this._pendingValue);
    this._pushValues();
  }
  _warnDuplicateIds() {
    const ids = (parseList(this.getAttribute('fields') || '') || []).map((field) => field?.id).filter(Boolean);
    const repeated = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (repeated.length) console.warn(`aha-audience-contact: duplicate field id ${repeated.join(', ')}; only the first of each is shown`);
  }
  _innerField(row) { return row.input.shadowRoot?.querySelector('.field') || null; }
  _stampTestId(node, id) {
    if (id) node.setAttribute('data-testid', id); else node.removeAttribute('data-testid');
  }
  _syncTestIds() {
    const prefix = this.getAttribute('testid');
    for (const [id, row] of this._rows) {
      const base = prefix ? `${prefix}-${id}` : '';
      this._stampTestId(row.wrapper, base);
      if (row.select) this._stampTestId(row.select, base && `${base}-country`);
      this._stampTestId(row.error, base && `${base}-error`);
      const field = this._innerField(row);
      if (field) this._stampTestId(field, base && `${base}-${row.select ? 'number' : 'input'}`);
    }
  }
  _syncInnerFields() {
    this._syncTestIds();
    const dialList = this._dialOptions();
    for (const [, row] of this._rows) if (row.select) this._syncDialRows(row, dialList);
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
    this._edited = true;
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
    if (problem === 'email') return this._text('emailMessage');
    if (problem === 'phone') return this._text('phoneMessage');
    return this._text('requiredMessage');
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
    this._group.setAttribute('aria-label', this.getAttribute('group-label') || this.getAttribute('aria-label') || this._text('groupLabel'));
    const closed = this.locked || this.hasAttribute('disabled');
    const optional = this._text('optionalLabel');
    const dialList = this._dialOptions();
    const dialOptions = JSON.stringify(dialList);
    for (const [, row] of this._rows) {
      const { field } = row;
      const kindLabel = KIND_LABEL[this._kind(field)];
      const base = field.label || (kindLabel ? this._text(kindLabel) : '');
      row.wrapper.setAttribute('label', !this._required(field) && optional ? `${base} ${optional}` : base);
      row.input.setAttribute('aria-label', row.wrapper.getAttribute('label'));
      row.input.setAttribute('placeholder', field.placeholder || '');
      row.input.toggleAttribute('disabled', closed);
      row.select?.toggleAttribute('disabled', closed);
      row.select?.setAttribute('aria-label', this._text('dialCodeLabel'));
      if (row.select && row.select.getAttribute('options') !== dialOptions) row.select.setAttribute('options', dialOptions);
      if (row.select) this._syncDialRows(row, dialList);
    }
    this._pushValues();
    this._syncErrors();
  }
}

export function defineAhaAudienceContact(tag = 'aha-audience-contact') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceContact);
}
if (typeof window !== 'undefined') defineAhaAudienceContact();
export default { AhaAudienceContact, defineAhaAudienceContact, contactStrings, countryName, isEmail, isPhone };
