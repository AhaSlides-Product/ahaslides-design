/**
 * @ahaslides-product/design/aha-close-button — DEPRECATED alias. The dismiss ✕ is a tertiary icon-only
 * Button at size xs; use it directly:
 *
 *   <aha-button variant="tertiary" icon-only size="xs" corner aria-label="Close"><aha-icon name="system-x" size="14" decorative></aha-icon></aha-button>
 *
 * This element renders exactly that, so `<aha-close-button label="Dismiss">` keeps working. `label` is the
 * accessible name (default "Close"); a press is a normal bubbling `click` on the host; the
 * --aha-close-line-height / --aha-close-inset / --aha-close-container-padding pinning variables are unchanged.
 */
import './icons.js';
import './aha-button.js';

const STYLE = `
  :host{ display:contents }
  :host([hidden]){ display:none }
`;

export class AhaCloseButton extends HTMLElement {
  static get observedAttributes() { return ['label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<aha-button part="button" variant="tertiary" icon-only size="xs" corner aria-label="Close">` +
          `<aha-icon name="system-x" size="14" decorative></aha-icon></aha-button>`;
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
