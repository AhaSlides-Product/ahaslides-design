/**
 * @ahaslides-product/design/aha-submitted-card — the calm "submitted, waiting for the reveal" card.
 *
 *   import '@ahaslides-product/design/aha-submitted-card';   // registers <aha-submitted-card>
 *   <aha-submitted-card heading="Submitted: Dogs" subtitle="Wait for the presenter to reveal the answer"></aha-submitted-card>
 *
 * The state after a participant has locked in and is waiting for the presenter. A bounded card on the
 * frosted deck surface with the ink hairline, so it reads on a light deck, a dark deck and a
 * photograph. Inside: a round pip on a 10% wash of the deck ink holding a glyph (or the picked
 * option's `image`), a 16px semibold heading and a muted subtitle. Copy stays with the caller.
 */
import './icons.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex:1 1 auto; min-height:0; width:100% }
  .card{ box-sizing:border-box; display:flex; flex:1 1 auto; flex-direction:column; align-items:center; justify-content:center;
    gap:var(--aha-space-6, 6px); padding:var(--aha-space-20, 20px) var(--aha-space-16, 16px); text-align:center; color:var(--_ink);
    border:1px solid var(--_edge); border-radius:var(--aha-radius-lg, 12px);
    background:color-mix(in srgb, var(--_ink) 5%, var(--_surface)); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost) }
  .pip{ display:inline-flex; color:var(--aha-color-success, #16C49A) }
  .picture{ width:96px; height:96px; object-fit:cover; border-radius:var(--aha-radius-default, 8px) }
  .card:not([data-image]) .picture, .card[data-image] .pip{ display:none }
  .text{ display:flex; flex-direction:column; gap:var(--aha-space-6, 6px) }
  p{ margin:0 }
  .heading{ font-size:16px; line-height:24px; font-weight:600 }
  .subtitle{ font-size:12px; line-height:18px; color:var(--_ink-muted) }
`;

export class AhaSubmittedCard extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'heading', 'subtitle', 'icon', 'image']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <div class="card" part="card" role="status">
        <span class="pip" part="pip"><aha-icon name="system-check-circle" size="24" decorative></aha-icon></span>
        <img class="picture" part="image" alt="">
        <div class="text">
          <p class="heading" part="heading" dir="auto"></p>
          <p class="subtitle" part="subtitle" dir="auto"></p>
        </div>
      </div>`));
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) { super.attributeChangedCallback(name, previous, next); this._sync(); }
  _sync() {
    const root = this.shadowRoot;
    root.querySelector('aha-icon').setAttribute('name', this.getAttribute('icon') || 'system-check-circle');
    root.querySelector('.heading').textContent = this.getAttribute('heading') || '';
    root.querySelector('.subtitle').textContent = this.getAttribute('subtitle') || '';
    const image = this.getAttribute('image');
    root.querySelector('.card').toggleAttribute('data-image', !!image);
    if (image) root.querySelector('.picture').setAttribute('src', image);
  }
}

export function defineAhaSubmittedCard(tag = 'aha-submitted-card') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaSubmittedCard);
}
if (typeof window !== 'undefined') defineAhaSubmittedCard();
export default { AhaSubmittedCard, defineAhaSubmittedCard };
