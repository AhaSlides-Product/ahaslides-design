/**
 * @ahaslides-product/design/aha-audience-modal — the audience phone's modal: the mobile twin of the DS Modal.
 *
 *   import '@ahaslides-product/design/aha-audience-modal';   // registers <aha-audience-modal>
 *
 *   <aha-audience-modal image="https://…/photo.jpg">The whole option text, however long.</aha-audience-modal>   // type="details" (default)
 *
 *   <aha-audience-modal type="action" heading="Change your display name">
 *     <aha-audience-field label="Display name"><aha-counted-input maxlength="30"></aha-counted-input></aha-audience-field>
 *     <aha-button slot="actions" data-action="save" variant="primary" size="touch">Save</aha-button>
 *   </aha-audience-modal>
 *
 *   <aha-audience-modal type="confirmation" heading="Leave the quiz?" destructive>
 *     Answers you have not sent will be lost.
 *     <aha-button slot="actions" data-action="stay" variant="primary" size="touch">Stay</aha-button>
 *     <aha-button slot="actions" data-action="leave" variant="danger" size="touch">Leave quiz</aha-button>
 *   </aha-audience-modal>
 *
 * Three types share one card. `details` shows one option in full (picture on top, the text below, line breaks kept), opened from
 * the `expand` event of <aha-answer-option expandable> or <aha-rank-list expandable>. `action` is a task surface: a `heading`,
 * any body content and its actions. `confirmation` is a yes/no decision: a `heading` phrased as a question, one line of copy and
 * its actions; it has no close button, is announced as an alertdialog and focuses its first non-`danger` action on open. The default slot is the body, which scrolls when the
 * card is taller than its container; `slot="actions"` buttons stay pinned below it, stacked full width on a phone (the first one
 * on top) and in one row, the first one rightmost, once the card is 400px wide or more.
 *
 * A tap on a slotted element carrying `data-action` emits a cancelable composed `action` ({ detail: { action } }) and then closes
 * the modal with that value; call `preventDefault()` to keep it open while an async action runs, then `close(value)`. The close
 * button, Escape and a tap outside the card close it with `dismiss`; `destructive` ignores the tap outside. Every close emits
 * composed `close` ({ detail: { returnValue } }), and `show()` returns a promise of that same value.
 *
 * There is no dark backdrop, because a backdrop is cut off inside an iframe: the card carries a border and shadow to read on
 * the deck, and an invisible layer catches the tap outside. While open it traps Tab inside the card and gives focus back to
 * whatever opened it. `inline` draws the card in the page flow; `contained` centres it inside the nearest positioned ancestor
 * (a phone-sized frame in docs and previews) instead of the viewport. `<aha-bottom-sheet>` is a deprecated alias.
 */
import './icons.js';
import './aha-button.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DISMISS = 'dismiss';

export const openModals = [];
export function raiseLayer(overlay) {
  const topLayer = Math.max(1000, ...openModals.map((other) => other._layerZ || 0));
  overlay._layerZ = topLayer + 1;
  overlay.style.setProperty('--aha-layer-z', String(overlay._layerZ));
}

export function lowerLayer(overlay) {
  overlay._layerZ = 0;
  overlay.style.removeProperty('--aha-layer-z');
}

let scrollLockCount = 0;
let overflowBeforeLock = '';

export function lockPageScroll() {
  if (scrollLockCount === 0) {
    overflowBeforeLock = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

export function unlockPageScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) document.documentElement.style.overflow = overflowBeforeLock;
}

const STYLE = `
  :host{ display:contents; font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif) }
  :host([hidden]){ display:none }
  .layer{ position:fixed; inset:0; z-index:var(--aha-layer-z, 1000); box-sizing:border-box; display:flex; align-items:center; justify-content:center; padding:var(--aha-space-16, 16px); visibility:hidden;
    transition:visibility var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .layer{ visibility:visible; transition:none }
  .hit{ position:absolute; inset:0; background:transparent }
  .panel{ position:relative; box-sizing:border-box; display:flex; flex-direction:column; width:100%; max-width:480px; max-height:100%; container:audience-modal / inline-size;
    background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); --aha-deck-ink:var(--aha-text-default, #1A1A1A); font-family:inherit;
    border:1px solid var(--aha-border-default, #E5E5E5); border-radius:var(--aha-radius-default, 8px); box-shadow:0 8px 24px var(--aha-ink-a30, rgba(0,0,0,.3));
    opacity:0; transform:scale(.96);
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ opacity:1; transform:none }
  .panel:focus{ outline:none }
  .head{ flex:0 0 auto; display:flex; align-items:center; justify-content:flex-end; gap:var(--aha-space-8, 8px); min-height:var(--aha-space-40, 40px); padding:var(--aha-space-8, 8px) var(--aha-space-8, 8px) 0 }
  .panel.has-heading .head{ justify-content:space-between; padding-left:var(--aha-space-24, 24px) }
  .title{ display:none; flex:1 1 auto; min-width:0; margin:0; font-size:var(--aha-size-h6, 18px); line-height:var(--aha-line-height-heading, 1.3); font-weight:600; overflow-wrap:anywhere }
  .panel.has-heading .title{ display:block }
  :host([type=confirmation]) .close{ display:none }
  :host([type=confirmation]) .head{ min-height:0; padding:var(--aha-space-24, 24px) var(--aha-space-24, 24px) var(--aha-space-8, 8px) }
  .body{ flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 var(--aha-space-24, 24px) var(--aha-space-24, 24px) }
  :host(:not([type=confirmation])) .panel.has-heading .body{ padding-top:var(--aha-space-8, 8px) }
  .panel.has-actions .body{ padding-bottom:var(--aha-space-16, 16px) }
  .picture{ display:none; width:100%; height:auto; max-height:none; margin:0 0 var(--aha-space-16, 16px); border-radius:var(--aha-radius-default, 8px); object-fit:contain }
  :host([image]) .picture{ display:block }
  .text{ font-size:16px; line-height:24px; overflow-wrap:anywhere }
  :host(:not([type])) .text, :host([type=details]) .text{ white-space:pre-wrap }
  .actions{ display:none; flex:0 0 auto; flex-direction:column; gap:var(--aha-space-8, 8px); padding:0 var(--aha-space-24, 24px) var(--aha-space-24, 24px) }
  .panel.has-actions .actions{ display:flex }
  @container audience-modal (min-width: 400px){ /* ds-lint-allow: responsive (a container query that moves the actions into a row; it sets no width) */
    .actions{ flex-direction:row-reverse; justify-content:flex-start }
  }
  :host([contained]) .layer{ position:absolute; z-index:var(--aha-layer-z, 10) }
  :host([inline]) .layer{ position:static; z-index:auto; display:block; padding:0; visibility:visible }
  :host([inline]) .hit{ display:none }
  :host([inline]) .panel{ max-width:none; max-height:none; opacity:1; transform:none; box-shadow:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="layer" part="layer">
    <div class="hit" part="hit"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true" tabindex="-1">
      <div class="head" part="head"><h2 class="title" id="title" part="title"></h2><aha-button class="close" variant="tertiary-deck" size="md" icon-only sheet aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button></div>
      <div class="body" part="body" id="body"><img class="picture" alt=""><div class="text" dir="auto"><slot></slot></div></div>
      <div class="actions" part="actions"><slot name="actions"></slot></div>
    </div>
  </div>`;

const hasOpenSelect = (event) => event.composedPath().some((node) => node.localName === 'aha-select' && node.hasAttribute('open'));

export class AhaAudienceModal extends HTMLElement {
  static get observedAttributes() { return ['open', 'type', 'heading', 'image', 'image-alt', 'label', 'close-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this.returnValue = '';
    this._engaged = false;
    this._requestedReturnValue = null;
    this._pendingResults = [];
    this._panel = this.shadowRoot.querySelector('.panel');
    this._title = this.shadowRoot.querySelector('.title');
    this._body = this.shadowRoot.querySelector('.body');
    this._picture = this.shadowRoot.querySelector('.picture');
    this._closeButton = this.shadowRoot.querySelector('.close');
    this._actionsSlot = this.shadowRoot.querySelector('slot[name=actions]');
    this._onDocumentKey = (event) => this._onKey(event);
    this.shadowRoot.querySelector('.hit').addEventListener('click', () => { if (!this.hasAttribute('destructive')) this.close(DISMISS); });
    this._closeButton.addEventListener('click', () => this.close(DISMISS));
    this._actionsSlot.addEventListener('slotchange', () => this._panel.classList.toggle('has-actions', this._actionsSlot.assignedElements().length > 0));
    this.addEventListener('click', (event) => this._onActionClick(event));
    this._sync();
  }

  connectedCallback() { this._sync(); if (this.hasAttribute('open')) this._engage(); }
  disconnectedCallback() {
    this._release();
    queueMicrotask(() => { if (!this.isConnected) this._resolvePending(DISMISS); });
  }
  attributeChangedCallback(name, previous, next) {
    this._sync();
    if (name !== 'open' || (previous === null) === (next === null)) return;
    if (next === null) this._onClosed(); else if (this.isConnected) this._engage();
  }

  /** Opens the modal. Resolves with the `returnValue` it closes with: the `data-action` value, or `dismiss`. */
  show() {
    const result = new Promise((resolve) => this._pendingResults.push(resolve));
    this.setAttribute('open', '');
    return result;
  }

  /** Closes the modal with `returnValue` and emits `close`. */
  close(returnValue = DISMISS) {
    if (!this.hasAttribute('open')) return;
    this._requestedReturnValue = String(returnValue);
    this.removeAttribute('open');
  }

  /** Closes the modal with `dismiss`. Kept for <aha-bottom-sheet> callers. */
  hide() { this.close(DISMISS); }

  _onClosed() {
    this._release();
    this.returnValue = this._requestedReturnValue ?? DISMISS;
    this._requestedReturnValue = null;
    this._resolvePending(this.returnValue);
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true, detail: { returnValue: this.returnValue } }));
  }

  _resolvePending(returnValue) {
    const pending = this._pendingResults;
    this._pendingResults = [];
    for (const resolve of pending) resolve(returnValue);
  }

  _onActionClick(event) {
    const trigger = this._actionTrigger(event.target);
    if (!this.hasAttribute('open') || !trigger || trigger.hasAttribute('disabled') || trigger.hasAttribute('loading')) return;
    const action = trigger.getAttribute('data-action');
    const proceed = this.dispatchEvent(new CustomEvent('action', { bubbles: true, composed: true, cancelable: true, detail: { action } }));
    if (proceed) this.close(action);
  }

  _actionTrigger(target) {
    for (let element = target; element && element !== this; element = element.parentElement) {
      if (element instanceof AhaAudienceModal) return null;
      if (element.hasAttribute('data-action')) return element;
    }
    return null;
  }

  _sync() {
    const type = this.getAttribute('type') || 'details';
    const heading = this.getAttribute('heading') || '';
    this._title.textContent = heading;
    this._panel.classList.toggle('has-heading', Boolean(heading));
    this._panel.setAttribute('role', type === 'confirmation' ? 'alertdialog' : 'dialog');
    const label = this.getAttribute('label');
    if (label || !heading) {
      this._panel.removeAttribute('aria-labelledby');
      this._panel.setAttribute('aria-label', label || 'Option details');
    } else {
      this._panel.removeAttribute('aria-label');
      this._panel.setAttribute('aria-labelledby', 'title');
    }
    if (type === 'confirmation') this._panel.setAttribute('aria-describedby', 'body'); else this._panel.removeAttribute('aria-describedby');
    this._closeButton.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
    const image = this.getAttribute('image');
    if (image && this._picture.getAttribute('src') !== image) this._picture.setAttribute('src', image);
    this._picture.setAttribute('alt', this.getAttribute('image-alt') || '');
  }

  _engage() {
    if (this.hasAttribute('inline') || this._engaged) return;
    this._engaged = true;
    this.returnValue = '';
    this._opener = deepActiveElement();
    raiseLayer(this);
    openModals.push(this);
    this._lockedScroll = !this.hasAttribute('contained');
    if (this._lockedScroll) lockPageScroll();
    document.addEventListener('keydown', this._onDocumentKey, true);
    this._body.scrollTop = 0;
    requestAnimationFrame(() => { if (this.hasAttribute('open')) this._initialFocusTarget().focus({ preventScroll: true }); });
  }

  _initialFocusTarget() {
    if (this.getAttribute('type') !== 'confirmation') return this._panel;
    const safeAction = [...this.querySelectorAll(':scope > [slot="actions"][data-action]')]
      .find((action) => action.getAttribute('variant') !== 'danger' && !action.hasAttribute('disabled'));
    if (!safeAction) return this._panel;
    return focusableWithin(safeAction.shadowRoot || safeAction)[0] || safeAction;
  }

  _release() {
    if (!this._engaged) return;
    this._engaged = false;
    document.removeEventListener('keydown', this._onDocumentKey, true);
    const wasOnTop = openModals[openModals.length - 1] === this;
    openModals.splice(openModals.indexOf(this), 1);
    lowerLayer(this);
    if (this._lockedScroll) { this._lockedScroll = false; unlockPageScroll(); }
    const opener = this._opener;
    this._opener = null;
    if (wasOnTop && opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  _onKey(event) {
    if (openModals[openModals.length - 1] !== this) return;
    if (event.key === 'Escape') { if (hasOpenSelect(event)) return; event.preventDefault(); event.stopPropagation(); this.close(DISMISS); return; }
    if (event.key !== 'Tab') return;
    const stops = [...focusableWithin(this._panel), ...focusableWithin(this)].filter((element) => element.getClientRects().length > 0);
    if (!stops.length) { event.preventDefault(); return; }
    const active = deepActiveElement();
    const index = stops.indexOf(active);
    const next = event.shiftKey ? (index <= 0 ? stops.length - 1 : index - 1) : (index === stops.length - 1 ? 0 : index + 1);
    if (index === -1 || (event.shiftKey && index <= 0) || (!event.shiftKey && index === stops.length - 1)) {
      event.preventDefault();
      stops[next].focus();
    }
  }
}

export function focusableWithin(root) {
  const found = [];
  for (const element of root.querySelectorAll('*')) {
    if (element.matches(FOCUSABLE)) found.push(element);
    if (element.shadowRoot) found.push(...focusableWithin(element.shadowRoot));
  }
  return found;
}

export function deepActiveElement() {
  let active = document.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function defineAhaAudienceModal(tag = 'aha-audience-modal') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAudienceModal);
  return true;
}
if (typeof window !== 'undefined') defineAhaAudienceModal();

export default { AhaAudienceModal, defineAhaAudienceModal };
