/**
 * @ahaslides-product/design/aha-switch — the shared Switch primitive.
 *
 *   import '@ahaslides-product/design/aha-switch';   // registers <aha-switch>
 *   <aha-switch checked></aha-switch>
 *   <aha-switch size="small"></aha-switch>
 *   <aha-switch loading></aha-switch>
 *   <aha-switch on-text="On" off-text="Off"></aha-switch>
 *   <aha-switch on-icon="system-check" off-icon="system-x"></aha-switch>
 *
 * A single setting that takes effect immediately (use Checkbox when options are saved as a
 * group). ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React
 * and Vue. Emits a composed `change` CustomEvent<{checked}>.
 *
 * DS V3 / AntD matrix:
 *   size          — default | small
 *   disabled      — non-interactive, 40% opacity
 *   loading       — a spinner rides in the knob; interaction is blocked while it spins
 *   checked/unchecked children — optional text (…-children) or an icon (…-icon) shown INSIDE the
 *                   track, on the side away from the knob (checked → left, unchecked → right)
 *
 * The `checked` and `loading` states toggle a HOST ATTRIBUTE that drives :host([…]) rules on the
 * PERSISTENT .track/.knob — the subtree is never rebuilt on those toggles, so the knob-slide CSS
 * transition keeps its "from" value and actually fires (the Switch-click trap). Only structural
 * attrs (size + the children/icon content) re-render the subtree.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex }
  .track{ position:relative; box-sizing:border-box; width:44px; height:22px; flex:0 0 auto;
    background:var(--aha-gray-20,#F7F7F7); border:1px solid var(--aha-gray-50,#D4D4D4); border-radius:var(--aha-radius-pill,999px);
    cursor:pointer; outline:2px solid transparent; outline-offset:2px;
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), outline-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .knob{ position:absolute; top:50%; left:2px; width:18px; height:18px; border-radius:50%;
    background:var(--aha-white,#FFFFFF); box-shadow:0 1px 2px rgba(0,0,0,.15); transform:translate(0,-50%);
    display:inline-flex; align-items:center; justify-content:center;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)) }
  :host([checked]) .track{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB) }
  :host([checked]) .knob{ transform:translate(20px,-50%) }
  :host([disabled]) .track{ opacity:.4; cursor:not-allowed }
  :host([loading]) .track{ cursor:wait }
  .track:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }

  /* checked / unchecked content INSIDE the track, away from the knob */
  .children{ position:absolute; top:0; height:100%; display:inline-flex; align-items:center; justify-content:center;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; font-weight:600; line-height:1;
    color:var(--aha-white,#FFFFFF); white-space:nowrap; pointer-events:none;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .children aha-icon{ color:currentColor }
  .children.on{ left:6px; right:22px; opacity:0 }
  .children.off{ left:22px; right:6px; color:var(--aha-text-tertiary,#8A8A8A); opacity:1 }
  :host([checked]) .children.on{ opacity:1 }
  :host([checked]) .children.off{ opacity:0 }

  /* the loading spinner rides in the knob */
  .spin{ display:none; color:var(--aha-color-primary,#6A1EBB); animation:aha-switch-spin var(--aha-motion-slow,.3s) linear infinite }
  :host([loading]) .spin{ display:inline-flex }
  :host([checked][loading]) .spin{ color:var(--aha-color-primary,#6A1EBB) }
  @keyframes aha-switch-spin{ to{ transform:rotate(360deg) } }

  /* small size */
  :host([size="small"]) .track{ width:28px; height:16px }
  :host([size="small"]) .knob{ width:12px; height:12px }
  :host([size="small"]) .children{ font-size:10px }
  :host([size="small"]) .children.on{ left:5px; right:16px }
  :host([size="small"]) .children.off{ left:16px; right:5px }
  :host([size="small"][checked]) .knob{ transform:translate(12px,-50%) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important; animation:none !important } }
`;

export class AhaSwitch extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled', 'loading', 'size', 'on-text', 'off-text', 'on-icon', 'off-icon']; }
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get loading() { return this.hasAttribute('loading'); }
  set loading(v) { v ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._track) this._build();
    this._sync();
  }
  attributeChangedCallback(name) {
    if (!this._track) return;
    // Structural attrs change the content → rebuild the children/knob subtree. The animated state
    // attrs (checked/loading) DON'T rebuild — they only drive :host([…]) on the persistent nodes,
    // so the knob-slide transition keeps its "from" and fires (the Switch-click trap).
    if (name === 'on-text' || name === 'off-text' || name === 'on-icon' || name === 'off-icon') this._fill();
    this._sync();
  }

  _build() {
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><span class="track" part="track" role="switch" tabindex="0">` +
        `<span class="children on" part="children-checked" aria-hidden="true"></span>` +
        `<span class="children off" part="children-unchecked" aria-hidden="true"></span>` +
        `<span class="knob" part="knob"><aha-icon class="spin" name="system-circle-notch" size="12" aria-hidden="true"></aha-icon></span>` +
      `</span>`));
    this._track = this.shadowRoot.querySelector('.track');
    this._knob = this.shadowRoot.querySelector('.knob');
    this._fill();
    const toggle = () => {
      if (this.disabled || this.loading) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { checked: this.checked } }));
    };
    this._track.addEventListener('click', toggle);
    this._track.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
  }

  // Paint the in-track children (icon wins over text) + the knob spinner. Runs on build and when a
  // content attr changes — NOT on the checked/loading toggle, which the persistent CSS handles.
  _content(icon, text) {
    if (icon) return `<aha-icon name="${esc(icon)}" size="12" aria-hidden="true"></aha-icon>`;
    if (text != null && text !== '') return esc(text);
    return '';
  }
  // Set a persistent node's content from an HTML string WITHOUT innerHTML= (so this stays off the
  // dead-transition rebuild path — the spinner is built once in _build, this only swaps the labels).
  _set(node, html) {
    while (node.firstChild) node.removeChild(node.firstChild);
    if (html) node.append(document.createRange().createContextualFragment(html));
  }
  _fill() {
    this._set(this.shadowRoot.querySelector('.children.on'), this._content(this.getAttribute('on-icon'), this.getAttribute('on-text')));
    this._set(this.shadowRoot.querySelector('.children.off'), this._content(this.getAttribute('off-icon'), this.getAttribute('off-text')));
  }
  _sync() {
    this._track.setAttribute('aria-checked', String(this.checked));
    if (this.disabled || this.loading) this._track.setAttribute('aria-disabled', 'true');
    else this._track.removeAttribute('aria-disabled');
    this._track.setAttribute('aria-busy', String(this.loading));
    this._track.tabIndex = this.disabled ? -1 : 0;
  }
}

export function defineAhaSwitch(tag = 'aha-switch') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSwitch);
  return true;
}
if (typeof window !== 'undefined') defineAhaSwitch();

export default { AhaSwitch, defineAhaSwitch };
