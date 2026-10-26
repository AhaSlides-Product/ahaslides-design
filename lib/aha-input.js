/**
 * @ahaslides-product/design/aha-input — the shared Input primitive.
 *
 *   import '@ahaslides-product/design/aha-input';   // registers <aha-input>
 *   <aha-input placeholder="Workspace name" value="AhaSlides"></aha-input>
 *   <aha-input status="error" prefix-icon="system-envelope" clearable></aha-input>
 *
 * The DS V3 Input is a FAMILY, not a bare box: three sizes (small · default · large), two
 * statuses (default · error — border + ring recolour; `warning` is a deprecated alias that renders as error), an
 * optional `info-message` help line, disabled + readonly, and a set
 * of affixes — a leading `prefix` / trailing `suffix` (an icon by name or plain text), a `clearable`
 * ✕ that wipes the value, and a password reveal toggle (type="password" → an eye that flips the
 * field to text). The focus ring lives on a PERSISTENT wrapper node and animates via the shared
 * motion tokens — a class/attribute toggles, the subtree is never rebuilt on a state change, so the
 * transition actually fires. ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. The clear control is a tertiary icon-only <aha-button>. Emits composed `input` / `change` /
 * `clear` CustomEvent<{value}>. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. It has no character cap or counter: a capped field is
 * <aha-counted-input>, whose counter sits inside the field.
 */
import './aha-button.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IMPLICIT_SUBMIT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'number']);
const isSubmitButton = (element) => (element.localName === 'button' && (element.getAttribute('type') || 'submit').toLowerCase() === 'submit')
  || (element.localName === 'input' && /^(?:submit|image)$/i.test(element.type))
  || (element.localName === 'aha-button' && (element.getAttribute('type') || '').toLowerCase() === 'submit');
const isImplicitSubmitField = (element) => element.localName === 'aha-input'
  || (element instanceof HTMLInputElement && IMPLICIT_SUBMIT_TYPES.has(element.type));
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; width:var(--aha-field-width,240px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* the wrapper is the persistent node that carries border + focus ring (animated, never rebuilt) */
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:8px;
    height:40px; padding:0 12px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px; padding:0 8px; gap:6px }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:48px }
  :host([size="lg"]) .field, :host([size="large"]) .field{ font-size:var(--aha-size-l,16px); line-height:24px }

  .label{ display:block; margin-bottom:var(--aha-space-4,4px); font-size:14px; line-height:21px; font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A) }
  .label[hidden]{ display:none }
  :host([disabled]) .label, :host(:disabled) .label{ color:var(--aha-text-disabled,#B5B5B5) }
  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; padding:0; margin:0;
    font-family:inherit; font-size:14px; line-height:21px;
    color:inherit; background:transparent; border:0; outline:none }
  .field::placeholder{ color:var(--aha-text-tertiary,#8A8A8A) }
  .field::-ms-reveal, .field::-ms-clear{ display:none }

  /* hover / focus on the persistent wrapper */
  .wrap:hover{ border-color:var(--aha-border-hover,#E70E68) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .wrap, :host([status="warning"]) .wrap, :host([invalid]) .wrap{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([status="error"][_focused]) .wrap, :host([status="warning"][_focused]) .wrap, :host([invalid][_focused]) .wrap{
    border-color:var(--aha-border-error,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }

  /* disabled + readonly */
  :host([disabled]) .wrap, :host(:disabled) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field, :host(:disabled) .field{ cursor:not-allowed }
  :host([readonly]) .wrap{ background:var(--aha-bg-container-secondary,#F7F7F7) }

  /* affixes */
  .affix{ flex:0 0 auto; display:inline-flex; align-items:center; color:var(--aha-text-tertiary,#8A8A8A); font-size:14px }
  aha-icon{ display:inline-flex; color:currentColor }
  /* icon-buttons: clear + password reveal — persistent nodes, tinted on hover */
  .btn{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; padding:2px; margin:0; border:0;
    background:transparent; color:var(--aha-text-tertiary,#8A8A8A); cursor:pointer; border-radius:var(--aha-radius-sm,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .btn:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  .btn:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:1px }
  .btn[hidden]{ display:none }
  .clear{ flex:0 0 auto; margin-right:calc(-1 * var(--aha-space-4,4px)) }
  .clear[hidden]{ display:none }
  :host([size="sm"]) .clear::part(button), :host([size="small"]) .clear::part(button){ width:20px; height:20px }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaInput extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'type', 'disabled', 'readonly', 'invalid', 'status', 'size',
      'prefix', 'suffix', 'prefix-icon', 'suffix-icon', 'clearable', 'aria-describedby', 'aria-controls', 'aria-label', 'label', 'error-message', 'info-message'];
  }
  static get formAssociated() { return true; }
  constructor() {
    super();
    this._internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this._formDisabled = false;
  }
  get form() { return this._internals ? this._internals.form : this.closest('form'); }
  get labels() { return this._internals ? this._internals.labels : []; }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled') || this._formDisabled; }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this._initialValue = this.getAttribute('value') ?? '';
    }
    this._render();
  }
  formResetCallback() { this.setAttribute('value', this._initialValue ?? ''); }
  formDisabledCallback(disabled) { this._formDisabled = disabled; this._sync(); }
  formStateRestoreCallback(state) { if (typeof state === 'string') this.setAttribute('value', state); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // affix set / type changes the DOM shape → rebuild; everything else is a cheap sync
    if (['prefix', 'suffix', 'prefix-icon', 'suffix-icon', 'clearable', 'type'].includes(name)) this._render();
    else if (name === 'aria-controls') this._syncControls();
    else if (name === 'aria-describedby' || name === 'error-message' || name === 'info-message') this._syncDescription();
    else if (name === 'status' || name === 'invalid') { this._sync(); this._syncDescription(); }
    else this._sync();
  }

  _affixHtml(where) {
    const icon = this.getAttribute(where + '-icon');
    const text = this.getAttribute(where);
    if (icon) return `<span class="affix" part="${where}" aria-hidden="true"><aha-icon name="${esc(icon)}" size="16"></aha-icon></span>`;
    if (text) return `<span class="affix" part="${where}">${esc(text)}</span>`;
    return '';
  }
  _render() {
    const isPw = (this.getAttribute('type') || 'text') === 'password';
    const clearable = this.hasAttribute('clearable');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<label class="label" part="label" for="field" hidden></label>` +
      `<div class="wrap" part="wrap">` +
        this._affixHtml('prefix') +
        `<input class="field" id="field" part="field"/>` +
        (clearable ? `<aha-button class="clear" part="clear" icon-only variant="tertiary" size="sm" aria-label="Clear" hidden><aha-icon slot="icon" name="system-x-circle" size="16" aria-hidden="true"></aha-icon></aha-button>` : '') +
        (isPw ? `<button class="btn reveal" part="reveal" type="button" tabindex="-1" aria-label="Show password" aria-pressed="false"><aha-icon name="system-eye" size="16"></aha-icon></button>` : '') +
        this._affixHtml('suffix') +
      `</div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    const f = this.shadowRoot.querySelector('.field');
    f.addEventListener('input', () => {
      this.setAttribute('value', f.value);
      this._syncClear();
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    f.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    // focus ring toggles an attribute on :host (persistent node) — no rebuild, transition fires
    f.addEventListener('focus', () => { this.setAttribute('_focused', ''); this._syncDescription(); this._syncControls(); this._syncName(); });
    f.addEventListener('keydown', (event) => this._submitOnEnter(event));
    f.addEventListener('blur', () => this.removeAttribute('_focused'));

    const clearBtn = this.shadowRoot.querySelector('.clear');
    if (clearBtn) clearBtn.addEventListener('mousedown', (e) => e.preventDefault());   // keep focus on the field
    if (clearBtn) clearBtn.addEventListener('click', () => {
      f.value = '';
      this.setAttribute('value', '');
      this._syncClear();
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: '' } }));
      this.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true, detail: { value: '' } }));
      f.focus();
    });

    const reveal = this.shadowRoot.querySelector('.reveal');
    if (reveal) reveal.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const showing = f.type === 'text';
      f.type = showing ? 'password' : 'text';
      reveal.setAttribute('aria-pressed', String(!showing));
      reveal.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      reveal.querySelector('aha-icon').setAttribute('name', showing ? 'system-eye' : 'system-eye-slash');
    });
    this._sync();
    this._syncDescription();
    this._syncControls();
  }
  _submitOnEnter(event) {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const form = this.form;
    if (!form) return;
    const fields = [...form.elements];
    const defaultButton = fields.find(isSubmitButton);
    if (defaultButton) {
      if (defaultButton.disabled || defaultButton.hasAttribute('disabled') || defaultButton.hasAttribute('loading')) return;
    } else if (fields.filter(isImplicitSubmitField).length > 1) return;
    setTimeout(() => {
      if (event.defaultPrevented || !form.isConnected) return;
      const nativeSubmitter = defaultButton && (defaultButton.localName === 'button' || defaultButton.localName === 'input') ? defaultButton : undefined;
      form.requestSubmit(nativeSubmitter);
    }, 0);
  }
  _syncClear() {
    const clearBtn = this.shadowRoot.querySelector('.clear');
    if (!clearBtn) return;
    const empty = !this.value || this.disabled || this.hasAttribute('readonly');
    clearBtn.hidden = empty;
  }
  _sync() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    this._syncName();
    // a password field's type is driven by the reveal toggle; leave it alone here
    if (!this.shadowRoot.querySelector('.reveal')) f.type = this.getAttribute('type') || 'text';
    f.placeholder = this.getAttribute('placeholder') || '';
    f.disabled = this.disabled;
    f.readOnly = this.hasAttribute('readonly');
    if (isInvalid(this)) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (f.value !== this.value) f.value = this.value;
    if (this._internals) this._internals.setFormValue(this.value);
    this._syncClear();
  }
  _syncName() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    const visible = this.shadowRoot && this.shadowRoot.querySelector('.label');
    if (!f) return;
    const labelText = this.getAttribute('label') || '';
    visible.textContent = labelText;
    visible.hidden = !labelText;
    let name = this.getAttribute('aria-label');
    if (!name && !labelText) name = [...this.labels].map((label) => label.textContent.trim()).filter(Boolean).join(' ');
    if (name) f.setAttribute('aria-label', name); else f.removeAttribute('aria-label');
  }
  // ariaControlsElements points the inner field at a light-DOM element, which an id reference cannot do across the shadow root; browsers without element reflection simply skip it
  _syncControls() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f || !('ariaControlsElements' in f)) return;
    const root = this.getRootNode();
    const controlled = (this.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)
      .map((id) => (root.getElementById ? root.getElementById(id) : null)).filter(Boolean);
    f.ariaControlsElements = controlled.length ? controlled : null;
  }
  // id references cannot cross the shadow root; element references can (re-resolved on focus for late-mounted errors)
  _syncDescription() {
    syncFieldError(this, this.shadowRoot && this.shadowRoot.querySelector('.field'));
  }
}

export function defineAhaInput(tag = 'aha-input') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInput);
  return true;
}
if (typeof window !== 'undefined') defineAhaInput();

export default { AhaInput, defineAhaInput };
