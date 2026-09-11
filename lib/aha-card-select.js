/**
 * @ahaslides-product/design/aha-card-select — single-select as an icon+label card grid.
 *
 *   import '@ahaslides-product/design/aha-card-select';   // registers <aha-card-select>
 *   const el = document.querySelector('aha-card-select');
 *   el.options = [{ value:'bar', label:'Bar', icon:'system-chart-bar' }, …];
 *   el.value = 'bar';
 *
 * The one selection shape Ant has no built-in for (SETTINGS-51): pick one of N options, each shown as
 * its own visual card (icon + label). Reach for it when each option carries a visual — a chart-type
 * picker, a layout/mode picker; 2–4 short text-only options in one row are a segmented control instead
 * (SETTINGS-38), a longer set a dropdown. The whole grid is ONE accessible radiogroup: exactly one card
 * is tabbable (roving tabindex), Arrow keys move-and-select, Space/Enter select. Selection lives on a
 * PERSISTENT node — choosing a card only toggles its [aria-checked]/class, so the border + tint
 * transition fires (never a subtree rebuild on the selection). Icons are summoned by name via
 * <aha-icon>. Shadow-DOM CSS, themed only by --aha-* tokens. Emits composed `change` CustomEvent<{value}>.
 *
 * Two layouts, both driven by `columns` (default 3):
 *  - labelled tiles (default): grid-template-columns: repeat(columns, minmax(0,1fr)) — tiles stretch to fill.
 *  - iconOnly: repeat(columns, 44px) fixed 44px squares packed to the start; the label is hidden but kept
 *    as the card's title + aria-label so the option stays named for the pointer and for AT.
 */
import './icons.js';   // registers <aha-icon> for each card's glyph

const STYLE = `
  :host{ display:block }
  /* labelled (default): tiles stretch to fill each of the columns tracks */
  .grid{ display:grid; grid-template-columns:repeat(var(--cols,3), minmax(0,1fr)); gap:8px }
  /* iconOnly: fixed 44px squares packed to the start (they do not stretch) */
  :host([icon-only]) .grid{ grid-template-columns:repeat(var(--cols,3), 44px); justify-content:start }
  .card{ box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:16px 12px; text-align:center; cursor:pointer;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  /* iconOnly card = a 44px square, icon centred, label hidden (kept as title + aria-label) */
  :host([icon-only]) .card{ width:44px; height:44px; padding:0; gap:0 }
  :host([icon-only]) .card-label{ position:absolute; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0 }
  .card aha-icon{ color:var(--aha-icon-default,#4A4A4A);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .card:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .card[aria-checked="true"]{ border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  .card[aria-checked="true"] aha-icon{ color:var(--aha-color-primary,#6A1EBB) }
  .card:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  :host([disabled]) .card{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([disabled]) .card aha-icon{ color:var(--aha-text-disabled,#B5B5B5) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaCardSelect extends HTMLElement {
  static get observedAttributes() { return ['value', 'disabled', 'columns', 'icon-only', 'options']; }
  get value() { return this.getAttribute('value') || ''; }
  set value(v) { v == null ? this.removeAttribute('value') : this.setAttribute('value', v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get columns() { const c = parseInt(this.getAttribute('columns') || '', 10); return Number.isFinite(c) ? c : 3; }
  set columns(v) { v == null ? this.removeAttribute('columns') : this.setAttribute('columns', String(v)); }
  get iconOnly() { return this.hasAttribute('icon-only'); }
  set iconOnly(v) { v ? this.setAttribute('icon-only', '') : this.removeAttribute('icon-only'); }
  get options() { return this._opts || []; }
  set options(v) { this._opts = Array.isArray(v) ? v : []; this._build(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._build();
  }
  attributeChangedCallback(name, _old, val) {
    if (!this.shadowRoot) return;
    if (name === 'options') { try { this._opts = JSON.parse(val || '[]'); } catch { this._opts = []; } this._build(); }
    else if (name === 'columns' || name === 'icon-only') { this._applyCols(); }   // layout only — no rebuild
    else this._select(this.value, false);   // value/disabled → in-place update, never a rebuild
  }

  _applyCols() {
    const grid = this.shadowRoot && this.shadowRoot.querySelector('.grid');
    // labelled default falls back to the option count (capped at 3); iconOnly defaults to 3 fixed squares.
    const cols = this.hasAttribute('columns') ? this.getAttribute('columns')
      : (this.iconOnly ? '3' : String(Math.min(3, (this._opts || []).length || 1)));
    if (grid) grid.style.setProperty('--cols', cols);
  }

  // Build the grid ONCE per option-set change (data change, not a selection change). A selection only
  // toggles [aria-checked]/tabindex on the persistent card nodes, so the transition fires across it.
  _build() {
    if (!this.shadowRoot) return;
    const opts = this._opts || (() => { try { return JSON.parse(this.getAttribute('options') || '[]'); } catch { return []; } })();
    this._opts = opts;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="grid" role="radiogroup" part="grid"></div>`;
    const grid = this.shadowRoot.querySelector('.grid');
    for (const o of opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.setAttribute('part', 'card');
      b.setAttribute('role', 'radio');
      b.dataset.value = o.value;
      b.innerHTML = (o.icon ? `<aha-icon name="${o.icon}" size="24" aria-hidden="true"></aha-icon>` : '') +
        `<span class="card-label"></span>`;
      const label = o.label ?? o.value;
      b.querySelector('.card-label').textContent = label;
      // keep the label reachable even when visually hidden (iconOnly): name the card for pointer + AT
      b.title = label;
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => { if (!this.disabled) this._choose(o.value); });
      b.addEventListener('keydown', (e) => this._onKeydown(e, o.value));
      grid.appendChild(b);
    }
    this._applyCols();
    this._select(this.value, false);
  }

  _cards() { return this.shadowRoot ? [...this.shadowRoot.querySelectorAll('.card')] : []; }

  // Reflect selection + roving tabindex onto the persistent card nodes. No rebuild.
  _select(value, emit) {
    const cards = this._cards();
    const hasSel = cards.some(c => c.dataset.value === value);
    const tabbable = cards.find(c => c.dataset.value === value) || cards[0] || null;
    for (const c of cards) {
      const on = c.dataset.value === value;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.setAttribute('tabindex', c === (hasSel ? tabbable : cards[0]) ? '0' : '-1');
      c.disabled = this.disabled;
    }
    if (emit) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value } }));
  }

  _choose(value) {
    if (value === this.value) return;
    this.setAttribute('value', value);
    this._select(value, true);
  }

  _onKeydown(e, value) {
    if (this.disabled) return;
    const cards = this._cards();
    const i = cards.findIndex(c => c.dataset.value === value);
    let ni = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ni = (i + 1) % cards.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ni = (i - 1 + cards.length) % cards.length;
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._choose(value); return; }
    if (ni >= 0) { e.preventDefault(); const t = cards[ni]; this._choose(t.dataset.value); t.focus(); }
  }
}

export function defineAhaCardSelect(tag = 'aha-card-select') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCardSelect);
  return true;
}
if (typeof window !== 'undefined') defineAhaCardSelect();

export default { AhaCardSelect, defineAhaCardSelect };
