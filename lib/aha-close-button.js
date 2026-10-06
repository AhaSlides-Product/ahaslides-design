/**
 * @ahaslides-product/design/aha-close-button — the one dismiss ✕ for Alert, Info box, Background task,
 * Toast and Notification. Modal and Drawer keep the ✕ in their own header.
 *
 *   import '@ahaslides-product/design/aha-close-button';   // registers <aha-close-button> (+ <aha-button>, <aha-icon>)
 *   <aha-close-button label="Dismiss"></aha-close-button>
 *
 * It is the DS tertiary <aha-button> at small size (28 × 28, icon-only) holding the 16px `system-x` glyph,
 * so size, hover and focus ring are the button's own. As a flex item it sits at the end of the row,
 * centred on the FIRST line of text (and on the leading icon), so it stays put when the text wraps.
 * The container passes two numbers through custom properties:
 *
 *   --aha-close-line-height        the first line's line box (default 28px = no offset)
 *   --aha-close-container-padding  the container's inline-end padding; the button then lands
 *                                  --aha-close-inset (8px) from the container's edge, the same everywhere
 *
 *   label    accessible name (default "Close") — pass the translated string
 *
 * A press is a normal bubbling `click` on the host. The shadow DOM is built once; `label` updates the
 * persistent button in place.
 */
import './icons.js';
import './aha-button.js';

const STYLE = `
  :host{ flex:0 0 auto; align-self:flex-start; display:inline-flex; line-height:0;
    margin-block:calc((var(--aha-close-line-height, var(--aha-space-28, 28px)) - var(--aha-space-28, 28px)) / 2);
    margin-inline-start:auto;
    margin-inline-end:calc(var(--aha-close-inset, var(--aha-space-8, 8px)) - var(--aha-close-container-padding, var(--aha-space-8, 8px))) }
  :host([hidden]){ display:none }
`;

export class AhaCloseButton extends HTMLElement {
  static get observedAttributes() { return ['label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<aha-button part="button" variant="tertiary" size="sm" icon-only aria-label="Close">` +
          `<aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>`;
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const button = this.shadowRoot.querySelector('aha-button');
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
