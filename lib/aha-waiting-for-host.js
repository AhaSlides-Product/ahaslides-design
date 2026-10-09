/**
 * @ahaslides-product/design/aha-waiting-for-host — the centred "waiting for the presenter" screen.
 *
 *   import '@ahaslides-product/design/aha-waiting-for-host';   // registers <aha-waiting-for-host>
 *   <aha-waiting-for-host headline="Waiting for the host" subline="The question appears as soon as they start."></aha-waiting-for-host>
 *
 * The lobby / passive-phase screen. It renders the screen only: whether the participant should be
 * here at all (host quiz status, presentation not started) is the slide's decision, so show it with
 * `hidden` or by mounting it. Unboxed, deck ink throughout, the sub-line a muted mix of it. The glyph
 * breathes gently (opacity only) and holds still under prefers-reduced-motion. Copy and translation
 * stay with the caller (attributes, or the `headline` / `subline` slots).
 */
import './icons.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex:1 1 auto; min-height:0; width:100% }
  .screen{ box-sizing:border-box; display:flex; flex:1 1 auto; flex-direction:column; align-items:center; justify-content:center;
    gap:var(--aha-space-8, 8px); padding:var(--aha-space-20, 20px) 0; text-align:center; color:var(--_ink) }
  .glyph{ line-height:0; color:var(--_ink-muted); animation:aha-waiting-breathe calc(var(--aha-motion-viz-enter, .6s) * 3) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) infinite alternate }
  @keyframes aha-waiting-breathe{ from{ opacity:1 } to{ opacity:.45 } }
  p{ margin:0 }
  .headline{ font-size:16px; line-height:24px; font-weight:600 }
  .subline{ font-size:14px; line-height:21px; color:var(--_ink-muted) }
  .subline[hidden]{ display:none }
  @media (prefers-reduced-motion: reduce){ .glyph{ animation:none } }
`;

export class AhaWaitingForHost extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'headline', 'subline', 'icon']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <div class="screen" part="screen" aria-live="polite">
        <span class="glyph" part="glyph"><aha-icon name="system-hourglass-high" size="32" decorative></aha-icon></span>
        <p class="headline" part="headline" dir="auto"><slot name="headline"></slot></p>
        <p class="subline" part="subline" dir="auto"><slot name="subline"></slot></p>
      </div>`));
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) { super.attributeChangedCallback(name, previous, next); this._sync(); }
  _sync() {
    this.shadowRoot.querySelector('aha-icon').setAttribute('name', this.getAttribute('icon') || 'system-hourglass-high');
    this.shadowRoot.querySelector('slot[name=headline]').textContent = this.getAttribute('headline') || '';
    const subline = this.getAttribute('subline') || '';
    const sublineSlot = this.shadowRoot.querySelector('slot[name=subline]');
    sublineSlot.textContent = subline;
    this.shadowRoot.querySelector('.subline').toggleAttribute('hidden', !subline && !this.querySelector('[slot=subline]'));
  }
}

export function defineAhaWaitingForHost(tag = 'aha-waiting-for-host') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaWaitingForHost);
}
if (typeof window !== 'undefined') defineAhaWaitingForHost();
export default { AhaWaitingForHost, defineAhaWaitingForHost };
