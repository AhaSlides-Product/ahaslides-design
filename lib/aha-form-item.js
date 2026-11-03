/**
 * @ahaslides-product/design/aha-form-item — one labelled, validated field: label, required mark, help and error.
 *
 *   import '@ahaslides-product/design/aha-form';   // registers <aha-form> + <aha-form-item>
 *   <aha-form-item label="Email" name="email" required help="We send the invite here">
 *     <aha-input type="email"></aha-input>
 *   </aha-form-item>
 *   item.validator = (value) => (/^\S+@\S+\.\S+$/.test(value) ? '' : 'Enter a real email address');
 *
 * The framework-free Form.Item. It wraps ONE control (any <aha-*> field, or a native input, select or
 * textarea) and draws what antd's Form.Item draws under form-theme.js, value for value: the label above
 * (14/22 regular ink, 4 below), an ink `*` before the label of a required field, the error row below the
 * field (the shared <aha-field-error icon>: 12px warning-circle glyph and 12/18 ink text, never a status
 * hue) and the help line under that (<aha-field-error tone="info">: 12/18 secondary text), 20 below the item.
 *
 * Wiring to the control, across the shadow boundary the way the DS already does it: the label becomes the
 * control's `aria-label` (unless the control names itself), `required` sets `aria-required`, an error sets
 * `status="error"` on an <aha-*> control (its error border and `aria-invalid`) or `aria-invalid` on a
 * native one, and the error and help nodes sit in this element's LIGHT DOM with stable ids listed in the
 * control's `aria-describedby`, so the DS fields resolve them into the inner field's ariaDescribedByElements.
 * Clicking the label focuses the control.
 *
 * Validation: `required` (an empty string, whitespace, an empty list or an unchecked box is empty) with
 * `required-message`, then `validator(value, { values, item })` returning a message (or a Promise of
 * one; '' or nothing is valid; an Error thrown with a message is the message). It runs when the field is left after an edit,
 * again on every edit while an error shows, and from validate(). `error` is a message the consumer owns
 * (a server answer such as "That key is taken"): it shows until removed and never blocks submit; a
 * validation error shows over it. The value is the control's `value`, `checked` for a checkbox or switch,
 * and `values` for <aha-select mode="tags">.
 */
import './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const DEFAULT_REQUIRED_MESSAGE = 'This field is required';
const DEFAULT_OPTIONAL_TEXT = '(optional)';
const CHECKED_CONTROLS = new Set(['aha-checkbox', 'aha-switch']);
const FIELD_CONTROLS = ['aha-input', 'aha-counted-input', 'aha-counted-textarea', 'aha-select', 'aha-autocomplete', 'input', 'select', 'textarea'];

const STYLE = `
  :host{ display:block; margin-bottom:var(--aha-space-20,20px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .head{ padding-bottom:var(--aha-space-4,4px) }
  .head[hidden]{ display:none }
  .label{ display:inline; font-size:var(--aha-size-default,14px); line-height:22px; font-weight:var(--aha-weight-regular,400);
    color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere; cursor:default }
  .mark{ margin-inline-end:var(--aha-space-4,4px); color:var(--aha-text-negative,#1A1A1A) }
  .optional{ margin-inline-start:var(--aha-space-4,4px); color:var(--aha-text-secondary,#4A4A4A) }
  .mark[hidden], .optional[hidden]{ display:none }
  .body{ min-width:0 }
  ${FIELD_CONTROLS.map((tag) => `:host(:not([_layout="inline"])) ::slotted(${tag})`).join(', ')}{ width:100%; box-sizing:border-box }

  :host([_layout="horizontal"]) .item{ display:flex; align-items:flex-start; gap:var(--aha-space-16,16px) }
  :host([_layout="horizontal"]) .head{ flex:0 0 var(--aha-form-label-width,160px); box-sizing:border-box; min-height:40px;
    display:flex; align-items:center; padding-bottom:0 }
  :host([_layout="horizontal"]) .body{ flex:1 1 auto }

  :host([_layout="inline"]){ display:inline-block; margin-bottom:0; vertical-align:top }
  :host([_layout="inline"]) .item{ display:flex; align-items:flex-start; gap:var(--aha-space-8,8px) }
  :host([_layout="inline"]) .head{ min-height:40px; display:flex; align-items:center; padding-bottom:0 }
`;

const isEmpty = (value) => value == null || value === false
  || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
const isCheckedControl = (control) => CHECKED_CONTROLS.has(control.localName)
  || (control.localName === 'input' && /^(?:checkbox|radio)$/i.test(control.type));
const isTagsSelect = (control) => control.localName === 'aha-select' && control.getAttribute('mode') === 'tags';

function readValue(control) {
  if (isCheckedControl(control)) return control.checked != null ? !!control.checked : control.hasAttribute('checked');
  if (isTagsSelect(control)) return Array.isArray(control.values) ? control.values : [];
  return control.value ?? control.getAttribute('value') ?? '';
}
function writeValue(control, value) {
  if (isCheckedControl(control)) control.checked = !!value;
  else if (isTagsSelect(control)) control.values = value || [];
  else control.value = value ?? '';
}
const messageOf = (result) => (result == null || result === false || result === true ? '' : String(result));

let minted = 0;

export class AhaFormItem extends HTMLElement {
  static get observedAttributes() { return ['label', 'name', 'required', 'required-message', 'help', 'error']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="item" part="item">` +
        `<div class="head" part="head"><span class="label" part="label">` +
          `<span class="mark" part="required-mark" aria-hidden="true">*</span><span class="text"></span><span class="optional" part="optional"></span>` +
        `</span></div>` +
        `<div class="body" part="body"><slot></slot><slot name="error"></slot><slot name="help"></slot></div>` +
      `</div>`;
    this._validation = '';
    this._touched = false;
    this._run = 0;
    this._owned = { label: false, required: false, invalid: '', ids: [] };
    this.shadowRoot.querySelector('slot:not([name])').addEventListener('slotchange', () => this._adoptControl());
    this.shadowRoot.querySelector('.label').addEventListener('click', () => this.focus());
    const onEdit = (event) => {
      if (!this._control || !event.composedPath().includes(this._control)) return;
      this._touched = true;
      if (this._validation) this.validate();
    };
    this.addEventListener('input', onEdit);
    this.addEventListener('change', onEdit);
    this.addEventListener('focusout', (event) => {
      if (event.relatedTarget && this.contains(event.relatedTarget)) return;
      if (this._touched) this.validate();
    });
  }

  connectedCallback() {
    upgradeProperties(this, ['validator']);
    if (!this._errorNode) {
      const base = this.id || `aha-form-item-${++minted}`;
      this._errorNode = this._describer('error', `${base}-error`);
      this._helpNode = this._describer('help', `${base}-help`);
      this._helpNode.setAttribute('tone', 'info');
      this._errorNode.setAttribute('icon', '');
    }
    this._adoptControl();
  }
  attributeChangedCallback() { if (this._errorNode) this._sync(); }

  get control() { return this.shadowRoot.querySelector('slot:not([name])').assignedElements()[0] || null; }
  get name() { return this.getAttribute('name') || ''; }
  get required() { return this.hasAttribute('required'); }
  set required(flag) { this.toggleAttribute('required', !!flag); }
  get error() { return this.getAttribute('error') || ''; }
  set error(message) { message ? this.setAttribute('error', message) : this.removeAttribute('error'); }
  get value() { return this._control ? readValue(this._control) : undefined; }
  /** The message on show: a validation error first, else the consumer's `error`. */
  get message() { return this._validation || this.error; }

  focus(options) { this._control?.focus?.(options); }

  /** Runs the rules and shows the result; resolves to the message ('' when valid). */
  validate() {
    const run = ++this._run;
    const result = this._check().then((message) => {
      if (run !== this._run) return this._latest;
      this._validation = message;
      this._sync();
      return message;
    });
    this._latest = result;
    return result;
  }

  /** Puts the control back to the value it had when it was slotted and clears the validation error. */
  reset() {
    this._run++;
    this._touched = false;
    this._validation = '';
    if (this._control && this._initial !== undefined) writeValue(this._control, this._initial);
    this._sync();
  }

  async _check() {
    const value = this.value;
    if (isEmpty(value)) return this.required ? (this.getAttribute('required-message') || DEFAULT_REQUIRED_MESSAGE) : '';
    if (typeof this.validator !== 'function') return '';
    const form = this.closest('aha-form');
    try {
      return messageOf(await this.validator(value, { values: form && 'values' in form ? form.values : {}, item: this }));
    } catch (error) {
      const message = messageOf(error instanceof Error ? error.message : error);
      if (!message) throw error;
      return message;
    }
  }

  _describer(slot, id) {
    const node = document.createElement('aha-field-error');
    node.setAttribute('slot', slot);
    node.id = id;
    this.append(node);
    return node;
  }

  _adoptControl() {
    if (!this._errorNode) return;
    const control = this.control;
    if (control !== this._control) {
      if (this._control) this._release(this._control);
      this._control = control;
      this._initial = undefined;
      if (control) this._snapshot(control);
    }
    this._sync();
  }
  _snapshot(control) {
    const tag = control.localName;
    if (tag.includes('-') && !customElements.get(tag)) {
      customElements.whenDefined(tag).then(() => { if (this._control === control && this._initial === undefined) this._initial = readValue(control); });
      return;
    }
    this._initial = readValue(control);
  }

  _sync() {
    const root = this.shadowRoot;
    const form = this.closest('aha-form');
    const layout = form ? form.getAttribute('layout') : null;
    if (layout === 'horizontal' || layout === 'inline') this.setAttribute('_layout', layout); else this.removeAttribute('_layout');
    const markMode = form ? form.getAttribute('required-mark') : null;
    const label = this.getAttribute('label') || '';
    root.querySelector('.head').hidden = !label;
    root.querySelector('.text').textContent = label;
    root.querySelector('.mark').hidden = !this.required || markMode === 'optional' || markMode === 'hidden';
    const optional = root.querySelector('.optional');
    optional.hidden = this.required || markMode !== 'optional';
    optional.textContent = (form && form.getAttribute('optional-text')) ?? DEFAULT_OPTIONAL_TEXT;

    const message = this.message;
    const help = this.getAttribute('help') || '';
    this._errorNode.setAttribute('message', message);
    this._helpNode.setAttribute('message', help);
    this.toggleAttribute('_invalid', !!message);
    if (this._control) this._wire(this._control, label, message, help);
  }

  _wire(control, label, message, help) {
    const owned = this._owned;
    if (label && (!control.hasAttribute('aria-label') || owned.label)) {
      if (control.getAttribute('aria-label') !== label) control.setAttribute('aria-label', label);
      owned.label = true;
    } else if (owned.label) {
      control.removeAttribute('aria-label');
      owned.label = false;
    }

    if (this.required && (!control.hasAttribute('aria-required') || owned.required)) {
      control.setAttribute('aria-required', 'true');
      owned.required = true;
    } else if (!this.required && owned.required) {
      control.removeAttribute('aria-required');
      owned.required = false;
    }

    const invalidAttribute = control.localName.startsWith('aha-') ? 'status' : 'aria-invalid';
    const invalidValue = invalidAttribute === 'status' ? 'error' : 'true';
    if (message && (!control.hasAttribute(invalidAttribute) || owned.invalid)) {
      if (control.getAttribute(invalidAttribute) !== invalidValue) control.setAttribute(invalidAttribute, invalidValue);
      owned.invalid = invalidAttribute;
    } else if (!message && owned.invalid) {
      control.removeAttribute(owned.invalid);
      owned.invalid = '';
    }

    const ids = [message && this._errorNode.id, help && this._helpNode.id].filter(Boolean);
    const theirs = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && !owned.ids.includes(id));
    const next = [...theirs, ...ids].join(' ');
    if (next !== (control.getAttribute('aria-describedby') || '')) {
      if (next) control.setAttribute('aria-describedby', next); else control.removeAttribute('aria-describedby');
    }
    owned.ids = ids;
  }

  _release(control) {
    const owned = this._owned;
    if (owned.label) control.removeAttribute('aria-label');
    if (owned.required) control.removeAttribute('aria-required');
    if (owned.invalid) control.removeAttribute(owned.invalid);
    const theirs = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && !owned.ids.includes(id));
    if (theirs.length) control.setAttribute('aria-describedby', theirs.join(' ')); else control.removeAttribute('aria-describedby');
    this._owned = { label: false, required: false, invalid: '', ids: [] };
  }
}

export function defineAhaFormItem(tag = 'aha-form-item') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaFormItem);
  return true;
}
if (typeof window !== 'undefined') defineAhaFormItem();

export default { AhaFormItem, defineAhaFormItem };
