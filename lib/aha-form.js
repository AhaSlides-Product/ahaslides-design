/**
 * @ahaslides-product/design/aha-form — a labelled, validated set of fields with no antd: layout, validate, submit, reset.
 *
 *   import '@ahaslides-product/design/aha-form';   // registers <aha-form> + <aha-form-item>
 *   <aha-form id="invite">
 *     <aha-form-item label="Name" name="name" required><aha-input></aha-input></aha-form-item>
 *     <aha-form-item label="Email" name="email" required><aha-input type="email"></aha-input></aha-form-item>
 *     <aha-button type="submit" variant="primary">Send invite</aha-button>
 *   </aha-form>
 *   invite.addEventListener('submit', (event) => save(event.detail.values));   // fires only when every rule passes
 *
 * The framework-free counterpart of the antd Form themed by form-theme.js, for code that cannot reach
 * antd (Vue 2, plain HTML, React apps dropping antd). It is a plain container, not a native <form>: a
 * native form cannot see controls slotted through a shadow root, so <aha-form> does the form's job itself.
 * A click on a `type="submit"` button inside it (<aha-button>, <button> or <input>) or Enter in a
 * one-line text field (<aha-input>, <aha-counted-input>, a native text input) calls submit(); a
 * `type="reset"` button calls reset(). submit() validates every <aha-form-item> it holds, focuses the
 * first invalid control, and fires `submit` with { values } or `invalid` with { values, errors }.
 * `layout` is vertical (default), horizontal (labels in a 160px column, --aha-form-label-width) or
 * inline; `required-mark="optional"` marks the optional fields instead of the required ones
 * (`optional-text`, default "(optional)"), `required-mark="hidden"` shows neither.
 */
import './aha-form-item.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  :host([layout="inline"]){ display:flex; flex-wrap:wrap; align-items:flex-start; gap:var(--aha-space-16,16px) }
`;
const ONE_LINE_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number', 'date', 'month', 'week', 'time', 'datetime-local']);
const ONE_LINE_HOSTS = new Set(['aha-input', 'aha-counted-input']);
const BUTTON_TAGS = new Set(['aha-button', 'button', 'input']);

const buttonType = (node) => (node instanceof Element && BUTTON_TAGS.has(node.localName) ? (node.getAttribute('type') || '').toLowerCase() : '');
const isDisabled = (node) => node.disabled === true || node.hasAttribute('disabled') || node.hasAttribute('loading');

export class AhaForm extends HTMLElement {
  static get observedAttributes() { return ['layout', 'required-mark', 'optional-text']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`;
    this.addEventListener('click', (event) => this._onClick(event));
    this.addEventListener('keydown', (event) => this._onKeydown(event));
  }
  attributeChangedCallback() { for (const item of this.items) if (item._sync && item._errorNode) item._sync(); }

  /** The <aha-form-item> elements this form owns (not those of a nested form). */
  get items() { return [...this.querySelectorAll('aha-form-item')].filter((item) => item.closest('aha-form') === this); }
  get values() {
    const values = {};
    for (const item of this.items) if (item.name) values[item.name] = item.value;
    return values;
  }

  /** Runs every item's rules and shows the results. Resolves to { valid, values, errors: [{ name, label, message }] }. */
  async validate({ focus = true } = {}) {
    const items = this.items;
    const messages = await Promise.all(items.map((item) => item.validate()));
    const errors = [];
    messages.forEach((message, index) => {
      if (message) errors.push({ name: items[index].name, label: items[index].getAttribute('label') || '', message });
    });
    if (focus && errors.length) items[messages.findIndex(Boolean)].focus();
    return { valid: !errors.length, values: this.values, errors };
  }

  /** Validates, then fires `submit` ({ values }) or `invalid` ({ values, errors }). Resolves to the validate() result. */
  async submit() {
    const result = await this.validate();
    const detail = result.valid ? { values: result.values } : { values: result.values, errors: result.errors };
    this.dispatchEvent(new CustomEvent(result.valid ? 'submit' : 'invalid', { bubbles: true, composed: true, detail }));
    return result;
  }

  /** Puts every control back to its first value, clears validation errors and fires `reset`. */
  reset() {
    for (const item of this.items) item.reset();
    this.dispatchEvent(new CustomEvent('reset', { bubbles: true, composed: true }));
  }

  _onClick(event) {
    if (event.defaultPrevented) return;
    for (const node of event.composedPath()) {
      if (node === this) return;
      const type = buttonType(node);
      if (type !== 'submit' && type !== 'reset') continue;
      if (isDisabled(node)) return;
      event.preventDefault();
      if (type === 'submit') this.submit(); else this.reset();
      return;
    }
  }

  _onKeydown(event) {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const host = event.target;
    const field = event.composedPath()[0];
    const oneLine = ONE_LINE_HOSTS.has(host.localName)
      || (host.localName === 'input' && ONE_LINE_TYPES.has(host.type));
    if (!oneLine || !(field instanceof HTMLInputElement) || !ONE_LINE_TYPES.has(field.type)) return;
    event.preventDefault();
    this.submit();
  }
}

export function defineAhaForm(tag = 'aha-form') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaForm);
  return true;
}
if (typeof window !== 'undefined') defineAhaForm();

export { AhaFormItem, defineAhaFormItem } from './aha-form-item.js';
export default { AhaForm, defineAhaForm };
