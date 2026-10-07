/**
 * @ahaslides-product/design/aha-instruction-line — the one quiet instruction line on an audience phone.
 *
 *   import '@ahaslides-product/design/aha-instruction-line';   // registers <aha-instruction-line>
 *   <aha-instruction-line>Swipe a card, or tap a side</aha-instruction-line>
 *
 * The default audience body: 16px, regular 400, centred, in the deck ink. Unboxed on purpose: no
 * pill, card, border or tint, so the deck shows straight through and every slide's instruction reads
 * identically. The text is a slot, so the caller keeps the copy and its translation. Announced
 * politely when it changes.
 */
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:block }
  p{ margin:0; text-align:center; font-size:16px; line-height:24px; font-weight:400; color:var(--_ink) }
`;

export class AhaInstructionLine extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes]; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><p part="text" aria-live="polite" dir="auto"><slot></slot></p>`));
  }
}

export function defineAhaInstructionLine(tag = 'aha-instruction-line') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaInstructionLine);
}
if (typeof window !== 'undefined') defineAhaInstructionLine();
export default { AhaInstructionLine, defineAhaInstructionLine };
