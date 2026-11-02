/**
 * @ahaslides-product/design/aha-select — the shared lightweight Select FIELD (leaf).
 *
 *   import '@ahaslides-product/design/aha-select';   // registers <aha-select>
 *   <aha-select placeholder="Pick a theme"
 *     options='[{"label":"Light","value":"light"},{"label":"Dark","value":"dark"}]'></aha-select>
 *   <aha-select status="error" value="dark"></aha-select>
 *
 * The LEAF counterpart to the composite Select (slug `select`, `selectTheme`). The composite carries a
 * virtualised list, option groups and several picks from a list — too much to rebuild. This leaf is a styled control that
 * picks one value from a short, known set (or, opt-in, takes free-entry tags), and — crucially — embeds inside a shadow-DOM row
 * (aha-settings-list's `control.type:"select"`) where the composite can't go.
 *
 * It renders a fully THEMED popup — a `role="listbox"` panel with DS chrome (white surface, radius 8,
 * elevation shadow, 40px option rows with Select's #F7F7F7 hover/active row and its brand-tint selected row) — NOT the browser's
 * unstyleable native <select> dropdown. It's an accessible combobox: the trigger is
 * `role="combobox" aria-haspopup="listbox" aria-expanded`, and the open list supports full keyboard
 * (Arrow/Home/End to move, typeahead, Enter/Space to pick, Escape to close), outside-click dismissal,
 * and the selected option in Select's brand tint with a #E70E68 label. The `open` state is a reflected, observed attribute so
 * the fade/scale transition lives on a PERSISTENT panel node and the aria can't desync.
 *
 * The open list is shown in the browser top layer (Popover API, popover="manual") and placed with
 * position:fixed from the control's measured rect, so an `overflow:hidden` card, a transform or a
 * z-index ancestor cannot clip or cover it. It opens above when there is more room there, stays 8px
 * inside the viewport (a list wider than the room to its right moves left), and follows scroll and
 * resize while open. Without the Popover API it is a plain fixed-position list placed the same way.
 *
 * DS V3 chrome: three sizes (small 24 · default 32 · large 40), radius 8, 1px #E3E3E3 border, a brand
 * #E70E68 focus border, #8A8A8A placeholder, error/warning status, a trailing caret via
 * <aha-icon name="system-caret-down">. Shadow-DOM CSS, themed only by --aha-* tokens → byte-identical
 * in React and Vue. Zero dependencies. Emits composed `change` CustomEvent<{value}>.
 *
 * Opt-in (each off by default, so an existing select renders unchanged):
 *   allow-clear      an × beside the caret while a value is set; click it (or Delete / Backspace on the
 *                    closed trigger) to empty the value. Emits `change` and `clear` with {value:''}.
 *                    `clear-label` names the button for screen readers (default "Clear selection").
 *   show-search      typing filters the list: the open popup turns the value area into a text field
 *                    (ARIA 1.2 combobox, aria-autocomplete="list"); Arrow keys move, Enter picks,
 *                    Escape closes, Tab closes. Emits `search` with {query}; `empty-text` is the
 *                    no-match row (default "No matches").
 *   popup-width      "match" (exactly the control's width), "content" (as wide as the longest option,
 *                    no control-width minimum), or a length ("280" = 280px, "20rem"). Unset: at least
 *                    the control's width, growing with content up to 320px.
 *   option fields    { label, value, disabled?, description?, title?, prefix?, suffix?, selectedLabel? } —
 *                    `description` is a second, smaller line under the label; `title` is the row's native
 *                    tooltip; `prefix` is leading text in the row (a flag emoji), `suffix` trailing text in
 *                    tertiary ink (a dial code, which type-to-filter also matches); `selectedLabel` is what the
 *                    closed trigger shows for that option instead of `label` ("🇬🇧 +44" for "United Kingdom").
 *   loading          an <aha-spin> replaces the caret, the open list is aria-busy, and while no option
 *                    is listed the popup shows `loading-text` (default "Loading…") instead of `empty-text`.
 *   filter="off"     with show-search: typing emits `search` but does not filter, so the host can load
 *                    options from a server; the popup opens with no options yet, and the picked option's
 *                    label stays on the trigger after a new search replaces the options.
 *   width="content"  the control is as wide as its longest option (or placeholder), so it does not jump
 *                    when the value changes; never wider than its container.
 *   mode="tags"      free-entry values as closable <aha-tag> chips before an inline field (select-tags.js):
 *                    `values` (JSON array attribute or array property), `separators` (characters that split,
 *                    default ",;" — a paste also splits on new lines and tabs), Enter or leaving the field
 *                    adds the text, Backspace in an empty field removes the last tag. No popup. Emits
 *                    `change` with {values}.
 */
import './icons.js';
import './aha-spin.js';
import { SelectTags } from './select-tags.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';   // registers <aha-icon> for the caret + the selected check
import { upgradeProperties } from './upgrade-properties.js';
const ENABLED = '.option:not([aria-disabled="true"]):not([hidden])';
const supportsTopLayer = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';
const GAP = 4, EDGE = 8;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; width:var(--aha-field-width,240px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .control{ position:relative; display:flex; width:100% }
  .probe{ position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; visibility:hidden }
  /* the trigger is the persistent node that carries border + focus ring (animated, never rebuilt) */
  .trigger{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:8px;
    height:40px; padding:0 12px;
    font-family:inherit; font-size:14px; line-height:21px;
    text-align:left; color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px); cursor:pointer;
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .trigger, :host([size="small"]) .trigger{ height:32px; padding:0 8px }
  :host([size="lg"]) .trigger, :host([size="large"]) .trigger{ height:48px }
  :host([size="lg"]) .trigger, :host([size="large"]) .trigger{ font-size:var(--aha-size-l,16px); line-height:24px }
  :host([size="touch"]) .trigger{ height:56px; padding:0 var(--aha-space-16,16px); font-size:16px; line-height:24px }
  .value{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  :host([_placeholder]) .value{ color:var(--aha-text-placeholder,#999999) }
  .caret{ flex:0 0 auto; display:inline-flex; color:var(--aha-text-tertiary,#8A8A8A);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .caret{ transform:rotate(180deg) }
  aha-icon{ display:inline-flex; color:currentColor }

  /* hover / focus on the persistent trigger */
  .trigger:hover{ border-color:var(--aha-color-primary,#E70E68) }
  :host([open]) .trigger, .trigger:focus-visible{ outline:none;
    border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .trigger{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([status="error"][open]) .trigger, :host([status="error"]) .trigger:focus-visible{
    border-color:var(--aha-border-error,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }
  :host([status="warning"]) .trigger{ border-color:var(--aha-border-warning,#1A1A1A) }
  :host([status="warning"][open]) .trigger, :host([status="warning"]) .trigger:focus-visible{
    border-color:var(--aha-border-warning,#1A1A1A); box-shadow:0 0 0 2px var(--aha-border-warning,#1A1A1A) }

  /* disabled */
  :host([disabled]) .trigger{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .caret{ color:var(--aha-text-disabled,#B5B5B5) }

  /* the THEMED popup — a persistent node so the fade/scale transition fires when [open] toggles */
  .listbox{ position:fixed; top:0; left:0; right:auto; bottom:auto; min-width:var(--_anchor-width,100%); width:max-content; color:var(--aha-text-default,#1A1A1A); max-width:min(320px, 90vw);
    z-index:30; box-sizing:border-box; margin:0; padding:4px; list-style:none;
    max-height:280px; overflow-y:auto; overscroll-behavior:contain;
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border-secondary,#F1F1F1);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top left;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .listbox{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([_flip]) .listbox{ transform-origin:bottom left; transform:translateY(4px) }
  :host([_flip][open]) .listbox{ transform:translateY(0) }
  /* the top-layer list is display:none while closed, so the enter fade starts from @starting-style */
  @starting-style{
    :host([open]) .listbox{ opacity:0; visibility:hidden; transform:translateY(-4px) }
    :host([_flip][open]) .listbox{ transform:translateY(4px) }
  }

  .option{ display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:var(--aha-radius-sm,6px);
    font-family:inherit; font-size:14px; line-height:22px;
    color:var(--aha-text-default,#1A1A1A); cursor:pointer; user-select:none;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .option .label{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .option:hover, .option[data-active="true"]{ background:var(--aha-bg-hover,#F7F7F7) }
  .option[aria-selected="true"]{ background:var(--aha-bg-accent,#E70E680D); color:var(--aha-color-primary,#E70E68); font-weight:600 }
  .option[aria-disabled="true"]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; pointer-events:none }
  .option[hidden], .empty[hidden]{ display:none }
  .option .text{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column }
  .option .description{ font-size:var(--aha-size-sm,12px); line-height:18px; font-weight:400; color:var(--aha-text-secondary,#4A4A4A);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .option[aria-disabled="true"] .description{ color:var(--aha-text-disabled,#B5B5B5) }
  .option .prefix{ flex:0 0 auto; display:inline-flex; align-items:center }
  .option .suffix{ flex:0 0 auto; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A) }
  .option[aria-disabled="true"] .suffix{ color:var(--aha-text-disabled,#B5B5B5) }
  .empty{ padding:9px var(--aha-space-12,12px); /* ds-lint-allow: spacing (9px matches the option row so the no-match row is the same height) */ font-size:14px; line-height:22px; color:var(--aha-text-tertiary,#8A8A8A); cursor:default }

  :host([popup-width]) .listbox{ min-width:0; width:var(--_popup-width,max-content); max-width:90vw }
  :host([popup-width="match"]) .listbox{ width:var(--_anchor-width,100%); max-width:none }
  :host([popup-width="content"]) .listbox{ width:max-content }

  .clear{ display:none; position:absolute; top:50%; right:36px; transform:translateY(-50%);
    width:16px; height:16px; padding:0; margin:0; border:0; background:none; cursor:pointer;
    align-items:center; justify-content:center; color:var(--aha-text-tertiary,#8A8A8A);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .clear:hover{ color:var(--aha-text-default,#1A1A1A) }
  :host([_clearable]) .clear{ display:inline-flex }
  :host([_clearable]) .caret{ margin-left:var(--aha-space-24,24px) }
  :host([size="sm"]) .clear, :host([size="small"]) .clear{ right:32px }
  :host([size="touch"]) .clear{ right:40px }
  :host([_searching]) .clear{ display:none }

  .search{ display:none; position:absolute; top:1px; bottom:1px; left:1px; right:36px; box-sizing:border-box;
    margin:0; padding:0 0 0 11px; /* ds-lint-allow: spacing (the trigger's 12px padding less the 1px border the field sits inside) */ border:0; outline:none; background:transparent;
    font-family:inherit; font-size:14px; color:var(--aha-text-default,#1A1A1A) }
  .search::placeholder{ color:var(--aha-text-placeholder,#999999) }
  :host([size="sm"]) .search, :host([size="small"]) .search{ padding-left:7px; /* ds-lint-allow: spacing (8px trigger padding less the 1px border) */ right:32px }
  :host([size="lg"]) .search, :host([size="large"]) .search{ font-size:var(--aha-size-l,16px) }
  :host([size="touch"]) .search{ padding-left:15px; /* ds-lint-allow: spacing (16px trigger padding less the 1px border) */ right:40px; font-size:16px }
  :host([_searching]) .search{ display:block }
  :host([_searching]) .value{ visibility:hidden }

  .spin{ display:none; flex:0 0 auto; width:16px; height:16px; align-items:center; justify-content:center }
  :host([loading]) .spin{ display:inline-flex }
  :host([loading]) .caret{ display:none }
  .loading{ display:flex; align-items:center; gap:var(--aha-space-8,8px); padding:9px var(--aha-space-12,12px); /* ds-lint-allow: spacing (9px matches the option row so the loading row is the same height) */
    font-size:14px; line-height:22px; color:var(--aha-text-tertiary,#8A8A8A); cursor:default }
  .loading[hidden]{ display:none }

  :host([width="content"]){ width:auto; max-width:100% }
  :host([width="content"]) .trigger{ display:inline-grid; grid-template-columns:minmax(0,auto) auto; column-gap:var(--aha-space-8,8px) }
  :host([width="content"]) .value, .sizer{ grid-area:1/1 }
  :host([width="content"]) .caret, :host([width="content"]) .spin{ grid-area:1/2 }
  .sizer{ display:grid; height:0; overflow:hidden; visibility:hidden }
  .sizer > span{ grid-area:1/1; white-space:nowrap }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSelect extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'options', 'disabled', 'status', 'size', 'aria-label', 'error-message', 'aria-describedby',
      'allow-clear', 'clear-label', 'show-search', 'empty-text', 'popup-width',
      'loading', 'loading-text', 'filter', 'width', 'mode', 'values', 'separators'];  // 'open' is internal state, synced imperatively (aria-expanded in _openList/_close) — not observed
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get open() { return this.hasAttribute('open'); }
  set open(v) {
    if (!v) { this.removeAttribute('open'); this._track(false); return; }
    if (this._list) this._showList();
    this.setAttribute('open', '');
    if (this._list) this._track(true);
  }
  get options() { return this._options || this._parseOptions(); }
  set options(v) { this._options = Array.isArray(v) ? v : null; this._populate(); }
  get values() { return this._tags ? [...this._tags.values] : []; }
  set values(v) { this._pendingValues = v; if (this._tags) { this._tags.setValues(v); this._pendingValues = undefined; } }
  focus(options) { if (this._tags) this._tags.input.focus(options); else super.focus(options); }

  connectedCallback() {
    upgradeProperties(this, ['value', 'disabled', 'open', 'options', 'values']);
    if (!this.shadowRoot) this.attachShadow({ mode: 'open', delegatesFocus: true });
    this._onDocPointer = (e) => { if (!e.composedPath().includes(this)) this._close(); };
    this._build();
    document.addEventListener('pointerdown', this._onDocPointer, true);
    window.addEventListener('resize', this._onDocPointer, true);
  }
  disconnectedCallback() {
    // remove the global listeners bound on connect (no leak on mount/unmount)
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    window.removeEventListener('resize', this._onDocPointer, true);
    this._track(false, true);
  }
  attributeChangedCallback(name, previous, next) {
    if (!this.shadowRoot) return;
    if (name === 'mode' && previous !== next && (previous === 'tags' || next === 'tags') && (this._tags || this._trigger)) { this._build(); return; }
    if (this._tags) { this._tags.sync(name); return; }
    if (!this._trigger) return;
    if (name === 'loading') this._syncLoading();
    else if (name === 'options') { this._options = null; this._populate(); }
    else if (name === 'show-search') { if (!this.hasAttribute(name)) this._close(); this._populate(); }
    else this._sync();
  }

  _parseOptions() {
    const attr = this.getAttribute('options');
    if (!attr) return [];
    try { const o = JSON.parse(attr); return Array.isArray(o) ? o : []; } catch { return []; }
  }
  _uid() { return this._id || (this._id = 'lb-' + Math.random().toString(36).slice(2, 8)); }

  _build() {
    if (this._tracking) this._track(false, true);
    if (this._tags && this._pendingValues === undefined) this._pendingValues = [...this._tags.values];
    this._tags = null; this._trigger = null; this._list = null;
    if (this.getAttribute('mode') === 'tags') { this._buildTags(); return; }
    const id = this._uid();
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="control"><button class="trigger" part="trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">` +
        `<span class="value" part="value"></span>` +
        `<span class="caret" part="caret" aria-hidden="true"><aha-icon name="system-caret-down" size="16"></aha-icon></span>` +
      `</button>` +
      `<input class="search" part="search" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}" autocomplete="off" spellcheck="false" tabindex="-1">` +
      `<button class="clear" part="clear" type="button" tabindex="-1"><aha-icon name="system-x-circle" size="16" aria-hidden="true"></aha-icon></button>` +
      `<ul class="listbox" part="listbox" id="${id}" role="listbox" tabindex="-1"${supportsTopLayer ? ' popover="manual"' : ''}></ul>` +
      `<span class="probe" aria-hidden="true"></span></div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._list = this.shadowRoot.querySelector('.listbox');
    this._search = this.shadowRoot.querySelector('.search');
    this._clearButton = this.shadowRoot.querySelector('.clear');
    this._clearButton.addEventListener('click', () => this._clear());
    this._search.addEventListener('input', () => this._onSearchInput());
    this._search.addEventListener('keydown', (e) => this._onSearchKey(e));
    this._trigger.addEventListener('click', () => { if (!this.disabled) this._toggle(); });
    this._trigger.addEventListener('keydown', (e) => this._onTriggerKey(e));
    this._list.addEventListener('keydown', (e) => this._onListKey(e));
    this._list.addEventListener('click', (e) => {
      const opt = e.target.closest('.option'); if (opt && opt.getAttribute('aria-disabled') !== 'true') this._pick(opt.dataset.value);
    });
    this._populate();
  }

  _buildTags() {
    this.removeAttribute('open'); this.removeAttribute('_searching');
    this._tags = new SelectTags(this);
    if (this._pendingValues !== undefined) { this._tags.setValues(this._pendingValues); this._pendingValues = undefined; }
  }
  _filterOff() { return this.getAttribute('filter') === 'off'; }
  _syncLoading() {
    const loading = this.hasAttribute('loading');
    if (loading && !this._trigger.querySelector('.spin')) {
      this._trigger.querySelector('.caret').insertAdjacentHTML('beforebegin', '<span class="spin" part="spinner" aria-hidden="true"><aha-spin size="small"></aha-spin></span>');
    }
    if (loading) this._list.setAttribute('aria-busy', 'true'); else this._list.removeAttribute('aria-busy');
    let row = this._list.querySelector('.loading');
    if (loading && !row) {
      this._list.insertAdjacentHTML('beforeend', '<li class="loading" part="loading" role="presentation"><aha-spin size="small"></aha-spin><span class="loading-text"></span></li>');
      row = this._list.querySelector('.loading');
    }
    if (row) row.querySelector('.loading-text').textContent = this.getAttribute('loading-text') || 'Loading…';
    this._syncStatusRows();
  }
  _syncStatusRows() {
    const shown = this._list.querySelectorAll('.option:not([hidden])').length;
    const loading = this.hasAttribute('loading');
    const empty = this._list.querySelector('.empty');
    if (empty) empty.hidden = shown > 0 || loading || (!this.hasAttribute('_searching') && !this._filterOff());
    const row = this._list.querySelector('.loading');
    if (row) row.hidden = !loading || shown > 0;
  }
  _syncSizer() {
    let sizer = this._trigger.querySelector('.sizer');
    if (this.getAttribute('width') !== 'content') { if (sizer) sizer.remove(); return; }
    if (!sizer) {
      this._trigger.querySelector('.value').insertAdjacentHTML('afterend', '<span class="sizer" aria-hidden="true"></span>');
      sizer = this._trigger.querySelector('.sizer');
    }
    const opts = this._options || this._parseOptions();
    const labels = opts.map((o) => (o && typeof o === 'object' ? (o.selectedLabel ?? o.label ?? o.value) : o));
    const placeholder = this.getAttribute('placeholder');
    if (placeholder) labels.push(placeholder);
    sizer.innerHTML = labels.map((l) => `<span>${esc(l)}</span>`).join('');
  }

  _populate() {
    if (!this._list) return;
    const opts = this._options || this._parseOptions();
    const value = this.getAttribute('value');
    const id = this._uid();
    this._list.innerHTML = opts.map((o, i) => {
      const ov = o && typeof o === 'object' ? o.value : o;
      const ol = o && typeof o === 'object' ? (o.label ?? o.value) : o;
      const dis = o && typeof o === 'object' && o.disabled ? ' aria-disabled="true"' : '';
      const sel = String(ov) === String(value);
      const description = o && typeof o === 'object' && o.description != null && o.description !== '' ? o.description : null;
      const title = o && typeof o === 'object' && o.title != null && o.title !== '' ? ` title="${esc(o.title)}"` : '';
      const prefix = o && typeof o === 'object' && o.prefix != null && o.prefix !== '' ? o.prefix : null;
      const suffix = o && typeof o === 'object' && o.suffix != null && o.suffix !== '' ? o.suffix : null;
      const text = description == null ? `<span class="label">${esc(ol)}</span>`
        : `<span class="text"><span class="label">${esc(ol)}</span><span class="description" part="description">${esc(description)}</span></span>`;
      return `<li class="option" part="option" id="${id}-o${i}" role="option" data-value="${esc(ov)}" aria-selected="${sel}"${dis}${title}>` +
        (prefix == null ? '' : `<span class="prefix" part="option-prefix" aria-hidden="true">${esc(prefix)}</span>`) +
        text + (suffix == null ? '' : `<span class="suffix" part="option-suffix">${esc(suffix)}</span>`) + `</li>`;
    }).join('') + (this.hasAttribute('show-search') ? `<li class="empty" part="empty" role="presentation" hidden></li>` : '');
    if (this.hasAttribute('_searching')) this._applyFilter();
    if (this.hasAttribute('loading') || this._list.querySelector('.loading')) this._syncLoading();
    this._sync();
  }

  _toggle() { this.open ? this._close() : this._openList(); }
  _openList(seed) {
    const mayOpenEmpty = this.hasAttribute('loading') || (this._filterOff() && this.hasAttribute('show-search'));
    if (this.disabled || (!this.options.length && !mayOpenEmpty)) return;
    this._showList();
    this.setAttribute('open', '');
    this._track(true);
    this._trigger.setAttribute('aria-expanded', 'true');
    if (this.hasAttribute('show-search')) { this._openSearch(seed); return; }
    // active = the selected option, else the first enabled
    const sel = this._list.querySelector('.option[aria-selected="true"]') || this._list.querySelector('.option:not([aria-disabled="true"])');
    this._setActive(sel);
    this._list.focus({ preventScroll: true });
  }
  _openSearch(seed) {
    this.setAttribute('_searching', '');
    this._search.value = seed || '';
    this._search.placeholder = this._trigger.querySelector('.value').textContent;
    this._search.setAttribute('aria-expanded', 'true');
    const name = this.getAttribute('aria-label') || this.getAttribute('placeholder');
    if (name) this._search.setAttribute('aria-label', name); else this._search.removeAttribute('aria-label');
    this._applyFilter();
    this._search.focus({ preventScroll: true });
    if (seed) this._emitSearch();
  }
  _closeSearch() {
    if (!this.hasAttribute('_searching')) return;
    this.removeAttribute('_searching');
    this._search.value = '';
    this._search.setAttribute('aria-expanded', 'false');
    this._search.removeAttribute('aria-activedescendant');
    for (const el of this._list.querySelectorAll('.option[hidden]')) el.hidden = false;
    const empty = this._list.querySelector('.empty'); if (empty) empty.hidden = true;
  }
  _onSearchInput() { this._applyFilter(); this._emitSearch(); }
  _emitSearch() {
    this.dispatchEvent(new CustomEvent('search', { bubbles: true, composed: true, detail: { query: this._search.value } }));
  }
  _applyFilter() {
    const query = this._filterOff() ? '' : this._search.value.trim().toLowerCase();
    let shown = 0;
    for (const el of this._list.querySelectorAll('.option')) {
      const label = ((el.querySelector('.label')?.textContent || '') + ' ' + (el.querySelector('.suffix')?.textContent || '')).toLowerCase();
      el.hidden = !!query && !label.includes(query);
      if (!el.hidden) shown++;
    }
    const empty = this._list.querySelector('.empty');
    if (empty) { empty.textContent = this.getAttribute('empty-text') || 'No matches'; empty.hidden = shown > 0; }
    this._syncStatusRows();
    const selected = this._list.querySelector('.option[aria-selected="true"]:not([hidden])');
    this._setActive(!query && selected ? selected : this._list.querySelector(ENABLED));
  }
  _close(focusTrigger) {
    if (!this.open || !this._trigger) return;
    this.removeAttribute('open');
    this._track(false);
    this._trigger.setAttribute('aria-expanded', 'false');
    this._setActive(null);
    this._closeSearch();
    if (focusTrigger) this._trigger.focus();
  }
  _showList() {
    const list = this._list;
    clearTimeout(this._hideTimer);
    this._hideTimer = 0;
    if (list && list.hasAttribute('popover') && list.isConnected && !list.matches(':popover-open')) list.showPopover();
  }
  // stays in the top layer until the exit fade ends, or the list would vanish mid-transition
  _hideList(immediately) {
    const list = this._list;
    if (!list || !list.hasAttribute('popover')) return;
    const hide = () => { this._hideTimer = 0; if (list.matches(':popover-open')) list.hidePopover(); };
    clearTimeout(this._hideTimer);
    const fadeSeconds = parseFloat(getComputedStyle(list).transitionDuration) || 0;
    if (immediately || !fadeSeconds) hide();
    else this._hideTimer = setTimeout(hide, fadeSeconds * 1000 + 50);
  }
  _track(on, immediately) {
    if (on && !this._tracking) {
      this._tracking = true;
      this._schedulePlace = this._schedulePlace || (() => {
        if (this._placeFrame) return;
        this._placeFrame = requestAnimationFrame(() => { this._placeFrame = 0; this._place(); });
      });
      window.addEventListener('resize', this._schedulePlace);
      window.addEventListener('scroll', this._schedulePlace, true);
      // results arriving, the loading row or filtering resize the list without any scroll or resize event
      if (typeof ResizeObserver === 'function' && this._list) {
        this._listObserver = new ResizeObserver(this._schedulePlace);
        this._listObserver.observe(this._list);
      }
      this._place();
    } else if (!on && this._tracking) {
      this._tracking = false;
      window.removeEventListener('resize', this._schedulePlace);
      window.removeEventListener('scroll', this._schedulePlace, true);
      if (this._listObserver) { this._listObserver.disconnect(); this._listObserver = null; }
      cancelAnimationFrame(this._placeFrame);
      this._placeFrame = 0;
      this._hideList(immediately);
    } else if (!on && immediately) this._hideList(true);
  }
  // Without the Popover API a transformed ancestor becomes the fixed containing block; the probe cancels its offset.
  _place() {
    const list = this._list;
    const control = this.shadowRoot && this.shadowRoot.querySelector('.control');
    const probe = this.shadowRoot && this.shadowRoot.querySelector('.probe');
    if (!list || !control || !probe || !this._tracking) return;
    const anchor = control.getBoundingClientRect();
    list.style.setProperty('--_anchor-width', `${anchor.width}px`);
    const width = list.offsetWidth, height = list.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
    const below = viewportHeight - anchor.bottom - GAP - EDGE, above = anchor.top - GAP - EDGE;
    const onTop = height > below && above > below;
    const top = clamp(onTop ? anchor.top - GAP - height : anchor.bottom + GAP, EDGE, Math.max(EDGE, viewportHeight - height - EDGE));
    const left = clamp(anchor.left, EDGE, Math.max(EDGE, viewportWidth - width - EDGE));
    const origin = list.hasAttribute('popover') && list.matches(':popover-open') ? { top: 0, left: 0 } : probe.getBoundingClientRect();
    list.style.top = `${top - origin.top}px`;
    list.style.left = `${left - origin.left}px`;
    this.toggleAttribute('_flip', onTop);
  }
  _syncOpen() {
    const open = this.open;
    if (this._trigger) this._trigger.setAttribute('aria-expanded', String(open));
  }

  _setActive(opt) {
    for (const el of this._list.querySelectorAll('.option[data-active="true"]')) el.removeAttribute('data-active');
    const owner = this.hasAttribute('_searching') ? this._search : this._list;
    if (opt) { opt.setAttribute('data-active', 'true'); owner.setAttribute('aria-activedescendant', opt.id); opt.scrollIntoView({ block: 'nearest' }); }
    else owner.removeAttribute('aria-activedescendant');
  }
  _move(dir) {
    const items = [...this._list.querySelectorAll(ENABLED)];
    if (!items.length) return;
    const cur = this._list.querySelector('.option[data-active="true"]');
    let i = cur ? items.indexOf(cur) : -1;
    i = dir === 'home' ? 0 : dir === 'end' ? items.length - 1 : (i + (dir === 'up' ? -1 : 1) + items.length) % items.length;
    this._setActive(items[i]);
  }
  _typeahead(ch) {
    const items = [...this._list.querySelectorAll(ENABLED)];
    const hit = items.find(el => (el.querySelector('.label')?.textContent || '').trim().toLowerCase().startsWith(ch.toLowerCase()));
    if (hit) this._setActive(hit);
  }
  _pick(val) {
    if (val == null) return;
    const picked = (this._options || this._parseOptions()).find((o) => String(o && typeof o === 'object' ? o.value : o) === String(val));
    if (picked != null) this._pickedLabel = { value: String(val), label: typeof picked === 'object' ? (picked.selectedLabel ?? picked.label ?? picked.value) : picked };
    this.setAttribute('value', val);
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: val } }));
    this._close(true);
  }

  _clear() {
    if (this.disabled || !this.hasAttribute('allow-clear') || !this.value) return;
    this.setAttribute('value', '');
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: '' } }));
    this.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true, detail: { value: '' } }));
    this._close();
    this._trigger.focus();
  }

  _onTriggerKey(e) {
    if (this.disabled) return;
    if (e.key === 'Escape' && this.open) { e.preventDefault(); e.stopPropagation(); this._close(true); return; }
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); this._openList(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !this.open && this.hasAttribute('allow-clear') && this.value) { e.preventDefault(); this._clear(); return; }
    if (this.hasAttribute('show-search') && e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); this._openList(e.key); }
  }
  _onSearchKey(e) {
    if (e.isComposing || e.keyCode === 229) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._move('down'); break;
      case 'ArrowUp': e.preventDefault(); this._move('up'); break;
      case 'Enter': { e.preventDefault(); const a = this._list.querySelector('.option[data-active="true"]'); if (a) this._pick(a.dataset.value); break; }
      case 'Escape': e.preventDefault(); e.stopPropagation(); this._close(true); break;
      case 'Tab': this._close(); break;
    }
  }
  _onListKey(e) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._move('down'); break;
      case 'ArrowUp': e.preventDefault(); this._move('up'); break;
      case 'Home': e.preventDefault(); this._move('home'); break;
      case 'End': e.preventDefault(); this._move('end'); break;
      case 'Enter': case ' ': { e.preventDefault(); const a = this._list.querySelector('.option[data-active="true"]'); if (a) this._pick(a.dataset.value); break; }
      case 'Escape': e.preventDefault(); e.stopPropagation(); this._close(true); break;
      case 'Tab': this._close(); break;
      default: if (e.key.length === 1 && /\S/.test(e.key)) this._typeahead(e.key);
    }
  }

  _syncValueText() {
    const opts = this._options || this._parseOptions();
    const value = this.getAttribute('value');
    const match = opts.find(o => String(o && typeof o === 'object' ? o.value : o) === String(value));
    let label = match ? (typeof match === 'object' ? (match.selectedLabel ?? match.label ?? match.value) : match) : null;
    if (label == null && this._filterOff() && this._pickedLabel && this._pickedLabel.value === String(value)) label = this._pickedLabel.label;
    const empty = label == null || value == null || value === '';
    this._trigger.querySelector('.value').textContent = empty ? (this.getAttribute('placeholder') || '') : label;
    if (empty && this.getAttribute('placeholder') != null) this.setAttribute('_placeholder', ''); else this.removeAttribute('_placeholder');
    if (this.hasAttribute('allow-clear') && !this.disabled && value != null && value !== '') this.setAttribute('_clearable', ''); else this.removeAttribute('_clearable');
    this._clearButton.setAttribute('aria-label', this.getAttribute('clear-label') || 'Clear selection');
  }
  _syncPopupWidth() {
    const width = this.getAttribute('popup-width');
    const length = width == null || width === 'match' || width === 'content' ? '' : (/^\d+(\.\d+)?$/.test(width) ? width + 'px' : width);
    if (length) this._list.style.setProperty('--_popup-width', length); else this._list.style.removeProperty('--_popup-width');
  }
  _sync() {
    if (!this._trigger) return;
    this._trigger.disabled = this.disabled;
    const name = this.getAttribute('aria-label');
    if (name) this._trigger.setAttribute('aria-label', name); else this._trigger.removeAttribute('aria-label');
    // keep aria-selected + the value label in sync with the current value
    const value = this.getAttribute('value');
    for (const el of this._list.querySelectorAll('.option')) el.setAttribute('aria-selected', String(String(el.dataset.value) === String(value)));
    this._syncValueText();
    if (isInvalid(this)) this._trigger.setAttribute('aria-invalid', 'true'); else this._trigger.removeAttribute('aria-invalid');
    syncFieldError(this, this._trigger);
    this._syncPopupWidth();
    this._syncSizer();
    this._syncOpen();
  }
}

export function defineAhaSelect(tag = 'aha-select') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSelect);
  return true;
}
if (typeof window !== 'undefined') defineAhaSelect();

export default { AhaSelect, defineAhaSelect };
