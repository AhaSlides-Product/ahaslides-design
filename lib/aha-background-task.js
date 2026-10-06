/**
 * @ahaslides-product/design/aha-background-task — the pattern for any long-running process (import, export, upload, duplicate) as a shared primitive; the presenter's Import notification is the reference implementation.
 *
 *   import '@ahaslides-product/design/aha-background-task';   // registers <aha-background-task> (+ <aha-button>, <aha-icon>)
 *   <aha-background-task heading="Quarterly review.pptx" value="42" caption="42%">
 *     <span slot="action" role="button" tabindex="0">Cancel</span>
 *   </aha-background-task>
 *
 * A fixed bottom-right card (right 24, bottom 88, z-index 1100) for ONE background task. It updates in place
 * through five states — progress (default), success, canceled, offline, error — by toggling attributes on
 * persistent nodes, so the bar width animates instead of being recreated. The consumer owns the task, the copy
 * and the timers (the presenter's Import auto-dismisses a successful card 2s after completion).
 *
 *   state          progress | success | canceled | offline | error
 *   heading        the task's subject (file, deck or export name), or a status headline ("Import canceled", "Connection lost", "Import failed")
 *   description    the line under the heading (canceled / offline / error)
 *   value          0–100 bar width; the bar is hidden on success / canceled / error, grey and still on offline
 *   caption        bottom-left text, e.g. "42%" or "36/44 slides imported"
 *   rating-prompt  the success state always shows the DS <aha-csat>; its question (default "How did this go?")
 *   rating-source  analytics source of that <aha-csat> (default "background_task_completion")
 *   dismiss-label  accessible name of the ✕ (default "Dismiss"); the ✕ shows on success / canceled / error
 *
 * Slots: `icon` (24px leading task icon) · `action` (bottom-right tertiary <aha-button size="sm">, e.g. Cancel) · `footer` (the
 * cancel confirmation or the connection-lost buttons, below the card body; overrides the default completion rating).
 *
 * The whole card is role="status" aria-live="polite"; the bar carries no ARIA of its own.
 *
 * @fires dismiss  CustomEvent — the ✕ was pressed.
 */
import './icons.js';
import './aha-button.js';
import './aha-csat.js';

const STYLE = `
  :host{ display:block; box-sizing:border-box; position:fixed; right:24px; bottom:88px; z-index:1100; width:320px; max-width:calc(100vw - 32px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,sans-serif) }
  .card{ box-sizing:border-box; padding:var(--aha-space-14,14px) var(--aha-space-16,16px) var(--aha-space-16,16px); background:var(--aha-bg-elevated,#FFFFFF); border-radius:12px;
    box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08);
    transition:box-shadow var(--aha-toast-shadow-duration,.35s) ease; animation:enter var(--aha-motion-slow,.3s) ease both }
  .card.compact{ padding-bottom:var(--aha-space-14,14px) }
  .top{ display:flex; align-items:center; gap:var(--aha-space-10,10px) }
  .top.spaced{ margin-bottom:var(--aha-space-10,10px) }
  .status{ color:var(--aha-color-error,#F5222D) }
  .lead{ flex:0 0 auto; width:24px; height:24px; display:flex; align-items:center; justify-content:center }
  .texts{ flex:1 1 auto; min-width:0 }
  .title-row{ display:flex; align-items:center; gap:var(--aha-space-6,6px); min-width:0 }
  .heading{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    font-size:12.5px; line-height:1.3; font-weight:600; color:var(--aha-toast-ink,#1F1330) }
  .done{ flex:0 0 auto; line-height:0; color:var(--aha-icon-default,#4A4A4A) }
  .description{ margin-top:var(--aha-space-2,2px); font-size:12px; line-height:18px; color:var(--aha-toast-ink-soft,#6B6478); display:flex; align-items:center; gap:var(--aha-toast-description-gap,5px) }
  .close{ flex:0 0 auto; margin-left:auto; margin-right:calc(var(--aha-space-4,4px) * -1) }
  .track{ width:100%; height:5px; border-radius:var(--aha-radius-pill,999px); background:rgba(106,30,187,.12); overflow:hidden; transition:opacity var(--aha-motion-slow,.3s) ease }
  .fill{ position:relative; overflow:hidden; height:100%; width:0; border-radius:var(--aha-radius-pill,999px); background:var(--aha-color-primary,#6A1EBB);
    transition:width var(--aha-toast-bar-duration,1.7s) cubic-bezier(0.2,0.65,0.3,1) }
  :host([state="offline"]) .fill{ background:var(--aha-toast-paused,#D9D4E2) }
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

const TERMINAL_STATES = ['success', 'canceled', 'error'];

const setAttributeIfChanged = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

export class AhaBackgroundTask extends HTMLElement {
  static get observedAttributes() { return ['state', 'heading', 'description', 'value', 'caption', 'dismiss-label', 'rating-prompt', 'rating-source']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>
        <div class="card" part="card" role="status" aria-live="polite">
          <div class="top">
            <div class="lead" part="icon"><slot name="icon"><aha-icon name="system-file" size="24" decorative></aha-icon></slot></div>
            <div class="lead status" part="status" hidden><aha-icon name="system-x-circle" size="24" decorative></aha-icon></div>
            <div class="texts">
              <div class="title-row"><div class="heading" part="heading"></div><span class="done" part="done" hidden><aha-icon name="system-check-circle" size="16" decorative></aha-icon></span></div>
              <div class="description" part="description" hidden></div>
            </div>
            <aha-button class="close" part="close" variant="tertiary" icon-only size="sm" aria-label="Dismiss" hidden><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
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
    const hasBottom = !!(this.getAttribute('caption') || hasAction);
    const hasBody = hasBottom || hasFooter || showsRating || !TERMINAL_STATES.includes(state);
    root.querySelector('.bottom').hidden = !hasBottom;
    root.querySelector('.footer').hidden = !(hasFooter || showsRating);
    const rating = root.querySelector('.rating');
    rating.hidden = !showsRating;
    const csat = rating.querySelector('aha-csat');
    setAttributeIfChanged(csat, 'prompt', this.getAttribute('rating-prompt') || 'How did this go?');
    setAttributeIfChanged(csat, 'source', this.getAttribute('rating-source') || 'background_task_completion');
    root.querySelector('.top').classList.toggle('spaced', hasBody);
    root.querySelector('.card').classList.toggle('compact', !hasBody);
  }

  _sync() {
    const root = this.shadowRoot;
    const state = this.getAttribute('state') || 'progress';
    const description = this.getAttribute('description');

    root.querySelector('.heading').textContent = this.getAttribute('heading') || '';
    root.querySelector('.done').hidden = state !== 'success';
    root.querySelector('.status').hidden = state !== 'error';
    root.querySelector('.lead:not(.status)').hidden = state === 'error';
    const descriptionNode = root.querySelector('.description');
    descriptionNode.textContent = description || '';
    descriptionNode.hidden = !description;

    const close = root.querySelector('.close');
    close.hidden = !TERMINAL_STATES.includes(state);
    setAttributeIfChanged(close, 'aria-label', this.getAttribute('dismiss-label') || 'Dismiss');

    const percent = Math.min(Math.max(Number(this.getAttribute('value')) || 0, 0), 100);
    root.querySelector('.track').hidden = TERMINAL_STATES.includes(state);
    root.querySelector('.fill').style.width = `${percent}%`;

    root.querySelector('.caption').textContent = this.getAttribute('caption') || '';
    this._syncSlots();
  }
}

export function defineAhaBackgroundTask(tag = 'aha-background-task') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBackgroundTask);
  return true;
}
if (typeof window !== 'undefined') defineAhaBackgroundTask();

export default { AhaBackgroundTask, defineAhaBackgroundTask };
