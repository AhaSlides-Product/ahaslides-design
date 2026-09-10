/**
 * @ahaslides-product/design/aha-counted-input — a single-line field with a focus-only counter.
 *
 *   import '@ahaslides-product/design/aha-counted-input';   // registers <aha-counted-input>
 *   <aha-counted-input maxlength="80" placeholder="Option text"></aha-counted-input>
 *
 * The settings-panel text field: a normal single-line input whose character counter is REVEALED
 * ONLY WHILE THE FIELD IS FOCUSED and hidden at rest (SETTINGS-21 / SETTINGS-42). The counter is a
 * PERSISTENT overlay INSIDE the field (absolute, right-aligned) — never a sibling beside the field
 * (which would steal width and misalign stacked fields), and never remounted on focus. Focus just
 * toggles an attribute on a persistent node, so the opacity transition actually fires (no
 * dead-transition rebuild). The right padding for the counter is always reserved, so revealing it
 * never shifts the text. ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical
 * in React and Vue. Zero deps. Emits composed `input` / `change` CustomEvent<{value}>.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; width:240px }
  /* persistent wrapper carries border + focus ring (animated, never rebuilt) */
  .wrap{ box-sizing:border-box; position:relative; width:100%; display:inline-flex; align-items:center; gap:8px;
    height:32px; padding:0 12px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px; padding:0 8px }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:40px }

  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; padding:0; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:inherit; background:transparent; border:0; outline:none }
  .field::placeholder{ color:var(--aha-text-tertiary,#8A8A8A) }
  /* reserve room for the counter overlay so revealing it never shifts the text */
  :host([_counted]) .field{ padding-right:44px }

  /* the counter — a PERSISTENT overlay inside the field, revealed only on focus (opacity, no remount) */
  .counter{ position:absolute; right:12px; top:50%; transform:translateY(-50%);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-tertiary,#8A8A8A); pointer-events:none; opacity:0;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([size="sm"]) .counter, :host([size="small"]) .counter{ right:8px }
  :host([_focused][_counted]) .counter{ opacity:1 }
  .counter[hidden]{ display:none }

  /* hover / focus on the persistent wrapper */
  .wrap:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .wrap{ border-color:var(--aha-border-error,#F5222D) }
  :host([status="error"][_focused]) .wrap{
    border-color:var(--aha-border-error,#F5222D); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }

  /* disabled + readonly */
  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field{ cursor:not-allowed }
  :host([readonly]) .wrap{ background:var(--aha-bg-container-secondary,#F7F7F7) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaCountedInput extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'maxlength', 'disabled', 'readonly', 'status', 'size'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() {
    // every change is a cheap sync — the DOM shape never changes, so the counter transition stays alive
    if (this.shadowRoot) this._sync();
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="wrap" part="wrap">` +
        `<input class="field" part="field"/>` +
        `<span class="counter" part="counter" aria-hidden="true"></span>` +
      `</div>`;
    const f = this.shadowRoot.querySelector('.field');
    f.addEventListener('input', () => {
      this.setAttribute('value', f.value);
      this._syncCounter();
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    f.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    // focus toggles an attribute on :host (persistent node) — no rebuild, the counter transition fires
    f.addEventListener('focus', () => this.setAttribute('_focused', ''));
    f.addEventListener('blur', () => this.removeAttribute('_focused'));
    this._sync();
  }
  _syncCounter() {
    const max = this.getAttribute('maxlength');
    const counter = this.shadowRoot.querySelector('.counter');
    if (max) {
      this.setAttribute('_counted', '');
      counter.hidden = false;
      counter.textContent = `${(this.value || '').length}/${max}`;
    } else {
      this.removeAttribute('_counted');
      counter.hidden = true;
    }
  }
  _sync() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    f.placeholder = this.getAttribute('placeholder') || '';
    f.disabled = this.disabled;
    f.readOnly = this.hasAttribute('readonly');
    const max = this.getAttribute('maxlength');
    if (max) f.setAttribute('maxlength', max); else f.removeAttribute('maxlength');
    if (this.getAttribute('status') === 'error') f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (f.value !== this.value) f.value = this.value;
    this._syncCounter();
  }
}

export function defineAhaCountedInput(tag = 'aha-counted-input') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCountedInput);
  return true;
}
if (typeof window !== 'undefined') defineAhaCountedInput();

export default { AhaCountedInput, defineAhaCountedInput };
