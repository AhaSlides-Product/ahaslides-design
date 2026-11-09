/**
 * select-multiple.js — the list-backed chip body of <aha-select>: `mode="multiple"`, and `mode="tags"`
 * once the select has options. aha-select builds it instead of its trigger and listbox, so the
 * single-value select and option-less tags never run any of it.
 *
 * The chips and the inline field are SelectTags' (closable <aha-tag> chips, Backspace in an empty field
 * removes the last); this adds the themed listbox from aha-select (same rows, top layer, placement) with
 * `aria-multiselectable`. Picking a row toggles it and the list stays open.
 *
 *   multiple   values come only from the options. The field is read-only unless `show-search` is set;
 *              then typing filters the rows and a pick clears the query.
 *   tags       typing always filters the rows as suggestions; Arrow keys move to a row and Enter picks it,
 *              otherwise Enter, a separator, a paste or leaving the field adds the typed text as before.
 *
 * `max-count` disables the rows not yet picked (and stops new free-entry tags) once that many are picked.
 * `max-tag-count="responsive"` keeps the control to one row (see select-collapse.js).
 * `allow-clear` shows the × while any value is set. Emits `change` with {values}, `clear` with {values:[]}
 * and, when typing filters, `search` with {query}.
 */
import './icons.js';
import { SelectTags } from './select-tags.js';
import { listRows, flatOptions, optionValue, matchText, syncGroups } from './select-list.js';
import { SelectCollapse, COLLAPSE_STYLE } from './select-collapse.js';

const ENABLED = '.option:not([aria-disabled="true"]):not([hidden])';

const MULTI_STYLE = `
  .tags{ position:relative; padding-right:var(--aha-space-36,36px); cursor:pointer }
  :host([_clearable]) .tags{ padding-right:var(--aha-space-56,56px) }
  :host([size="sm"]) .tags, :host([size="small"]) .tags{ padding-right:var(--aha-space-32,32px) }
  :host([size="sm"][_clearable]) .tags, :host([size="small"][_clearable]) .tags{ padding-right:var(--aha-space-56,56px) }
  :host([size="touch"]) .tags{ padding-right:var(--aha-space-40,40px) }
  :host([size="touch"][_clearable]) .tags{ padding-right:var(--aha-space-64,64px) }
  :host([_typing]) .tags{ cursor:text }
  .input{ flex-basis:var(--aha-space-24,24px); min-width:var(--aha-space-24,24px) }
  .input[readonly]{ cursor:pointer; caret-color:transparent }
  .tags .caret{ position:absolute; top:50%; right:var(--aha-space-12,12px); transform:translateY(-50%); margin:0; pointer-events:none }
  :host([open]) .tags .caret{ transform:translateY(-50%) rotate(180deg) }
  :host([size="sm"]) .tags .caret, :host([size="small"]) .tags .caret{ right:var(--aha-space-8,8px) }
  :host([size="touch"]) .tags .caret{ right:var(--aha-space-16,16px) }
  :host([disabled]) .tags{ cursor:not-allowed }
  .option .check{ flex:0 0 auto; display:inline-flex; opacity:0;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .option[aria-selected="true"] .check{ opacity:1 }
`;

const supportsTopLayer = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';

export class SelectMultiple extends SelectTags {
  constructor(host, { style, id }) {
    super(host);
    const root = host.shadowRoot;
    const tagsStyle = root.querySelector('style');
    tagsStyle.insertAdjacentHTML('beforebegin', `<style>${style}</style>`);
    tagsStyle.insertAdjacentHTML('afterend', `<style>${MULTI_STYLE}${COLLAPSE_STYLE}</style>`);
    this.id = id;
    this.box.classList.add('control');
    this.box.insertAdjacentHTML('beforeend',
      `<button class="clear" part="clear" type="button" tabindex="-1"><aha-icon name="system-x-circle" size="16" aria-hidden="true"></aha-icon></button>` +
      `<span class="caret" part="caret" aria-hidden="true"><aha-icon name="system-caret-down" size="16"></aha-icon></span>`);
    this.box.insertAdjacentHTML('afterend',
      `<ul class="listbox" part="listbox" id="${id}" role="listbox" aria-multiselectable="true" tabindex="-1"${supportsTopLayer ? ' popover="manual"' : ''}></ul>` +
      `<span class="probe" aria-hidden="true"></span>`);
    this.list = root.querySelector('.listbox');
    this.clearButton = root.querySelector('.clear');
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-haspopup', 'listbox');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-controls', id);

    this.clearButton.addEventListener('click', (e) => { e.stopPropagation(); this.clearAll(); });
    this.box.addEventListener('click', (e) => {
      if (host.hasAttribute('disabled') || e.composedPath().some((n) => (n.localName === 'aha-tag' && n !== this.collapse.rest) || n === this.clearButton)) return;
      if (host.hasAttribute('open') && !this.typing()) this.close(); else this.openList();
    });
    this.input.addEventListener('blur', () => this.close());
    // The last input of an IME word still has isComposing set, so the filter catches up when composition ends.
    this.input.addEventListener('compositionend', (e) => this.onInput(e));
    // Keeps focus in the field, so removing a chip or clearing neither closes the list nor commits half-typed text.
    this.box.addEventListener('mousedown', (e) => {
      if (e.composedPath().some((n) => n === this.clearButton || (n.localName === 'button' && n.getRootNode().host?.localName === 'aha-tag'))) e.preventDefault();
    });
    this.list.addEventListener('mousedown', (e) => e.preventDefault());
    this.list.addEventListener('click', (e) => {
      const row = e.target.closest('.option');
      if (row && row.getAttribute('aria-disabled') !== 'true') this.toggle(row.dataset.value);
    });
    this.syncList();
    this.syncState();
    this.collapse = new SelectCollapse(this);
    this.collapse.fit();
  }

  tagsMode() { return this.host.getAttribute('mode') === 'tags'; }
  typing() { return this.tagsMode() || this.host.hasAttribute('show-search'); }
  options() {
    const source = this.host._options || this.host.getAttribute('options');
    if (source !== this.source) { this.source = source; this.flat = flatOptions(this.host._options || this.host._parseOptions()); }
    return this.flat;
  }
  maxCount() { const n = parseInt(this.host.getAttribute('max-count'), 10); return n > 0 ? n : 0; }
  atMax() { const max = this.maxCount(); return !!max && this.values.length >= max; }
  isOpen() { return this.host.hasAttribute('open'); }

  chipLabel(value) {
    const option = this.options().find((o) => String(optionValue(o)) === value);
    if (option == null) return value;
    return String(typeof option === 'object' ? (option.selectedLabel ?? option.label ?? option.value) : option);
  }
  accept(added) {
    if (!this.tagsMode()) return [];
    const max = this.maxCount();
    if (!max) return added;
    const kept = added.slice(0, Math.max(0, max - this.values.length));
    const refused = added.slice(kept.length);
    if (refused.length) this.input.value = [...refused, this.input.value].filter(Boolean).join(this.host.getAttribute('separators')?.[0] || ',');
    return kept;
  }

  syncList() {
    if (!this.list) return;
    this.source = undefined;
    const active = this.list.querySelector('.option[data-active="true"]')?.dataset.value;
    const opts = this.host._options || this.host._parseOptions();
    this.list.innerHTML = listRows(opts, this.id, (v) => this.values.includes(String(v))) +
      `<li class="empty" part="empty" role="presentation" hidden></li>`;
    for (const row of this.list.querySelectorAll('.option')) {
      if (row.getAttribute('aria-disabled') === 'true') row.dataset.off = '';
      row.insertAdjacentHTML('beforeend', '<span class="check" part="option-check" aria-hidden="true"><aha-icon name="system-check" size="16"></aha-icon></span>');
    }
    for (const chip of this.chips.querySelectorAll('aha-tag:not([closing])')) this.labelChip(chip);
    this.syncRows();
    if (!this.isOpen()) return;
    this.filter();
    const row = active == null ? null : [...this.list.querySelectorAll(ENABLED)].find((r) => r.dataset.value === active);
    this.setActive(row || (this.tagsMode() ? null : this.list.querySelector(ENABLED)));
  }

  syncRows() {
    if (!this.list) return;
    const capped = this.atMax();
    for (const row of this.list.querySelectorAll('.option')) {
      const selected = this.values.includes(row.dataset.value);
      row.setAttribute('aria-selected', String(selected));
      if (row.hasAttribute('data-off') || (capped && !selected)) row.setAttribute('aria-disabled', 'true');
      else row.removeAttribute('aria-disabled');
    }
    const host = this.host;
    if (host.hasAttribute('allow-clear') && !host.hasAttribute('disabled') && this.values.length) host.setAttribute('_clearable', '');
    else host.removeAttribute('_clearable');
    this.clearButton.setAttribute('aria-label', host.getAttribute('clear-label') || 'Clear selection');
  }

  syncState() {
    const host = this.host;
    const typing = this.typing();
    this.input.readOnly = !typing;
    host.toggleAttribute('_typing', typing);
    if (typing) this.input.setAttribute('aria-autocomplete', 'list'); else this.input.removeAttribute('aria-autocomplete');
    const required = host.getAttribute('aria-required');
    if (required) this.input.setAttribute('aria-required', required); else this.input.removeAttribute('aria-required');
    if (host.hasAttribute('disabled')) this.close();
    this.syncRows();
  }

  render() {
    super.render();
    this.syncRows();
    this.collapse?.fit();
  }

  sync(name) {
    super.sync(name);
    if (!this.list) return;
    if (name === 'options') this.syncList();
    else if (name === 'filter-prop') { if (this.isOpen()) this.filter(); }
    else this.syncState();
    this.collapse?.fit();
  }

  filter() {
    const query = this.typing() ? this.input.value.trim().toLowerCase() : '';
    const prop = this.host.getAttribute('filter-prop');
    const opts = this.options();
    let shown = 0;
    [...this.list.querySelectorAll('.option')].forEach((row, i) => {
      row.hidden = !!query && !matchText(row, opts[i], prop).toLowerCase().includes(query);
      if (!row.hidden) shown++;
    });
    syncGroups(this.list);
    const empty = this.list.querySelector('.empty');
    empty.textContent = this.host.getAttribute('empty-text') || 'No matches';
    empty.hidden = shown > 0 || this.tagsMode();
    return shown;
  }

  openList() {
    const host = this.host;
    if (host.hasAttribute('disabled') || this.isOpen()) return;
    if (!this.options().length) return;
    if (this.filter() === 0 && this.tagsMode()) return;
    host._showList();
    host.setAttribute('open', '');
    host._track(true);
    this.input.setAttribute('aria-expanded', 'true');
    this.setActive(this.tagsMode() ? null : this.list.querySelector(ENABLED));
  }

  close() {
    if (!this.isOpen()) return;
    this.host.removeAttribute('open');
    this.host._track(false);
    this.input.setAttribute('aria-expanded', 'false');
    this.setActive(null);
    if (!this.tagsMode() && this.input.value) { this.input.value = ''; this.filter(); this.emitSearch(); }
  }

  setActive(row) {
    for (const el of this.list.querySelectorAll('.option[data-active="true"]')) el.removeAttribute('data-active');
    if (row) { row.setAttribute('data-active', 'true'); this.input.setAttribute('aria-activedescendant', row.id); row.scrollIntoView({ block: 'nearest' }); }
    else this.input.removeAttribute('aria-activedescendant');
  }

  move(step) {
    const rows = [...this.list.querySelectorAll(ENABLED)];
    if (!rows.length) return;
    const i = rows.indexOf(this.list.querySelector('.option[data-active="true"]'));
    this.setActive(rows[i < 0 ? (step > 0 ? 0 : rows.length - 1) : (i + step + rows.length) % rows.length]);
  }

  toggle(value) {
    if (this.host.hasAttribute('disabled')) return;
    if (this.values.includes(value)) this.values = this.values.filter((v) => v !== value);
    else if (this.atMax()) return;
    else this.values = [...this.values, value];
    this.render();
    this.emit();
    if (this.typing() && this.input.value) {
      this.input.value = '';
      this.emitSearch();
      if (this.filter() === 0 && this.tagsMode()) { this.close(); return; }
    }
    if (this.isOpen()) this.setActive(this.list.querySelector(`.option[data-value="${CSS.escape(value)}"]:not([hidden])`));
  }

  clearAll() {
    const host = this.host;
    if (host.hasAttribute('disabled') || !this.values.length) return;
    this.values = [];
    this.render();
    this.emit();
    host.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true, detail: { values: [] } }));
    this.input.focus();
  }

  remove(value, animating) {
    super.remove(value, animating);
    if (animating) this.syncRows();
  }

  emitSearch() {
    this.host.dispatchEvent(new CustomEvent('search', { bubbles: true, composed: true, detail: { query: this.input.value } }));
  }

  commit(text, all) {
    if (this.tagsMode()) { super.commit(text, all); if (this.isOpen() && this.filter() === 0) this.close(); return; }
    this.syncPlaceholder();
  }

  onInput(e) {
    if (e.isComposing) return;
    if (this.tagsMode()) super.onInput(e);
    if (!this.typing()) return;
    this.emitSearch();
    if (!this.isOpen()) { this.openList(); return; }
    const shown = this.filter();
    if (this.tagsMode() && shown === 0) { this.close(); return; }
    const active = this.list.querySelector('.option[data-active="true"]:not([hidden])');
    if (!active) this.setActive(this.tagsMode() ? null : this.list.querySelector(ENABLED));
  }

  onPaste(e) { if (this.tagsMode()) super.onPaste(e); }

  onKey(e) {
    if (e.isComposing || e.keyCode === 229 || this.host.hasAttribute('disabled')) return;
    const open = this.isOpen();
    const active = open && this.list.querySelector('.option[data-active="true"]:not([hidden])');
    switch (e.key) {
      case 'ArrowDown': case 'ArrowUp':
        e.preventDefault();
        if (!open) this.openList(); else this.move(e.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Enter':
        if (active) { e.preventDefault(); this.toggle(active.dataset.value); return; }
        if (this.tagsMode()) { super.onKey(e); return; }
        e.preventDefault();
        this.openList();
        return;
      case ' ':
        if (this.typing()) return;
        e.preventDefault();
        if (active) this.toggle(active.dataset.value); else this.openList();
        return;
      case 'Home': case 'End': {
        if (this.typing() || !open) return;
        e.preventDefault();
        const rows = this.list.querySelectorAll(ENABLED);
        if (rows.length) this.setActive(rows[e.key === 'Home' ? 0 : rows.length - 1]);
        return;
      }
      case 'Escape':
        if (open) { e.preventDefault(); e.stopPropagation(); this.close(); }
        return;
      case 'Tab': this.close(); return;
      case 'Backspace': super.onKey(e); return;
    }
  }
}
