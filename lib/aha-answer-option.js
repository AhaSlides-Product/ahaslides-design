/**
 * @ahaslides-product/design/aha-answer-option — one tappable answer row on the audience phone.
 *
 *   import '@ahaslides-product/design/aha-answer-option';   // registers <aha-answer-option>
 *   <aha-answer-option selected>Coffee</aha-answer-option>
 *   <aha-answer-option revealed correct count="12" total="30" count-mode="percent">Tea</aha-answer-option>
 *
 * Reach for <aha-answer-list> first: it repeats this row and owns the selection, the 8px gap and the
 * counts. Use the row directly only when the rows are not a plain list (split across columns, laid
 * out on a board).
 *
 * The row takes the RAW quiz inputs (quiz-status, answered, revealed, awaiting-reveal, selected,
 * correct) and resolves them with `answerOptionState()`, so a slide never interprets the host's quiz
 * lifecycle itself. Three looks: OPEN (tappable), LOCKED (answered or waiting for the reveal: your
 * pick stays at full strength, the others mute), REVEALED (an <aha-answer-mark> on every row: a white tick
 * on the answer-green disc or a white cross on the answer-red disc; the correct row takes the
 * --aha-answer-correct edge, your wrong pick is ringed in --aha-answer-wrong, the rest mute). Deck-tracking: the label is the deck ink, the row sits on the frosted surface, the
 * "you picked this" colour is the deck's first accent. Emits composed `pick` when tapped while open.
 *
 * `expandable` is the long-text variant: the label clamps to 4 lines, a "More" link sits inside the card when the
 * text is cut, the picture stays on the left, as on a default row, and shows a dark expand overlay on hover. More and the picture emit
 * composed `expand` ({ detail: { source: 'more' | 'image' } }) and never pick; open <aha-audience-modal> in response.
 */
import './icons.js';
import './aha-answer-mark.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';
import { EXPANDABLE_STYLE, SHADE_HTML, MORE_HTML, measureClamp, syncExpandPicture } from './expandable-option.js';

const QUIZ_STATUS_QUESTION = 4;

/**
 * One answer row's state, from the host quiz phase plus this participant's answer.
 * `quizStatus` undefined means a host with no quiz lifecycle: the question counts as open.
 * Returns { visible, interactive, dimmed, tone: idle|picked|correct|incorrect, verdict: none|correct|incorrect, mine }.
 */
export function answerOptionState({ quizStatus, answered = false, revealed = false, awaitingReveal = false, selected = false, correct = false } = {}) {
  const visible = quizStatus == null || quizStatus >= QUIZ_STATUS_QUESTION;
  if (!visible) return { visible: false, interactive: false, dimmed: false, tone: 'idle', verdict: 'none', mine: false };
  if (revealed) {
    return {
      visible: true, interactive: false, dimmed: !selected && !correct,
      tone: correct ? 'correct' : (selected ? 'incorrect' : 'idle'),
      verdict: correct ? 'correct' : 'incorrect',
      mine: selected,
    };
  }
  if (answered || awaitingReveal) {
    return { visible: true, interactive: false, dimmed: !selected, tone: selected ? 'picked' : 'idle', verdict: 'none', mine: selected };
  }
  const roundClosed = quizStatus != null && quizStatus > QUIZ_STATUS_QUESTION;
  return { visible: true, interactive: !roundClosed, dimmed: false, tone: selected ? 'picked' : 'idle', verdict: 'none', mine: selected };
}

/** The count chip's text. A share is clamped at 100%: count and total arrive in separate ticks. */
export function answerCountLabel(count, total, mode) {
  if (mode !== 'percent') return String(count);
  if (!(total > 0)) return '0%';
  return `${Math.min(100, Math.round((count / total) * 100))}%`;
}

const STYLE = DECK_STYLE + `
  :host{ display:block; min-width:0 }
  .row{ position:relative; box-sizing:border-box; display:flex; align-items:center; gap:var(--aha-space-12, 12px);
    width:100%; min-height:var(--aha-space-48, 48px); padding:var(--aha-space-8, 8px) var(--aha-space-16, 16px);
    border-radius:var(--aha-radius-default, 8px); color:var(--_ink); text-align:start; cursor:default }
  .row[data-tall][data-image-only]{ align-items:flex-start }
  .row[aria-disabled="false"]{ cursor:pointer }
  .row:focus-visible, .row:has(.label:focus-visible){ outline:2px solid var(--_ink); outline-offset:2px }
  .label:focus-visible, .control:focus-visible{ outline:none }
  .row:has(.control:focus-visible){ outline:2px solid var(--_ink); outline-offset:2px }
  .row[data-tone="idle"], .row[data-tone="picked"]{ --_tone:var(--_ink) }
  .row[data-tone="correct"]{ --_tone:var(--aha-answer-correct) }
  .row[data-tone="incorrect"]{ --_tone:var(--aha-answer-wrong); box-shadow:0 0 0 var(--aha-space-2, 2px) var(--_tone) }

  .surface{ position:absolute; inset:0; pointer-events:none; border:1px solid var(--_stroke); border-radius:inherit;
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row:not([data-tone="idle"]) .surface{ border-color:var(--_tone) }
  .row[aria-disabled="false"]:hover .surface{ background:var(--_surface-hover) }
  .row[aria-disabled="true"] .surface{ background:var(--_surface-disabled) }
  .tint{ position:absolute; inset:0; pointer-events:none; border-radius:inherit; background:var(--_tone); opacity:0;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-mine]:not([data-tone="picked"]) .tint{ opacity:.1 }

  .content{ position:relative; display:flex; align-items:center; gap:inherit; flex:1 1 auto; min-width:0;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-tall][data-image-only] .content{ align-items:flex-start }
  .row[data-dimmed] .content{ opacity:.55 }

  .control{ flex:0 0 auto; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:20px; height:20px; border:1px solid var(--_stroke-chip); border-radius:50%; color:var(--aha-white, #FFFFFF);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-mode="multiple"] .control{ border-radius:var(--aha-radius-sm, 6px) }
  .row[aria-disabled="false"]:hover .control{ border-color:var(--_stroke-hover) }
  .row[data-mine] .control{ border-color:var(--_mark) }
  .row[data-mine][data-mode="multiple"] .control{ background:var(--_mark) }
  .row[data-mine][aria-disabled="false"]:hover .control{ border-color:var(--_mark-hover) }
  .row[data-mine][data-mode="multiple"][aria-disabled="false"]:hover .control{ background:var(--_mark-hover) }
  .dot{ width:var(--aha-space-12, 12px); height:var(--aha-space-12, 12px); border-radius:50%; background:var(--_mark); transform:scale(0);
    transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-mine] .dot{ transform:scale(1) }
  .tick{ display:none }
  .row[data-mode="multiple"] .dot{ display:none }
  .row[data-mode="multiple"] .tick{ display:inline-flex; opacity:0; transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-mode="multiple"][data-mine] .tick{ opacity:1 }
  .row:not([data-verdict="none"]) .control{ display:none }
  .row[data-expandable][data-image-only]:not([data-verdict="none"]) .control{ display:inline-flex; position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); border:0 }

  .verdict{ display:none }
  .row:not([data-verdict="none"]) .verdict{ display:inline-flex }

  .picture{ flex:0 0 auto; display:none; align-items:center; justify-content:center; overflow:hidden; width:44px; height:44px;
    border-radius:var(--aha-radius-default, 8px) }
  .row[data-image] .picture{ display:inline-flex }
  .row[data-image-only] .picture{ flex:1 1 auto; width:100%; height:120px }
  .picture img{ width:100%; height:100%; object-fit:cover }
  .label{ flex:1 1 auto; min-width:0; font-size:16px; line-height:24px; font-weight:var(--aha-weight-regular, 400); overflow-wrap:anywhere }
  .row[data-mine] .label{ font-weight:var(--aha-weight-semibold, 600) }
  .row[data-image]:not([data-expandable]) .label{ display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
  .row[data-image-only] .label{ display:none }
  .count{ flex:0 0 auto; display:inline-flex; align-items:center; gap:var(--aha-space-4, 4px); font-size:14px; font-weight:600; color:var(--_ink-secondary); font-variant-numeric:tabular-nums }
  .row[data-count-mode="off"] .count{ visibility:hidden }
  .person{ display:none }
  .row[data-count-mode="people"] .person{ display:inline-flex }
  .body{ display:contents }
  .row[data-expandable] .count{ order:2 }
  .row[data-expandable][data-count-mode="off"] .count{ display:none }
  .row[data-expandable][data-image-only] .picture{ flex:1 1 auto; width:100%; height:120px }
  .row[data-expandable][data-image-only] .body{ display:none }
  ${EXPANDABLE_STYLE}
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="row" part="row" data-tone="idle" data-verdict="none" data-count-mode="off">
    <span class="surface"></span><span class="tint"></span>
    <span class="content">
      <span class="control" aria-hidden="true"><span class="dot"></span><aha-icon class="tick" name="system-check" size="16" decorative></aha-icon></span>
      <aha-answer-mark class="verdict" part="verdict" size="20"></aha-answer-mark>
      <span class="picture"><img alt="">${SHADE_HTML}</span>
      <span class="body"><span class="label" dir="auto"><slot></slot></span>${MORE_HTML}</span>
      <span class="count" part="count"><span class="count-text">0</span><aha-icon class="person" name="system-user" size="16" decorative></aha-icon></span>
    </span>
  </div>`;

const OBSERVED = ['selected', 'correct', 'answered', 'revealed', 'awaiting-reveal', 'quiz-status', 'selection-mode', 'image',
  'count', 'total', 'count-mode', 'correct-label', 'incorrect-label', 'expandable', 'more-label', 'expand-label'];

export class AhaAnswerOption extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, ...OBSERVED]; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._row = this.shadowRoot.querySelector('.row');
    this._row.addEventListener('click', () => this._pick());
    this._row.addEventListener('keydown', (event) => this._onKey(event));
    this._label = this.shadowRoot.querySelector('.label');
    this._control = this.shadowRoot.querySelector('.control');
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._sync());
    this._more = this.shadowRoot.querySelector('.more');
    this._picture = this.shadowRoot.querySelector('.picture');
    this._more.addEventListener('click', (event) => this._expand(event, 'more'));
    this._picture.addEventListener('click', (event) => { if (this.hasAttribute('expandable')) this._expand(event, 'image'); });
    this._picture.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') this._expand(event, 'image');
    });
    this._resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this._measureClamp());
  }
  connectedCallback() {
    super.connectedCallback();
    this._sync();
    if (this._resizeObserver) this._resizeObserver.observe(this._row);
  }
  disconnectedCallback() { if (this._resizeObserver) this._resizeObserver.disconnect(); }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    this._sync();
  }

  /** The resolved state, the same object `answerOptionState()` returns for this row's attributes. */
  get state() {
    const status = this.getAttribute('quiz-status');
    return answerOptionState({
      quizStatus: status == null || status === '' ? undefined : Number(status),
      answered: this.hasAttribute('answered'),
      revealed: this.hasAttribute('revealed'),
      awaitingReveal: this.hasAttribute('awaiting-reveal'),
      selected: this.hasAttribute('selected'),
      correct: this.hasAttribute('correct'),
    });
  }
  focus(options) { this._choice().focus(options); }

  /** Radio and checkbox children are presentational, so the expandable row puts the role on the label (or the control when there is no text) and leaves More and the picture outside it. */
  _choice() {
    if (!this.hasAttribute('expandable')) return this._row;
    return this.textContent.trim().length > 0 ? this._label : this._control;
  }

  _pick() {
    if (!this.state.interactive) return;
    this.dispatchEvent(new CustomEvent('pick', { bubbles: true, composed: true }));
  }
  _expand(event, source) {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(new CustomEvent('expand', { bubbles: true, composed: true, detail: { source } }));
  }
  _measureClamp() {
    measureClamp(this._row, this._label, this.hasAttribute('expandable'));
  }
  _onKey(event) {
    if (event.target !== this._choice()) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this._pick(); return; }
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const rows = [...(this.parentNode?.children || [])].filter((el) => el.localName === this.localName && el.state.interactive);
    const next = rows[(rows.indexOf(this) + step + rows.length) % rows.length];
    if (!next || next === this) return;
    event.preventDefault();
    next.focus();
    if ((this.getAttribute('selection-mode') || 'single') === 'single') next._pick();
  }
  _sync() {
    const state = this.state;
    const row = this._row;
    const mode = this.getAttribute('selection-mode') === 'multiple' ? 'multiple' : 'single';
    const image = this.getAttribute('image');
    const hasLabel = this.textContent.trim().length > 0;
    this.toggleAttribute('hidden', !state.visible);
    const choice = this._choice();
    for (const element of [row, this._label, this._control]) {
      if (element === choice) continue;
      for (const name of ['role', 'aria-checked', 'tabindex', 'aria-label']) element.removeAttribute(name);
      if (element !== row) element.removeAttribute('aria-disabled');
    }
    this._control.setAttribute('aria-hidden', String(choice !== this._control));
    choice.setAttribute('role', mode === 'multiple' ? 'checkbox' : 'radio');
    choice.setAttribute('aria-checked', String(state.mine));
    choice.setAttribute('aria-disabled', String(!state.interactive));
    row.setAttribute('aria-disabled', String(!state.interactive));
    choice.tabIndex = state.interactive ? 0 : -1;
    row.dataset.mode = mode;
    row.dataset.tone = state.tone;
    row.dataset.verdict = state.verdict;
    row.toggleAttribute('data-mine', state.mine);
    row.toggleAttribute('data-dimmed', state.dimmed);
    row.toggleAttribute('data-image', !!image);
    row.toggleAttribute('data-image-only', !!image && !hasLabel);
    row.toggleAttribute('data-tall', !!image && (!hasLabel || this.textContent.trim().length > 60));
    const expandable = this.hasAttribute('expandable');
    row.toggleAttribute('data-expandable', expandable);
    this._more.textContent = this.getAttribute('more-label') || 'More';
    syncExpandPicture(this._picture, expandable && !!image, this.getAttribute('expand-label'));
    this._measureClamp();
    const img = this.shadowRoot.querySelector('.picture img');
    if (image && img.getAttribute('src') !== image) img.setAttribute('src', image);
    if (!hasLabel && image) choice.setAttribute('aria-label', this.getAttribute('aria-label') || 'Image option');
    else choice.removeAttribute('aria-label');
    const verdictMark = this.shadowRoot.querySelector('.verdict');
    const correctVerdict = state.verdict === 'correct';
    verdictMark.setAttribute('result', correctVerdict ? 'correct' : 'incorrect');
    verdictMark.setAttribute('label', correctVerdict ? (this.getAttribute('correct-label') || 'Correct') : (this.getAttribute('incorrect-label') || 'Incorrect'));
    const countMode = ['percent', 'people'].includes(this.getAttribute('count-mode')) ? this.getAttribute('count-mode') : 'off';
    row.dataset.countMode = countMode;
    const total = this.getAttribute('total');
    this.shadowRoot.querySelector('.count-text').textContent =
      answerCountLabel(Number(this.getAttribute('count') || 0), total == null ? undefined : Number(total), countMode);
  }
}

export function defineAhaAnswerOption(tag = 'aha-answer-option') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAnswerOption);
}
if (typeof window !== 'undefined') defineAhaAnswerOption();
export default { AhaAnswerOption, defineAhaAnswerOption, answerOptionState, answerCountLabel };
