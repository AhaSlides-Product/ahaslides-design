/**
 * @ahaslides-product/design/aha-dropdown — the shared Dropdown primitive.
 *
 *   import '@ahaslides-product/design/aha-dropdown';   // registers <aha-dropdown> (+ <aha-icon>)
 *   <aha-dropdown label="Actions" items='[{"key":"rename","label":"Rename","icon":"system-pencil-simple"},{"type":"divider"},{"key":"delete","label":"Delete","icon":"system-trash","danger":true}]'></aha-dropdown>
 *
 * A trigger button that reveals a floating overlay of actions. The overlay is a Menu of the DS V3
 * item family, NOT a flat list: rows carry leading icons, a divider rules them off, an item can be
 * disabled or a red `danger` action, and a `{type:"group"}` splits sections. `items` is a list of:
 *   { key, label, icon?, disabled?, danger? }         a leaf action row
 *   { type:"divider" }                                a separator line
 *   { type:"group", label, children:[…] }             a titled section
 *
 * `placement` positions the overlay (bottomLeft default · bottomRight · topLeft · topRight) and
 * `trigger` is click (default) or hover. Open/close animates via the shared motion tokens on a
 * PERSISTENT panel (a class toggles — the subtree is never rebuilt on open), and the caret rotates.
 * It closes on outside-click, Escape (focus returns to the trigger), or Tab. The trigger caret and
 * every leading glyph are summoned by name from the DS icon library via <aha-icon> — never inline.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Emits a composed `select` event (detail { key }). WAI-ARIA menu button with roving arrow nav.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
import './icons.js';   // registers <aha-icon> so the trigger caret + leading glyphs resolve from the DS library

const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px }
  .dd{ position:relative; display:inline-block }
  .trigger{ display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 14px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-text-default,#1A1A1A); font:inherit; font-weight:600; cursor:pointer;
    transition:border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .trigger:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .trigger:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
  .caret{ display:inline-flex; color:var(--aha-icon-muted,#8A8A8A);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .dd.open .caret{ transform:rotate(180deg) }

  .panel{ position:absolute; min-width:200px; z-index:20;
    display:flex; flex-direction:column; gap:2px; padding:6px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-elevated,#FFFFFF); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .dd.open .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  /* placement — the persistent panel keeps its transition; only the anchor edges change */
  .dd.bottomLeft .panel{ top:calc(100% + 6px); left:0; transform-origin:top left }
  .dd.bottomRight .panel{ top:calc(100% + 6px); right:0; transform-origin:top right }
  .dd.topLeft .panel{ bottom:calc(100% + 6px); left:0; transform-origin:bottom left; transform:translateY(4px) }
  .dd.topRight .panel{ bottom:calc(100% + 6px); right:0; transform-origin:bottom right; transform:translateY(4px) }
  .dd.topLeft.open .panel, .dd.topRight.open .panel{ transform:translateY(0) }

  .item{ display:flex; align-items:center; gap:10px; height:36px; padding:0 12px; border:0; text-align:left; width:100%;
    box-sizing:border-box; border-radius:var(--aha-radius-default,8px); background:transparent; color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .item:not([disabled]):not(.danger):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .item:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }
  .item[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
  .item.danger{ color:var(--aha-color-error,#F5222D) }
  .item.danger:not([disabled]):hover{ background:color-mix(in srgb, var(--aha-color-error,#F5222D) 8%, transparent) }

  .label{ flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .group-title{ padding:8px 12px 4px; font-size:11px; font-weight:600; letter-spacing:.4px; text-transform:uppercase;
    color:var(--aha-text-tertiary,#8A8A8A) }
  .divider{ height:1px; margin:4px 8px; background:var(--aha-split,#F1F1F1); border:0 }
`;

export class AhaDropdown extends HTMLElement {
  static get observedAttributes() { return ['label', 'items', 'placement', 'trigger']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._onDocClick = (e) => { if (!this.contains(e.target)) this._setOpen(false); };
    this.addEventListener('keydown', (e) => this._onKey(e));
    document.addEventListener('click', this._onDocClick);
    this._render();
  }
  disconnectedCallback() { document.removeEventListener('click', this._onDocClick); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _placement() { const p = this.getAttribute('placement'); return ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'].includes(p) ? p : 'bottomLeft'; }
  _isOpen() { const dd = this.shadowRoot.querySelector('.dd'); return !!(dd && dd.classList.contains('open')); }
  _enabled() { return [...this.shadowRoot.querySelectorAll('.item:not([disabled])')]; }
  _setOpen(open, focusItem) {
    const dd = this.shadowRoot.querySelector('.dd');
    if (!dd) return;
    dd.classList.toggle('open', open);
    const t = this.shadowRoot.querySelector('.trigger');
    if (t) t.setAttribute('aria-expanded', String(open));
    if (open && focusItem) this._roveTo(this._enabled()[0], true);
  }
  _roveTo(target, focus) {
    if (!target) return;
    this.shadowRoot.querySelectorAll('.item').forEach((b) => { b.tabIndex = b === target ? 0 : -1; });
    if (focus) target.focus();
  }
  _move(from, delta) {
    const enabled = this._enabled();
    if (!enabled.length) return;
    const i = enabled.indexOf(from);
    this._roveTo(enabled[(i + delta + enabled.length) % enabled.length], true);
  }
  _onKey(e) {
    const item = e.target.closest && e.target.closest('.item');
    const onTrigger = !!(e.target.closest && e.target.closest('.trigger'));
    if (e.key === 'Escape') {
      if (this._isOpen()) { e.preventDefault(); this._setOpen(false); this.shadowRoot.querySelector('.trigger').focus(); }
      return;
    }
    if (e.key === 'Tab') { if (this._isOpen()) this._setOpen(false); return; }
    if (onTrigger && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); this._setOpen(true, true); return;
    }
    if (!item) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._move(item, 1); break;
      case 'ArrowUp': e.preventDefault(); this._move(item, -1); break;
      case 'Home': e.preventDefault(); this._roveTo(this._enabled()[0], true); break;
      case 'End': { e.preventDefault(); const en = this._enabled(); this._roveTo(en[en.length - 1], true); break; }
      case 'Enter': case ' ': e.preventDefault(); this._activate(item); break;
    }
  }
  _activate(b) {
    if (b.hasAttribute('disabled')) return;
    this._setOpen(false);
    this.shadowRoot.querySelector('.trigger').focus();
    this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { key: b.getAttribute('data-key') } }));
  }
  _rowHtml(it) {
    if (it && it.type === 'divider') return `<div class="divider" role="separator"></div>`;
    if (it && it.type === 'group') {
      const gid = 'g' + Math.abs(this._hash(it.label || '')).toString(36);
      const kids = (it.children || []).map((k) => this._rowHtml(k)).join('');
      return `<div role="group" aria-labelledby="${gid}"><div class="group-title" id="${gid}">${esc(it.label || '')}</div>${kids}</div>`;
    }
    const icon = it.icon ? `<aha-icon name="${esc(it.icon)}" size="16" aria-hidden="true"></aha-icon>` : '';
    return `<button class="item${it.danger ? ' danger' : ''}" part="item" role="menuitem" tabindex="-1" data-key="${esc(it.key)}"${it.disabled ? ' disabled' : ''}>` +
      `${icon}<span class="label">${esc(it.label)}</span></button>`;
  }
  _render() {
    const rows = this._items().map((it) => this._rowHtml(it)).join('');
    const place = this._placement();
    const hover = this.getAttribute('trigger') === 'hover';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="dd ${place}" part="dd">
        <button class="trigger" part="trigger" aria-haspopup="menu" aria-controls="aha-dd-panel" aria-expanded="false">
          <span>${esc(this.getAttribute('label') || 'Menu')}</span>
          <span class="caret" part="caret"><aha-icon name="system-caret-down" size="16" decorative></aha-icon></span>
        </button>
        <div class="panel" part="panel" id="aha-dd-panel" role="menu">${rows}</div>
      </div>`;
    const dd = this.shadowRoot.querySelector('.dd');
    this.shadowRoot.querySelector('.trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      this._setOpen(!this._isOpen());
    });
    if (hover) {
      dd.addEventListener('mouseenter', () => this._setOpen(true));
      dd.addEventListener('mouseleave', () => this._setOpen(false));
    }
    this.shadowRoot.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => this._activate(b)));
  }
  _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return h; }
}

export function defineAhaDropdown(tag = 'aha-dropdown') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDropdown);
  return true;
}
if (typeof window !== 'undefined') defineAhaDropdown();

export default { AhaDropdown, defineAhaDropdown };
