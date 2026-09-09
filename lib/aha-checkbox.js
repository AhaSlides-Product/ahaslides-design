/**
 * @ahaslides-product/design/aha-checkbox — the shared Checkbox primitive.
 *
 *   import '@ahaslides-product/design/aha-checkbox';   // registers <aha-checkbox>
 *   <aha-checkbox checked>Let participants join anonymously</aha-checkbox>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies (no Lit). Emits a composed `change` CustomEvent<{checked}>.
 */
const STYLE = `
  :host{ display:inline-block }
  label{ display:inline-flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); cursor:pointer; user-select:none }
  :host([disabled]) label{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5) }
  input{ position:absolute; opacity:0; width:0; height:0; margin:0 }
  .box{ position:relative; flex:0 0 auto; width:14px; height:14px; box-sizing:border-box;
    border:1px solid var(--aha-checkbox-border,#D4D4D4); border-radius:4px;
    background:var(--aha-bg-container,#fff); transition:all var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  label:hover .box{ border-color:var(--aha-purple-30,#D3B4FF) }
  :host([disabled]) label:hover .box{ border-color:var(--aha-checkbox-border,#D4D4D4) }
  :host([checked]) .box, :host([indeterminate]) .box{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB) }
  :host([disabled]) .box, :host([disabled][checked]) .box{ background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  svg{ position:absolute; inset:0; margin:auto; width:12px; height:12px; display:none }
  .bar{ position:absolute; inset:0; margin:auto; width:8px; height:2px; border-radius:1px; background:var(--aha-text-inverse,#fff); display:none } /* ds-lint-allow: radius (decorative 2px indeterminate bar, sub-scale rounding) */
  :host([checked]) svg{ display:block }
  :host([indeterminate]) svg{ display:none }
  :host([indeterminate]) .bar{ display:block }
  :host([disabled]) svg path{ stroke:var(--aha-text-disabled,#B5B5B5) }
  input:focus-visible + .box{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const TICK = '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.3 4.7 8.5 9.5 3.7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // ds-lint-allow: hex,svg (checkmark tick — sub-glyph chrome drawn on the primary fill, not a catalogue icon)

export class AhaCheckbox extends HTMLElement {
  static get observedAttributes() { return ['checked', 'indeterminate', 'disabled']; }
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get indeterminate() { return this.hasAttribute('indeterminate'); }
  set indeterminate(v) { v ? this.setAttribute('indeterminate', '') : this.removeAttribute('indeterminate'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._input) this._build();
    this._sync();
  }
  attributeChangedCallback() { if (this._input) this._sync(); }

  _build() {
    // Build ONCE with both glyphs baked in; checked/indeterminate then drive :host([checked])/
    // :host([indeterminate]) CSS on the persistent .box and toggle which glyph shows. Rebuilding the
    // subtree on toggle gives the new .box no "from" state and it snaps (the Switch-click trap), so
    // nothing here is re-created on a state change — the live node keeps its transition's "from".
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><label><input type="checkbox"/><span class="box">${TICK}<span class="bar"></span></span><slot></slot></label>`));
    this._input = this.shadowRoot.querySelector('input');
    this._input.addEventListener('change', (e) => {
      if (this.disabled) { e.preventDefault(); return; }
      this.checked = e.target.checked;
      this.indeterminate = false;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { checked: this.checked } }));
    });
  }
  _sync() {
    this._input.checked = this.checked;
    this._input.disabled = this.disabled;
    this._input.indeterminate = this.indeterminate;
  }
}

export function defineAhaCheckbox(tag = 'aha-checkbox') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCheckbox);
  return true;
}
if (typeof window !== 'undefined') defineAhaCheckbox();

export default { AhaCheckbox, defineAhaCheckbox };
