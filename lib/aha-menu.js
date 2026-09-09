/**
 * @ahaslides-product/design/aha-menu — the shared Menu primitive.
 *
 *   import '@ahaslides-product/design/aha-menu';   // registers <aha-menu>
 *   <aha-menu value="poll" items='[{"key":"poll","label":"Poll","icon":"system-bar-chart"}]'></aha-menu>
 *
 * A list of selectable options — a side nav, a settings list, an overflow menu. The DS V3 Menu is a
 * FAMILY, not a flat list: it carries leading icons, group titles, dividers, danger items, disabled
 * rows, and nestable submenus, in three modes — `vertical` (compact popover list, the default),
 * `inline` (indented sidebar tree), and `horizontal` (a top-level nav bar).
 *
 * `items` is a tree of nodes:
 *   { key, label, icon?, disabled?, danger? }         a leaf row
 *   { key, label, icon?, children:[…], disabled? }    a submenu (expand/collapse, inline)
 *   { type:"group", label, children:[…] }             a titled section
 *   { type:"divider" }                                a separator line
 *
 * The selected row is brand-tinted; hover, selection, submenu expand and the caret all animate via
 * the shared motion tokens on PERSISTENT nodes (a class/attribute toggles — the subtree is never
 * rebuilt on a state change, so the transition actually fires). ONE element, shadow-DOM CSS, themed
 * only by --aha-* tokens → byte-identical in React and Vue. Emits a composed `select` (detail {key}).
 * Icons are summoned by name from the DS icon library via <aha-icon> — never an inline glyph.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px }
  .menu{ display:flex; flex-direction:column; gap:2px; padding:6px; min-width:200px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF) }
  /* horizontal mode — a top-level nav bar */
  :host([mode="horizontal"]) .menu{ flex-direction:row; align-items:center; gap:4px; min-width:0; width:max-content }
  :host([mode="horizontal"]) .item{ width:auto }

  .item{ display:flex; align-items:center; gap:10px; height:36px; padding:0 12px; border:0; text-align:left; width:100%;
    box-sizing:border-box; border-radius:var(--aha-radius-default,8px); background:transparent; color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .item:not(.selected):not([disabled]):not(.danger):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .item:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }
  .item.selected{ background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  .item[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
  .item.danger{ color:var(--aha-color-error,#F5222D) }
  .item.danger:not([disabled]):hover{ background:color-mix(in srgb, var(--aha-color-error,#F5222D) 8%, transparent) }

  .label{ flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .caret{ flex:0 0 auto; display:inline-flex; transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .parent[aria-expanded="true"] > .caret{ transform:rotate(90deg) }

  /* group title — a non-interactive section header */
  .group-title{ padding:8px 12px 4px; font-size:11px; font-weight:600; letter-spacing:.4px; text-transform:uppercase;
    color:var(--aha-text-tertiary,#8A8A8A) }
  /* divider */
  .divider{ height:1px; margin:4px 8px; background:var(--aha-split,#F1F1F1); border:0 }

  /* submenu — a persistent node that animates open via grid-rows (never rebuilt on toggle) */
  .sub{ display:grid; grid-template-rows:0fr;
    transition:grid-template-rows var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .sub.open{ grid-template-rows:1fr }
  .sub > .sub-inner{ overflow:hidden; min-height:0; display:flex; flex-direction:column; gap:2px }
  .sub .item{ padding-left:34px }
  :host([mode="inline"]) .sub .item{ padding-left:44px }
`;

export class AhaMenu extends HTMLElement {
  static get observedAttributes() { return ['items', 'value', 'mode']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'value') this._select(this.getAttribute('value'), false);
    else this._render();   // items/mode change → full rebuild (not a per-state toggle, so no dead transition)
  }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }

  // ---- rendering -------------------------------------------------------------
  _rowHtml(it, value) {
    if (it && it.type === 'divider') return `<div class="divider" role="separator"></div>`;
    if (it && it.type === 'group') {
      const gid = 'g' + Math.abs(this._hash(it.label || '')).toString(36);
      const kids = (it.children || []).map((k) => this._rowHtml(k, value)).join('');
      return `<div role="group" aria-labelledby="${gid}"><div class="group-title" id="${gid}">${esc(it.label || '')}</div>${kids}</div>`;
    }
    const icon = it.icon ? `<aha-icon name="${esc(it.icon)}" size="16" aria-hidden="true"></aha-icon>` : '';
    const isParent = Array.isArray(it.children) && it.children.length;
    if (isParent) {
      const caret = `<span class="caret"><aha-icon name="system-caret-right" size="14" aria-hidden="true"></aha-icon></span>`;
      const kids = it.children.map((k) => this._rowHtml(k, value)).join('');
      return `<button class="item parent" part="item" role="menuitem" aria-haspopup="true" aria-expanded="false" tabindex="-1"` +
        ` data-key="${esc(it.key)}"${it.disabled ? ' disabled' : ''}>${icon}<span class="label">${esc(it.label)}</span>${caret}</button>` +
        `<div class="sub" role="group"><div class="sub-inner">${kids}</div></div>`;
    }
    const sel = it.key === value;
    return `<button class="item${sel ? ' selected' : ''}${it.danger ? ' danger' : ''}" part="item" role="menuitemradio"` +
      ` aria-checked="${sel}" tabindex="-1" data-key="${esc(it.key)}"${it.disabled ? ' disabled' : ''}>` +
      `${icon}<span class="label">${esc(it.label)}</span></button>`;
  }
  _render() {
    const value = this.getAttribute('value');
    const mode = this.getAttribute('mode') || 'vertical';
    const rows = this._items().map((it) => this._rowHtml(it, value)).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="menu" part="menu" role="menu" aria-orientation="${mode === 'horizontal' ? 'horizontal' : 'vertical'}">${rows}</div>`;
    this.shadowRoot.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => this._activate(b)));
    this.shadowRoot.querySelector('.menu').addEventListener('keydown', (e) => this._onKey(e));
    this._roveTo(this.shadowRoot.querySelector('.item.selected') || this._focusables()[0]);
  }

  // ---- selection + submenu (persistent-node toggles, no rebuild) -------------
  _activate(btn) {
    if (btn.hasAttribute('disabled')) return;
    if (btn.classList.contains('parent')) { this._toggleSub(btn); this._roveTo(btn, true); return; }
    this._select(btn.getAttribute('data-key'), true);
  }
  _toggleSub(btn, force) {
    const sub = btn.nextElementSibling;
    if (!sub || !sub.classList.contains('sub')) return;
    const open = force === undefined ? !sub.classList.contains('open') : force;
    sub.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  _select(key, emit) {
    this.shadowRoot.querySelectorAll('.item[role="menuitemradio"]').forEach((b) => {
      const on = b.getAttribute('data-key') === key;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    if (emit) this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { key } }));
  }

  // ---- roving focus + keyboard (WAI-ARIA menu) -------------------------------
  _focusables() {
    // visible, enabled rows: skip disabled, skip children inside a collapsed submenu
    return [...this.shadowRoot.querySelectorAll('.item:not([disabled])')].filter((b) => {
      const sub = b.closest('.sub');
      return !sub || sub.classList.contains('open');
    });
  }
  _roveTo(target, focus) {
    const list = this._focusables();
    if (!list.length) return;
    const to = list.includes(target) ? target : list[0];
    this.shadowRoot.querySelectorAll('.item').forEach((b) => { b.tabIndex = b === to ? 0 : -1; });
    if (focus) to.focus();
  }
  _move(from, delta) {
    const list = this._focusables();
    if (!list.length) return;
    const i = list.indexOf(from);
    this._roveTo(list[(i + delta + list.length) % list.length], true);
  }
  _onKey(e) {
    const item = e.target.closest && e.target.closest('.item');
    if (!item) return;
    const horiz = (this.getAttribute('mode') || 'vertical') === 'horizontal';
    const next = horiz ? 'ArrowRight' : 'ArrowDown';
    const prev = horiz ? 'ArrowLeft' : 'ArrowUp';
    switch (e.key) {
      case next: e.preventDefault(); this._move(item, 1); break;
      case prev: e.preventDefault(); this._move(item, -1); break;
      case 'Home': e.preventDefault(); this._roveTo(this._focusables()[0], true); break;
      case 'End': { e.preventDefault(); const f = this._focusables(); this._roveTo(f[f.length - 1], true); break; }
      case 'ArrowRight': if (item.classList.contains('parent')) { e.preventDefault(); this._toggleSub(item, true); this._roveTo(item, true); } break;
      case 'ArrowLeft': if (item.classList.contains('parent')) { e.preventDefault(); this._toggleSub(item, false); this._roveTo(item, true); } break;
      case 'Enter': case ' ': e.preventDefault(); this._activate(item); item.focus(); break;
    }
  }
  _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return h; }
}

export function defineAhaMenu(tag = 'aha-menu') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaMenu);
  return true;
}
if (typeof window !== 'undefined') defineAhaMenu();

export default { AhaMenu, defineAhaMenu };
