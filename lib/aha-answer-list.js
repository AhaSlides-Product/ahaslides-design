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
 * awaiting-reveal) as attributes. With `lock-key`, a submission made through <aha-audience-submit>
 * (or `submissionLock(key).lock(value)`) locks the list and restores the pick after an iframe remount.
 */
import './aha-answer-option.js';
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:block }
  .list{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); width:100% }
  :host([columns="grid"]) .list{ display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)) }
`;

const FORWARDED = ['quiz-status', 'answered', 'revealed', 'awaiting-reveal', 'selection-mode', 'count-mode', 'total', 'correct-label', 'incorrect-label'];
const parseJson = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

export class AhaAnswerList extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'options', 'value', 'counts', 'group-label', 'columns', 'lock-key', ...FORWARDED];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style><div class="list" part="list"></div>`));
    this._list = this.shadowRoot.querySelector('.list');
    this._list.addEventListener('pick', (event) => this._onPick(event));
    this._options = null;
    this._counts = null;
    this._value = undefined;
    this._lockedRecord = null;
  }
  connectedCallback() {
    super.connectedCallback();
    this._renderOptions();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record && record.value != null) this._value = record.value;
      this._syncRows();
    });
  }
  disconnectedCallback() { this._unwatchLock?.(); }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'options') { this._options = null; this._renderOptions(); return; }
    if (name === 'value') this._value = undefined;
    if (name === 'counts') this._counts = null;
    if (name === 'lock-key' && this.isConnected) { this._unwatchLock?.(); this.connectedCallback(); return; }
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
  _renderOptions() {
    const fragment = document.createDocumentFragment();
    for (const option of this.options) {
      const row = document.createElement('aha-answer-option');
      row.dataset.optionId = String(option.id);
      row.textContent = option.label ?? '';
      if (option.image || option.imageUrl) row.setAttribute('image', option.image || option.imageUrl);
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
    }
  }
}

export function defineAhaAnswerList(tag = 'aha-answer-list') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAnswerList);
}
if (typeof window !== 'undefined') defineAhaAnswerList();
export default { AhaAnswerList, defineAhaAnswerList };
