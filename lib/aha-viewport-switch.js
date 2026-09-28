/**
 * @ahaslides-product/design/aha-viewport-switch — the useIsMobile() shape switch as an element.
 *
 *   import '@ahaslides-product/design/aha-viewport-switch';   // registers <aha-viewport-switch>
 *   <aha-viewport-switch>
 *     <aha-list slot="mobile">…</aha-list>         <!-- below 768px -->
 *     <div slot="desktop">…DataTable…</div>       <!-- 768px and up -->
 *   </aha-viewport-switch>
 *
 * Shows exactly ONE of its two slots, decided by the DS mobile breakpoint `(max-width: 767.98px)`,
 * and reflects the decision as a `mobile` attribute on the host (read-only state for styling hooks).
 * Fires `viewport-change` (detail: { mobile }) when the viewport crosses the breakpoint. For renders
 * that change SHAPE only — pure styling belongs in `@media (max-width: 767.98px)`. The same store is
 * exported here (and from ./viewport) for framework code; React uses useIsMobile() from ./use-is-mobile.
 */
import { isMobileViewport, subscribeMobileViewport } from './viewport.js';

export { MOBILE_MAX_WIDTH, MOBILE_MEDIA_QUERY, isMobileViewport, subscribeMobileViewport } from './viewport.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .branch{ display:block; font-family:inherit }
  :host([mobile]) .desktop, :host(:not([mobile])) .mobile{ display:none }
`;

export class AhaViewportSwitch extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="branch mobile" part="mobile"><slot name="mobile"></slot></div>` +
        `<div class="branch desktop" part="desktop"><slot name="desktop"></slot></div>`;
    }
    this._apply(isMobileViewport(), false);
    this._unsubscribe = subscribeMobileViewport((mobile) => this._apply(mobile, true));
  }
  disconnectedCallback() {
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = null;
  }

  get mobile() { return this.hasAttribute('mobile'); }

  _apply(mobile, notify) {
    if (this.hasAttribute('mobile') === mobile) return;
    this.toggleAttribute('mobile', mobile);
    if (notify) this.dispatchEvent(new CustomEvent('viewport-change', { detail: { mobile }, bubbles: true, composed: true }));
  }
}

export function defineAhaViewportSwitch(tag = 'aha-viewport-switch') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaViewportSwitch);
  return true;
}
if (typeof window !== 'undefined') defineAhaViewportSwitch();

export default { AhaViewportSwitch, defineAhaViewportSwitch };
