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
 * Three layouts, all driven by `columns` (default 3):
 *  - labelled tiles (default): grid-template-columns: repeat(columns, minmax(0,1fr)) — tiles stretch to fill.
 *  - iconOnly: repeat(columns, 44px) fixed 44px squares packed to the start; the label is hidden, kept as the
 *    card's aria-label, and shown as an <aha-tooltip> bubble on mouse hover and keyboard focus (never on a tap or a
 *    pointer focus). The bubble opens above the card and flips below, or aligns to the grid's edge, when the
 *    viewport has no room. No native title in this layout, so the browser never draws a second tooltip.
 *  - tile="preview": tiles stretch like labelled tiles, but an option with `slot: '<name>'` shows the app's own
 *    light-DOM child (`<div slot="<name>">`) in a preview frame in place of any icon (aspect ratio from
 *    --aha-card-select-preview-ratio, default 4 / 3). Selected = a white gap then a 2px brand ring around the tile, never a
 *    fill over the preview. `hide-labels` keeps each label as the aria-label only, for previews that draw the name.
 *
 * An empty or unknown `value` checks no tile; the first tile then holds the tab stop. The host is the radiogroup,
 * so its aria-label names it once.
 */
import './icons.js';   // registers <aha-icon> for each card's glyph
import './aha-tooltip.js';   // the icon-only label bubble
import { upgradeProperties } from './upgrade-properties.js';
import { escapeHtml } from './escape-html.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* labelled (default): tiles stretch to fill each of the columns tracks */
  .grid{ display:grid; grid-template-columns:repeat(var(--cols,3), minmax(0,1fr)); gap:8px }
  /* iconOnly: fixed 44px squares packed to the start (they do not stretch) */
  :host([icon-only]) .grid{ grid-template-columns:repeat(var(--cols,3), 44px); justify-content:start }
  .card{ box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:6px;
    padding:8px; text-align:center; cursor:pointer;
    font-family:inherit; font-size:13px; line-height:20px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .tip{ display:flex; min-width:0 }
  .tip .card{ flex:1 }
  /* an empty-text tooltip (labelled layout) never draws its bubble */
  .tip:not([text])::part(bubble){ display:none }
  /* iconOnly card = a 44px square, icon centred, label hidden (kept as aria-label + tooltip) */
  :host([icon-only]) .card{ width:44px; height:44px; padding:0; gap:0 }
  :host([icon-only]) .card-label{ position:absolute; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0 }
  .preview{ display:block; width:100%; aspect-ratio:var(--aha-card-select-preview-ratio,4 / 3); overflow:hidden }
  ::slotted(*){ display:block; width:100%; height:100% }
  :host([tile="preview"]:not([icon-only])) .card-label{ padding:var(--aha-space-6,6px) var(--aha-space-8,8px) }
  :host([tile="preview"][hide-labels]:not([hide-labels="false"]):not([icon-only])) .card-label{ position:absolute;
    width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0 }
  .card aha-icon{ color:var(--aha-icon-default,#4A4A4A);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  /* hover + selected follow the checkable Tag at size large */
  .card:hover{ border-color:var(--aha-border-hover,#E70E68) }
  .card[aria-checked="true"]{ border-color:var(--aha-color-primary,#E70E68); background:var(--aha-bg-accent,#E70E680D); color:var(--aha-text-link-hover,#DB005B) }
  .card[aria-checked="true"] aha-icon{ color:var(--aha-color-primary,#E70E68) }
  :host([tile="preview"]:not([icon-only])) .card{ padding:0; gap:0; overflow:hidden; align-items:stretch; transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([tile="preview"]:not([icon-only])) .card[aria-checked="true"]{ background:var(--aha-bg-container,#FFFFFF);
    border-color:var(--aha-bg-container,#FFFFFF); box-shadow:0 0 0 2px var(--aha-color-primary,#E70E68) }
  .card:focus-visible{ outline:2px solid var(--aha-color-primary,#E70E68); outline-offset:2px }
  /* a 2px gap between the selected ring and the focus ring, so the two never merge into one band */
  :host([tile="preview"]:not([icon-only])) .card:focus-visible{ outline-offset:4px }
  :host([disabled]) .card{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([disabled]) .card aha-icon{ color:var(--aha-text-disabled,#B5B5B5) }
  :host([disabled]) .preview{ opacity:.5 }
  :host([disabled]) ::slotted(*){ pointer-events:none }
  :host([disabled][tile="preview"]:not([icon-only])) .card[aria-checked="true"]{ background:var(--aha-bg-container-disabled,#F1F1F1);
    border-color:var(--aha-bg-container-disabled,#F1F1F1); box-shadow:0 0 0 2px var(--aha-text-disabled,#B5B5B5) }
  /* forced colours drop box-shadow, so the selected preview ring becomes an outline */
  @media (forced-colors: active){
    :host([tile="preview"]:not([icon-only])) .card[aria-checked="true"]{ outline:2px solid Highlight; outline-offset:0 }
    :host([tile="preview"]:not([icon-only])) .card[aria-checked="true"]:focus-visible{ outline-offset:4px }
  }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaCardSelect extends HTMLElement {
  static get observedAttributes() { return ['value', 'disabled', 'columns', 'icon-only', 'options', 'tile', 'hide-labels']; }

  constructor() {
    super();
    // The host is the radiogroup, so the author's aria-label names it once (a grid role inside would name it twice).
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    if (internals && 'role' in internals) internals.role = 'radiogroup';
    else this._roleFallback = true;
  }
  get value() { return this.getAttribute('value') || ''; }
  set value(v) { v == null ? this.removeAttribute('value') : this.setAttribute('value', v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get columns() { const c = parseInt(this.getAttribute('columns') || '', 10); return Number.isFinite(c) ? c : 3; }
  set columns(v) { v == null ? this.removeAttribute('columns') : this.setAttribute('columns', String(v)); }
  get iconOnly() { return this.hasAttribute('icon-only'); }
  set iconOnly(v) { v ? this.setAttribute('icon-only', '') : this.removeAttribute('icon-only'); }
  get tile() { return this.getAttribute('tile') === 'preview' ? 'preview' : 'default'; }
  set tile(v) { v === 'preview' ? this.setAttribute('tile', 'preview') : this.removeAttribute('tile'); }
  get hideLabels() { return this.hasAttribute('hide-labels') && this.getAttribute('hide-labels') !== 'false'; }
  set hideLabels(v) { v && v !== 'false' ? this.setAttribute('hide-labels', '') : this.removeAttribute('hide-labels'); }
  get options() { return this._opts || []; }
  set options(v) {
    const next = Array.isArray(v) ? v : [];
    // a framework re-render hands over an equal new array; a rebuild there would drop focus and snap the transition
    if (this.shadowRoot && JSON.stringify(next) === this._builtKey) { this._opts = next; return; }
    this._opts = next; this._build();
  }

  connectedCallback() {
    upgradeProperties(this, ['value', 'disabled', 'columns', 'iconOnly', 'options', 'tile', 'hideLabels']);
    if (this._roleFallback && !this.hasAttribute('role')) this.setAttribute('role', 'radiogroup');
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
    this._applyLabels();
  }

  _applyLabels() {
    for (const card of this._cards()) {
      const tip = card.parentElement;
      if (this.iconOnly) { tip.setAttribute('text', card.dataset.label); card.removeAttribute('title'); }
      else { tip.removeAttribute('text'); card.title = card.dataset.label; }
    }
  }

  // The bubble opens above the card; flip below when the card is near the top of the viewport and
  // align to the grid edge when it is near a side, so it never clips.
  _placeTip(tip) {
    if (!this.iconOnly) return;
    const rect = tip.getBoundingClientRect();
    const side = rect.top < 48 && window.innerHeight - rect.bottom > rect.top ? 'bottom' : 'top';
    const edge = rect.left < 60 ? '-start' : window.innerWidth - rect.right < 60 ? '-end' : '';
    tip.setAttribute('placement', side + edge);
  }

  // Build the grid ONCE per option-set change (data change, not a selection change). A selection only
  // toggles [aria-checked]/tabindex on the persistent card nodes, so the transition fires across it.
  _build() {
    if (!this.shadowRoot) return;
    const opts = this._opts || (() => { try { return JSON.parse(this.getAttribute('options') || '[]'); } catch { return []; } })();
    this._opts = opts;
    this._builtKey = JSON.stringify(opts);
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="grid" part="grid"></div>`;
    const grid = this.shadowRoot.querySelector('.grid');
    for (const o of opts) {
      const tip = document.createElement('aha-tooltip');
      tip.className = 'tip';
      tip.setAttribute('placement', 'top');
      tip.addEventListener('pointerenter', () => this._placeTip(tip));
      tip.addEventListener('focusin', () => this._placeTip(tip));
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.setAttribute('part', 'card');
      b.setAttribute('role', 'radio');
      b.dataset.value = o.value;
      b.innerHTML = (o.slot ? '<span class="preview" part="preview" aria-hidden="true"><slot></slot></span>'
        : o.icon ? `<aha-icon name="${escapeHtml(o.icon)}" size="24" aria-hidden="true"></aha-icon>` : '') +
        `<span class="card-label"></span>`;
      if (o.slot) b.querySelector('slot').name = String(o.slot);
      const label = o.label ?? o.value;
      b.querySelector('.card-label').textContent = label;
      b.dataset.label = label;
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => { if (!this.disabled) this._choose(o.value); });
      b.addEventListener('keydown', (e) => this._onKeydown(e, o.value));
      tip.appendChild(b);
      grid.appendChild(tip);
    }
    this._applyCols();
    this._select(this.value, false);
  }

  _cards() { return this.shadowRoot ? [...this.shadowRoot.querySelectorAll('.card')] : []; }

  // Reflect selection + roving tabindex onto the persistent card nodes. No rebuild.
  _select(value, emit) {
    const cards = this._cards();
    const tabbable = cards.find(c => c.dataset.value === value) || cards[0] || null;
    for (const c of cards) {
      const on = c.dataset.value === value;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.setAttribute('tabindex', c === tabbable ? '0' : '-1');
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
