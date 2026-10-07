/**
 * @ahaslides-product/design/aha-identity-strip — the "Submitting as {emoji} {name}" header.
 *
 *   import '@ahaslides-product/design/aha-identity-strip';   // registers <aha-identity-strip>
 *   <aha-identity-strip name="Linh" emoji="🦊" eyebrow="Round 2"></aha-identity-strip>
 *
 * For a slide that genuinely needs an identity header (a team round showing who is answering). Do not
 * add it as chrome on every slide: the audience app already shows who the participant joined as.
 * One anonymous rule for every slide: no name means anonymous, the host emoji is hidden (it means
 * nothing beside "Guest") and `anonymous-name` stands in. Unboxed, deck ink; the eyebrow is a muted
 * mix of it. `label`, `anonymous-name` and `eyebrow` carry the caller's translated strings.
 */
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

/** A participant is anonymous when the host handed over no name. */
export const isAnonymousParticipant = (name) => !name || String(name).trim() === '';

const STYLE = DECK_STYLE + `
  :host{ display:block; text-align:center }
  p{ margin:0 }
  .eyebrow{ margin-bottom:var(--aha-space-4, 4px); font-size:12px; line-height:18px; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; color:color-mix(in srgb, var(--_ink) 60%, transparent) }
  .eyebrow[hidden], .emoji[hidden]{ display:none }
  .identity{ font-size:16px; line-height:24px; color:var(--_ink) }
  strong{ font-weight:600 }
`;

export class AhaIdentityStrip extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'name', 'emoji', 'label', 'anonymous-name', 'eyebrow']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <p class="eyebrow" part="eyebrow" dir="auto"></p>
      <p class="identity" part="identity"><span class="label"></span> <span class="emoji" aria-hidden="true"></span> <strong dir="auto"></strong></p>`));
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) { super.attributeChangedCallback(name, previous, next); this._sync(); }
  _sync() {
    const root = this.shadowRoot;
    const name = this.getAttribute('name');
    const anonymous = isAnonymousParticipant(name);
    const eyebrow = this.getAttribute('eyebrow') || '';
    root.querySelector('.eyebrow').textContent = eyebrow;
    root.querySelector('.eyebrow').hidden = !eyebrow;
    root.querySelector('.label').textContent = this.getAttribute('label') ?? 'Submitting as';
    const emoji = root.querySelector('.emoji');
    emoji.textContent = this.getAttribute('emoji') || '';
    emoji.hidden = anonymous || !emoji.textContent;
    root.querySelector('strong').textContent = anonymous ? (this.getAttribute('anonymous-name') || 'Guest') : name;
  }
}

export function defineAhaIdentityStrip(tag = 'aha-identity-strip') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaIdentityStrip);
}
if (typeof window !== 'undefined') defineAhaIdentityStrip();
export default { AhaIdentityStrip, defineAhaIdentityStrip, isAnonymousParticipant };
