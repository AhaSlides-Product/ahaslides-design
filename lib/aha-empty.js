/**
 * @ahaslides-product/design/aha-empty — the shared Empty (empty-state) primitive.
 *
 *   import '@ahaslides-product/design/aha-empty';   // registers <aha-empty>
 *   <aha-empty>No responses yet<aha-button slot="action">Share the link</aha-button></aha-empty>
 *
 * The placeholder for a surface with no data: a line-art illustration, a short caption (the
 * default slot), and an optional action (slot="action"). A static display marker — no interactive
 * state, so no motion. ONE element, shadow-DOM CSS, themed only by --aha-* tokens.
 */
// The empty-state illustration is the component's OWN graphic (drawn with currentColor so it
// inherits the token-bound host colour), not a catalogue glyph — the auditable escape hatch applies.
const ART = '<svg width="64" height="41" viewBox="0 0 64 41" fill="none" aria-hidden="true"><ellipse cx="32" cy="33" rx="26" ry="5" stroke="currentColor" stroke-width="1.5" opacity=".5"/><path d="M8 33V16a3 3 0 0 1 3-3h13l4 6h18a3 3 0 0 1 3 3v11" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'; // ds-lint-allow: svg (empty-state illustration — the component's own graphic, not a catalogue icon)
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .empty{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:32px 16px; text-align:center }
  .art{ line-height:0; color:var(--aha-text-disabled,#B5B5B5) }
  .desc{ font-size:14px; line-height:22px; color:var(--aha-text-tertiary,#8A8A8A) }
  .action{ display:flex; gap:8px; margin-top:2px }
  .action:empty{ display:none }
`;

export class AhaEmpty extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="empty" part="empty">
        <div class="art" part="art">${ART}</div>
        <div class="desc" part="desc"><slot>No data</slot></div>
        <div class="action" part="action"><slot name="action"></slot></div>
      </div>`;
  }
}

export function defineAhaEmpty(tag = 'aha-empty') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaEmpty);
  return true;
}
if (typeof window !== 'undefined') defineAhaEmpty();

export default { AhaEmpty, defineAhaEmpty };
