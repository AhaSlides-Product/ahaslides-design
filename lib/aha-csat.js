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
 * Layout: the borderless single row — a 12px prompt + two 28×28 thumb buttons (16px icons), plus the
 * optional Feedback button, on ONE line, no chrome (the canonical CSAT surface). It is the ONLY layout.
 *
 * Flow:
 *   • Rating is a toggle: thumbs-up / thumbs-down rates and reflects `value`, the chosen thumb takes the
 *     active state while BOTH thumbs stay visible; clicking the other thumb switches the rating, clicking
 *     the chosen thumb again un-rates (`value` is removed). Both emit `rate` — `rating` is null on un-rate.
 *   • thumbs-DOWN also opens a feedback popover anchored to the thumbs group: an X, an optional heading
 *     (`feedback-prompt`), an <aha-counted-textarea> (focused on open) and a secondary <aha-button>
 *     that stays disabled until text is typed. The popover is the shared <aha-popover> (role=dialog,
 *     Escape + outside-click close, focus return) — dismissing it does NOT lose the down rating.
 *   • After Send the popover will not re-open on thumbs-down until the rating changes again.
 *   • Feedback button (opt-in `feedback-button`, right of the thumbs, always visible) — opens the same
 *     popover without rating.
 *   • On submit, emits a composed `feedback` CustomEvent<{ rating:'up'|'down'|null, source, feedback }>
 *     (the pattern's CSAT_FEEDBACK_SUBMITTED, separate from CSAT_RATED).
 *     Show the "Thank you for your feedback!" toast from it.
 *
 * @fires rate     CustomEvent<{ rating:'up'|'down'|null, source }> — a thumb was chosen, or null when un-rated.
 * @fires feedback CustomEvent<{ rating:'up'|'down'|null, source, feedback }> — free-text submitted; `rating` is the current value, null when unrated.
 *
 * The thumbs are toggle buttons with aria-pressed synced to the selection; the down thumb carries
 * aria-haspopup="dialog" + aria-expanded mirrored from the popover onto the opener that opened it.
 */
import './icons.js';   // registers <aha-icon> + the registry (the thumbs come from it)
import './aha-popover.js';           // the feedback follow-up surface (role=dialog, Esc/outside-click close)
import './aha-counted-textarea.js';  // the free-text field inside the popover
import './aha-button.js';            // the submit control inside the popover
import './aha-tooltip.js';           // the Good / Not good / Feedback hover hints

const STYLE = `
  :host{ display:inline-grid; align-items:center; min-height:28px; max-width:100%;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .rating{ justify-self:start; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); max-width:100% }
  .prompt{ font-size:12px; line-height:18px; font-weight:400; color:var(--aha-gray-80,#616161); min-width:0 }
  .prompt:empty{ display:none }
.btns, .trg{ display:inline-flex; flex:none; align-items:center; gap:var(--aha-space-2,2px) }
  aha-tooltip[hidden]{ display:none }
  .btn{ display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0;
    border:0; border-radius:var(--aha-radius-xs,4px); background:transparent; color:var(--aha-icon-default,#4A4A4A); cursor:pointer;
    transition:background-color var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .btn:hover{ background:var(--aha-button-ghost-bg-hover,#F9F5FF); color:var(--aha-purple-50,#8644D4) }
  .btn:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .btn.selected{ background:var(--aha-btn-tertiary-bg-active,#F0E4FF); color:var(--aha-purple-60,#6A1EBB) }

  /* feedback follow-up — the free-text panel that opens after a thumbs-down, slotted into the
     shared <aha-popover> (which carries its own elevated card chrome + motion). */
  .fb-body{ display:flex; flex-direction:column; gap:12px; min-width:220px }
  .fb-head{ display:flex; align-items:flex-start; justify-content:flex-end; gap:var(--aha-space-8,8px); margin-bottom:calc(-1 * var(--aha-space-4,4px)) }
  .fb-prompt{ flex:1; font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .fb-prompt:empty{ display:none }
  .fb-close{ --aha-close-line-height:21px }
  .fb-text{ width:100% }
  .fb-submit{ align-self:flex-end }

  @media (prefers-reduced-motion: reduce){ .btn{ transition:none } }
`;

export class AhaCsat extends HTMLElement {
  static get observedAttributes() { return ['prompt', 'value', 'feedback-prompt', 'feedback-placeholder', 'feedback-button', 'feedback-button-placeholder', 'like-label', 'dislike-label', 'feedback-label']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<span class="rating" part="rating"><span class="prompt" part="prompt"></span>` +
        `<span class="btns">` +
          `<aha-tooltip class="tip-up" placement="top"><button class="btn up" part="button" type="button" aria-label="Good" aria-pressed="false"><aha-icon name="system-thumbs-up" size="16" decorative></aha-icon></button></aha-tooltip>` +
          `<aha-popover class="fb" part="feedback" placement="bottom-end" trigger="click" flip>` +
            `<span slot="trigger" class="trg" tabindex="-1">` +
              `<aha-tooltip class="tip-down" placement="top"><button class="btn down" part="button" type="button" aria-label="Not good" aria-pressed="false" aria-haspopup="dialog" aria-expanded="false"><aha-icon name="system-thumbs-down" size="16" decorative></aha-icon></button></aha-tooltip>` +
              `<aha-tooltip class="tip-feedback fb-trigger" placement="top" hidden><button class="btn fb-open" part="button" type="button" aria-label="Feedback" aria-haspopup="dialog" aria-expanded="false"><aha-icon name="system-chat-text" size="16" decorative></aha-icon></button></aha-tooltip>` +
            `</span>` +
            `<div class="fb-body">` +
              `<div class="fb-head"><div class="fb-prompt" part="feedback-prompt"></div><aha-button variant="tertiary" icon-only size="xs" corner class="fb-close" part="feedback-close" aria-label="Close"><aha-icon name="system-x" size="14" decorative></aha-icon></aha-button></div>` +
              `<aha-counted-textarea class="fb-text" maxlength="2000" minrows="2" maxrows="4"></aha-counted-textarea>` +
              `<aha-button class="fb-submit" variant="secondary" size="md" disabled>Send</aha-button>` +
            `</div>` +
          `</aha-popover>` +
        `</span></span>`;
      this._popover = this.shadowRoot.querySelector('aha-popover');
      this._fbText = this.shadowRoot.querySelector('.fb-text');
      const down = this.shadowRoot.querySelector('.down');
      this.shadowRoot.querySelector('.up').addEventListener('click', () => {
        this._toggleRating('up');
        if (this._popover.open) this._popover.open = false;
        this._syncExpanded();
      });
      down.addEventListener('click', () => {
        this._fromFeedbackButton = false;
        this._toggleRating('down');
        this._wantOpen = this.getAttribute('value') === 'down' && !this.hasAttribute('data-feedback-done');
        this._update();
      });
      const fbOpen = this.shadowRoot.querySelector('.fb-open');
      this.shadowRoot.querySelector('.trg').addEventListener('focus', () => this._focusOpener());
      fbOpen.addEventListener('click', () => { this._fromFeedbackButton = true; this._wantOpen = undefined; this._update(); });
      this._submit = this.shadowRoot.querySelector('.fb-submit');
      this._submit.addEventListener('click', () => this._submitFeedback());
      this._fbText.addEventListener('input', () => this._syncSubmit());
      this.shadowRoot.querySelector('.fb-close').addEventListener('click', () => this._closePopover());
      this._popover.addEventListener('open', () => {
        if (this._reconcilePopover()) return;
        this._syncExpanded();
        setTimeout(() => this._focusTextarea(), 200);
      });
      this._popover.addEventListener('close', () => { if (!this._reconcilePopover()) this._syncExpanded(); });
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _toggleRating(chosen) {
    const rating = this.getAttribute('value') === chosen ? null : chosen;
    if (rating) this.setAttribute('value', rating); else this.removeAttribute('value');
    this.removeAttribute('data-feedback-done');
    this.dispatchEvent(new CustomEvent('rate', { bubbles: true, composed: true, detail: { rating, source: this.getAttribute('source') || '' } }));
  }
  _reconcilePopover() {
    const want = this._wantOpen;
    this._wantOpen = undefined;
    if (want === undefined || want === this._popover.open) return false;
    this._popover.open = want;
    this._syncExpanded();
    return true;
  }
  _syncExpanded() {
    const open = this._popover.open;
    this.shadowRoot.querySelector('.down').setAttribute('aria-expanded', String(open && !this._fromFeedbackButton));
    this.shadowRoot.querySelector('.fb-open').setAttribute('aria-expanded', String(open && !!this._fromFeedbackButton));
  }
  _focusTextarea() {
    const field = this._popover.open && this._fbText.shadowRoot && this._fbText.shadowRoot.querySelector('.field');
    if (field) field.focus();
  }
  _submitFeedback() {
    const feedback = ((this._fbText && this._fbText.value) || '').trim();
    this.dispatchEvent(new CustomEvent('feedback', { bubbles: true, composed: true, detail: { rating: this.getAttribute('value'), source: this.getAttribute('source') || '', feedback } }));
    this._closePopover();
    this._fbText.setAttribute('value', '');
    this._syncSubmit();
    this.setAttribute('data-feedback-done', '');
    this._update();
  }
  _focusOpener() {
    const opener = this.shadowRoot.querySelector(this._fromFeedbackButton ? '.fb-open' : '.down');
    if (opener) opener.focus();
  }
  _closePopover() {
    if (this._popover) this._popover.open = false;
    this._syncExpanded();
    this._focusOpener();
  }
  _syncSubmit() {
    const hasText = !!((this._fbText && this._fbText.value) || '').trim();
    this._submit.toggleAttribute('disabled', !hasText);
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
    this.shadowRoot.querySelector('.fb-prompt').textContent = this.getAttribute('feedback-prompt') || '';
    const placeholder = this._fromFeedbackButton
      ? (this.getAttribute('feedback-button-placeholder') || this.getAttribute('feedback-placeholder') || 'Share your thoughts')
      : (this.getAttribute('feedback-placeholder') || 'How can we improve? Let us know!');
    if (this._fbText) this._fbText.setAttribute('placeholder', placeholder);
    const likeLabel = this.getAttribute('like-label') || 'Good';
    const dislikeLabel = this.getAttribute('dislike-label') || 'Not good';
    this.shadowRoot.querySelector('.tip-up').setAttribute('text', likeLabel);
    this.shadowRoot.querySelector('.tip-down').setAttribute('text', dislikeLabel);
    up.setAttribute('aria-label', likeLabel);
    down.setAttribute('aria-label', dislikeLabel);
    this.shadowRoot.querySelector('.tip-feedback').setAttribute('text', this.getAttribute('feedback-label') || 'Feedback');
    this.shadowRoot.querySelector('.tip-feedback').toggleAttribute('hidden', !this.hasAttribute('feedback-button'));
  }
}

export function defineAhaCsat(tag = 'aha-csat') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCsat);
  return true;
}
if (typeof window !== 'undefined') defineAhaCsat();

export default { AhaCsat, defineAhaCsat };
