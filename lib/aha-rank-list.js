/**
 * @ahaslides-product/design/aha-rank-list — "put these in the right order" on the audience phone.
 *
 *   import '@ahaslides-product/design/aha-rank-list';   // registers <aha-rank-list>
 *   <aha-rank-list group-label="Order the planets by size" lock-key="slide-42"
 *     options='[{"id":"j","label":"Jupiter"},{"id":"e","label":"Earth"},{"id":"m","label":"Mars"}]'></aha-rank-list>
 *   list.addEventListener('change', (e) => e.detail.value);   // ["e","j","m"], the ordered ids
 *
 * The sibling of <aha-answer-option>: the same frosted row, ink edge, 8px corners and 44px height, so
 * a ranking list and a pick list read as one family. `group-label` shows above the rows as a caption. Instead of a pick each row carries a position:
 * an ordinal badge in the deck accent (white numeral) that renumbers live. Two ways to move a row:
 * the move-up / move-down buttons (the keyboard and switch path; disabled at the ends), and a pointer
 * drag where the row follows the finger and the others slide out of its way. Every move is announced
 * to a screen reader. Option images show in full (contain, never cropped). `disabled`, or a submission
 * through `lock-key`, locks the list and restores the submitted order after an iframe remount.
 */
import './icons.js';
import { AudienceElement, DECK_STYLE, escapeHtml, watchSubmissionLock } from './audience-deck.js';

/** The option ids in `order` first (unknown ids dropped), then any option it does not mention. */
export function resolveOrder(optionIds, order) {
  const known = new Set(optionIds);
  const kept = (Array.isArray(order) ? order : []).map(String).filter((id) => known.has(id));
  return [...kept, ...optionIds.filter((id) => !kept.includes(id))];
}

const STYLE = DECK_STYLE + `
  :host{ display:block }
  .caption{ margin:0 0 var(--aha-space-12, 12px); font-size:12px; line-height:18px; color:var(--_ink-muted) }
  .caption:empty{ display:none }
  .list{ position:relative; display:flex; flex-direction:column; gap:var(--aha-space-8, 8px) }
  .row{ position:relative; box-sizing:border-box; display:flex; align-items:center; gap:var(--aha-space-12, 12px);
    min-height:44px; padding:var(--aha-space-8, 8px) var(--aha-space-16, 16px);
    border-radius:var(--aha-radius-default, 8px); color:var(--_ink); cursor:grab; touch-action:none;
    transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)), box-shadow var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-tall]{ align-items:flex-start }
  .row[data-dragging]{ z-index:2; transition:none; box-shadow:0 8px 24px color-mix(in srgb, var(--_ink) 22%, transparent) }
  .row[data-settling]{ transition:transform var(--aha-motion-mid, .2s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .surface{ position:absolute; inset:0; pointer-events:none; border:1px solid var(--_edge); border-radius:inherit;
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .row:hover .surface{ background:var(--_surface-hover) }
  :host([disabled]) .row, :host([data-locked]) .row{ cursor:default; touch-action:auto }
  :host([disabled]) .surface, :host([data-locked]) .surface{ background:var(--_surface-disabled) }
  .badge{ position:relative; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px;
    border-radius:var(--aha-radius-pill, 999px); background:var(--_mark); color:var(--aha-white, #FFFFFF);
    font-size:12px; font-weight:600; font-variant-numeric:tabular-nums }
  .picture{ position:relative; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; overflow:hidden;
    width:28px; height:28px; border-radius:var(--aha-radius-sm, 6px); background:color-mix(in srgb, var(--_ink) 8%, transparent) }
  .row[data-image-only] .picture{ flex:1 1 auto; width:auto; height:120px }
  .picture img{ width:100%; height:100%; object-fit:contain }
  .label{ position:relative; flex:1 1 auto; min-width:0; font-size:16px; line-height:24px; font-weight:600; overflow-wrap:anywhere;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
  .controls{ position:relative; flex:0 0 auto; display:flex; align-items:center; gap:var(--aha-space-8, 8px); color:var(--_ink-muted) }
  .moves{ display:flex; flex-direction:column; margin-block:calc(-1 * var(--aha-space-10, 10px)) }
  .move{ display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; padding:0; margin:0;
    border:0; border-radius:var(--aha-radius-xs, 4px); background:transparent; color:inherit; cursor:pointer;
    transition:background var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)), opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .move:hover:not(:disabled){ background:color-mix(in srgb, var(--_ink) 10%, transparent) }
  .move:focus-visible{ outline:2px solid var(--_ink); outline-offset:1px }
  .move:disabled{ cursor:default; opacity:.4 }
  .grip{ display:inline-flex }
  .live{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }
  @media (prefers-reduced-motion: reduce){ .row, .surface, .move{ transition:none } }
`;

const parseJson = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

export class AhaRankList extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'options', 'value', 'group-label', 'disabled', 'lock-key']; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><p class="caption" part="caption" aria-hidden="true" dir="auto"></p><div class="list" part="list" role="list"></div><span class="live" aria-live="polite" aria-atomic="true"></span>`));
    this._list = this.shadowRoot.querySelector('.list');
    this._options = null;
    this._order = null;
    this._locked = false;
    this._drag = null;
    this._list.addEventListener('pointerdown', (event) => this._down(event));
    this._list.addEventListener('pointermove', (event) => this._move(event));
    this._list.addEventListener('pointerup', (event) => this._up(event));
    this._list.addEventListener('pointercancel', (event) => this._up(event));
    this._list.addEventListener('click', (event) => {
      const button = event.target.closest('.move');
      if (button) this._step(button.closest('.row').dataset.optionId, Number(button.dataset.step));
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this._buildRows();
    this._watchLock();
  }
  _watchLock() {
    this._unwatchLock?.();
    this._unwatchLock = watchSubmissionLock(this, (record) => {
      this._locked = !!record;
      this.toggleAttribute('data-locked', this._locked);
      if (record && Array.isArray(record.value)) this._order = record.value.map(String);
      this._arrange();
    });
  }
  disconnectedCallback() { this._unwatchLock?.(); this._unwatchLock = null; }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (!this.isConnected) return;
    if (name === 'options') { this._options = null; this._buildRows(); return; }
    if (name === 'value') this._order = null;
    if (name === 'lock-key') { if (this._unwatchLock) this._watchLock(); return; }
    this._arrange();
  }

  get options() { return this._options ?? parseJson(this.getAttribute('options'), []); }
  set options(list) { this._options = Array.isArray(list) ? list : []; this._buildRows(); }
  /** The ordered option ids. */
  get value() { return resolveOrder(this.options.map((o) => String(o.id)), this._order ?? parseJson(this.getAttribute('value'), null)); }
  set value(order) { this._order = Array.isArray(order) ? order.map(String) : null; this._arrange(); }

  _inert() { return this.hasAttribute('disabled') || this._locked; }
  _buildRows() {
    const fragment = document.createDocumentFragment();
    for (const option of this.options) {
      const row = document.createElement('div');
      const label = String(option.label ?? '').trim();
      const image = option.image || option.imageUrl;
      row.className = 'row';
      row.dataset.optionId = String(option.id);
      row.setAttribute('role', 'listitem');
      row.toggleAttribute('data-image-only', !!image && !label);
      row.toggleAttribute('data-tall', !!image && !label || label.length > 60);
      const name = escapeHtml(label || 'image option');
      row.append(document.createRange().createContextualFragment(
        `<span class="surface"></span><span class="badge" aria-hidden="true"></span>` +
        (image ? `<span class="picture"><img alt="" src="${escapeHtml(image)}"></span>` : '') +
        (label ? `<span class="label" dir="auto">${escapeHtml(label)}</span>` : '') +
        `<span class="controls" data-nodrag><span class="moves">` +
        `<button class="move" type="button" data-step="-1" aria-label="Move ${name} up"><aha-icon name="system-caret-up" size="12" decorative></aha-icon></button>` +
        `<button class="move" type="button" data-step="1" aria-label="Move ${name} down"><aha-icon name="system-caret-down" size="12" decorative></aha-icon></button>` +
        `</span><span class="grip" aria-hidden="true"><aha-icon name="system-drag" size="16" decorative></aha-icon></span></span>`));
      fragment.append(row);
    }
    this._list.replaceChildren(fragment);
    this._arrange();
  }
  _rows() { return [...this._list.querySelectorAll('.row')]; }
  _arrange() {
    this._list.setAttribute('aria-label', this.getAttribute('group-label') || 'Order the options');
    this.shadowRoot.querySelector('.caption').textContent = this.getAttribute('group-label') || '';
    const byId = new Map(this._rows().map((row) => [row.dataset.optionId, row]));
    const order = this.value;
    order.forEach((id, index) => {
      const row = byId.get(id);
      if (!row) return;
      if (this._list.children[index] !== row) this._list.insertBefore(row, this._list.children[index] || null);
    });
    const count = order.length;
    this._rows().forEach((row, index) => {
      const option = this.options.find((o) => String(o.id) === row.dataset.optionId);
      row.querySelector('.badge').textContent = String(index + 1);
      row.setAttribute('aria-label', `${index + 1}. ${option?.label || 'Image option'}`);
      const [up, down] = row.querySelectorAll('.move');
      up.disabled = this._inert() || index === 0;
      down.disabled = this._inert() || index === count - 1;
    });
  }
  _commit(order, movedId) {
    this._order = order;
    this._arrange();
    const index = order.indexOf(movedId);
    const label = this.options.find((o) => String(o.id) === movedId)?.label || 'option';
    this.shadowRoot.querySelector('.live').textContent = `Moved ${label} to position ${index + 1} of ${order.length}`;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: [...order] } }));
  }
  _step(id, step) {
    if (this._inert()) return;
    const order = this.value;
    const from = order.indexOf(id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= order.length) return;
    const tops = this._tops();
    order.splice(to, 0, order.splice(from, 1)[0]);
    this._commit(order, id);
    this._flip(tops, null);
    this._rows()[to].querySelector(`.move[data-step="${step}"]:not(:disabled)`)?.focus();
  }
  _tops() { return new Map(this._rows().map((row) => [row, row.offsetTop])); }
  _flip(tops, skip) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const row of this._rows()) {
      if (row === skip || !tops.has(row)) continue;
      const delta = tops.get(row) - row.offsetTop;
      if (!delta) continue;
      row.removeAttribute('data-settling');
      row.style.transform = `translateY(${delta}px)`;
      void row.offsetHeight;
      row.setAttribute('data-settling', '');
      row.style.transform = '';
    }
  }
  _down(event) {
    const row = event.target.closest('.row');
    if (!row || this._inert() || !event.isPrimary || event.target.closest('[data-nodrag]')) return;
    this._drag = { row, startY: event.clientY, startTop: row.offsetTop };
    row.setPointerCapture?.(event.pointerId);
    row.setAttribute('data-dragging', '');
  }
  _move(event) {
    const drag = this._drag;
    if (!drag || !event.isPrimary) return;
    const { row } = drag;
    const offset = drag.startTop + (event.clientY - drag.startY) - row.offsetTop;
    row.style.transform = `translateY(${offset}px)`;
    const rows = this._rows();
    const centre = row.offsetTop + offset + row.offsetHeight / 2;
    const from = rows.indexOf(row);
    let to = from;
    while (to < rows.length - 1 && centre > rows[to + 1].offsetTop + rows[to + 1].offsetHeight / 2) to += 1;
    while (to > 0 && centre < rows[to - 1].offsetTop + rows[to - 1].offsetHeight / 2) to -= 1;
    if (to === from) return;
    const tops = this._tops();
    const order = this.value;
    order.splice(to, 0, order.splice(from, 1)[0]);
    this._commit(order, row.dataset.optionId);
    // Moving the dragged row in the DOM drops its pointer capture; take it back so the drag continues.
    if (row.hasPointerCapture && !row.hasPointerCapture(event.pointerId)) row.setPointerCapture(event.pointerId);
    row.style.transform = `translateY(${drag.startTop + (event.clientY - drag.startY) - row.offsetTop}px)`;
    this._flip(tops, row);
  }
  _up(event) {
    const drag = this._drag;
    if (!drag || !event.isPrimary) return;
    this._drag = null;
    drag.row.removeAttribute('data-dragging');
    drag.row.setAttribute('data-settling', '');
    drag.row.style.transform = '';
  }
}

export function defineAhaRankList(tag = 'aha-rank-list') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaRankList);
}
if (typeof window !== 'undefined') defineAhaRankList();
export default { AhaRankList, defineAhaRankList, resolveOrder };
