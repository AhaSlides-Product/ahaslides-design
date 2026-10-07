/**
 * @ahaslides-product/design/aha-audience-chip — one short tappable choice, several to a line.
 *
 *   import '@ahaslides-product/design/aha-audience-chip';   // registers <aha-audience-chip>
 *   <aha-audience-chip>Remote</aha-audience-chip>
 *   <aha-audience-chip selected>Hybrid</aha-audience-chip>
 *   chip.addEventListener('change', (e) => e.detail.selected);
 *
 * For short labels where several fit on a line and the participant scans the SET (and the mobile
 * answer to a dropdown: every choice visible at once). A full-width answer row is <aha-answer-option>.
 * Not <aha-tag checkable>: that one is a 22px label chip on a fixed grey with a fixed purple, built for
 * app screens. This one sits on the frosted deck surface with the ink hairline, is never shorter than
 * the 44px touch floor, carries the deck's font into its <button>, and marks "chosen" with the deck
 * accent (2px edge plus a 14% tint under the label, so the label keeps the deck ink). A tap toggles
 * `selected` and emits composed `change` { selected }.
 */
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:inline-flex; max-width:100% }
  button{ position:relative; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; max-width:100%;
    min-height:44px; padding:0 var(--aha-space-16, 16px); margin:0; cursor:pointer;
    font-size:16px; line-height:24px; font-weight:600; color:var(--_ink); text-align:center;
    border:1px solid var(--_edge); border-radius:var(--aha-radius-lg, 12px);
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    transition:border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  button:hover{ background:var(--_surface-hover); border-color:var(--_edge-hover) }
  button:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .tint{ position:absolute; inset:0; border-radius:inherit; background:var(--_mark); opacity:0; pointer-events:none;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .text{ position:relative; overflow-wrap:anywhere }
  :host([selected]) button{ border-color:var(--_mark); box-shadow:inset 0 0 0 1px var(--_mark) }
  :host([selected]) .tint{ opacity:.14 }
  :host([disabled]) button{ cursor:default; opacity:.45 }
  :host([disabled]) button:hover{ background:var(--_surface); border-color:var(--_edge) }
  @media (prefers-reduced-motion: reduce){ button, .tint{ transition:none } }
`;

export class AhaAudienceChip extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'selected', 'disabled']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><button type="button" part="chip" aria-pressed="false"><span class="tint"></span><span class="text" dir="auto"><slot></slot></span></button>`));
    this._button = this.shadowRoot.querySelector('button');
    this._button.addEventListener('click', () => {
      if (this.hasAttribute('disabled')) return;
      this.toggleAttribute('selected');
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { selected: this.selected } }));
    });
  }
  get selected() { return this.hasAttribute('selected'); }
  set selected(value) { this.toggleAttribute('selected', !!value); }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) { super.attributeChangedCallback(name, previous, next); this._sync(); }
  _sync() {
    this._button.setAttribute('aria-pressed', String(this.selected));
    this._button.disabled = this.hasAttribute('disabled');
  }
}

export function defineAhaAudienceChip(tag = 'aha-audience-chip') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceChip);
}
if (typeof window !== 'undefined') defineAhaAudienceChip();
export default { AhaAudienceChip, defineAhaAudienceChip };
