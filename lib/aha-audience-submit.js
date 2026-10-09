/**
 * @ahaslides-product/design/aha-audience-submit — the one primary action on an audience phone.
 *
 *   import '@ahaslides-product/design/aha-audience-submit';   // registers <aha-audience-submit>
 *   <aha-audience-submit lock-key="slide-42">Submit</aha-audience-submit>
 *   submit.addEventListener('submit-answer', async () => {
 *     await xprops.submit(answer);
 *     submit.lock(answer);             // or submit.unlock() if the host refused it
 *   });
 *
 * A <aha-button variant="primary" size="touch" block> (48px, 8px corners, 16px semibold) with the
 * audience guarantees added around it:
 *   · the fill is the deck accent and the label the readable black or white for it, through the
 *     --aha-button-primary-* tokens that `applyDeck()` (or the `accent` attribute) publishes;
 *   · the edge is the 1px ink hairline, and keyboard focus draws a 2px outline 1px off the button;
 *   · the label is in the deck's font, not the product font;
 *   · a tap goes busy at once (spinner, no second tap) and fires a cancelable `submit-answer`;
 *   · `lock(value)` locks it on "Answer submitted" with a lock glyph and, with `lock-key`, writes the
 *     submission lock, so every element sharing the key stays locked after an iframe remount;
 *   · `closed` (the host stopped submissions) swaps the label for a lock glyph and "Submissions
 *     closed" in place, with no reflow. Locked, closed and disabled are the DS neutral grey.
 */
import './aha-button.js';
import './icons.js';
import { AudienceElement, DECK_STYLE, submissionLock, watchSubmissionLock } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:block }
  aha-button{ font-family:inherit; --aha-button-primary-border:var(--_edge); --aha-button-focus-outline:2px solid var(--aha-border-focus, #E70E68) }
  .label{ display:inline-flex; align-items:center; gap:var(--aha-space-8, 8px);
    transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .label[hidden]{ display:none }
  :host([loading]) .label{ opacity:.85 }
  @media (prefers-reduced-motion: reduce){ .label{ transition:none } }
`;

export class AhaAudienceSubmit extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'disabled', 'loading', 'closed', 'locked', 'closed-label', 'locked-label', 'lock-key'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <aha-button variant="primary" size="touch" block part="button">
        <span class="label" data-for="open"><slot></slot></span>
        <span class="label" data-for="lock" hidden><aha-icon name="system-lock" size="16" decorative></aha-icon><span class="lock-text"></span></span>
      </aha-button>`));
    this._button = this.shadowRoot.querySelector('aha-button');
    this._button.addEventListener('click', () => this._onClick());
  }
  connectedCallback() {
    super.connectedCallback();
    this._sync();
    this._watchLock();
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      // The lock only ever adds `locked`; the host's own already-submitted flag survives an empty lock.
      if (record || this._lockedByKey) this.toggleAttribute('locked', !!record);
      this._lockedByKey = !!record;
      if (record) this.removeAttribute('loading');
    });
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    this._sync();
  }

  /** Lock this submission (and, with `lock-key`, every element sharing the key, across remounts). */
  lock(value) {
    const key = this.getAttribute('lock-key');
    if (key) submissionLock(key).lock(value);
    this.removeAttribute('loading');
    this.setAttribute('locked', '');
  }
  /** Release the lock, or the busy state after a refused submission, so the participant can try again. */
  unlock() {
    const key = this.getAttribute('lock-key');
    if (key) submissionLock(key).unlock();
    this.removeAttribute('loading');
    this.removeAttribute('locked');
  }

  _blocked() { return ['disabled', 'loading', 'closed', 'locked'].some((name) => this.hasAttribute(name)); }
  _onClick() {
    if (this._blocked()) return;
    this.setAttribute('loading', '');
    const proceed = this.dispatchEvent(new CustomEvent('submit-answer', { bubbles: true, composed: true, cancelable: true }));
    if (!proceed) this.removeAttribute('loading');
  }
  _sync() {
    const closed = this.hasAttribute('closed');
    const locked = this.hasAttribute('locked');
    const showLock = closed || locked;
    this._button.toggleAttribute('disabled', this.hasAttribute('disabled') || showLock);
    this._button.toggleAttribute('loading', this.hasAttribute('loading') && !showLock);
    this.shadowRoot.querySelector('[data-for=open]').hidden = showLock;
    this.shadowRoot.querySelector('[data-for=lock]').hidden = !showLock;
    this.shadowRoot.querySelector('.lock-text').textContent = closed
      ? (this.getAttribute('closed-label') || 'Submissions closed')
      : (this.getAttribute('locked-label') || 'Answer submitted');
  }
}

export function defineAhaAudienceSubmit(tag = 'aha-audience-submit') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceSubmit);
}
if (typeof window !== 'undefined') defineAhaAudienceSubmit();
export default { AhaAudienceSubmit, defineAhaAudienceSubmit };
