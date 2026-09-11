/**
 * @ahaslides-product/design/aha-add-item-button — the full-width "+ Add" affordance.
 *
 *   import '@ahaslides-product/design/aha-add-item-button';   // registers <aha-add-item-button>
 *   <aha-add-item-button label="Add option"></aha-add-item-button>
 *   <aha-add-item-button label="Add question" disabled></aha-add-item-button>
 *
 * The tertiary/subtle full-width add row that sits under a settings list (OptionRow / QuestionList):
 * a dashed 1px border, radius 8, transparent/white fill, a leading system-plus glyph + the label.
 * On click it emits a composed `add` CustomEvent so the host can append a new item. When it hits the
 * max item count the host sets `disabled` → muted, no hover, aria-disabled.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * The hover tint (border + text toward brand, faint accent fill) animates via the shared motion
 * tokens on the PERSISTENT <button> node — an attribute/state toggles, the subtree is never rebuilt,
 * so the transition actually fires. The `+` icon is decorative; the label carries the accessible
 * name. Zero dependencies. Icons are summoned by name from the DS icon library via <aha-icon>.
 */
import './icons.js'; // registers <aha-icon> so the system-plus glyph resolves from the DS library

const STYLE = `
  :host{ display:block; width:100% }
  /* the button is the persistent node that carries the hover tint (animated, never rebuilt) */
  button{
    box-sizing:border-box; width:100%; height:40px; margin:0; padding:0 12px;
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-weight:600; font-size:14px; line-height:1;
    color:var(--aha-text-secondary,#4A4A4A); background:var(--aha-bg-container,#fff);
    border:1px dashed var(--aha-border,#E3E3E3); border-radius:8px;
    cursor:pointer; white-space:nowrap; user-select:none;
    transition:border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
               color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
               background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  button:hover{ border-color:var(--aha-color-primary,#6A1EBB); color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF) }
  button:focus-visible{ outline:none; border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }
  aha-icon{ display:inline-flex; color:currentColor }

  /* disabled — muted, no hover, not-allowed */
  :host([disabled]) button{ color:var(--aha-text-disabled,#B5B5B5); border-color:var(--aha-border-disabled,#EBEBEB);
    background:var(--aha-bg-container,#fff); cursor:not-allowed }
  :host([disabled]) button:hover{ border-color:var(--aha-border-disabled,#EBEBEB); color:var(--aha-text-disabled,#B5B5B5); background:var(--aha-bg-container,#fff) }

  @media (prefers-reduced-motion: reduce){ button{ transition:none } }
`;

export class AhaAddItemButton extends HTMLElement {
  static get observedAttributes() { return ['label', 'disabled']; }

  get label() { return this.getAttribute('label') ?? 'Add'; }
  set label(v) { this.setAttribute('label', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { this._sync(); }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<button part="button" type="button">` +
        `<aha-icon name="system-plus" size="16" decorative></aha-icon>` +
        `<span class="label" part="label"></span>` +
      `</button>`;
    const btn = this.shadowRoot.querySelector('button');
    btn.addEventListener('click', (e) => {
      if (this.disabled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      this.dispatchEvent(new CustomEvent('add', { bubbles: true, composed: true, detail: {} }));
    });
    this._sync();
  }
  _sync() {
    const btn = this.shadowRoot && this.shadowRoot.querySelector('button');
    if (!btn) return;
    const label = this.getAttribute('label') ?? 'Add';
    this.shadowRoot.querySelector('.label').textContent = label;
    btn.disabled = this.disabled;
    if (this.disabled) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
  }
}

export function defineAhaAddItemButton(tag = 'aha-add-item-button') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAddItemButton);
  return true;
}
if (typeof window !== 'undefined') defineAhaAddItemButton();

export default { AhaAddItemButton, defineAhaAddItemButton };
