/**
 * @ahaslides-product/design/aha-menu — the shared Menu primitive.
 *
 *   import '@ahaslides-product/design/aha-menu';   // registers <aha-menu>
 *   <aha-menu value="poll" items='[{"key":"poll","label":"Poll"},{"key":"quiz","label":"Quiz"}]'></aha-menu>
 *
 * A vertical list of selectable options — a side nav, a settings list, an overflow menu.
 * Feed it an `items` JSON array and a `value` (the selected key). The selected row is
 * brand-tinted; hover and selection animate via the shared motion tokens on PERSISTENT
 * nodes (selection toggles a class, it never rebuilds the row). ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Emits a composed `select`.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px }
  .menu{ display:flex; flex-direction:column; gap:2px; padding:6px; min-width:200px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF) }
  .item{ display:flex; align-items:center; height:36px; padding:0 12px; border:0; text-align:left; width:100%;
    border-radius:var(--aha-radius-default,8px); background:transparent; color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .item:not(.selected):not([disabled]):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .item:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }
  .item.selected{ background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  .item[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
`;

export class AhaMenu extends HTMLElement {
  static get observedAttributes() { return ['items', 'value']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'items') this._render(); else this._select(this.getAttribute('value'), false);
  }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _enabled() { return [...this.shadowRoot.querySelectorAll('.item:not([disabled])')]; }
  _select(key, emit) {
    this.shadowRoot.querySelectorAll('.item').forEach((b) => {
      const on = b.getAttribute('data-key') === key;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    this._roveTo(this.shadowRoot.querySelector('.item.selected'));
    if (emit) this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { key } }));
  }
  _roveTo(target, focus) {
    const enabled = this._enabled();
    if (!enabled.length) return;
    const to = (target && !target.hasAttribute('disabled')) ? target : enabled[0];
    this.shadowRoot.querySelectorAll('.item').forEach((b) => { b.tabIndex = b === to ? 0 : -1; });
    if (focus) to.focus();
  }
  _move(from, delta) {
    const enabled = this._enabled();
    if (!enabled.length) return;
    const i = enabled.indexOf(from);
    const next = enabled[(i + delta + enabled.length) % enabled.length];
    this._roveTo(next, true);
  }
  _onKey(e) {
    const item = e.target.closest && e.target.closest('.item');
    if (!item) return;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': e.preventDefault(); this._move(item, 1); break;
      case 'ArrowUp': case 'ArrowLeft': e.preventDefault(); this._move(item, -1); break;
      case 'Home': e.preventDefault(); this._roveTo(this._enabled()[0], true); break;
      case 'End': { e.preventDefault(); const en = this._enabled(); this._roveTo(en[en.length - 1], true); break; }
      case 'Enter': case ' ': e.preventDefault(); this._select(item.getAttribute('data-key'), true); item.focus(); break;
    }
  }
  _render() {
    const value = this.getAttribute('value');
    const rows = this._items().map((it) =>
      `<button class="item${it.key === value ? ' selected' : ''}" part="item" role="menuitemradio" aria-checked="${it.key === value}" tabindex="-1" data-key="${esc(it.key)}"${it.disabled ? ' disabled' : ''}>${esc(it.label)}</button>`
    ).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="menu" part="menu" role="menu">${rows}</div>`;
    this.shadowRoot.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => {
      if (b.hasAttribute('disabled')) return;
      this._select(b.getAttribute('data-key'), true);
    }));
    this.shadowRoot.querySelector('.menu').addEventListener('keydown', (e) => this._onKey(e));
    this._roveTo(this.shadowRoot.querySelector('.item.selected'));
  }
}

export function defineAhaMenu(tag = 'aha-menu') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaMenu);
  return true;
}
if (typeof window !== 'undefined') defineAhaMenu();

export default { AhaMenu, defineAhaMenu };
