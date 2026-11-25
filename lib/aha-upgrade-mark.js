/**
 * @ahaslides-product/design/aha-upgrade-mark — the upgrade mark as a stand-alone, slot-able glyph.
 *
 *   import '@ahaslides-product/design/aha-upgrade-mark';   // registers <aha-upgrade-mark>
 *   <aha-paywall feature-key="…" required-plan="pro">
 *     <aha-button variant="secondary"><aha-upgrade-mark slot="icon"></aha-upgrade-mark>Add slide</aha-button>
 *   </aha-paywall>
 *
 * The 16px Vivid Pink circle with the white crown that <aha-paywall> draws as its own anchor, usable as the
 * leading icon of an <aha-button>. On a primary (pink) button it inverts itself to a white circle with a
 * pink crown, read from the button it sits in; `inverse` forces that look anywhere else. Decorative: the
 * button's label names the action.
 */
import './icons.js';

const STYLE = `
  :host{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; flex:0 0 auto;
    width:16px; height:16px; border-radius:var(--aha-radius-pill,999px); line-height:0; vertical-align:middle;
    background:var(--aha-color-primary,#E70E68); color:var(--aha-text-inverse,#FFFFFF) }
  :host([inverse]){ background:var(--aha-text-inverse,#FFFFFF); color:var(--aha-color-primary,#E70E68) }
`;

export class AhaUpgradeMark extends HTMLElement {
  static get observedAttributes() { return ['inverse']; }
  get inverse() { return this.hasAttribute('inverse'); }
  set inverse(v) { v ? this.setAttribute('inverse', '') : this.removeAttribute('inverse'); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML =
        `<style>${STYLE}</style><aha-icon name="system-crown-badge-fill" size="12" decorative></aha-icon>`;
    }
    this.setAttribute('aria-hidden', 'true');
    this._follow();
  }
  disconnectedCallback() { this._watch?.disconnect(); this._watch = null; }

  _follow() {
    const button = this.closest('aha-button');
    this._watch?.disconnect();
    this._watch = null;
    if (!button) {
      if (this._auto) this.removeAttribute('inverse');
      this._auto = false;
      return;
    }
    const sync = () => {
      const primary = button.getAttribute('variant') === 'primary';
      if (primary) this.setAttribute('inverse', ''); else if (this._auto) this.removeAttribute('inverse');
      this._auto = primary;
    };
    if (!this.hasAttribute('inverse') || this._auto) sync();
    if (typeof MutationObserver === 'undefined') return;
    this._watch = new MutationObserver(sync);
    this._watch.observe(button, { attributes: true, attributeFilter: ['variant'] });
  }
}

export function defineAhaUpgradeMark(tag = 'aha-upgrade-mark') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaUpgradeMark);
  return true;
}
if (typeof window !== 'undefined') defineAhaUpgradeMark();

export default { AhaUpgradeMark, defineAhaUpgradeMark };
