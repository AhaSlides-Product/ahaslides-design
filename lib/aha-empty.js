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
 *   • image="default"  the pink empty-list illustration at 64 px (the default)
 *   • image="simple"   the same illustration at 48 px, with tighter spacing, for tight / inline surfaces
 *   • image="none"     text-only: no illustration, just the caption (and action)
 *   • a custom picture via slot="image" (overrides the built-in art — the antd Empty/Customize case)
 *   • a caption from the `description` attribute OR the default slot; description="" hides it
 *   • an optional call to action via slot="action"
 * A static display marker — no interactive state, so no motion. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. The art is called by name from
 * the illustration registry through <aha-illustration>, loaded lazily so the element stays SSR-safe.
 * Only empty-list and empty-table load with it; a slot="image" picture with any other name needs
 * `import '@ahaslides-product/design/illustrations'`.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
if (typeof window !== 'undefined') import('./illustrations-empty.js');

const ART_NAME = 'empty-list';
const ART_SIZE = { default: '64', simple: '48' };
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .empty{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:32px 16px; text-align:center }
  /* the simple variant is a lower-key placeholder for tight / inline surfaces */
  :host([image="simple"]) .empty{ padding:20px 16px; gap:8px }
  .art{ line-height:0 }
  .art .custom{ display:none }
  .art.has-custom .built-in{ display:none }
  .art.has-custom .custom{ display:block }
  :host([image="none"]) .art{ display:none }
  .desc{ font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5); color:var(--aha-text-tertiary,#8A8A8A) }
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

  _art() {
    const size = this.getAttribute('image') === 'simple' ? ART_SIZE.simple : ART_SIZE.default;
    return `<aha-illustration name="${ART_NAME}" size="${size}" decorative></aha-illustration>`;
  }
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
    // A custom picture (slot="image") supersedes the built-in illustration.
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
