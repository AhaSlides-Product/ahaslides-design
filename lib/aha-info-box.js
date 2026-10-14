/**
 * @ahaslides-product/design/aha-info-box — the settings callout, drawn by the DS Alert.
 *
 *   import '@ahaslides-product/design/aha-info-box';   // registers <aha-info-box>
 *   <aha-info-box variant="warning" dismissible>Turning this off clears saved responses.</aha-info-box>
 *
 * A thin wrapper over <aha-alert>: the settings API (`variant` information / success / warning / error,
 * `icon`, `dismissible`, the `dismiss` event) maps onto the Alert's `type`, `icon` and `closable`, so the
 * callout has the Alert's look, glyphs, roles and leave animation. Dismissing hides the info box and emits
 * `dismiss`; the host owns any persisted "don't show again" state, and un-hiding the box shows it again.
 */
import './aha-alert.js';

const TYPE = { information: 'info', success: 'success', warning: 'warning', error: 'error' };

const STYLE = `
  :host{ display:block }
  :host([hidden]){ display:none }
`;

export class AhaInfoBox extends HTMLElement {
  static get observedAttributes() { return ['variant', 'dismissible', 'icon']; }
  get variant() { return this.getAttribute('variant') || 'information'; }
  set variant(v) { this.setAttribute('variant', v); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<aha-alert class="box" part="box"><slot></slot></aha-alert>`;
      this._built = true;
      const alert = this.shadowRoot.querySelector('aha-alert');
      alert.addEventListener('close', (e) => e.stopPropagation());
      // The Alert removes itself once it has faded out; put the same node back, hidden, so the box can be shown again.
      new MutationObserver(() => {
        if (alert.isConnected) return;
        const surface = alert.shadowRoot && alert.shadowRoot.querySelector('.alert');
        if (surface) surface.classList.remove('leaving');
        const wasHidden = this.hidden;
        this.hidden = true;
        this.shadowRoot.appendChild(alert);
        if (!wasHidden) this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
      }).observe(this.shadowRoot, { childList: true });
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _sync() {
    const alert = this.shadowRoot.querySelector('aha-alert');
    alert.setAttribute('type', TYPE[this.variant] || TYPE.information);
    const icon = this.getAttribute('icon');
    if (icon) alert.setAttribute('icon', icon); else alert.removeAttribute('icon');
    alert.toggleAttribute('closable', this.hasAttribute('dismissible'));
  }
}

export function defineAhaInfoBox(tag = 'aha-info-box') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInfoBox);
  return true;
}
if (typeof window !== 'undefined') defineAhaInfoBox();

export default { AhaInfoBox, defineAhaInfoBox };
