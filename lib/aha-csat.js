/**
 * @ahaslides-product/design/aha-csat — the shared CSAT (satisfaction) primitive.
 *
 *   import '@ahaslides-product/design/aha-csat';   // registers <aha-csat>
 *   <aha-csat prompt="How's your experience?" source="editor_help"></aha-csat>
 *
 * The shared binary thumbs-up/down satisfaction prompt (feedback pattern) — do NOT build a
 * bespoke rating control. Pass a stable `source` per placement so analytics segmentation is
 * typo-proof. ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The Good / Not good / Feedback
 * buttons are the DS icon button, <aha-button variant="tertiary" icon-only size="sm"> (28×28) with the shared
 * <aha-icon> BY NAME at 16; the chosen thumb is the button's `pressed` state (aria-pressed follows), so hover and
 * selected animate on PERSISTENT button nodes (attribute toggle, no rebuild).
 *
 * Layout: the borderless single row by default — a 12px prompt + two 28×28 thumb buttons (16px icons), plus the
 * optional Feedback button, on ONE line, no chrome (the canonical CSAT surface). Set `layout="stacked"` to put the
 * prompt on the top line and the buttons on the line below, both left-aligned (e.g. a narrow side panel).
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
 *   • Opt-in `feedback-on="any"` (default `down`) opens the same popover after a thumbs-up too, with the same
 *     once-per-rating rule; the `feedback` event then carries rating 'up'. The up thumb gains aria-haspopup="dialog".
 *   • Opt-in `confirmation="<text>"` shows that text inline after the thumbs (under them with layout="stacked") once
 *     rated and again after a feedback Send, in a role=status live region, as a 14px regular line in the default
 *     text ink; the chosen thumb is drawn in the tertiary active ink on the accent fill with
 *     or without it. Opt-in `confirmation-like` / `confirmation-dislike` replace that text for an up / down rating
 *     (e.g. "You liked this. Thanks for letting us know!"); `confirmation` stays the fallback for an unset one and the
 *     only text after a Feedback-button Send with no rating. None set: no confirmation shows.
 *   • Opt-in `confirmation-sent="<text>"` replaces the confirmation text after a feedback Send (e.g. "Thanks! Our
 *     developers have received your feedback."); unset, the rating text or `confirmation` shows as before.
 *   • With `feedback-display="inline"` the field has no close button: it closes on Send or on Escape.
 *   • Opt-in `feedback-hint="<text>"` shows that text as the helper line under the feedback field (the textarea's
 *     `info-message`), beside the counter; an error message on the field replaces it while it shows.
 *   • Feedback button (opt-in `feedback-button`, right of the thumbs, always visible) — opens the same
 *     popover without rating.
 *   • Opt-in `feedback-display="inline"` (default `popover`) — the same feedback body (heading, textarea, Send) opens
 *     in flow under the buttons instead of in its own popover, for a CSAT that already sits inside a popover or card.
 *     Same opening rules, events and once-per-rating rule; Send or Escape with focus inside collapses it, and the
 *     Feedback button only opens it (clicked while open, it keeps it open and focuses the field). The panel is a
 *     labelled group (no role=dialog); the openers carry aria-expanded and aria-controls but no aria-haspopup. Its
 *     height and fade animate on the DS motion tokens (none under reduced motion).
 *   • On submit, emits a composed `feedback` CustomEvent<{ rating:'up'|'down'|null, source, feedback }>
 *     (the pattern's CSAT_FEEDBACK_SUBMITTED, separate from CSAT_RATED).
 *     Show the "Thank you for your feedback!" toast from it.
 *
 * Tooltips: the Good / Not good / Feedback hints open above the buttons by default; set
 * `tooltip-placement="bottom"` to open them below (e.g. inside a card whose title sits above the CSAT).
 * Any other value falls back to top. The feedback popover opens end-aligned (right edge on the thumbs) by
 * default; set `feedback-placement="start"` to open it start-aligned (left edge on the thumbs, e.g. a CSAT in the
 * left corner of a narrow panel). It still flips above the thumbs at the bottom of the viewport. Any other value falls back to end.
 *
 * @fires rate     CustomEvent<{ rating:'up'|'down'|null, source }> — a thumb was chosen, or null when un-rated.
 * @fires feedback CustomEvent<{ rating:'up'|'down'|null, source, feedback }> — free-text submitted; `rating` is the current value, null when unrated.
 *
 * The thumbs are toggle buttons with aria-pressed synced to the selection; the down thumb carries
 * aria-haspopup="dialog" (popover display only) + aria-expanded mirrored from the feedback panel onto the opener that opened it.
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
  :host([layout="stacked"]) .rating{ flex-direction:column; align-items:flex-start; gap:var(--aha-space-2,2px) }
  .prompt{ font-size:12px; line-height:18px; font-weight:400; color:var(--aha-gray-80,#616161); min-width:0 }
  .prompt:empty{ display:none }
  .btns, .trg{ display:inline-flex; flex:none; align-items:center; gap:var(--aha-space-2,2px) }
  aha-tooltip[hidden]{ display:none }
  :host([data-popover-open]) aha-tooltip::part(bubble){ visibility:hidden }
  .confirm{ display:inline-flex; min-width:0; margin-inline-start:var(--aha-space-4,4px);
    font-size:var(--aha-size-default,14px); line-height:21px; font-weight:var(--aha-weight-regular,400); color:var(--aha-text-default,#1A1A1A) }
  .confirm[hidden]{ display:none }
  .confirm-text{ min-width:0; overflow-wrap:anywhere }
  :host([layout="stacked"]) .confirm{ margin-inline-start:0; margin-block-start:var(--aha-space-8,8px) }

  /* feedback follow-up — the free-text panel that opens after a thumbs-down, slotted into the
     shared <aha-popover> (which carries its own elevated card chrome + motion). */
  .fb-body{ display:flex; flex-direction:column; gap:12px; min-width:220px }
  .fb-head{ display:flex; align-items:flex-start; justify-content:flex-end; gap:var(--aha-space-8,8px); margin-bottom:calc(-1 * var(--aha-space-4,4px)) }
  .fb-prompt{ flex:1; font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .fb-prompt:empty{ display:none }
  .fb-close{ --aha-close-line-height:21px }
  .fb-text{ width:100% }
  .fb-submit{ align-self:flex-end }

  :host([feedback-display="inline"]){ display:grid; width:100%; min-width:0; box-sizing:border-box }
  :host([feedback-display="inline"]) aha-popover{ display:none }
  .fb-inline{ display:grid; grid-template-rows:0fr; min-width:0; opacity:0; visibility:hidden;
    transition:grid-template-rows var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host(:not([feedback-display="inline"])) .fb-inline{ display:none }
  :host([data-feedback-open]) .fb-inline{ grid-template-rows:1fr; opacity:1; visibility:visible }
  .fb-inline-clip{ min-height:0; min-width:0; overflow:hidden }
  .fb-inline .fb-body{ min-width:0; box-sizing:border-box; padding-top:var(--aha-space-8,8px) }
  :host([feedback-display="inline"]) .fb-close{ display:none }
  :host([feedback-display="inline"]) .fb-head{ margin-bottom:0 }

  @media (prefers-reduced-motion: reduce){ .fb-inline{ transition:none } }
`;

export class AhaCsat extends HTMLElement {
  static get observedAttributes() { return ['prompt', 'value', 'feedback-prompt', 'feedback-placeholder', 'feedback-button', 'feedback-button-placeholder', 'like-label', 'dislike-label', 'feedback-label', 'tooltip-placement', 'feedback-placement', 'layout', 'feedback-on', 'confirmation', 'confirmation-like', 'confirmation-dislike', 'confirmation-sent', 'feedback-hint', 'feedback-display']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<span class="rating" part="rating"><span class="prompt" part="prompt"></span>` +
        `<span class="btns">` +
          `<aha-popover class="fb" part="feedback" placement="bottom-end" trigger="click" flip>` +
            `<span slot="trigger" class="trg" tabindex="-1">` +
              `<aha-tooltip class="tip-up" placement="top"><aha-button class="up" variant="tertiary" icon-only size="sm" part="button" type="button" aria-label="Good" pressed="false"><aha-icon name="system-thumbs-up" size="16" decorative></aha-icon></aha-button></aha-tooltip>` +
              `<aha-tooltip class="tip-down" placement="top"><aha-button class="down" variant="tertiary" icon-only size="sm" part="button" type="button" aria-label="Not good" pressed="false" aria-haspopup="dialog" aria-expanded="false"><aha-icon name="system-thumbs-down" size="16" decorative></aha-icon></aha-button></aha-tooltip>` +
              `<aha-tooltip class="tip-feedback fb-trigger" placement="top" hidden><aha-button class="fb-open" variant="tertiary" icon-only size="sm" part="button" type="button" aria-label="Feedback" aria-haspopup="dialog" aria-expanded="false"><aha-icon name="system-chat-text" size="16" decorative></aha-icon></aha-button></aha-tooltip>` +
            `</span>` +
            `<div class="fb-body">` +
              `<div class="fb-head"><div class="fb-prompt" part="feedback-prompt"></div><aha-button variant="tertiary" icon-only size="xs" corner class="fb-close" part="feedback-close" aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button></div>` +
              `<aha-counted-textarea class="fb-text" maxlength="2000" minrows="2" maxrows="4"></aha-counted-textarea>` +
              `<aha-button class="fb-submit" variant="secondary" size="md" disabled>Send</aha-button>` +
            `</div>` +
          `</aha-popover>` +
        `</span><span class="confirm" part="confirmation" role="status" aria-live="polite" hidden><span class="confirm-text"></span></span></span>` +
        `<div class="fb-inline" id="fb-inline" part="feedback-inline" role="group" inert><div class="fb-inline-clip"></div></div>`;
      this._popover = this.shadowRoot.querySelector('aha-popover');
      this._inlinePanel = this.shadowRoot.querySelector('.fb-inline');
      this._inlinePanel.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !this._isOpen()) return;
        event.stopPropagation();
        this._closePopover();
      });
      this._fbText = this.shadowRoot.querySelector('.fb-text');
      const down = this.shadowRoot.querySelector('.down');
      this.shadowRoot.querySelector('.up').addEventListener('click', () => {
        this._openedBy = 'up';
        this._fromFeedbackButton = false;
        this._toggleRating('up');
        this._wantOpen = this.getAttribute('feedback-on') === 'any' && this.getAttribute('value') === 'up' && !this.hasAttribute('data-feedback-done');
        this._update();
        this._applyInline();
      });
      down.addEventListener('click', () => {
        this._openedBy = 'down';
        this._fromFeedbackButton = false;
        this._toggleRating('down');
        this._wantOpen = this.getAttribute('value') === 'down' && !this.hasAttribute('data-feedback-done');
        this._update();
        this._applyInline();
      });
      const fbOpen = this.shadowRoot.querySelector('.fb-open');
      this.shadowRoot.querySelector('.trg').addEventListener('focus', () => this._focusOpener());
      fbOpen.addEventListener('click', () => {
        const alreadyOpen = this._isInline() && this._isOpen();
        this._fromFeedbackButton = true;
        this._wantOpen = this._isInline() ? true : undefined;
        this._update();
        this._applyInline();
        if (alreadyOpen) this._focusTextarea();
      });
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
    this._placeFeedback();
    this._update();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'feedback-display') this._placeFeedback();
    this._update();
  }
  _isInline() { return this.getAttribute('feedback-display') === 'inline'; }
  _isOpen() { return this._isInline() ? this.hasAttribute('data-feedback-open') : !!this._popover.open; }
  _placeFeedback() {
    const trigger = this.shadowRoot.querySelector('.trg');
    const body = this.shadowRoot.querySelector('.fb-body');
    const inline = this._isInline();
    if (inline === (trigger.parentNode !== this._popover)) return;
    if (inline) {
      this._popover.open = false;
      this._popover.before(trigger);
      this._inlinePanel.firstElementChild.append(body);
    } else {
      this._setInlineOpen(false);
      this._popover.prepend(trigger);
      this._popover.append(body);
    }
    this._syncExpanded();
  }
  _applyInline() {
    if (!this._isInline()) return;
    const want = this._wantOpen;
    this._wantOpen = undefined;
    if (want !== undefined) this._setInlineOpen(want);
  }
  _setInlineOpen(open) {
    const wasOpen = this.hasAttribute('data-feedback-open');
    this.toggleAttribute('data-feedback-open', open);
    this._inlinePanel.toggleAttribute('inert', !open);
    this._syncExpanded();
    if (open && !wasOpen) this._focusTextarea();
  }
  _toggleRating(chosen) {
    const rating = this.getAttribute('value') === chosen ? null : chosen;
    this.removeAttribute('data-feedback-done');
    if (rating) this.setAttribute('value', rating); else this.removeAttribute('value');
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
    const open = this._isOpen();
    const byUp = this._openedBy === 'up';
    this.shadowRoot.querySelector('.down').setAttribute('aria-expanded', String(open && !this._fromFeedbackButton && !byUp));
    if (this.getAttribute('feedback-on') === 'any') this.shadowRoot.querySelector('.up').setAttribute('aria-expanded', String(open && !this._fromFeedbackButton && byUp));
    this.shadowRoot.querySelector('.fb-open').setAttribute('aria-expanded', String(open && !!this._fromFeedbackButton));
    this.toggleAttribute('data-popover-open', open && !this._isInline());
  }
  _focusTextarea() {
    const field = this._isOpen() && this._fbText.shadowRoot && this._fbText.shadowRoot.querySelector('.field');
    if (field) field.focus({ preventScroll: this._isInline() });
  }
  _submitFeedback() {
    const feedback = ((this._fbText && this._fbText.value) || '').trim();
    this.dispatchEvent(new CustomEvent('feedback', { bubbles: true, composed: true, detail: { rating: this.getAttribute('value'), source: this.getAttribute('source') || '', feedback } }));
    this._closePopover();
    this._fbText.setAttribute('value', '');
    this._syncSubmit();
    this.setAttribute('data-feedback-done', '');
    this._announceAgain = true;
    this._update();
  }
  _focusOpener() {
    const opener = this.shadowRoot.querySelector(this._fromFeedbackButton ? '.fb-open' : this._openedBy === 'up' ? '.up' : '.down');
    if (opener) opener.focus();
  }
  _closePopover() {
    if (this._isInline()) this._setInlineOpen(false);
    else if (this._popover) this._popover.open = false;
    this._syncExpanded();
    this._focusOpener();
  }
  _syncConfirmation(value) {
    const confirm = this.shadowRoot.querySelector('.confirm');
    const line = confirm.querySelector('.confirm-text');
    const byRating = value === 'up' ? this.getAttribute('confirmation-like') : value === 'down' ? this.getAttribute('confirmation-dislike') : null;
    const sent = this.hasAttribute('data-feedback-done') ? this.getAttribute('confirmation-sent') : null;
    const text = sent || byRating || this.getAttribute('confirmation');
    const shown = text && (value || this.hasAttribute('data-feedback-done')) ? text : '';
    const announceAgain = shown && this._announceAgain;
    this._announceAgain = false;
    if (announceAgain) {
      line.textContent = '';
      confirm.hidden = true;
      setTimeout(() => this._syncConfirmation(this.getAttribute('value')), 50);
    } else {
      if (line.textContent !== shown) line.textContent = shown;
      confirm.hidden = !shown;
    }
  }
  _syncSubmit() {
    const hasText = !!((this._fbText && this._fbText.value) || '').trim();
    this._submit.toggleAttribute('disabled', !hasText);
  }
  _update() {
    this.shadowRoot.querySelector('.prompt').textContent = this.getAttribute('prompt') || '';
    const value = this.getAttribute('value');
    const up = this.shadowRoot.querySelector('.up'), down = this.shadowRoot.querySelector('.down');
    up.setAttribute('pressed', String(value === 'up'));
    down.setAttribute('pressed', String(value === 'down'));
    const feedbackOnAny = this.getAttribute('feedback-on') === 'any';
    const inline = this.getAttribute('feedback-display') === 'inline';
    const fbOpen = this.shadowRoot.querySelector('.fb-open');
    for (const opener of [up, down, fbOpen]) {
      const opens = opener !== up || feedbackOnAny;
      if (opens && !inline) opener.setAttribute('aria-haspopup', 'dialog'); else opener.removeAttribute('aria-haspopup');
      if (opens && inline) opener.setAttribute('aria-controls', 'fb-inline'); else opener.removeAttribute('aria-controls');
    }
    if (!feedbackOnAny) up.removeAttribute('aria-expanded');
    this._syncConfirmation(value);
    const tipPlacement = this.getAttribute('tooltip-placement') === 'bottom' ? 'bottom' : 'top';
    for (const tip of this.shadowRoot.querySelectorAll('.tip-up, .tip-down, .tip-feedback')) tip.setAttribute('placement', tipPlacement);
    this._popover.setAttribute('placement', this.getAttribute('feedback-placement') === 'start' ? 'bottom-start' : 'bottom-end');
    this.shadowRoot.querySelector('.fb-prompt').textContent = this.getAttribute('feedback-prompt') || '';
    const panelLabel = this.getAttribute('feedback-prompt') || this.getAttribute('feedback-label') || 'Feedback';
    this._popover.setAttribute('aria-label', panelLabel);
    if (this._inlinePanel) this._inlinePanel.setAttribute('aria-label', panelLabel);
    const placeholder = this._fromFeedbackButton
      ? (this.getAttribute('feedback-button-placeholder') || this.getAttribute('feedback-placeholder') || 'Share your thoughts')
      : (this.getAttribute('feedback-placeholder') || 'How can we improve? Let us know!');
    if (this._fbText) this._fbText.setAttribute('placeholder', placeholder);
    if (this._fbText) {
      const hint = this.getAttribute('feedback-hint');
      if (hint) this._fbText.setAttribute('info-message', hint);
      else this._fbText.removeAttribute('info-message');
    }
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
