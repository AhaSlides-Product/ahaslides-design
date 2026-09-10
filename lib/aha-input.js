/**
 * @ahaslides-product/design/aha-input — the shared Input primitive.
 *
 *   import '@ahaslides-product/design/aha-input';   // registers <aha-input>
 *   <aha-input placeholder="Workspace name" value="AhaSlides"></aha-input>
 *   <aha-input size="large" status="error" prefix-icon="system-envelope" clearable></aha-input>
 *
 * The DS V3 Input is a FAMILY, not a bare box: three sizes (small · default · large), three
 * statuses (default · error · warning — border + ring recolour), disabled + readonly, and a set
 * of affixes — a leading `prefix` / trailing `suffix` (an icon by name or plain text), a `clearable`
 * ✕ that wipes the value, and a password reveal toggle (type="password" → an eye that flips the
 * field to text). The focus ring lives on a PERSISTENT wrapper node and animates via the shared
 * motion tokens — a class/attribute toggles, the subtree is never rebuilt on a state change, so the
 * transition actually fires. ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies. Emits composed `input` / `change` /
 * `clear` CustomEvent<{value}>. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; width:240px }
  /* the wrapper is the persistent node that carries border + focus ring (animated, never rebuilt) */
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:8px;
    height:32px; padding:0 12px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px; padding:0 8px; gap:6px }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:40px }

  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; padding:0; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:inherit; background:transparent; border:0; outline:none }
  .field::placeholder{ color:var(--aha-text-tertiary,#8A8A8A) }
  .field::-ms-reveal, .field::-ms-clear{ display:none }

  /* hover / focus on the persistent wrapper */
  .wrap:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .wrap, :host([invalid]) .wrap{ border-color:var(--aha-border-error,#F5222D) }
  :host([status="error"][_focused]) .wrap, :host([invalid][_focused]) .wrap{
    border-color:var(--aha-border-error,#F5222D); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }
  :host([status="warning"]) .wrap{ border-color:var(--aha-border-warning,#FF7747) }
  :host([status="warning"][_focused]) .wrap{
    border-color:var(--aha-border-warning,#FF7747); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-warning,#FF7747) 20%, transparent) }

  /* disabled + readonly */
  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field{ cursor:not-allowed }
  :host([readonly]) .wrap{ background:var(--aha-bg-container-secondary,#F7F7F7) }

  /* affixes */
  .affix{ flex:0 0 auto; display:inline-flex; align-items:center; color:var(--aha-text-tertiary,#8A8A8A); font-size:14px }
  aha-icon{ display:inline-flex; color:currentColor }
  /* icon-buttons: clear + password reveal — persistent nodes, tinted on hover */
  .btn{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; padding:2px; margin:0; border:0;
    background:transparent; color:var(--aha-text-tertiary,#8A8A8A); cursor:pointer; border-radius:var(--aha-radius-sm,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .btn:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  .btn:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:1px }
  .btn[hidden]{ display:none }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaInput extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'type', 'disabled', 'readonly', 'invalid', 'status', 'size',
      'prefix', 'suffix', 'prefix-icon', 'suffix-icon', 'clearable'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // affix set / type changes the DOM shape → rebuild; everything else is a cheap sync
    if (['prefix', 'suffix', 'prefix-icon', 'suffix-icon', 'clearable', 'type'].includes(name)) this._render();
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
      `<div class="wrap" part="wrap">` +
        this._affixHtml('prefix') +
        `<input class="field" part="field"/>` +
        (clearable ? `<button class="btn clear" part="clear" type="button" tabindex="-1" aria-label="Clear" hidden><aha-icon name="system-x-circle" size="16"></aha-icon></button>` : '') +
        (isPw ? `<button class="btn reveal" part="reveal" type="button" tabindex="-1" aria-label="Show password" aria-pressed="false"><aha-icon name="system-eye" size="16"></aha-icon></button>` : '') +
        this._affixHtml('suffix') +
      `</div>`;
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
    f.addEventListener('focus', () => this.setAttribute('_focused', ''));
    f.addEventListener('blur', () => this.removeAttribute('_focused'));

    const clearBtn = this.shadowRoot.querySelector('.clear');
    if (clearBtn) clearBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();   // keep focus on the field
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
    // a password field's type is driven by the reveal toggle; leave it alone here
    if (!this.shadowRoot.querySelector('.reveal')) f.type = this.getAttribute('type') || 'text';
    f.placeholder = this.getAttribute('placeholder') || '';
    f.disabled = this.disabled;
    f.readOnly = this.hasAttribute('readonly');
    // aria-invalid mirrors the error status (status="error" or the legacy `invalid` alias)
    const invalid = this.getAttribute('status') === 'error' || this.hasAttribute('invalid');
    if (invalid) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (f.value !== this.value) f.value = this.value;
    this._syncClear();
  }
}

export function defineAhaInput(tag = 'aha-input') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInput);
  return true;
}
if (typeof window !== 'undefined') defineAhaInput();

export default { AhaInput, defineAhaInput };
