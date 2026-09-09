/**
 * @ahaslides-product/design/aha-radio — the shared Radio primitive.
 *
 *   import '@ahaslides-product/design/aha-radio';   // registers <aha-radio>
 *   <aha-radio name="mode" value="poll" checked>Poll</aha-radio>
 *   <aha-radio name="mode" value="quiz">Quiz</aha-radio>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies (no Lit). Radios sharing a `name` are mutually exclusive; selecting one clears
 * its siblings. Emits a composed `change` CustomEvent<{value, checked}>.
 *
 * Motion lives on PERSISTENT nodes (the ring border + the inner dot's scale): the shadow tree is
 * built once, and a state change only toggles the reflected attribute, so the transition fires.
 */
const STYLE = `
  :host{ display:inline-block }
  label{ display:inline-flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); cursor:pointer; user-select:none }
  :host([disabled]) label{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5) }
  input{ position:absolute; opacity:0; width:0; height:0; margin:0 }
  .ring{ position:relative; flex:0 0 auto; width:16px; height:16px; box-sizing:border-box;
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:50%;
    background:var(--aha-bg-container,#fff); display:inline-flex; align-items:center; justify-content:center;
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--aha-color-primary,#6A1EBB);
    transform:scale(0);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  label:hover .ring{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([disabled]) label:hover .ring{ border-color:var(--aha-border-strong,#D4D4D4) }
  :host([checked]) .ring{ border-color:var(--aha-color-primary,#6A1EBB) }
  :host([checked]) .dot{ transform:scale(1) }
  :host([disabled]) .ring{ background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([disabled]) .dot{ background:var(--aha-text-disabled,#B5B5B5) }
  input:focus-visible + .ring{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaRadio extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled']; }
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); }
  get name() { return this.getAttribute('name') || ''; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      // Built ONCE. State changes toggle the reflected attribute on this persistent tree — never a rebuild.
      this.shadowRoot.insertAdjacentHTML('beforeend',
        `<style>${STYLE}</style><label><input type="radio"/><span class="ring"><span class="dot"></span></span><slot></slot></label>`);
      this._built = true;
      this._input = this.shadowRoot.querySelector('input');
      this._sync();
      this._input.addEventListener('change', () => {
        if (this.disabled) { this._sync(); return; }
        this._select();
      });
    }
  }
  attributeChangedCallback() { if (this._input) this._sync(); }

  _sync() { this._input.checked = this.checked; this._input.disabled = this.disabled; }

  _select() {
    if (this.checked) return;
    this.checked = true;
    for (const sib of this._group()) if (sib !== this) sib.checked = false;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value, checked: true } }));
  }

  _group() {
    const nm = this.name;
    if (!nm) return [this];
    const scope = this.getRootNode() || document;
    return [...scope.querySelectorAll('aha-radio')].filter(r => r.name === nm);
  }
}

export function defineAhaRadio(tag = 'aha-radio') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaRadio);
  return true;
}
if (typeof window !== 'undefined') defineAhaRadio();

export default { AhaRadio, defineAhaRadio };
