/**
 * @ahaslides-product/design/aha-select — the shared lightweight Select FIELD (leaf).
 *
 *   import '@ahaslides-product/design/aha-select';   // registers <aha-select>
 *   <aha-select placeholder="Pick a theme"
 *     options='[{"label":"Light","value":"light"},{"label":"Dark","value":"dark"}]'></aha-select>
 *   <aha-select size="large" status="error" value="dark"></aha-select>
 *
 * The LEAF counterpart to the composite Select (slug `select`, `selectTheme`). The composite carries a
 * virtualised list, type-to-search and tags — too much to rebuild. This leaf is a styled control that
 * picks one value from a short, known set, and — crucially — embeds inside a shadow-DOM row
 * (aha-settings-list's `control.type:"select"`) where the composite can't go.
 *
 * It renders a fully THEMED popup — a `role="listbox"` panel with DS chrome (white surface, radius 8,
 * elevation shadow, brand-tinted hover/selected, a check on the chosen option) — NOT the browser's
 * unstyleable native <select> dropdown. It's an accessible combobox: the trigger is
 * `role="combobox" aria-haspopup="listbox" aria-expanded`, and the open list supports full keyboard
 * (Arrow/Home/End to move, typeahead, Enter/Space to pick, Escape to close), outside-click dismissal,
 * and a `system-check` on the selected option. The `open` state is a reflected, observed attribute so
 * the fade/scale transition lives on a PERSISTENT panel node and the aria can't desync.
 *
 * DS V3 chrome: three sizes (small 24 · default 32 · large 40), radius 8, 1px #E3E3E3 border, a brand
 * #6A1EBB focus border, #8A8A8A placeholder, error/warning status, a trailing caret via
 * <aha-icon name="system-caret-down">. Shadow-DOM CSS, themed only by --aha-* tokens → byte-identical
 * in React and Vue. Zero dependencies. Emits composed `change` CustomEvent<{value}>.
 */
import './icons.js';   // registers <aha-icon> for the caret + the selected check
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; width:240px; position:relative }
  /* the trigger is the persistent node that carries border + focus ring (animated, never rebuilt) */
  .trigger{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:8px;
    height:32px; padding:0 12px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    text-align:left; color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px); cursor:pointer;
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .trigger, :host([size="small"]) .trigger{ height:24px; padding:0 8px }
  :host([size="lg"]) .trigger, :host([size="large"]) .trigger{ height:40px }
  .value{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  :host([_placeholder]) .value{ color:var(--aha-text-tertiary,#8A8A8A) }
  .caret{ flex:0 0 auto; display:inline-flex; color:var(--aha-text-tertiary,#8A8A8A);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([open]) .caret{ transform:rotate(180deg) }
  aha-icon{ display:inline-flex; color:currentColor }

  /* hover / focus on the persistent trigger */
  .trigger:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([open]) .trigger, .trigger:focus-visible{ outline:none;
    border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .trigger{ border-color:var(--aha-border-error,#F5222D) }
  :host([status="error"][open]) .trigger, :host([status="error"]) .trigger:focus-visible{
    border-color:var(--aha-border-error,#F5222D); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }
  :host([status="warning"]) .trigger{ border-color:var(--aha-border-warning,#FF7747) }
  :host([status="warning"][open]) .trigger, :host([status="warning"]) .trigger:focus-visible{
    border-color:var(--aha-border-warning,#FF7747); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-warning,#FF7747) 20%, transparent) }

  /* disabled */
  :host([disabled]) .trigger{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .caret{ color:var(--aha-text-disabled,#B5B5B5) }

  /* the THEMED popup — a persistent node so the fade/scale transition fires when [open] toggles */
  .listbox{ position:absolute; top:calc(100% + 6px); left:0; min-width:100%; width:max-content; max-width:min(320px, 90vw);
    z-index:30; box-sizing:border-box; margin:0; padding:4px; list-style:none;
    max-height:280px; overflow-y:auto; overscroll-behavior:contain;
    background:var(--aha-bg-elevated,#fff); border:1px solid var(--aha-border-secondary,#EBEBEB);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top left;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .listbox{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([_flip]) .listbox{ top:auto; bottom:calc(100% + 6px); transform-origin:bottom left; transform:translateY(4px) }
  :host([_flip][open]) .listbox{ transform:translateY(0) }

  .option{ display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:var(--aha-radius-sm,6px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); cursor:pointer; user-select:none;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .option .label{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .option .check{ flex:0 0 auto; display:inline-flex; visibility:hidden; color:var(--aha-color-primary,#6A1EBB) }
  .option[aria-selected="true"]{ color:var(--aha-color-primary,#6A1EBB); font-weight:600 }
  .option[aria-selected="true"] .check{ visibility:visible }
  .option[data-active="true"]{ background:var(--aha-bg-accent,#F9F5FF) }
  .option[aria-disabled="true"]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; pointer-events:none }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSelect extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'options', 'disabled', 'status', 'size'];  // 'open' is internal state, synced imperatively (aria-expanded in _openList/_close) — not observed
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get options() { return this._options || this._parseOptions(); }
  set options(v) { this._options = Array.isArray(v) ? v : null; this._populate(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._onDocPointer = (e) => { if (!e.composedPath().includes(this)) this._close(); };
    this._build();
    document.addEventListener('pointerdown', this._onDocPointer, true);
    window.addEventListener('resize', this._onDocPointer, true);
  }
  disconnectedCallback() {
    // remove the global listeners bound on connect (no leak on mount/unmount)
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    window.removeEventListener('resize', this._onDocPointer, true);
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot || !this._trigger) return;
    if (name === 'options') { this._options = null; this._populate(); }
    else this._sync();
  }

  _parseOptions() {
    const attr = this.getAttribute('options');
    if (!attr) return [];
    try { const o = JSON.parse(attr); return Array.isArray(o) ? o : []; } catch { return []; }
  }
  _uid() { return this._id || (this._id = 'lb-' + Math.random().toString(36).slice(2, 8)); }

  _build() {
    const id = this._uid();
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<button class="trigger" part="trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">` +
        `<span class="value" part="value"></span>` +
        `<span class="caret" part="caret" aria-hidden="true"><aha-icon name="system-caret-down" size="16"></aha-icon></span>` +
      `</button>` +
      `<ul class="listbox" part="listbox" id="${id}" role="listbox" tabindex="-1"></ul>`;
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._list = this.shadowRoot.querySelector('.listbox');
    this._trigger.addEventListener('click', () => { if (!this.disabled) this._toggle(); });
    this._trigger.addEventListener('keydown', (e) => this._onTriggerKey(e));
    this._list.addEventListener('keydown', (e) => this._onListKey(e));
    this._list.addEventListener('click', (e) => {
      const opt = e.target.closest('.option'); if (opt && opt.getAttribute('aria-disabled') !== 'true') this._pick(opt.dataset.value);
    });
    this._populate();
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
      return `<li class="option" part="option" id="${id}-o${i}" role="option" data-value="${esc(ov)}" aria-selected="${sel}"${dis}>` +
        `<span class="label">${esc(ol)}</span>` +
        `<span class="check" aria-hidden="true"><aha-icon name="system-check" size="16"></aha-icon></span></li>`;
    }).join('');
    this._sync();
  }

  _toggle() { this.open ? this._close() : this._openList(); }
  _openList() {
    if (this.disabled || !this.options.length) return;
    // flip above when there isn't room below (edge-collision, like the DS dropdown)
    const r = this.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    if (below < 240 && r.top > below) this.setAttribute('_flip', ''); else this.removeAttribute('_flip');
    this.setAttribute('open', '');
    this._trigger.setAttribute('aria-expanded', 'true');
    // active = the selected option, else the first enabled
    const sel = this._list.querySelector('.option[aria-selected="true"]') || this._list.querySelector('.option:not([aria-disabled="true"])');
    this._setActive(sel);
    this._list.focus({ preventScroll: true });
  }
  _close(focusTrigger) {
    if (!this.open) return;
    this.removeAttribute('open'); this.removeAttribute('_flip');
    this._trigger.setAttribute('aria-expanded', 'false');
    this._setActive(null);
    if (focusTrigger) this._trigger.focus();
  }
  _syncOpen() {
    const open = this.open;
    if (this._trigger) this._trigger.setAttribute('aria-expanded', String(open));
  }

  _setActive(opt) {
    for (const el of this._list.querySelectorAll('.option[data-active="true"]')) el.removeAttribute('data-active');
    if (opt) { opt.setAttribute('data-active', 'true'); this._list.setAttribute('aria-activedescendant', opt.id); opt.scrollIntoView({ block: 'nearest' }); }
    else this._list.removeAttribute('aria-activedescendant');
  }
  _move(dir) {
    const items = [...this._list.querySelectorAll('.option:not([aria-disabled="true"])')];
    if (!items.length) return;
    const cur = this._list.querySelector('.option[data-active="true"]');
    let i = cur ? items.indexOf(cur) : -1;
    i = dir === 'home' ? 0 : dir === 'end' ? items.length - 1 : (i + (dir === 'up' ? -1 : 1) + items.length) % items.length;
    this._setActive(items[i]);
  }
  _typeahead(ch) {
    const items = [...this._list.querySelectorAll('.option:not([aria-disabled="true"])')];
    const hit = items.find(el => (el.textContent || '').trim().toLowerCase().startsWith(ch.toLowerCase()));
    if (hit) this._setActive(hit);
  }
  _pick(val) {
    if (val == null) return;
    this.setAttribute('value', val);
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: val } }));
    this._close(true);
  }

  _onTriggerKey(e) {
    if (this.disabled) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); this._openList(); }
  }
  _onListKey(e) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._move('down'); break;
      case 'ArrowUp': e.preventDefault(); this._move('up'); break;
      case 'Home': e.preventDefault(); this._move('home'); break;
      case 'End': e.preventDefault(); this._move('end'); break;
      case 'Enter': case ' ': { e.preventDefault(); const a = this._list.querySelector('.option[data-active="true"]'); if (a) this._pick(a.dataset.value); break; }
      case 'Escape': e.preventDefault(); this._close(true); break;
      case 'Tab': this._close(); break;
      default: if (e.key.length === 1 && /\S/.test(e.key)) this._typeahead(e.key);
    }
  }

  _syncValueText() {
    const opts = this._options || this._parseOptions();
    const value = this.getAttribute('value');
    const match = opts.find(o => String(o && typeof o === 'object' ? o.value : o) === String(value));
    const label = match ? (typeof match === 'object' ? (match.label ?? match.value) : match) : null;
    const empty = label == null || value == null || value === '';
    this._trigger.querySelector('.value').textContent = empty ? (this.getAttribute('placeholder') || '') : label;
    if (empty && this.getAttribute('placeholder') != null) this.setAttribute('_placeholder', ''); else this.removeAttribute('_placeholder');
  }
  _sync() {
    if (!this._trigger) return;
    this._trigger.disabled = this.disabled;
    // keep aria-selected + the value label in sync with the current value
    const value = this.getAttribute('value');
    for (const el of this._list.querySelectorAll('.option')) el.setAttribute('aria-selected', String(String(el.dataset.value) === String(value)));
    this._syncValueText();
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
