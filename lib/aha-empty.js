/**
 * @ahaslides-product/design/aha-empty — the shared Empty (empty-state) primitive.
 *
 *   import '@ahaslides-product/design/aha-empty';   // registers <aha-empty>
 *   <aha-empty description="No responses yet">
 *     <aha-button slot="action">Share the link</aha-button>
 *   </aha-empty>
 *
 * The placeholder for a surface with no data: an illustration, a short caption and an optional
 * action. The DS V3 Empty is a small family, not one fixed picture:
 *   • image="default"  a 64×41 line-art illustration (the default)
 *   • image="simple"   a smaller 48×30 low-key graphic for tight / inline surfaces
 *   • a custom picture via slot="image" (overrides the built-in art — the antd Empty/Customize case)
 *   • a caption from the `description` attribute OR the default slot; description="" hides it
 *   • an optional call to action via slot="action"
 * A static display marker — no interactive state, so no motion. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// The empty-state illustration is the component's OWN graphic (drawn with currentColor so it
// inherits the token-bound host colour), not a catalogue glyph — the auditable escape hatch applies.
const ART_DEFAULT = '<svg width="64" height="41" viewBox="0 0 64 41" fill="none" aria-hidden="true"><ellipse cx="32" cy="33" rx="26" ry="5" stroke="currentColor" stroke-width="1.5" opacity=".5"/><path d="M8 33V16a3 3 0 0 1 3-3h13l4 6h18a3 3 0 0 1 3 3v11" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'; // ds-lint-allow: svg (empty-state illustration — the component's own graphic, not a catalogue icon)
const ART_SIMPLE = '<svg width="48" height="30" viewBox="0 0 48 30" fill="none" aria-hidden="true"><ellipse cx="24" cy="24" rx="20" ry="4" stroke="currentColor" stroke-width="1.5" opacity=".5"/><path d="M8 24l3-9h26l3 9M13 15V9h8l2 3h12v3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'; // ds-lint-allow: svg (simple empty-state illustration — the component's own graphic, not a catalogue icon)
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .empty{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:32px 16px; text-align:center }
  /* the simple variant is a lower-key placeholder for tight / inline surfaces */
  :host([image="simple"]) .empty{ padding:20px 16px; gap:8px }
  .art{ line-height:0; color:var(--aha-text-disabled,#B5B5B5) }
  .art .custom{ display:none }
  .art.has-custom .built-in{ display:none }
  .art.has-custom .custom{ display:block }
  .desc{ font-size:14px; line-height:22px; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([image="simple"]) .desc{ font-size:13px; line-height:20px }
  .desc:empty{ display:none }        /* description="" → no caption */
  .action{ display:flex; gap:8px; margin-top:2px }
  .action:empty{ display:none }
`;

export class AhaEmpty extends HTMLElement {
  static get observedAttributes() { return ['image', 'description']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _art() { return this.getAttribute('image') === 'simple' ? ART_SIMPLE : ART_DEFAULT; }
  // The caption: the `description` attribute wins; otherwise the default slot. An explicit
  // description="" renders no slot fallback, so the (empty) node collapses → caption off.
  _desc() {
    const attr = this.getAttribute('description');
    if (attr !== null) return esc(attr);
    return '<slot>No data</slot>';
  }
  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="empty" part="empty">
        <div class="art" part="art">
          <span class="built-in">${this._art()}</span>
          <span class="custom"><slot name="image"></slot></span>
        </div>
        <div class="desc" part="desc">${this._desc()}</div>
        <div class="action" part="action"><slot name="action"></slot></div>
      </div>`;
    // A custom picture (slot="image") supersedes the built-in line art.
    const artEl = this.shadowRoot.querySelector('.art');
    const imgSlot = this.shadowRoot.querySelector('slot[name="image"]');
    const syncArt = () => artEl.classList.toggle('has-custom', imgSlot.assignedNodes().length > 0);
    imgSlot.addEventListener('slotchange', syncArt);
    syncArt();
  }
}

export function defineAhaEmpty(tag = 'aha-empty') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaEmpty);
  return true;
}
if (typeof window !== 'undefined') defineAhaEmpty();

export default { AhaEmpty, defineAhaEmpty };
