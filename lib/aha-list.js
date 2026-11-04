/**
 * @ahaslides-product/design/aha-list — the shared List primitive.
 *
 *   import '@ahaslides-product/design/aha-list';   // registers <aha-list>
 *   <aha-list list-title="Recent decks" bordered
 *     items='[{"title":"Team offsite","description":"12 slides","avatar":"system-user-circle",
 *              "actions":[{"key":"edit","icon":"system-pencil-simple"},{"key":"del","icon":"system-trash","danger":true}]}]'>
 *   </aha-list>
 *
 * A vertical list of uniform rows — a recent-items feed, a participant list, a settings list.
 * Two ways to feed it, mix freely:
 *   • `items` — a JSON array of structured rows: { title, description?, avatar?, actions?:[{key,icon,danger?}] }.
 *     The row lays out an optional leading avatar/icon, a title + description meta block, and a
 *     trailing actions cluster.
 *   • light-DOM children — each becomes one plain row (the free-form escape hatch).
 *
 * Config: `size` (small · default · large row padding), `bordered` (outer container border),
 * `split` (row dividers on/off — on by default), `list-title` (header), `footer` (footer text),
 * `loading` (skeleton rows). The last row drops its divider; rows highlight on hover when the row is
 * interactive (has actions). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. Emits a composed `action` (detail {key, index}) on an action click.
 *
 * Picker (opt-in): `selectable` turns the `items` rows into a single-choice listbox — rows become
 * role="option" with aria-selected, a click or Enter/Space selects, ArrowUp/ArrowDown/Home/End move
 * focus (one tab stop, :focus-visible ring). Picker rows render no action buttons: a listbox option
 * holds no controls, so `actions` is ignored while `selectable` is set. `value` names the selected row's `key` (a row without a
 * `key` answers to its index as a string); a row with `selected: true` is the initial pick when no
 * `value` is set. Selecting sets `value` and emits a composed `select` (detail {key, index}); setting
 * `value` from the app re-marks the rows without rebuilding them. The selected row takes the Menu's
 * brand tint (bg-accent). Without `selectable` the rows stay a plain role="list".
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .list{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF); border-radius:var(--aha-radius-lg,12px); overflow:hidden }
  /* bordered — outer container border (opt-in) */
  :host([bordered]) .list{ border:1px solid var(--aha-border-default,#E3E3E3) }

  .head{ padding:14px 20px; font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .foot{ padding:12px 20px; font-size:13px; line-height:20px; color:var(--aha-text-tertiary,#616161) }

  /* row — a persistent node; background animates on hover (never rebuilt per-state) */
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:12px; padding:12px 20px;
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  /* size — row vertical padding scale */
  :host([size="small"]) .row{ padding-top:8px; padding-bottom:8px }
  :host([size="large"]) .row{ padding-top:16px; padding-bottom:16px }
  /* split — row dividers (on by default; the header + first row keep the header rule) */
  .row + .row, .head + .row, .head + .rows > .row:first-child{ border-top:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .row + .row{ border-top:none }
  .head{ border-bottom:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .head{ border-bottom:none }
  .foot{ border-top:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .foot{ border-top:none }
  /* interactive rows (actions present) highlight on hover */
  .row.interactive:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  /* selectable — picker rows, Menu's selected tint and focus ring */
  .row.selectable{ cursor:pointer; outline:none }
  .row.selectable[aria-selected="true"]{ background:var(--aha-bg-accent,#E70E680D) }
  .row.selectable .desc{ color:var(--aha-text-secondary,#4A4A4A) }
  .row.selectable:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:-2px }

  .avatar{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center;
    width:36px; height:36px; border-radius:var(--aha-radius-pill,999px); background:var(--aha-bg-accent,#E70E680D);
    color:var(--aha-text-default,#1A1A1A) }
  .meta{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px }
  .title{ font-weight:600; color:var(--aha-text-default,#1A1A1A); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .desc{ color:var(--aha-text-tertiary,#616161); font-size:13px; line-height:20px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .row.selectable .desc{ color:var(--aha-text-secondary,#4A4A4A) }
  .actions{ flex:0 0 auto; display:inline-flex; align-items:center; gap:4px }
  .act{ display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border:0;
    border-radius:var(--aha-radius-sm,6px); background:transparent; color:var(--aha-text-tertiary,#616161); cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .act:hover{ background:var(--aha-bg-hover,#F7F7F7); color:var(--aha-text-default,#1A1A1A) }
  .act:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:-2px }
  .act.danger:hover{ background:color-mix(in srgb, var(--aha-color-error,#1A1A1A) 8%, transparent); color:var(--aha-color-error,#1A1A1A) }

  /* loading skeleton — a shimmer bar on a persistent node */
  .skeleton{ height:12px; border-radius:var(--aha-radius-xs,4px); background:var(--aha-split,#F1F1F1);
    animation:aha-shimmer var(--aha-motion-slow,.3s) ease-in-out infinite alternate }
  @keyframes aha-shimmer{ from{ opacity:.55 } to{ opacity:1 } }

  ::slotted(*){ display:block; box-sizing:border-box; padding:12px 20px;
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  ::slotted(*:hover){ background:var(--aha-bg-hover,#F7F7F7) }
  @media (prefers-reduced-motion: reduce){ .row, .act, ::slotted(*){ transition:none !important } .skeleton{ animation:none } }
`;

export class AhaList extends HTMLElement {
  static get observedAttributes() { return ['list-title', 'footer', 'items', 'size', 'bordered', 'split', 'loading', 'selectable', 'value']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'value') this._syncSelection();
    else this._render();
  }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }

  _rowHtml(it, i) {
    const avatar = it.avatar
      ? `<span class="avatar" part="avatar"><aha-icon name="${esc(it.avatar)}" size="24" aria-hidden="true"></aha-icon></span>`
      : '';
    const desc = it.description ? `<div class="desc">${esc(it.description)}</div>` : '';
    const meta = `<div class="meta"><div class="title">${esc(it.title || '')}</div>${desc}</div>`;
    const acts = Array.isArray(it.actions) && it.actions.length
      ? `<div class="actions" part="actions">` + it.actions.map((a) =>
          `<button class="act${a.danger ? ' danger' : ''}" part="action" data-key="${esc(a.key || '')}" data-index="${i}"` +
          `${a.label ? ` aria-label="${esc(a.label)}"` : ''}><aha-icon name="${esc(a.icon)}" size="16" aria-hidden="true"></aha-icon></button>`
        ).join('') + `</div>`
      : '';
    if (this.hasAttribute('selectable')) {
      return `<div class="row interactive selectable" part="row" role="option" aria-selected="false" tabindex="-1"` +
        ` data-key="${esc(this._rowKey(it, i))}" data-index="${i}">${avatar}${meta}</div>`;
    }
    const interactive = acts ? ' interactive' : '';
    return `<div class="row${interactive}" part="row" role="listitem">${avatar}${meta}${acts}</div>`;
  }
  _rowKey(it, i) { return it && it.key != null ? String(it.key) : String(i); }
  _skeletonHtml() {
    return Array.from({ length: 3 }, () =>
      `<div class="row" part="row"><div class="meta"><div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:35%"></div></div></div>`
    ).join('');
  }
  _render() {
    const title = this.getAttribute('list-title');
    const footer = this.getAttribute('footer');
    const loading = this.hasAttribute('loading');
    const items = this._items();
    const picker = this.hasAttribute('selectable') && !loading && items.length > 0;
    const head = title ? `<div class="head" part="head"${picker ? ' id="head"' : ''}>${esc(title)}</div>` : '';
    const foot = footer ? `<div class="foot" part="foot">${esc(footer)}</div>` : '';
    const listboxAttrs = `role="listbox"${title ? ' aria-labelledby="head"' : ''}`;
    const body = loading
      ? `<div class="rows" role="list">${this._skeletonHtml()}</div>`
      : items.length
        ? `<div class="rows" ${picker ? listboxAttrs : 'role="list"'}>${items.map((it, i) => this._rowHtml(it, i)).join('')}</div>`
        : `<slot></slot>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="list" part="list">${head}${body}${foot}</div>`;
    this.shadowRoot.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('action', {
        bubbles: true, composed: true,
        detail: { key: b.getAttribute('data-key'), index: Number(b.getAttribute('data-index')) },
      }));
    }));
    if (picker) {
      const rows = this.shadowRoot.querySelector('.rows');
      rows.addEventListener('click', (e) => {
        const row = e.target.closest('.row.selectable');
        if (row) this._select(row);
      });
      rows.addEventListener('keydown', (e) => this._onKey(e));
      this._syncSelection();
    }
  }

  _options() { return [...this.shadowRoot.querySelectorAll('.row.selectable')]; }
  _selectedKey() {
    if (this.hasAttribute('value')) return this.getAttribute('value');
    const items = this._items();
    const i = items.findIndex((it) => it && it.selected === true);
    return i < 0 ? null : this._rowKey(items[i], i);
  }
  _syncSelection() {
    const options = this._options();
    if (!options.length) return;
    const key = this._selectedKey();
    let selected = null;
    for (const row of options) {
      const on = !selected && row.dataset.key === key;
      if (on) selected = row;
      row.setAttribute('aria-selected', String(on));
    }
    this._roveTo(selected || options[0]);
  }
  _roveTo(target, focus) {
    for (const row of this._options()) row.tabIndex = row === target ? 0 : -1;
    if (focus) target.focus();
  }
  _select(row) {
    const key = row.dataset.key;
    this.setAttribute('value', key);
    this._roveTo(row, true);
    this.dispatchEvent(new CustomEvent('select', {
      bubbles: true, composed: true, detail: { key, index: Number(row.dataset.index) },
    }));
  }
  _onKey(e) {
    const row = e.target.classList && e.target.classList.contains('selectable') ? e.target : null;
    if (!row) return;
    const options = this._options();
    const i = options.indexOf(row);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._roveTo(options[Math.min(i + 1, options.length - 1)], true); break;
      case 'ArrowUp': e.preventDefault(); this._roveTo(options[Math.max(i - 1, 0)], true); break;
      case 'Home': e.preventDefault(); this._roveTo(options[0], true); break;
      case 'End': e.preventDefault(); this._roveTo(options[options.length - 1], true); break;
      case 'Enter': case ' ': e.preventDefault(); this._select(row); break;
    }
  }
}

export function defineAhaList(tag = 'aha-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaList);
  return true;
}
if (typeof window !== 'undefined') defineAhaList();

export default { AhaList, defineAhaList };
