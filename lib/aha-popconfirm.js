/**
 * @ahaslides-product/design/aha-popconfirm — the Popconfirm as a web component, for code that cannot take the antd Popconfirm.
 *
 *   import '@ahaslides-product/design/aha-popconfirm';   // registers <aha-popconfirm>
 *
 *   <aha-popconfirm heading="Delete this slide?" description="Its responses go too." ok-text="Delete" ok-danger>
 *     <aha-button variant="secondary">Delete</aha-button>
 *   </aha-popconfirm>
 *
 * Reproduces the antd Popconfirm as themed by popconfirm-theme.js: a small prompt anchored to its trigger (the default slot),
 * drawn by the shared <aha-popover> (white, radius 8, its border, shadow, arrow, twelve placements, flip and top layer). Inside,
 * the warning glyph (16, default ink) sits 8 before a 14/22 SemiBold ink title and an optional 14/22 description 4 below it, then
 * Cancel and OK at the DS small size (28 high, 4 corners) on the right, 8 below and 8 apart.
 *
 * `heading` (or `slot="title"`) and `description` (or `slot="description"`) fill the message; `slot="icon"` replaces the glyph
 * and `no-icon` drops it. `ok-text`, `cancel-text`, `ok-disabled` and `confirm-loading` drive the buttons; `ok-danger` is a
 * destructive confirm (popconfirm-theme `destructiveConfirm`): Cancel turns primary and OK secondary. While `confirm-loading`
 * is set OK spins and Cancel, Escape and an outside click do nothing. `disabled`, or a disabled trigger, stops it opening. `ok-test-id` and
 * `cancel-test-id` put a data-testid on the two buttons. `placement` defaults to top; `arrow="false"` drops the arrow.
 *
 * Every event is composed and does not bubble (an enclosing aha-modal fires the same names), so listen on the element itself.
 * A trigger click emits a cancelable `open` ({ detail: { source: 'trigger' } }) and opens it unless cancelled. OK emits
 * a cancelable `confirm`; Cancel, Escape, an outside click and a second trigger click emit a cancelable `cancel` ({ detail:
 * { source } }). Unless cancelled either goes on to the cancelable `close`, then the prompt closes and emits `closed`. On open,
 * focus moves to the primary button (OK, or Cancel when `ok-danger` or `ok-disabled`); on close it goes back to the trigger,
 * except after an outside click. `inline` keeps it in the page flow with no keys, no outside click and no focus move (docs).
 */
import './icons.js';
import './aha-button.js';
import './aha-popover.js';
import { deepActiveElement } from './aha-audience-modal.js';

const STYLE = `
  :host{ display:inline-block; vertical-align:top; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  .anchor{ position:relative; display:inline-flex; vertical-align:top }
  .trigger{ display:inline-flex }
  .pop{ position:absolute; inset:0; pointer-events:none }
  .pop::part(panel){ width:max-content; padding:var(--aha-space-12, 12px); pointer-events:auto }
  .prompt{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); color:var(--aha-text-default, #1A1A1A);
    font-size:var(--aha-size-default, 14px); line-height:22px; text-align:start }
  .message{ display:flex; align-items:flex-start; gap:var(--aha-space-8, 8px) }
  .icon{ flex:0 0 auto; display:inline-flex; align-items:center; height:22px; color:var(--aha-text-default, #1A1A1A) }
  :host([no-icon]) .icon{ display:none }
  .text{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:var(--aha-space-4, 4px); overflow-wrap:anywhere }
  .title{ font-weight:600; color:var(--aha-text-default, #1A1A1A) }
  .description{ color:var(--aha-text-default, #1A1A1A) }
  .untitled .title, .undescribed .description{ display:none }
  .buttons{ display:flex; justify-content:flex-end; align-items:center; gap:var(--aha-space-8, 8px); white-space:nowrap }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <span class="anchor" part="anchor">
    <span class="trigger" part="trigger"><slot></slot></span>
    <aha-popover class="pop" trigger="focus" arrow flip>
      <div class="prompt" part="prompt">
        <div class="message" part="message">
          <span class="icon" part="icon"><slot name="icon"><aha-icon name="system-warning-circle" size="16" decorative></aha-icon></slot></span>
          <div class="text">
            <div class="title" part="title"><slot name="title"><span class="heading"></span></slot></div>
            <div class="description" part="description"><slot name="description"><span class="description-text"></span></slot></div>
          </div>
        </div>
        <div class="buttons" part="buttons">
          <aha-button class="cancel" part="cancel-button" variant="secondary" size="sm">Cancel</aha-button>
          <aha-button class="ok" part="ok-button" variant="primary" size="sm">OK</aha-button>
        </div>
      </div>
    </aha-popover>
  </span>`;

// React 18 writes a false prop on a custom element as the string "false".
const FLAGS = ['open', 'ok-danger', 'ok-disabled', 'confirm-loading', 'disabled', 'no-icon', 'inline'];
const isSet = (value) => value !== null && value !== 'false';
const filled = (slot) => slot.assignedNodes().some((node) => node.nodeType === 1 || node.textContent.trim());
// The panel is still display:none on the frame the prompt opens, so the first focus() can be refused.
const FOCUS_ATTEMPTS = 4;

// Only the prompt opened last takes Escape, as each listens on window and the first listener would otherwise win.
const openPrompts = [];

const isTriggerDisabled = (trigger) => Boolean(trigger)
  && (trigger.hasAttribute('disabled') || trigger.matches(':disabled') || trigger.getAttribute('aria-disabled') === 'true');

// Not bubbling: an enclosing aha-modal or drawer fires the same names, and its `cancel` / `closed` listener must not see the prompt's.
const emit = (host, type, detail = null) =>
  host.dispatchEvent(new CustomEvent(type, { composed: true, cancelable: type !== 'closed', detail }));

const isWithin = (node, host) => {
  for (let n = node; n; n = n.parentNode || n.host) if (n === host) return true;
  return false;
};

export class AhaPopconfirm extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'heading', 'description', 'label', 'ok-text', 'cancel-text', 'ok-danger', 'ok-disabled', 'confirm-loading',
      'disabled', 'placement', 'arrow', 'ok-test-id', 'cancel-test-id', 'no-icon', 'inline'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._engaged = false;
    this._pop = this.shadowRoot.querySelector('.pop');
    this._prompt = this.shadowRoot.querySelector('.prompt');
    this._heading = this.shadowRoot.querySelector('.heading');
    this._descriptionText = this.shadowRoot.querySelector('.description-text');
    this._okButton = this.shadowRoot.querySelector('.ok');
    this._cancelButton = this.shadowRoot.querySelector('.cancel');
    this._triggerSlot = this.shadowRoot.querySelector('.trigger slot');
    this._titleSlot = this.shadowRoot.querySelector('slot[name=title]');
    this._descriptionSlot = this.shadowRoot.querySelector('slot[name=description]');
    this._onWindowKey = (event) => this._onKey(event);
    this._onDocumentClick = (event) => { if (!event.composedPath().includes(this)) this._cancel('outside'); };
    this.shadowRoot.querySelector('.trigger').addEventListener('click', () => this._onTrigger());
    this._okButton.addEventListener('click', () => this._confirm());
    this._cancelButton.addEventListener('click', () => this._cancel('cancel-button'));
    this._titleSlot.addEventListener('slotchange', () => this._sync());
    this._descriptionSlot.addEventListener('slotchange', () => this._sync());
    this._triggerSlot.addEventListener('slotchange', () => this._syncTrigger());
  }

  connectedCallback() {
    this._pop.toggleAttribute('flip', !this.hasAttribute('inline'));
    this._sync();
    if (this.hasAttribute('open')) this._engage();
  }
  disconnectedCallback() { this._release(); }
  attributeChangedCallback(name, previous, next) {
    if (next === 'false' && FLAGS.includes(name)) this.removeAttribute(name);
    this._sync();
    if (name !== 'open' || isSet(previous) === isSet(next)) return;
    if (!isSet(next)) this._onClosed(); else if (this.isConnected) this._engage();
  }

  get open() { return this.hasAttribute('open'); }
  set open(value) { this.toggleAttribute('open', value === '' || (Boolean(value) && value !== 'false')); }

  show() { this.setAttribute('open', ''); }

  /** Asks to close. Emits a cancelable `close`; unless it is cancelled the prompt closes and emits `closed`. */
  close(source = 'method') {
    if (!this.hasAttribute('open')) return;
    if (!emit(this, 'close', { source })) return;
    this._closedBy = source;
    this.removeAttribute('open');
  }

  _onTrigger() {
    if (this.hasAttribute('open')) { this._cancel('trigger'); return; }
    if (this.hasAttribute('disabled') || isTriggerDisabled(this._triggerElement())) return;
    if (emit(this, 'open', { source: 'trigger' })) this.show();
  }

  _confirm() {
    if (!this.hasAttribute('open') || this.hasAttribute('ok-disabled') || this.hasAttribute('confirm-loading')) return;
    if (emit(this, 'confirm')) this.close('confirm');
  }

  _cancel(source) {
    if (!this.hasAttribute('open') || this.hasAttribute('confirm-loading')) return;
    if (emit(this, 'cancel', { source })) this.close(source);
  }

  _onClosed() {
    const source = this._closedBy || 'attribute';
    this._closedBy = null;
    const active = deepActiveElement();
    const focusInside = !active || active === document.body || isWithin(active, this);
    this._release();
    if (source !== 'outside' && focusInside && !this.hasAttribute('inline')) this._focusTrigger();
    emit(this, 'closed', { source });
  }

  _triggerElement() { return this._triggerSlot.assignedElements()[0] || null; }

  _focusTrigger() {
    const trigger = this._triggerElement();
    if (trigger && typeof trigger.focus === 'function') trigger.focus({ preventScroll: true });
  }

  _syncTrigger() {
    const trigger = this._triggerElement();
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', String(this.hasAttribute('open')));
  }

  _sync() {
    const heading = this.getAttribute('heading') || '';
    const description = this.getAttribute('description') || '';
    this._heading.textContent = heading;
    this._descriptionText.textContent = description;
    this._prompt.classList.toggle('untitled', !heading && !filled(this._titleSlot));
    this._prompt.classList.toggle('undescribed', !description && !filled(this._descriptionSlot));
    const name = this.getAttribute('label') || heading || this._titleSlot.assignedNodes().map((node) => node.textContent).join(' ').trim() || 'Confirm';
    this._pop.setAttribute('aria-label', name);
    this._pop.setAttribute('placement', this.getAttribute('placement') || 'top');
    this._pop.toggleAttribute('arrow', this.getAttribute('arrow') !== 'false');

    this._okButton.textContent = this.getAttribute('ok-text') || 'OK';
    this._cancelButton.textContent = this.getAttribute('cancel-text') || 'Cancel';
    const danger = this.hasAttribute('ok-danger');
    const loading = this.hasAttribute('confirm-loading');
    this._okButton.setAttribute('variant', danger ? 'secondary' : 'primary');
    this._cancelButton.setAttribute('variant', danger ? 'primary' : 'secondary');
    this._okButton.toggleAttribute('loading', loading);
    this._okButton.toggleAttribute('disabled', this.hasAttribute('ok-disabled'));
    this._cancelButton.toggleAttribute('disabled', loading);
    for (const [button, attribute] of [[this._okButton, 'ok-test-id'], [this._cancelButton, 'cancel-test-id']]) {
      const id = this.getAttribute(attribute);
      if (id) button.setAttribute('data-testid', id); else button.removeAttribute('data-testid');
    }
    this._pop.open = this.hasAttribute('open');
    this._syncTrigger();
  }

  _engage() {
    if (this._engaged || this.hasAttribute('inline')) return;
    this._engaged = true;
    openPrompts.push(this);
    window.addEventListener('keydown', this._onWindowKey, true);
    document.addEventListener('click', this._onDocumentClick, true);
    this._focusPrimary(FOCUS_ATTEMPTS);
  }

  _focusPrimary(attemptsLeft) {
    requestAnimationFrame(() => {
      if (!this.hasAttribute('open')) return;
      const okFirst = !this.hasAttribute('ok-danger') && !this.hasAttribute('ok-disabled');
      const target = okFirst ? this._okButton : this._cancelButton;
      target.focus({ preventScroll: true });
      if (!isWithin(deepActiveElement(), target) && attemptsLeft > 1) this._focusPrimary(attemptsLeft - 1);
    });
  }

  _release() {
    if (!this._engaged) return;
    this._engaged = false;
    openPrompts.splice(openPrompts.indexOf(this), 1);
    window.removeEventListener('keydown', this._onWindowKey, true);
    document.removeEventListener('click', this._onDocumentClick, true);
  }

  _onKey(event) {
    if (event.key !== 'Escape' || event.defaultPrevented || !this.hasAttribute('open') || openPrompts[openPrompts.length - 1] !== this) return;
    event.preventDefault();
    event.stopPropagation();
    this._cancel('escape');
  }
}

export function defineAhaPopconfirm(tag = 'aha-popconfirm') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPopconfirm);
  return true;
}
if (typeof window !== 'undefined') defineAhaPopconfirm();

export default { AhaPopconfirm, defineAhaPopconfirm };
