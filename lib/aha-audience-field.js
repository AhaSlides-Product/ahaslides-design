/**
 * @ahaslides-product/design/aha-audience-field — a labelled text, number or dropdown field on the audience phone.
 *
 *   import '@ahaslides-product/design/aha-audience-field';   // registers <aha-audience-field>
 *   import '@ahaslides-product/design/aha-counted-input';
 *   <aha-audience-field label="Your nickname">
 *     <aha-counted-input size="lg" maxlength="30" style="width:100%"></aha-counted-input>
 *   </aha-audience-field>
 *
 * The control itself is the shared DS field, never a copy: <aha-counted-input size="lg"> (a line),
 * <aha-counted-textarea size="lg"> (several lines), <aha-counted-input type="number" maxlength="none" size="lg"> (a number),
 * <aha-select size="lg"> (a short fixed list; prefer chips when every choice fits on screen). Those
 * stay deck-INDEPENDENT on purpose (an opaque white field with the fixed dark ink, so a dark deck is
 * never white-on-white). What this adds is the part that sits on the DECK: the label above, in the
 * deck ink at the 16px body size, which also becomes the control's accessible name (a placeholder is
 * not a label). `lock-key` disables the control after a submission and restores the submitted value.
 */
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); width:100% }
  .label{ font-size:16px; line-height:24px; font-weight:var(--aha-weight-regular, 400); color:var(--_ink) }
  .label:empty{ display:none }
  ::slotted(*){ width:100% }
`;

export class AhaAudienceField extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'label', 'lock-key']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><span class="label" part="label" dir="auto"></span><slot></slot>`));
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._sync());
    this.addEventListener('click', (event) => { if (event.composedPath()[0] === this.shadowRoot.querySelector('.label')) this.control?.focus?.(); });
  }
  connectedCallback() {
    super.connectedCallback();
    this._sync();
    this._watchLock();
  }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      const control = this.control;
      if (!control) return;
      // The lock only ever adds `disabled`; a host-disabled control stays disabled with no lock.
      if (record || this._lockedByKey) control.toggleAttribute('disabled', !!record);
      this._lockedByKey = !!record;
      if (record && record.value != null && typeof record.value !== 'object') control.setAttribute('value', String(record.value));
    });
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    this._sync();
  }

  /** The slotted field element. */
  get control() { return this.shadowRoot.querySelector('slot').assignedElements()[0] || null; }

  _sync() {
    const label = this.getAttribute('label') || '';
    this.shadowRoot.querySelector('.label').textContent = label;
    const control = this.control;
    if (!control) return;
    const ownName = control.hasAttribute('aria-label') && !control.hasAttribute('data-named-by-field');
    if (ownName || !label) return;
    control.setAttribute('aria-label', label);
    control.setAttribute('data-named-by-field', '');
  }
}

export function defineAhaAudienceField(tag = 'aha-audience-field') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceField);
}
if (typeof window !== 'undefined') defineAhaAudienceField();
export default { AhaAudienceField, defineAhaAudienceField };
