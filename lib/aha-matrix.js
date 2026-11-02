/**
 * @ahaslides-product/design/aha-matrix — a matrix question on the audience phone: one pick per statement.
 *
 *   import '@ahaslides-product/design/aha-matrix';   // registers <aha-matrix>
 *   <aha-matrix group-label="Rate each part of the event"
 *     rows='[{"id":"venue","label":"Venue"},{"id":"talks","label":"Talks"}]'
 *     columns='[{"id":"poor","label":"Poor"},{"id":"ok","label":"OK"},{"id":"great","label":"Great"}]'></aha-matrix>
 *   matrix.addEventListener('change', (e) => e.detail.value);   // { venue: ['ok'], talks: ['great'] }
 *
 * Every row (a statement) is its own labelled group of <aha-answer-option> rows, one per column, so a
 * phone reads the grid top to bottom with full-width 48px targets instead of a table that scrolls
 * sideways. Where the host is wide enough the columns flow side by side (at least 200px each).
 * `selection-mode="multiple"` makes each row a set of checkboxes. The value is always
 * `{ [rowId]: columnId[] }`, with rows the participant has not answered left out. Rows and columns are
 * `{ id, label }` objects, or plain strings whose id is their index. Arrow keys move between the
 * columns of one row (and pick, in single mode); Tab moves to the next row. `disabled` or a locked
 * `lock-key` shows the locked look of the answer rows and restores the submitted value.
 */
import './aha-answer-option.js';
import { AudienceElement, DECK_STYLE, watchSubmissionLock } from './audience-deck.js';
import { upgradeProperties } from './upgrade-properties.js';

const STYLE = DECK_STYLE + `
  :host{ display:block; width:100% }
  .matrix{ display:flex; flex-direction:column; gap:var(--aha-space-24, 24px); width:100% }
  .group{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); min-width:0; margin:0 }
  .row-label{ margin:0; font-size:16px; line-height:24px; font-weight:var(--aha-weight-semibold, 600); color:var(--_ink); overflow-wrap:anywhere }
  .options{ display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap:var(--aha-space-8, 8px) }
`;

const parseJson = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

/** Rows or columns as `{ id, label }`: a plain string keeps its index as the id. */
export function matrixAxis(list) {
  if (!Array.isArray(list)) return [];
  return list.map((entry, index) => (entry && typeof entry === 'object')
    ? { id: String(entry.id ?? index), label: String(entry.label ?? '') }
    : { id: String(index), label: String(entry ?? '') });
}

/** The next value after a pick: single mode replaces the row's answer, multiple toggles the column; an emptied row is dropped. */
export function matrixToggle(value, rowId, columnId, multiple) {
  const current = Array.isArray(value?.[rowId]) ? value[rowId].map(String) : [];
  const nextRow = multiple
    ? (current.includes(columnId) ? current.filter((id) => id !== columnId) : [...current, columnId])
    : [columnId];
  const next = { ...(value || {}), [rowId]: nextRow };
  if (nextRow.length === 0) delete next[rowId];
  return next;
}

let mintedIds = 0;

export class AhaMatrix extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'rows', 'columns', 'value', 'selection-mode', 'group-label', 'disabled', 'lock-key'];
  }
  constructor() {
    super();
    this._uid = `aha-matrix-${++mintedIds}`;
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style><div class="matrix" part="matrix" role="group"></div>`));
    this._matrix = this.shadowRoot.querySelector('.matrix');
    this._matrix.addEventListener('pick', (event) => this._onPick(event));
    this._rows = null;
    this._columns = null;
    this._value = undefined;
    this._lockedRecord = null;
  }
  connectedCallback() {
    upgradeProperties(this, ['rows', 'columns', 'value']);
    super.connectedCallback();
    this._build();
    this._watchLock();
  }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._lockedRecord = record;
      if (record && record.value && typeof record.value === 'object') this._value = record.value;
      this._sync();
    });
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'rows') { this._rows = null; this._build(); return; }
    if (name === 'columns') { this._columns = null; this._build(); return; }
    if (name === 'value') this._value = undefined;
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    this._sync();
  }

  get rows() { return this._rows ?? matrixAxis(parseJson(this.getAttribute('rows'), [])); }
  set rows(list) { this._rows = matrixAxis(list); this._build(); }
  get columns() { return this._columns ?? matrixAxis(parseJson(this.getAttribute('columns'), [])); }
  set columns(list) { this._columns = matrixAxis(list); this._build(); }
  get multiple() { return this.getAttribute('selection-mode') === 'multiple'; }
  /** `{ [rowId]: columnId[] }` — answered rows only. */
  get value() { return this._value ?? parseJson(this.getAttribute('value'), {}); }
  set value(next) { this._value = next && typeof next === 'object' ? next : {}; this._sync(); }
  get locked() { return !!this._lockedRecord; }

  _onPick(event) {
    const option = event.target;
    const rowId = option.dataset.rowId;
    const columnId = option.dataset.columnId;
    if (rowId == null || columnId == null || this.locked || this.hasAttribute('disabled')) return;
    event.stopPropagation();
    const next = matrixToggle(this.value, rowId, columnId, this.multiple);
    this._value = next;
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: next, row: rowId, column: columnId } }));
  }
  _build() {
    const fragment = document.createDocumentFragment();
    const columns = this.columns;
    this.rows.forEach((row, index) => {
      const group = document.createElement('div');
      group.className = 'group';
      group.setAttribute('part', 'row');
      group.dataset.rowId = row.id;
      const label = document.createElement('p');
      label.className = 'row-label';
      label.setAttribute('part', 'row-label');
      label.id = `${this._uid}-row-${index}`;
      label.dir = 'auto';
      label.textContent = row.label;
      const options = document.createElement('div');
      options.className = 'options';
      options.setAttribute('aria-labelledby', label.id);
      for (const column of columns) {
        const option = document.createElement('aha-answer-option');
        option.dataset.rowId = row.id;
        option.setAttribute('roving', '');
        option.dataset.columnId = column.id;
        option.textContent = column.label;
        options.append(option);
      }
      group.append(label, options);
      fragment.append(group);
    });
    this._matrix.replaceChildren(fragment);
    this._sync();
  }
  _sync() {
    this._matrix.setAttribute('aria-label', this.getAttribute('group-label') || this.getAttribute('aria-label') || 'Matrix question');
    const value = this.value;
    const mode = this.multiple ? 'multiple' : 'single';
    const closed = this.locked || this.hasAttribute('disabled');
    for (const options of this._matrix.querySelectorAll('.options')) {
      options.setAttribute('role', this.multiple ? 'group' : 'radiogroup');
      for (const option of options.children) {
        const picked = Array.isArray(value?.[option.dataset.rowId]) ? value[option.dataset.rowId].map(String) : [];
        option.setAttribute('selection-mode', mode);
        option.toggleAttribute('answered', closed);
        option.toggleAttribute('selected', picked.includes(option.dataset.columnId));
      }
    }
  }
}

export function defineAhaMatrix(tag = 'aha-matrix') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaMatrix);
}
if (typeof window !== 'undefined') defineAhaMatrix();
export default { AhaMatrix, defineAhaMatrix, matrixAxis, matrixToggle };
