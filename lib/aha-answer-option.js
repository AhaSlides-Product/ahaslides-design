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
 * pick stays at full strength, the others mute), REVEALED (a tick or cross on every row; only your
 * pick is ringed). Deck-tracking: the label is the deck ink, the row sits on the frosted surface, the
 * "you picked this" colour is the deck's first accent. Emits composed `pick` when tapped while open.
 */
import './icons.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

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
      visible: true, interactive: false, dimmed: false,
      tone: selected ? (correct ? 'correct' : 'incorrect') : 'idle',
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
    width:100%; min-height:56px; padding:var(--aha-space-12, 12px) var(--aha-space-16, 16px);
    border-radius:var(--aha-radius-default, 8px); color:var(--_ink); text-align:start; cursor:default; outline:none;
    transition:box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-tall]{ align-items:flex-start }
  .row[aria-disabled="false"]{ cursor:pointer }
  .row:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .row[data-mine]{ box-shadow:0 0 0 2px var(--_tone) }
  .row[data-tone="idle"], .row[data-tone="picked"]{ --_tone:var(--_ink) }
  .row[data-tone="correct"]{ --_tone:var(--aha-color-success, #16C49A) }
  .row[data-tone="incorrect"]{ --_tone:var(--aha-color-error, #F5222D) }

  .surface{ position:absolute; inset:0; pointer-events:none; border:1px solid var(--_edge); border-radius:inherit;
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-mine] .surface{ border-color:var(--_tone) }
  .row[aria-disabled="false"]:hover .surface{ background:var(--_surface-hover) }
  .row[aria-disabled="true"] .surface{ background:var(--_surface-disabled) }
  .tint{ position:absolute; inset:0; pointer-events:none; border-radius:inherit; background:var(--_tone); opacity:0;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-mine] .tint{ opacity:.1 }

  .content{ position:relative; display:flex; align-items:center; gap:inherit; flex:1 1 auto; min-width:0;
    transition:opacity var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-tall] .content{ align-items:flex-start }
  .row[data-dimmed] .content{ opacity:.45 }

  .control{ flex:0 0 auto; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:20px; height:20px; border:1px solid var(--_edge); border-radius:var(--aha-radius-pill, 999px); color:var(--aha-white, #FFFFFF);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row[data-mode="multiple"] .control{ border-radius:var(--aha-radius-xs, 4px) }
  .row[aria-disabled="false"]:hover .control{ border-color:var(--_edge-hover) }
  .row[data-mine] .control{ background:var(--_mark); border-color:var(--_mark) }
  .row[data-mine][aria-disabled="false"]:hover .control{ background:var(--_mark-hover); border-color:var(--_mark-hover) }
  .dot{ width:8px; height:8px; border-radius:var(--aha-radius-pill, 999px); background:currentColor; transform:scale(0);
    transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-mine] .dot{ transform:scale(1) }
  .tick{ display:none }
  .row[data-mode="multiple"] .dot{ display:none }
  .row[data-mode="multiple"] .tick{ display:inline-flex; opacity:0; transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-mode="multiple"][data-mine] .tick{ opacity:1 }
  .row:not([data-verdict="none"]) .control{ display:none }

  .verdict{ flex:0 0 auto; display:none; line-height:0 }
  .row[data-verdict="correct"] .verdict{ display:inline-flex; color:var(--aha-color-success, #16C49A) }
  .row[data-verdict="incorrect"] .verdict{ display:inline-flex; color:var(--aha-color-error, #F5222D) }

  .picture{ flex:0 0 auto; display:none; align-items:center; justify-content:center; overflow:hidden; width:44px; height:44px;
    border-radius:var(--aha-radius-default, 8px); background:color-mix(in srgb, var(--_ink) 8%, transparent) }
  .row[data-image] .picture{ display:inline-flex }
  .row[data-image-only] .picture{ flex:1 1 auto; width:100%; height:120px }
  .picture img{ width:100%; height:100%; object-fit:contain }
  .label{ flex:1 1 auto; min-width:0; font-size:16px; line-height:24px; font-weight:400; overflow-wrap:anywhere }
  .row[data-mine] .label{ font-weight:600 }
  .row[data-image] .label{ display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
  .row[data-image-only] .label{ display:none }
  .count{ flex:0 0 auto; display:inline-flex; align-items:center; gap:var(--aha-space-4, 4px); font-size:14px; font-weight:600; font-variant-numeric:tabular-nums }
  .row[data-count-mode="off"] .count{ visibility:hidden }
  .person{ display:none }
  .row[data-count-mode="people"] .person{ display:inline-flex }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="row" part="row" data-tone="idle" data-verdict="none" data-count-mode="off">
    <span class="surface"></span><span class="tint"></span>
    <span class="content">
      <span class="control" aria-hidden="true"><span class="dot"></span><aha-icon class="tick" name="system-check" size="16" decorative></aha-icon></span>
      <span class="verdict"><aha-icon name="system-check" size="16"></aha-icon></span>
      <span class="picture"><img alt=""></span>
      <span class="label" dir="auto"><slot></slot></span>
      <span class="count" part="count"><span class="count-text">0</span><aha-icon class="person" name="system-user" size="16" decorative></aha-icon></span>
    </span>
  </div>`;

const OBSERVED = ['selected', 'correct', 'answered', 'revealed', 'awaiting-reveal', 'quiz-status', 'selection-mode', 'image',
  'count', 'total', 'count-mode', 'correct-label', 'incorrect-label'];

export class AhaAnswerOption extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, ...OBSERVED]; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._row = this.shadowRoot.querySelector('.row');
    this._row.addEventListener('click', () => this._pick());
    this._row.addEventListener('keydown', (event) => this._onKey(event));
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._sync());
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
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
  focus(options) { this._row.focus(options); }

  _pick() {
    if (!this.state.interactive) return;
    this.dispatchEvent(new CustomEvent('pick', { bubbles: true, composed: true }));
  }
  _onKey(event) {
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
    row.setAttribute('role', mode === 'multiple' ? 'checkbox' : 'radio');
    row.setAttribute('aria-checked', String(state.mine));
    row.setAttribute('aria-disabled', String(!state.interactive));
    row.tabIndex = state.interactive ? 0 : -1;
    row.dataset.mode = mode;
    row.dataset.tone = state.tone;
    row.dataset.verdict = state.verdict;
    row.toggleAttribute('data-mine', state.mine);
    row.toggleAttribute('data-dimmed', state.dimmed);
    row.toggleAttribute('data-image', !!image);
    row.toggleAttribute('data-image-only', !!image && !hasLabel);
    row.toggleAttribute('data-tall', !!image && (!hasLabel || this.textContent.trim().length > 60));
    const img = this.shadowRoot.querySelector('.picture img');
    if (image && img.getAttribute('src') !== image) img.setAttribute('src', image);
    if (!hasLabel && image) row.setAttribute('aria-label', this.getAttribute('aria-label') || 'Image option');
    else row.removeAttribute('aria-label');
    const verdictIcon = this.shadowRoot.querySelector('.verdict aha-icon');
    const correctVerdict = state.verdict === 'correct';
    verdictIcon.setAttribute('name', correctVerdict ? 'system-check' : 'system-x');
    verdictIcon.setAttribute('label', correctVerdict ? (this.getAttribute('correct-label') || 'Correct') : (this.getAttribute('incorrect-label') || 'Incorrect'));
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
