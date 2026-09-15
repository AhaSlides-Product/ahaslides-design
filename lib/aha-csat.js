/**
 * @ahaslides-product/design/aha-csat — the shared CSAT (satisfaction) primitive.
 *
 *   import '@ahaslides-product/design/aha-csat';   // registers <aha-csat>
 *   <aha-csat prompt="How's your experience?" source="editor_help"></aha-csat>
 *
 * The shared binary thumbs-up/down satisfaction prompt (feedback pattern) — do NOT build a
 * bespoke rating control. Pass a stable `source` per placement so analytics segmentation is
 * typo-proof. ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The thumbs are the
 * shared <aha-icon> BY NAME. The selected/hover states animate on PERSISTENT button nodes
 * (class toggle, no rebuild).
 *
 * Layout: the borderless single row — prompt + two 16px thumb icon-buttons on ONE line, no chrome
 * (the canonical CSAT surface). It is the ONLY layout; the legacy `inline` attribute is a no-op
 * (a stray `<aha-csat inline>` still renders this same row).
 *
 * Flow (the feedback pattern's "ask for free-text only after a thumbs-down" rule):
 *   • thumbs-UP  — rates instantly: reflects `value="up"` and emits `rate`.
 *   • thumbs-DOWN — registers the down rating (reflects `value="down"`, emits `rate`) AND opens a
 *     feedback popover anchored to the down thumb: a short prompt, an <aha-counted-textarea>, and a
 *     primary <aha-button> to submit. The popover is the shared <aha-popover> (role=dialog, Escape +
 *     outside-click close, focus return) — dismissing it does NOT lose the down rating.
 *   • On submit, emits a dedicated composed `feedback` CustomEvent<{ rating:'down', source, feedback }>
 *     (mapping to the pattern's distinct CSAT_FEEDBACK_SUBMITTED analytics event, separate from
 *     CSAT_RATED), then reveals the opt-in thank-you line.
 *
 * @fires rate     CustomEvent<{ rating:'up'|'down', source }> — a thumb was chosen.
 * @fires feedback CustomEvent<{ rating:'down', source, feedback }> — free-text submitted after a down.
 *
 * The thumbs are toggle buttons with aria-pressed synced to the selection; the down thumb carries
 * aria-haspopup="dialog" + aria-expanded mirrored from the popover. Opt into the confirmation with
 * `thanks` (e.g. thanks="Thanks for the feedback!"); it fades in on a PERSISTENT node — instantly on
 * an up rating, and after the feedback is submitted on a down rating.
 */
import './icons.js';   // registers <aha-icon> + the registry (the thumbs come from it)
import './aha-popover.js';           // the feedback follow-up surface (role=dialog, Esc/outside-click close)
import './aha-counted-textarea.js';  // the free-text field inside the popover
import './aha-button.js';            // the primary submit control inside the popover

const STYLE = `
  :host{ display:inline-flex; align-items:center; gap:8px; height:21px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .prompt{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-text-secondary,#4A4A4A) }
  .prompt:empty{ display:none }
  .btns{ display:inline-flex; align-items:center; gap:4px }
  .btn{ display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; padding:0;
    border:0; border-radius:0; background:transparent; color:var(--aha-icon-muted,#8A8A8A); cursor:pointer;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .btn:hover{ transform:scale(1.12); color:var(--aha-color-primary,#6A1EBB) }
  .btn:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .btn.selected{ color:var(--aha-color-primary,#6A1EBB) }

  /* feedback follow-up — the free-text panel that opens after a thumbs-down, slotted into the
     shared <aha-popover> (which carries its own elevated card chrome + motion). */
  .fb-body{ display:flex; flex-direction:column; gap:12px; min-width:220px }
  .fb-prompt{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .fb-text{ width:100% }
  .fb-submit{ align-self:flex-end }

  .thanks{ display:none; align-items:center; gap:6px; font-size:14px; line-height:21px; font-weight:400;
    color:var(--aha-color-success,#16C49A);
    opacity:0; transform:translateY(2px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([thanks]) .thanks{ display:inline-flex }
  :host([thanks][data-done]) .thanks{ opacity:1; transform:none }

  @media (prefers-reduced-motion: reduce){ .btn{ transition:none } .btn:hover{ transform:none } .thanks{ transition:none } }
`;

export class AhaCsat extends HTMLElement {
  static get observedAttributes() { return ['prompt', 'value', 'thanks', 'feedback-prompt', 'feedback-placeholder']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="prompt" part="prompt"></span>` +
        `<span class="btns">` +
          `<button class="btn up" part="button" type="button" aria-label="Yes, helpful" aria-pressed="false"><aha-icon name="system-thumbs-up" size="16" decorative></aha-icon></button>` +
          `<aha-popover class="fb" part="feedback" placement="bottom-end" trigger="click">` +
            `<button slot="trigger" class="btn down" part="button" type="button" aria-label="No, not helpful" aria-pressed="false" aria-haspopup="dialog" aria-expanded="false"><aha-icon name="system-thumbs-down" size="16" decorative></aha-icon></button>` +
            `<div class="fb-body">` +
              `<div class="fb-prompt" part="feedback-prompt"></div>` +
              `<aha-counted-textarea class="fb-text" maxlength="200" minrows="2" maxrows="4"></aha-counted-textarea>` +
              `<aha-button class="fb-submit" variant="primary" size="md">Send feedback</aha-button>` +
            `</div>` +
          `</aha-popover>` +
        `</span>` +
        `<span class="thanks" part="thanks" role="status" aria-live="polite"><aha-icon name="system-check" size="16" decorative></aha-icon><span class="thanks-text"></span></span>`;
      this._popover = this.shadowRoot.querySelector('aha-popover');
      this._fbText = this.shadowRoot.querySelector('.fb-text');
      const down = this.shadowRoot.querySelector('.down');
      this.shadowRoot.querySelector('.up').addEventListener('click', () => this._rate('up'));
      // thumbs-down registers the rating; the shared popover opens itself on the same trigger click
      down.addEventListener('click', () => this._rate('down'));
      this.shadowRoot.querySelector('.fb-submit').addEventListener('click', () => this._submitFeedback());
      // mirror the popover's open state onto the trigger button (the popover wires aria-expanded on its
      // own internal wrapper, not on our slotted button) so AT hears the trigger's real state
      this._popover.addEventListener('open', () => down.setAttribute('aria-expanded', 'true'));
      this._popover.addEventListener('close', () => down.setAttribute('aria-expanded', 'false'));
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _rate(rating) {
    const changed = this.getAttribute('value') !== rating;
    this.setAttribute('value', rating);
    if (changed) this.dispatchEvent(new CustomEvent('rate', { bubbles: true, composed: true, detail: { rating, source: this.getAttribute('source') || '' } }));
  }
  _submitFeedback() {
    const feedback = ((this._fbText && this._fbText.value) || '').trim();
    this.dispatchEvent(new CustomEvent('feedback', { bubbles: true, composed: true, detail: { rating: 'down', source: this.getAttribute('source') || '', feedback } }));
    if (this._popover) this._popover.open = false;
    this.shadowRoot.querySelector('.down').setAttribute('aria-expanded', 'false');
    this.setAttribute('data-feedback-done', '');
    this._update();
  }
  _update() {
    this.shadowRoot.querySelector('.prompt').textContent = this.getAttribute('prompt') || '';
    const value = this.getAttribute('value');
    const up = this.shadowRoot.querySelector('.up'), down = this.shadowRoot.querySelector('.down');
    up.classList.toggle('selected', value === 'up');
    down.classList.toggle('selected', value === 'down');
    // toggle-button state — without it a screen reader can't tell which thumb is chosen (only the CSS .selected changed)
    up.setAttribute('aria-pressed', String(value === 'up'));
    down.setAttribute('aria-pressed', String(value === 'down'));
    this.shadowRoot.querySelector('.fb-prompt').textContent = this.getAttribute('feedback-prompt') || 'What could be better?';
    if (this._fbText) this._fbText.setAttribute('placeholder', this.getAttribute('feedback-placeholder') || 'Tell us more (optional)');
    // thank-you confirmation — fades in on a PERSISTENT node (opt-in via `thanks`): instantly on an up
    // rating, and only once the feedback is submitted on a down rating
    this.shadowRoot.querySelector('.thanks-text').textContent = this.getAttribute('thanks') || '';
    const showThanks = value === 'up' || (value === 'down' && this.hasAttribute('data-feedback-done'));
    if (showThanks) this.setAttribute('data-done', '');
    else this.removeAttribute('data-done');
  }
}

export function defineAhaCsat(tag = 'aha-csat') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCsat);
  return true;
}
if (typeof window !== 'undefined') defineAhaCsat();

export default { AhaCsat, defineAhaCsat };
