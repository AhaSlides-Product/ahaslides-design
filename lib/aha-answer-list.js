/**
 * @ahaslides-product/design/aha-answer-list — the multiple-choice answer block on the audience phone.
 *
 *   import '@ahaslides-product/design/aha-answer-list';   // registers <aha-answer-list> + <aha-answer-option>
 *   <aha-answer-list group-label="Which drink?" lock-key="slide-42"
 *     options='[{"id":"a","label":"Coffee"},{"id":"b","label":"Tea","correct":true}]'></aha-answer-list>
 *   list.addEventListener('change', (e) => e.detail.value);   // "a", or ["a","b"] with selection-mode="multiple"
 *
 * The default answer surface: a fixed set of answers the participant picks one (or several) of. It
 * owns the selection model, the fixed 8px thumb-safety gap, the live counts and the quiz reveal; each
 * row is an <aha-answer-option>. Pass the host's quiz flags (quiz-status, answered, revealed,
 * awaiting-reveal) as attributes. `expandable` makes long rows clamp with More and emit `expand`
 * (`detail.id`, `detail.source`). With `lock-key`, a submission made through <aha-audience-submit>
 * (or `submissionLock(key).lock(value)`) locks the list and restores the pick after an iframe remount.
 *
 * Opt-in additions, each off by default: `roving` makes the rows one Tab stop (Arrow keys, Home, End);
 * `option-labels="alphabet"` (A, B, … Z, AA) or `"number"` (1, 2, 3) puts a letter chip on every row;
 * an option with `"other": true` is the inline editable Other row (`otherValue` seeds its text), and the
 * list emits composed `other-input` ({ detail: { id, value } }) on every edit. `other-placeholder`,
 * `other-input-label` and `other-maxlength` set its field. The row surface follows
 * `--aha-answer-option-surface(-hover|-disabled)` set on the list.
 */
import './aha-answer-option.js';
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';
import { upgradeProperties } from './upgrade-properties.js';

const STYLE = DECK_STYLE + `
  :host{ display:block }
  .list{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); width:100%; margin-block:var(--aha-space-16, 16px) }
  :host([columns="grid"]) .list{ display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)) }
`;

const FORWARDED = ['quiz-status', 'answered', 'revealed', 'awaiting-reveal', 'selection-mode', 'count-mode', 'total', 'correct-label', 'incorrect-label', 'expandable', 'more-label', 'expand-label',
  'roving', 'other-placeholder', 'other-input-label', 'other-maxlength'];

/** The option label for a 0-based index: `alphabet` runs A … Z, AA, AB …; `number` runs 1, 2, 3; anything else is ''. */
export function answerOptionLabel(style, index) {
  if (style === 'number') return String(index + 1);
  if (style !== 'alphabet') return '';
  let label = '';
  for (let rest = index; rest >= 0; rest = Math.floor(rest / 26) - 1) label = String.fromCharCode(65 + (rest % 26)) + label;
  return label;
}
const parseJson = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

export class AhaAnswerList extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'options', 'value', 'counts', 'group-label', 'columns', 'lock-key', 'option-labels', ...FORWARDED];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style><div class="list" part="list"></div>`));
    this._list = this.shadowRoot.querySelector('.list');
    this._list.addEventListener('pick', (event) => this._onPick(event));
    this._list.addEventListener('expand', (event) => this._onExpand(event));
    this._list.addEventListener('other-input', (event) => this._onOtherInput(event));
    this._options = null;
    this._counts = null;
    this._value = undefined;
    this._lockedRecord = null;
  }
  connectedCallback() {
    upgradeProperties(this, ['options', 'counts', 'value']);
    super.connectedCallback();
    this._renderOptions();
    this._watchLock();
  }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record && record.value != null) this._value = record.value;
      this._syncRows();
    });
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'options') { this._options = null; this._renderOptions(); return; }
    if (name === 'value') this._value = undefined;
    if (name === 'counts') this._counts = null;
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    this._syncRows();
  }

  get options() { return this._options ?? parseJson(this.getAttribute('options'), []); }
  set options(list) { this._options = Array.isArray(list) ? list : []; this._renderOptions(); }
  get counts() { return this._counts ?? parseJson(this.getAttribute('counts'), {}); }
  set counts(map) { this._counts = map || {}; this._syncRows(); }
  get multiple() { return this.getAttribute('selection-mode') === 'multiple'; }
  /** The pick: an option id, or an array of ids with selection-mode="multiple". */
  get value() {
    if (this._value !== undefined) return this._value;
    const raw = this.getAttribute('value');
    if (this.multiple) return parseJson(raw, raw ? [raw] : []);
    return raw || null;
  }
  set value(next) { this._value = next ?? (this.multiple ? [] : null); this._syncRows(); }
  get locked() { return !!this._lockedRecord; }

  _picked() {
    const value = this.value;
    if (Array.isArray(value)) return value.map(String);
    return value == null ? [] : [String(value)];
  }
  _onPick(event) {
    const id = event.target.dataset.optionId;
    if (id == null || this.locked) return;
    let next;
    if (this.multiple) {
      const picked = this._picked();
      next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    } else {
      next = id;
    }
    this._value = next;
    this._syncRows();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: next } }));
  }
  _onExpand(event) {
    event.stopPropagation();
    const id = event.target.dataset.optionId;
    if (id == null) return;
    this.dispatchEvent(new CustomEvent('expand', { bubbles: true, composed: true, detail: { id, source: event.detail?.source } }));
  }
  _onOtherInput(event) {
    event.stopPropagation();
    const id = event.target.dataset.optionId;
    if (id == null) return;
    this.dispatchEvent(new CustomEvent('other-input', { bubbles: true, composed: true, detail: { id, value: event.detail?.value ?? '' } }));
  }
  _renderOptions() {
    const fragment = document.createDocumentFragment();
    for (const option of this.options) {
      const row = document.createElement('aha-answer-option');
      row.dataset.optionId = String(option.id);
      row.textContent = option.label ?? '';
      if (option.image || option.imageUrl) row.setAttribute('image', option.image || option.imageUrl);
      if (option.other) {
        row.setAttribute('other', '');
        if (option.otherValue != null) row.setAttribute('other-value', String(option.otherValue));
      }
      fragment.append(row);
    }
    this._list.replaceChildren(fragment);
    this._syncRows();
  }
  _syncRows() {
    const list = this._list;
    list.setAttribute('role', this.multiple ? 'group' : 'radiogroup');
    list.setAttribute('aria-label', this.getAttribute('group-label') || 'Answer options');
    const picked = this._picked();
    const counts = this.counts;
    const byId = new Map(this.options.map((option) => [String(option.id), option]));
    let index = 0;
    for (const row of list.children) {
      const id = row.dataset.optionId;
      for (const name of FORWARDED) {
        const value = this.getAttribute(name);
        if (value == null) row.removeAttribute(name); else row.setAttribute(name, value);
      }
      if (this.locked) row.setAttribute('answered', '');
      row.toggleAttribute('selected', picked.includes(id));
      row.toggleAttribute('correct', !!byId.get(id)?.correct);
      row.setAttribute('count', String(counts[id] ?? 0));
      const letter = answerOptionLabel(this.getAttribute('option-labels'), index);
      if (letter) row.setAttribute('letter', letter); else row.removeAttribute('letter');
      index += 1;
    }
  }
}

export function defineAhaAnswerList(tag = 'aha-answer-list') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAnswerList);
}
if (typeof window !== 'undefined') defineAhaAnswerList();
export default { AhaAnswerList, defineAhaAnswerList, answerOptionLabel };
