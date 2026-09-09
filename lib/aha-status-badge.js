/**
 * @ahaslides-product/design/aha-status-badge — the shared Status badge (domain lifecycle pill).
 *
 *   import '@ahaslides-product/design/aha-status-badge';   // registers <aha-status-badge>
 *   <aha-status-badge status="published">Published</aha-status-badge>
 *
 * A glanceable lifecycle state for a domain object (a survey / presentation / collector):
 * draft · published · closed · archived · active · inactive. A coloured dot plus a text label —
 * state is NEVER conveyed by colour alone (status-badges pattern, STATUS-06). ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens. The colour is driven by the `status` attribute
 * (CSS only, one persistent node — no rebuild on state change), and the label is your slotted text.
 * `role="status"` + an `aria-label` (mirrored from the slotted text) announce the state.
 */
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle }
  .pill{ box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; height:22px; padding:0 10px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600;
    border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-gray-20,#F7F7F7); color:var(--aha-text-secondary,#4A4A4A) }
  .dot{ flex:0 0 auto; width:6px; height:6px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-gray-60,#B5B5B5) }
  :host([status="published"]) .pill{ background:var(--aha-bg-positive,#D8FAEF); color:var(--aha-text-positive,#13A181) }
  :host([status="published"]) .dot{ background:var(--aha-color-success,#16C49A) }
  :host([status="closed"]) .pill{ background:var(--aha-bg-warning,#FFF5F0); color:var(--aha-text-warning,#E65B29) }
  :host([status="closed"]) .dot{ background:var(--aha-color-warning,#FF7747) }
  :host([status="archived"]) .pill{ background:var(--aha-gray-25,#F3F3F3); color:var(--aha-text-tertiary,#8A8A8A) }
  :host([status="archived"]) .dot{ background:var(--aha-gray-70,#8A8A8A) }
  :host([status="active"]) .pill{ background:var(--aha-bg-positive,#D8FAEF); color:var(--aha-text-positive,#13A181) }
  :host([status="active"]) .dot{ background:var(--aha-color-success,#16C49A) }
  :host([status="inactive"]) .pill{ background:var(--aha-gray-25,#F3F3F3); color:var(--aha-text-tertiary,#8A8A8A) }
  :host([status="inactive"]) .dot{ background:var(--aha-gray-60,#B5B5B5) }
`;

export class AhaStatusBadge extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="pill" part="pill" role="status"><span class="dot" part="dot" aria-hidden="true"></span><slot></slot></span>`;
      // Mirror the visible label onto aria-label so the state is announced, not conveyed by colour
      // alone (STATUS-05/06). The <slot> stays the source of truth; we only sync the a11y name.
      const slot = this.shadowRoot.querySelector('slot');
      const sync = () => {
        const label = (this.textContent || '').trim();
        if (label) this.shadowRoot.querySelector('.pill').setAttribute('aria-label', label);
      };
      slot.addEventListener('slotchange', sync);
      sync();
    }
  }
}

export function defineAhaStatusBadge(tag = 'aha-status-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatusBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatusBadge();

export default { AhaStatusBadge, defineAhaStatusBadge };
