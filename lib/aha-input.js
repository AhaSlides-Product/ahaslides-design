/**
 * @ahaslides-product/design/aha-input — the shared Input primitive.
 *
 *   import '@ahaslides-product/design/aha-input';   // registers <aha-input>
 *   <aha-input placeholder="Workspace name" value="AhaSlides"></aha-input>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Emits a composed `input` and `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:inline-flex; width:240px }
  .field{ box-sizing:border-box; width:100%; height:32px; padding:0 12px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    outline:none; transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .field{ height:24px; padding:0 8px }
  :host([size="lg"]) .field{ height:40px }
  .field::placeholder{ color:var(--aha-text-tertiary,#8A8A8A) }
  .field:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .field:focus{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }
  :host([invalid]) .field{ border-color:var(--aha-border-error,#F5222D) }
  :host([invalid]) .field:focus{ box-shadow:0 0 0 2px rgba(245,34,45,.2) }
  :host([disabled]) .field{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaInput extends HTMLElement {
  static get observedAttributes() { return ['value', 'placeholder', 'type', 'disabled', 'invalid', 'size']; }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><input class="field" part="field"/>`;
    const f = this.shadowRoot.querySelector('.field');
    f.addEventListener('input', () => {
      this.setAttribute('value', f.value);
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    f.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    this._sync();
  }
  _sync() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    f.type = this.getAttribute('type') || 'text';
    f.placeholder = this.getAttribute('placeholder') || '';
    f.disabled = this.disabled;
    if (f.value !== this.value) f.value = this.value;
  }
}

export function defineAhaInput(tag = 'aha-input') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInput);
  return true;
}
if (typeof window !== 'undefined') defineAhaInput();

export default { AhaInput, defineAhaInput };
