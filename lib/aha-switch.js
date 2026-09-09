/**
 * @ahaslides-product/design/aha-switch — the shared Switch primitive.
 *
 *   import '@ahaslides-product/design/aha-switch';   // registers <aha-switch>
 *   <aha-switch checked></aha-switch>
 *
 * A single setting that takes effect immediately (use Checkbox when options are saved as a
 * group). ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React
 * and Vue. Zero dependencies. Emits a composed `change` CustomEvent<{checked}>.
 */
const STYLE = `
  :host{ display:inline-flex }
  .track{ position:relative; box-sizing:border-box; width:44px; height:22px; flex:0 0 auto;
    background:var(--aha-gray-20,#F7F7F7); border:1px solid var(--aha-gray-50,#D4D4D4); border-radius:var(--aha-radius-pill,999px);
    cursor:pointer; outline:2px solid transparent; outline-offset:2px;
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), outline-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .knob{ position:absolute; top:50%; left:2px; width:18px; height:18px; border-radius:50%;
    background:var(--aha-white,#FFFFFF); box-shadow:0 1px 2px rgba(0,0,0,.15); transform:translate(0,-50%); transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)) }
  :host([checked]) .track{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB) }
  :host([checked]) .knob{ transform:translate(20px,-50%) }
  :host([disabled]) .track{ opacity:.4; cursor:not-allowed }
  .track:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSwitch extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled']; }
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="track" part="track" role="switch" tabindex="0" aria-checked="${this.checked}"><span class="knob"></span></span>`;
    const track = this.shadowRoot.querySelector('.track');
    const toggle = () => {
      if (this.disabled) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { checked: this.checked } }));
    };
    track.addEventListener('click', toggle);
    track.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
  }
}

export function defineAhaSwitch(tag = 'aha-switch') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSwitch);
  return true;
}
if (typeof window !== 'undefined') defineAhaSwitch();

export default { AhaSwitch, defineAhaSwitch };
