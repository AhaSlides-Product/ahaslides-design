/**
 * @ahaslides-product/design/aha-dropdown — the shared Dropdown primitive.
 *
 *   import '@ahaslides-product/design/aha-dropdown';   // registers <aha-dropdown> (+ <aha-icon>)
 *   <aha-dropdown label="Actions" items='[{"key":"rename","label":"Rename"},{"key":"delete","label":"Delete"}]'></aha-dropdown>
 *
 * A trigger button that reveals a floating list of actions. Open/close animates via the
 * shared motion tokens on a PERSISTENT panel (a class toggles — the subtree is never rebuilt
 * on open), the caret rotates, and it closes on outside-click or Escape. The trigger caret
 * is the DS glyph via <aha-icon>. ONE element, shadow-DOM CSS, themed only by --aha-* tokens
 * → byte-identical in React and Vue. Emits a composed `select` event.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
import './icons.js';   // registers <aha-icon> so the trigger caret glyph resolves from the DS library

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
  .panel{ position:absolute; top:calc(100% + 6px); left:0; min-width:200px; z-index:20;
    display:flex; flex-direction:column; gap:2px; padding:6px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-elevated,#FFFFFF); box-shadow:0 6px 20px rgba(0,0,0,.10);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .dd.open .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  .item{ display:flex; align-items:center; height:36px; padding:0 12px; border:0; text-align:left; width:100%;
    border-radius:var(--aha-radius-default,8px); background:transparent; color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .item:not([disabled]):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .item[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
`;

export class AhaDropdown extends HTMLElement {
  static get observedAttributes() { return ['label', 'items']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._onDocClick = (e) => { if (!this.contains(e.target)) this._setOpen(false); };
    this._onKey = (e) => { if (e.key === 'Escape') this._setOpen(false); };
    document.addEventListener('click', this._onDocClick);
    this.addEventListener('keydown', this._onKey);
    this._render();
  }
  disconnectedCallback() { document.removeEventListener('click', this._onDocClick); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _setOpen(open) {
    const dd = this.shadowRoot.querySelector('.dd');
    if (!dd) return;
    dd.classList.toggle('open', open);
    const t = this.shadowRoot.querySelector('.trigger');
    if (t) t.setAttribute('aria-expanded', String(open));
  }
  _render() {
    const rows = this._items().map((it) =>
      `<button class="item" part="item" role="menuitem" data-key="${esc(it.key)}"${it.disabled ? ' disabled' : ''}>${esc(it.label)}</button>`
    ).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="dd" part="dd">
        <button class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false">
          <span>${esc(this.getAttribute('label') || 'Menu')}</span>
          <span class="caret" part="caret"><aha-icon name="system-caret-down" size="16" decorative></aha-icon></span>
        </button>
        <div class="panel" part="panel" role="menu">${rows}</div>
      </div>`;
    this.shadowRoot.querySelector('.trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      this._setOpen(!this.shadowRoot.querySelector('.dd').classList.contains('open'));
    });
    this.shadowRoot.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => {
      if (b.hasAttribute('disabled')) return;
      this._setOpen(false);
      this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { key: b.getAttribute('data-key') } }));
    }));
  }
}

export function defineAhaDropdown(tag = 'aha-dropdown') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDropdown);
  return true;
}
if (typeof window !== 'undefined') defineAhaDropdown();

export default { AhaDropdown, defineAhaDropdown };
