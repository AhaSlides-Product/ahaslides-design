/**
 * @ahaslides-product/design/aha-split-button — Button's split variant: a main action joined to a caret that opens a menu.
 *
 *   import '@ahaslides-product/design/aha-split-button';   // registers <aha-split-button> (+ <aha-button>, <aha-dropdown>, <aha-icon>)
 *   <aha-split-button variant="primary" items='[{"key":"start","label":"Present from start"},{"key":"current","label":"Present from current slide"}]'>Present</aha-split-button>
 *   <aha-split-button variant="secondary" size="md" caret-label="More share options" items='[…]'><aha-icon slot="icon" name="system-share-network" size="16" decorative></aha-icon>Share</aha-split-button>
 *
 * Two real buttons in one shape: the main half is an <aha-button> (label slot, optional slot="icon")
 * and the caret half is an icon-only <aha-button> with the system-caret-down glyph, slotted as the
 * trigger of an <aha-dropdown>, so every per-state value (fill, label, hover, press, focus ring,
 * disabled, heights, radius, spinner) and the whole menu (rows, icons, dividers, danger, locked rows,
 * flyouts, roving keys, top-layer placement) are the shipped ones, not copies.
 * The outer corners keep the size's radius, the inner corners are square, and a 1px divider separates
 * the halves: white at 24% on primary, the default border on secondary, the disabled ink when disabled.
 * Each half hovers, presses and takes keyboard focus on its own.
 *
 * Events: a click on the main half is the native `click` on the element (the caret's click is consumed
 * by the dropdown and never reaches it); choosing a row emits the dropdown's composed `select`
 * (detail { key }), and the menu's `open` / `close` bubble out too.
 * Keyboard: Tab reaches the main half, then the caret; the caret opens the menu on click, Enter, Space
 * and ArrowDown (aria-haspopup="menu", aria-expanded), Escape closes it and returns focus to the caret.
 * `disabled` disables both halves; `loading` shows the spinner on the main half only and blocks its click.
 */
import './aha-button.js';
import './aha-dropdown.js';
import './icons.js';

const VARIANTS = ['primary', 'secondary'];
const SIZES = ['sm', 'md', 'lg'];
const PLACEMENTS = ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'];
const DEFAULT_CARET_LABEL = 'More options';

const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none !important }
  .split{ display:inline-flex; align-items:stretch; max-width:100% }
  .menu, .menu::part(dd){ display:inline-flex }
  .main, .caret{ position:relative }
  .main::part(button){ border-start-end-radius:0; border-end-end-radius:0 }
  .caret::part(button){ border-start-start-radius:0; border-end-start-radius:0 }
  .caret > aha-icon{ transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .menu[open] .caret > aha-icon{ transform:rotate(180deg) }
  @media (prefers-reduced-motion: reduce){ .caret > aha-icon{ transition:none } }
  :host([variant=primary]) .main::part(button){ border-inline-end-color:transparent }
  :host([variant=primary]) .caret::part(button){ border-inline-start-color:color-mix(in srgb, var(--aha-white,#FFFFFF) 24%, transparent) }
  :host([disabled]) .caret::part(button){ border-inline-start-color:var(--aha-button-disabled-text,#B5B5B5) }
  :host([variant=secondary]) .caret{ margin-inline-start:-1px /* ds-lint-allow: spacing (the halves share one 1px border edge) */ }
  :host([variant=secondary]) .main:hover, :host([variant=secondary]) .caret:hover, :host([variant=secondary]) .menu[open] .caret{ z-index:1 }
  .main:focus-within, .caret:focus-within{ z-index:2 }
`;

export class AhaSplitButton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size', 'disabled', 'loading', 'items', 'placement', 'caret-label']; }
  get items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  set items(value) { this.setAttribute('items', typeof value === 'string' ? value : JSON.stringify(value || [])); }
  connectedCallback() {
    if (!VARIANTS.includes(this.getAttribute('variant'))) this.setAttribute('variant', 'secondary');
    if (!SIZES.includes(this.getAttribute('size'))) this.setAttribute('size', 'lg');
    if (!this.shadowRoot) this._build();
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }
  // Built once: every later attribute change patches these persistent nodes, so hover, focus and the caret turn keep animating.
  _build() {
    const root = this.attachShadow({ mode: 'open', delegatesFocus: true });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="split" part="group">
        <aha-button class="main" part="main"><slot name="icon"></slot><slot></slot></aha-button>
        <aha-dropdown class="menu" part="menu">
          <aha-button slot="trigger" class="caret" part="caret" icon-only aria-label="${DEFAULT_CARET_LABEL}"><aha-icon slot="icon" name="system-caret-down" size="16" decorative></aha-icon></aha-button>
        </aha-dropdown>
      </div>`;
    this._main = root.querySelector('.main');
    this._menu = root.querySelector('.menu');
    this._caret = root.querySelector('.caret');
    this._iconSlot = root.querySelector('slot[name=icon]');
    // aha-button sizes its icon slot even when empty, so the slot only joins it while an icon is assigned
    this._iconSlot.addEventListener('slotchange', () => this._syncIcon());
    this._syncIcon();
  }
  _syncIcon() {
    if (this._iconSlot.assignedNodes().length > 0) this._iconSlot.setAttribute('slot', 'icon'); else this._iconSlot.removeAttribute('slot');
  }
  _sync() {
    const variant = VARIANTS.includes(this.getAttribute('variant')) ? this.getAttribute('variant') : 'secondary';
    const size = SIZES.includes(this.getAttribute('size')) ? this.getAttribute('size') : 'lg';
    const disabled = this.hasAttribute('disabled');
    for (const half of [this._main, this._caret]) {
      half.setAttribute('variant', variant);
      half.setAttribute('size', size);
      half.toggleAttribute('disabled', disabled);
    }
    this._main.toggleAttribute('loading', this.hasAttribute('loading'));
    this._caret.setAttribute('aria-label', this.getAttribute('caret-label') || DEFAULT_CARET_LABEL);
    // aha-dropdown rebuilds its panel on every items or placement write, even an unchanged one
    const placement = PLACEMENTS.includes(this.getAttribute('placement')) ? this.getAttribute('placement') : 'bottomRight';
    if (this._menu.getAttribute('placement') !== placement) this._menu.setAttribute('placement', placement);
    const items = this.getAttribute('items') || '[]';
    if (this._menu.getAttribute('items') !== items) this._menu.setAttribute('items', items);
    if (disabled && this._menu.open) this._menu.open = false;
  }
}

export function defineAhaSplitButton(tag = 'aha-split-button') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaSplitButton);
}
if (typeof window !== 'undefined') defineAhaSplitButton();
export default { AhaSplitButton, defineAhaSplitButton };
