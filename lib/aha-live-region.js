/**
 * @ahaslides-product/design/aha-live-region — the shared screen-reader announcement region.
 *
 *   import '@ahaslides-product/design/aha-live-region';   // registers <aha-live-region>
 *   <aha-live-region id="announcer"></aha-live-region>        <!-- mount once, keep it mounted -->
 *   document.getElementById('announcer').announce('Slide 3 of 12 saved');
 *   <aha-live-region message="3 results"></aha-live-region>   <!-- or drive it declaratively -->
 *
 * An aria-live region that is ALWAYS in the DOM — including while empty — so assistive tech is already
 * tracking it when a message arrives. aria-live="assertive" + aria-atomic="true" by default
 * (politeness="polite" for non-urgent updates) and deliberately NO role="alert", which would make a
 * screen reader announce the text twice. Visually hidden unless `visible` is set.
 *
 * announce(text) clears the region, then writes the text on the next tick, so announcing the SAME
 * message twice is still heard twice (an unchanged text node is not a change to a live region).
 * The text lives in the host's light DOM so the live-region mutation is observed directly.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  :host(:not([visible])){ position:absolute; width:1px; height:1px; margin:-1px; padding:0; border:0;
    overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap }
  .text{ font-family:inherit }
`;

const ANNOUNCE_DELAY_MS = 50;

export class AhaLiveRegion extends HTMLElement {
  static get observedAttributes() { return ['message', 'politeness']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="text" part="text"><slot></slot></span>`;
    }
    this._syncPoliteness();
    if (this.hasAttribute('message')) this._write(this.getAttribute('message'));
  }
  disconnectedCallback() { clearTimeout(this._pendingAnnouncement); }

  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'politeness') this._syncPoliteness();
    else this._write(this.getAttribute('message') || '');
  }

  announce(text) {
    clearTimeout(this._pendingAnnouncement);
    this.textContent = '';
    this._pendingAnnouncement = setTimeout(() => { this.textContent = text || ''; }, ANNOUNCE_DELAY_MS);
  }

  clear() {
    clearTimeout(this._pendingAnnouncement);
    this.textContent = '';
  }

  _write(text) {
    clearTimeout(this._pendingAnnouncement);
    if (this.textContent !== text) this.textContent = text;
  }

  _syncPoliteness() {
    this.setAttribute('aria-live', this.getAttribute('politeness') === 'polite' ? 'polite' : 'assertive');
    this.setAttribute('aria-atomic', 'true');
  }
}

export function defineAhaLiveRegion(tag = 'aha-live-region') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLiveRegion);
  return true;
}
if (typeof window !== 'undefined') defineAhaLiveRegion();

export default { AhaLiveRegion, defineAhaLiveRegion };
