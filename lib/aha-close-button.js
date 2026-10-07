/**
 * @ahaslides-product/design/aha-close-button — the one dismiss ✕ in the design system: Alert, Info box,
 * Background task, Toast, Notification, Modal and Drawer (the last two through dismissibleModalTitle /
 * dismissibleDrawerTitle, antd's own close off), plus the CSAT follow-up and the Uploader remove.
 *
 *   import '@ahaslides-product/design/aha-close-button';   // registers <aha-close-button> (+ <aha-icon>)
 *   <aha-close-button label="Dismiss"></aha-close-button>
 *
 * A native <button> with a 20 × 20 hit area (radius 6) holding the 14px `system-x` glyph in
 * --aha-icon-muted (#8A8A8A); hover turns the glyph --aha-text-default on --aha-bg-hover over 100ms.
 * As a flex item it sits at the end of the row, pinned to the top, with its centre 2.5px above the
 * centre of the FIRST line of text, so it stays put when the text wraps; it overhangs the container's
 * end padding by 2px so it sits in the corner. The container passes:
 *
 *   --aha-close-line-height        the first line's line box (default 21px, the 14px body line)
 *   --aha-close-inset              optional: a fixed distance from the container's end edge instead,
 *   --aha-close-container-padding  measured against this end padding (border included)
 *
 *   label    accessible name (default "Close") — pass the translated string
 *
 * A press is a normal bubbling `click` on the host. The shadow DOM is built once; `label` updates the
 * persistent button in place.
 */
import './icons.js';

const STYLE = `
  :host{ flex:0 0 auto; align-self:flex-start; display:inline-flex; line-height:0;
    margin-block:calc((var(--aha-close-line-height, 21px) - var(--aha-space-20, 20px)) / 2 - 2.5px) 0; /* ds-lint-allow: spacing (2.5px optical lift of the 0.92 Info box ✕, off the space scale) */
    margin-inline-start:auto;
    margin-inline-end:calc(var(--aha-close-inset, calc(var(--aha-close-container-padding, var(--aha-space-2, 2px)) - var(--aha-space-2, 2px))) - var(--aha-close-container-padding, var(--aha-space-2, 2px))) }
  :host([hidden]){ display:none }
  button{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
    width:var(--aha-space-20,20px); height:var(--aha-space-20,20px); padding:0; margin:0; border:0;
    border-radius:var(--aha-radius-sm,6px); background:transparent; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  button:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  button:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:0 }
  @media (prefers-reduced-motion: reduce){ button{ transition:none } }
`;

export class AhaCloseButton extends HTMLElement {
  static get observedAttributes() { return ['label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<button part="button" type="button" aria-label="Close">` +
          `<aha-icon name="system-x" size="14" decorative></aha-icon></button>`;
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const button = this.shadowRoot.querySelector('button');
    const label = this.getAttribute('label') || 'Close';
    if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
  }
}

export function defineAhaCloseButton(tag = 'aha-close-button') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCloseButton);
  return true;
}
if (typeof window !== 'undefined') defineAhaCloseButton();

export default { AhaCloseButton, defineAhaCloseButton };
