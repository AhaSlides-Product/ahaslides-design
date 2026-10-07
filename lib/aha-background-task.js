/**
 * @ahaslides-product/design/aha-background-task — the pattern for any long-running process (import, export, upload, duplicate) as a shared primitive; the presenter's Import notification is the reference implementation.
 *
 *   import '@ahaslides-product/design/aha-background-task';   // registers <aha-background-task> (+ <aha-button>, <aha-icon>)
 *   <aha-background-task heading="Quarterly review.pptx" value="42" caption="42%">
 *     <aha-button slot="action" variant="tertiary" size="sm">Cancel</aha-button>
 *   </aha-background-task>
 *
 * A fixed bottom-right card (right 24, bottom 88, z-index 1100) for ONE background task. It updates in place
 * through five states — progress (default), success, canceled, offline, error — by toggling attributes on
 * persistent nodes, so the bar width animates instead of being recreated. The consumer owns the task, the copy
 * and the timers (the presenter's Import dismisses a successful card only after the rating is answered or the ✕ is pressed).
 *
 *   state          progress | success | canceled | offline | error
 *   heading        the task's subject (file, deck or export name), or a status headline ("Import cancelled", "Connection lost", "Import failed")
 *   description    the line under the heading (success / canceled / offline / error); a `link` slot continues it inline
 *   value          0–100 bar width; the bar is hidden on success / canceled / error, neutral grey and still on offline
 *   no-percentage  for a process with no real percentage: the bar eases towards 90% on its own and `value` is ignored — pair it with a text caption, never a made-up number
 *   caption        bottom-left text while the bar shows, e.g. "42%" or "36/44 slides imported"; on success / canceled / error it moves to the description line unless a description is set
 *   rating-prompt  the success state always shows the DS <aha-csat>; its question (default "How did this go?")
 *   rating-source  analytics source of that <aha-csat> (default "background_task_completion")
 *   dismiss-label  accessible name of the ✕ (default "Dismiss"); the ✕ shows on success / canceled / error
 *
 * Slots: `link` (inline text action ending the description, e.g. "Retry" in "Download didn't start? Retry" — a real <a href> or <button>) · `icon` (24px leading task icon) · `action` (bottom-right tertiary <aha-button size="sm">, e.g. Cancel) · `footer` (the
 * cancel confirmation or the connection-lost buttons, below the card body; overrides the default completion rating).
 *
 * The whole card is role="status" aria-live="polite"; the bar carries no ARIA of its own.
 *
 * The leading icon is centred on the heading and description together whenever a description is shown.
 *
 * <aha-background-task-stack> is the fixed bottom-right column for several cards (right 24, bottom 88, 320 wide, 8px gap): `stack.prepend(card)`
 * puts the newest on top; keep ONE card per process and update it in place.
 *
 * @fires dismiss  CustomEvent — the ✕ was pressed.
 */
import './icons.js';
import './aha-button.js';
import './aha-close-button.js';
import './aha-csat.js';

const STYLE = `
  :host{ display:block; box-sizing:border-box; position:fixed; right:24px; bottom:88px; z-index:1100; width:320px; max-width:calc(100vw - 32px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,sans-serif) }
  .card{ box-sizing:border-box; padding:var(--aha-space-14,14px) var(--aha-space-16,16px) var(--aha-space-16,16px); background:var(--aha-bg-elevated,#FFFFFF); border-radius:12px;
    box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08);
    transition:box-shadow var(--aha-toast-shadow-duration,.35s) ease; animation:enter var(--aha-motion-slow,.3s) ease both }
  .card.compact{ padding-bottom:var(--aha-space-14,14px) }
  .top{ display:flex; align-items:flex-start; gap:var(--aha-space-10,10px) }
  .top.spaced{ margin-bottom:var(--aha-space-10,10px) }
  .lead{ flex:0 0 auto; width:24px; height:24px; display:flex; align-items:center; justify-content:center }
  .texts{ flex:1 1 auto; min-width:0; padding-block:var(--aha-space-4,4px) 0 }
  .title-row{ display:flex; align-items:center; gap:var(--aha-space-6,6px); min-width:0 }
  .top.centered .lead{ align-self:center; margin-top:var(--aha-space-4,4px) }
  .heading{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    font-size:12.5px; line-height:1.3; font-weight:600; color:var(--aha-toast-ink,#1F1330) }
  .done{ flex:0 0 auto; line-height:0; color:var(--aha-icon-default,#4A4A4A) }
  .description{ margin-top:var(--aha-space-2,2px); font-size:12px; line-height:18px; color:var(--aha-toast-ink-soft,#6B6478); display:flex; align-items:center; gap:var(--aha-toast-description-gap,5px) }
  .description-text{ min-width:0 }
  ::slotted([slot="link"]){ flex:0 0 auto; color:var(--aha-text-link,#6A1EBB); font:inherit; text-decoration:underline; text-underline-offset:2px; cursor:pointer; background:none; border:0; padding:0 }
  ::slotted([slot="link"]:hover){ color:var(--aha-text-link-hover,#A96FF0) }
  ::slotted([slot="link"]:focus-visible){ outline:2px solid var(--aha-focus-ring,#D3B4FF); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .close{ flex:0 0 auto; --aha-close-line-height:var(--aha-space-24,24px); --aha-close-container-padding:var(--aha-space-16,16px) }
  .track{ width:100%; height:5px; border-radius:var(--aha-radius-pill,999px); background:rgba(106,30,187,.12); overflow:hidden; transition:opacity var(--aha-motion-slow,.3s) ease }
  .fill{ position:relative; overflow:hidden; height:100%; width:0; border-radius:var(--aha-radius-pill,999px); background:var(--aha-color-primary,#6A1EBB);
    transition:width var(--aha-toast-bar-duration,1.7s) cubic-bezier(0.2,0.65,0.3,1) }
  :host([state="offline"]) .track{ background:var(--aha-toast-paused-track,#F1F1F1) }
  :host([state="offline"]) .fill{ background:var(--aha-toast-paused,#B5B5B5) }
  :host(:not([state="offline"])) .fill::after{ content:""; position:absolute; inset:0; background-size:20px 20px; animation:stripes .9s linear infinite;
    background-image:linear-gradient(45deg, rgba(255,255,255,.32) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.32) 50%, rgba(255,255,255,.32) 75%, transparent 75%, transparent) }
  .bottom{ min-height:20px; display:flex; align-items:center; justify-content:space-between; margin-top:var(--aha-toast-caption-gap,9px) }
  .caption{ font-size:12px; line-height:18px; font-weight:400; color:var(--aha-toast-ink-soft,#6B6478) }
  ::slotted([slot="action"]){ margin:calc(var(--aha-space-4,4px) * -1) calc(var(--aha-space-8,8px) * -1) calc(var(--aha-space-4,4px) * -1) 0 }
  .footer{ margin-top:var(--aha-space-12,12px); font-size:12px; line-height:18px }
  .footer ::slotted(*){ display:block }
  .rating{ padding-top:var(--aha-space-12,12px); border-top:1px solid var(--aha-border-secondary,#F1F1F1) }
  [hidden]{ display:none !important }
  @keyframes stripes{ from{ background-position:0 0 } to{ background-position:20px 0 } }
  @keyframes enter{ from{ opacity:0; transform:translateY(6px) } to{ opacity:1; transform:none } }
`;

const STACK_STYLE = `
  :host{ position:fixed; right:24px; bottom:88px; z-index:1100; display:flex; flex-direction:column; gap:var(--aha-space-8,8px); box-sizing:border-box; width:320px; max-width:calc(100vw - 32px) }
  ::slotted(aha-background-task){ position:static; width:100%; max-width:100% }
`;

const EASING_START = 4;
const EASING_CEILING = 90;
const EASING_RATE = 0.15;
const EASING_TICK_MS = 700;

const TERMINAL_STATES = ['success', 'canceled', 'error'];

const setAttributeIfChanged = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

export class AhaBackgroundTask extends HTMLElement {
  static get observedAttributes() { return ['state', 'heading', 'description', 'no-percentage', 'value', 'caption', 'dismiss-label', 'rating-prompt', 'rating-source']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>
        <div class="card" part="card" role="status" aria-live="polite">
          <div class="top">
            <div class="lead" part="icon"><slot name="icon"><aha-icon name="system-file" size="24" decorative></aha-icon></slot></div>
            <div class="texts">
              <div class="title-row"><div class="heading" part="heading"></div><span class="done" part="done" hidden><aha-icon name="system-check-circle" size="12" decorative></aha-icon></span></div>
              <div class="description" part="description" hidden><span class="description-text"></span><slot name="link"></slot></div>
            </div>
            <aha-close-button class="close" part="close" label="Dismiss" hidden></aha-close-button>
          </div>
          <div class="track" part="bar"><div class="fill"></div></div>
          <div class="bottom" part="bottom"><span class="caption" part="caption"></span><slot name="action"></slot></div>
          <div class="footer" part="footer"><slot name="footer"><div class="rating" part="rating" hidden><aha-csat feedback-button></aha-csat></div></slot></div>
        </div>`;
      this.shadowRoot.querySelector('.close').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
      });
      this.shadowRoot.addEventListener('slotchange', () => this._syncSlots());
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _syncSlots() {
    const root = this.shadowRoot;
    const hasAction = !!this.querySelector(':scope > [slot="action"]');
    const hasFooter = !!this.querySelector(':scope > [slot="footer"]');
    const state = this.getAttribute('state') || 'progress';
    const showsRating = state === 'success' && !hasFooter;
    const hasBottom = !!((!TERMINAL_STATES.includes(state) && this.getAttribute('caption')) || hasAction);
    const hasBody = hasBottom || hasFooter || showsRating || !TERMINAL_STATES.includes(state);
    root.querySelector('.bottom').hidden = !hasBottom;
    root.querySelector('.footer').hidden = !(hasFooter || showsRating);
    const rating = root.querySelector('.rating');
    rating.hidden = !showsRating;
    const csat = rating.querySelector('aha-csat');
    setAttributeIfChanged(csat, 'prompt', this.getAttribute('rating-prompt') || 'How did this go?');
    setAttributeIfChanged(csat, 'source', this.getAttribute('rating-source') || 'background_task_completion');
    root.querySelector('.top').classList.toggle('spaced', hasBottom || hasFooter || !TERMINAL_STATES.includes(state));
    root.querySelector('.top').classList.toggle('centered', !root.querySelector('.description').hidden);
    root.querySelector('.card').classList.toggle('compact', !hasBody);
  }

  disconnectedCallback() { this._stopEasing(); }

  _syncEasing() {
    const easing = this.hasAttribute('no-percentage') && (this.getAttribute('state') || 'progress') === 'progress';
    if (!easing) { this._stopEasing(); this._easedPercent = undefined; return; }
    if (this._easingTimer) return;
    this._easedPercent ??= EASING_START;
    this._easingTimer = setInterval(() => {
      this._easedPercent += (EASING_CEILING - this._easedPercent) * EASING_RATE;
      this._renderBar();
    }, EASING_TICK_MS);
  }

  _stopEasing() {
    clearInterval(this._easingTimer);
    this._easingTimer = undefined;
  }

  _renderBar() {
    const easing = this._easedPercent !== undefined;
    const percent = easing ? this._easedPercent : Math.min(Math.max(Number(this.getAttribute('value')) || 0, 0), 100);
    this.shadowRoot.querySelector('.fill').style.width = `${percent}%`;
  }

  _sync() {
    const root = this.shadowRoot;
    const state = this.getAttribute('state') || 'progress';
    const terminal = TERMINAL_STATES.includes(state);
    const description = this.getAttribute('description') || (terminal ? this.getAttribute('caption') : '');

    root.querySelector('.heading').textContent = this.getAttribute('heading') || '';
    root.querySelector('.done').hidden = state !== 'success';
    root.querySelector('.description-text').textContent = description || '';
    root.querySelector('.description').hidden = !description;

    const close = root.querySelector('.close');
    close.hidden = !TERMINAL_STATES.includes(state);
    setAttributeIfChanged(close, 'label', this.getAttribute('dismiss-label') || 'Dismiss');

    root.querySelector('.track').hidden = TERMINAL_STATES.includes(state);
    this._syncEasing();
    this._renderBar();

    root.querySelector('.caption').textContent = terminal ? '' : this.getAttribute('caption') || '';
    this._syncSlots();
  }
}

export class AhaBackgroundTaskStack extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STACK_STYLE}</style><slot></slot>`;
  }
}

export function defineAhaBackgroundTaskStack(tag = 'aha-background-task-stack') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBackgroundTaskStack);
  return true;
}

export function defineAhaBackgroundTask(tag = 'aha-background-task') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBackgroundTask);
  return true;
}
if (typeof window !== 'undefined') { defineAhaBackgroundTask(); defineAhaBackgroundTaskStack(); }

export default { AhaBackgroundTask, AhaBackgroundTaskStack, defineAhaBackgroundTask, defineAhaBackgroundTaskStack };
