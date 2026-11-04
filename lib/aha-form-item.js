/**
 * @ahaslides-product/design/aha-form-item — one labelled, validated field: label, required mark, help and error.
 *
 *   import '@ahaslides-product/design/aha-form';   // registers <aha-form> + <aha-form-item>
 *   <aha-form-item label="Email" name="email" required help="We'll send the invite here.">
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
 * control's `aria-label` (unless the control names itself, as a checkbox or switch with its own text does),
 * `required` sets `aria-required`, an error sets `status="error"` on an <aha-*> field (its error border and
 * `aria-invalid`) or `aria-invalid` on a checkbox, switch or native control, and the error and help nodes
 * sit in this element's LIGHT DOM with stable ids listed in the control's `aria-describedby`, so the DS fields resolve them into the inner field's ariaDescribedByElements.
 * Clicking the label focuses the control.
 *
 * Validation: `required` (an empty string, whitespace, an empty list or an unchecked box is empty) with
 * `required-message`, then `validator(value, { values, item })` returning a message (or a Promise of
 * one; '' or nothing is valid; an Error thrown with a message is the message). It runs when the field is left after an edit,
 * again on every edit while an error shows, and from validate(). `error` is a message the consumer owns
 * (a server answer such as "That key is taken"): it shows until removed and never blocks submit; a
 * validation error shows over it. The value is the control's `value`, `checked` for a checkbox or switch,
 * `values` for <aha-select mode="tags"> or mode="multiple", and for <aha-input-number> a number (its string
 * under `string-mode`) or null when empty, and for <aha-datepicker> the ISO date ('' when empty).
 */
import './aha-field-error.js';
import { upgradeProperties } from './upgrade-properties.js';

const DEFAULT_REQUIRED_MESSAGE = 'We need this one.';
const DEFAULT_OPTIONAL_TEXT = '(optional)';
const CHECKED_CONTROLS = new Set(['aha-checkbox', 'aha-switch']);
const FIELD_CONTROLS = ['aha-input', 'aha-input-number', 'aha-datepicker', 'aha-counted-input', 'aha-counted-textarea', 'aha-select', 'aha-autocomplete', 'input', 'select', 'textarea'];

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
  :host([_layout="horizontal"]) .body{ flex:1 1 auto; min-width:0 }
  @media (max-width:575px){
    :host([_layout="horizontal"]) .item{ display:block }
    :host([_layout="horizontal"]) .head{ min-height:0; padding-bottom:var(--aha-space-4,4px) }
  }

  :host([_layout="inline"]){ display:inline-block; margin-bottom:0; vertical-align:top }
  :host([_layout="inline"]) .item{ display:flex; align-items:flex-start; gap:var(--aha-space-8,8px) }
  :host([_layout="inline"]) .head{ min-height:40px; display:flex; align-items:center; padding-bottom:0 }
`;

const isEmpty = (value) => value == null || value === false
  || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
const isCheckedControl = (control) => CHECKED_CONTROLS.has(control.localName)
  || (control.localName === 'input' && /^(?:checkbox|radio)$/i.test(control.type));
const isListSelect = (control) => control.localName === 'aha-select' && /^(?:tags|multiple)$/.test(control.getAttribute('mode') || '');

const isNumberField = (control) => control.localName === 'aha-input-number' && 'valueAsNumber' in control;

function readValue(control) {
  if (isCheckedControl(control)) return control.checked != null ? !!control.checked : control.hasAttribute('checked');
  if (isListSelect(control)) return Array.isArray(control.values) ? control.values : [];
  if (isNumberField(control)) return control.value == null || control.stringMode ? control.value : control.valueAsNumber;
  return control.value ?? control.getAttribute('value') ?? '';
}
function writeValue(control, value) {
  if (isCheckedControl(control)) control.checked = !!value;
  else if (isListSelect(control)) control.values = value || [];
  else control.value = value ?? '';
}
const messageOf = (result) => (result == null || result === false || result === true ? '' : String(result));

const freshOwned = () => ({ label: '', required: '', invalid: '', ids: [] });

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
    this._owned = freshOwned();
    this._parts = Object.fromEntries(['head', 'text', 'mark', 'optional'].map((name) => [name, this.shadowRoot.querySelector(`.${name}`)]));
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
  attributeChangedCallback() { this._sync(); }

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
      if (run !== this._run) return this._latest || '';
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
    this._latest = null;
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
      return messageOf(await this.validator(value, { get values() { return form && 'values' in form ? form.values : {}; }, item: this }));
    } catch (error) {
      const message = messageOf(error instanceof Error ? error.message : error);
      if (!message) throw error;
      return message;
    }
  }

  _describer(slot, id) {
    const node = this.querySelector(`:scope > aha-field-error[slot="${slot}"]`) || document.createElement('aha-field-error');
    node.setAttribute('slot', slot);
    node.id = id;
    if (node.parentNode !== this) this.append(node);
    return node;
  }

  _adoptControl() {
    if (!this._errorNode) return;
    for (const node of [this._errorNode, this._helpNode]) if (node.parentNode !== this) this.append(node);
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
    if (!this._errorNode) return;
    const parts = this._parts;
    const form = this.closest('aha-form');
    const layout = form ? form.getAttribute('layout') : null;
    if (layout === 'horizontal' || layout === 'inline') this.setAttribute('_layout', layout); else this.removeAttribute('_layout');
    const markMode = form ? form.getAttribute('required-mark') : null;
    const label = this.getAttribute('label') || '';
    parts.head.hidden = !label;
    parts.text.textContent = label;
    parts.mark.hidden = !this.required || markMode === 'optional' || markMode === 'hidden';
    const optional = parts.optional;
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
    const invalidAttribute = control.localName.startsWith('aha-') && !isCheckedControl(control) ? 'status' : 'aria-invalid';
    const namesItself = isCheckedControl(control) && (control.hasAttribute('label') || !!control.textContent.trim());
    this._claim(control, 'label', 'aria-label', namesItself ? '' : label);
    this._claim(control, 'required', 'aria-required', this.required ? 'true' : '');
    this._claim(control, 'invalid', invalidAttribute, message ? (invalidAttribute === 'status' ? 'error' : 'true') : '');
    this._describe(control, [message && this._errorNode.id, help && this._helpNode.id].filter(Boolean));
  }

  _claim(control, key, attribute, value) {
    const owned = this._owned;
    if (value && (!control.hasAttribute(attribute) || owned[key] === attribute)) {
      if (control.getAttribute(attribute) !== value) control.setAttribute(attribute, value);
      owned[key] = attribute;
    } else if (owned[key] && !value) {
      control.removeAttribute(owned[key]);
      owned[key] = '';
    }
  }

  _describe(control, ids) {
    const current = control.getAttribute('aria-describedby') || '';
    const next = [...current.split(/\s+/).filter((id) => id && !this._owned.ids.includes(id)), ...ids].join(' ');
    if (next !== current) {
      if (next) control.setAttribute('aria-describedby', next); else control.removeAttribute('aria-describedby');
    }
    this._owned.ids = ids;
  }

  _release(control) {
    for (const key of ['label', 'required', 'invalid']) if (this._owned[key]) control.removeAttribute(this._owned[key]);
    this._describe(control, []);
    this._owned = freshOwned();
  }
}

export function defineAhaFormItem(tag = 'aha-form-item') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaFormItem);
  return true;
}
if (typeof window !== 'undefined') defineAhaFormItem();

export default { AhaFormItem, defineAhaFormItem };
