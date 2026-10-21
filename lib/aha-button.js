/**
 * @ahaslides-product/design/aha-button — the shared Button primitive.
 *
 *   import '@ahaslides-product/design/aha-button';   // registers <aha-button>
 *   <aha-button variant="primary" size="md">Save</aha-button>
 *   <aha-button icon-only variant="secondary" aria-label="More">…icon…</aha-button>
 *   <aha-button variant="tertiary" icon-only size="xs" corner aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>   // the dismiss ✕: 20px, pinned to the first line of its container
 *   <aha-button variant="primary" size="xl">Reveal</aha-button>   // 52px, the twin of React <XLButtonScope>; in-canvas presenter controls are lg with applyCanvasDeck (lib/canvas-deck.js)
 *   <aha-button variant="primary" size="touch" block>Submit</aha-button>   // 48px, 8px corners: the audience phone's primary action
 *   <aha-button variant="secondary-deck" size="touch" block>Upload</aha-button>   // white fill, a 10% dark-ink edge and a solid dark-ink label on every deck: the audience phone's secondary action
 *   <aha-button variant="tertiary-deck" size="touch">Skip</aha-button>   // no fill or edge, label in the deck ink, ink 5% on hover and 10% pressed: the audience phone's low-emphasis action
 *   <aha-button variant="tertiary-deck" size="touch" icon-only aria-label="Remove">…icon…</aha-button>   // 48 x 48, needs a name
 *   <aha-button variant="tertiary-deck" size="md" icon-only aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>   // the audience close ✕: 36 x 36 drawn, a 44 x 44 hit area; add `sheet` on a white modal or sheet for the muted grey glyph
 *   <aha-button variant="primary" shortcut="Mod+Enter">Save</aha-button>   // the key drawn as a chip after the label (display only; lib/shortcut-key.js)
 *   <aha-button variant="primary" size="lg" href="/signup">Sign up</aha-button>   // a link with the Button's look: navigation calls to action never hand-roll an <a class="…__button">
 *   <form><input type="email" required><aha-button variant="primary" type="submit">Join</aha-button></form>   // submits the closest form through requestSubmit()
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → identical in React and Vue,
 * and outside any app. Zero dependencies (no Lit). Built to the DS V3 Button spec
 * (Figma node 56611-11049), recoloured by the 2026-10-07 colour rules: primary #E70E68 / hover #DB005B / label #FFFFFF, pale-pink
 * secondary & tertiary hover/active with a Vivid Pink label, subtle elevation, icon 16px. Status carries no hue: danger renders exactly as secondary
 * (the name is kept so callers keep working) and positive (Upgrade, encourage) is Vivid Pink like primary.
 * Keyboard focus draws a 2px solid ring outside a 2px gap in Vivid Pink.
 *
 * Colours bind to the NAMED button semantic-token layer (--aha-button-*), a definition-layer
 * indirection over the core tokens (e.g. --aha-button-primary-bg: var(--aha-color-primary)), so
 * button theming can move independently of the core palette. Each var() keeps the same effective
 * fallback → the render is byte-identical to the raw --aha-btn-* seeds.
 */
import { SHORTCUT_CHIP_STYLE, fillShortcutChip } from './shortcut-key.js';

const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([block]){ display:block }
  :host([hidden]){ display:none !important }
  :is(button,a){
    font-family:inherit; font-weight:600; font-size:14px; line-height:1; text-decoration:none;
    display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;
    height:36px; padding:0 16px; border:1px solid transparent; border-radius:var(--aha-radius-default,8px);
    background:var(--aha-button-default-bg,#FFFFFF); color:var(--aha-button-default-text,#1A1A1A); border-color:var(--aha-button-default-border,#E3E3E3);
    cursor:pointer; white-space:nowrap; user-select:none; transition-property:background,border-color,box-shadow,color,text-decoration-color; transition-duration:var(--aha-motion-mid,.2s); transition-timing-function:var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  ::slotted([slot=icon]){ display:inline-flex; line-height:0; width:16px; height:16px }
  .spin{ flex:none; width:16px; height:16px; animation:aha-spin .7s linear infinite }
  @keyframes aha-spin{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ :is(button,a){ transition:none } }
  :host([size=xs]) :is(button,a){ height:20px; padding:0; border-radius:var(--aha-radius-sm,6px); font-size:14px }
  :host([size=sm]) :is(button,a){ height:28px; padding:0 8px; border-radius:var(--aha-radius-xs,4px); font-size:14px }
  :host([size=md]) :is(button,a){ height:36px; padding:0 16px; border-radius:var(--aha-radius-default,8px); font-size:14px }
  :host([size=lg]) :is(button,a){ height:40px; padding:0 20px; border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([size=xl]) :is(button,a){ height:52px; padding:0 var(--aha-space-28,28px); border-radius:var(--aha-radius-lg,12px); font-size:16px }
  :host([size=touch]) :is(button,a){ height:48px; padding:0 var(--aha-space-24,24px); border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([icon-only]) :is(button,a){ padding:0; gap:0; width:36px }
  :host([icon-only][size=xs]) :is(button,a){ width:20px }
  :host([icon-only][size=xs]) ::slotted(aha-icon){ display:inline-flex; line-height:0 }
  :host([icon-only][size=xs][corner]){ flex:0 0 auto; align-self:flex-start; display:inline-flex; line-height:0;
    margin-block:calc((var(--aha-close-line-height, 21px) - var(--aha-space-20, 20px)) / 2 - 2.5px) 0; /* ds-lint-allow: spacing (2.5px: the ✕ centre sits above the first line centre, off the space scale) */
    margin-inline-start:auto;
    margin-inline-end:calc(var(--aha-close-inset, calc(var(--aha-close-container-padding, var(--aha-space-2, 2px)) - var(--aha-space-2, 2px))) - var(--aha-close-container-padding, var(--aha-space-2, 2px))) }
  :host([icon-only][size=sm]) :is(button,a){ width:28px } :host([icon-only][size=md]) :is(button,a){ width:36px }
  :host([icon-only][size=lg]) :is(button,a){ width:40px }
  :host([icon-only][size=xl]) :is(button,a){ width:52px }
  :host([icon-only][size=touch]) :is(button,a){ width:48px }
  :host([variant=primary]) :is(button,a){ background:var(--aha-button-primary-bg,#E70E68); border-color:var(--aha-button-primary-border,var(--aha-button-primary-bg,#E70E68)); color:var(--aha-button-primary-text,#FFFFFF); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary]:not([disabled])) :is(button,a):hover{ background:var(--aha-button-primary-bg-hover,#DB005B); border-color:var(--aha-button-primary-border,var(--aha-button-primary-bg-hover,#DB005B)); box-shadow:var(--aha-button-elevate-primary-hover,0 4px 12px rgba(231,14,104,.32)) }
  :host([variant=primary]:not([disabled])) :is(button,a):active{ background:var(--aha-button-primary-bg-press,#DB005B); border-color:var(--aha-button-primary-border,var(--aha-button-primary-bg-press,#DB005B)); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=secondary]) :is(button,a), :host([variant=danger]) :is(button,a){ box-shadow:var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)) }
  :host([variant=secondary]:not([disabled])) :is(button,a):hover, :host([variant=danger]:not([disabled])) :is(button,a):hover{ background:var(--aha-button-default-bg,#FFFFFF); box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D), var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)); border-color:var(--aha-button-default-border-hover,#E70E68); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  :host([variant=secondary]:not([disabled])) :is(button,a):active, :host([variant=danger]:not([disabled])) :is(button,a):active{ background:var(--aha-button-default-bg,#FFFFFF); box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D), var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)); border-color:var(--aha-button-default-border-press,#DB005B); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  :host([variant=secondary-deck]) :is(button,a){ background:var(--aha-white,#fff); border-color:color-mix(in srgb, var(--aha-text-default,#1A1A1A) 10%, transparent); color:var(--aha-text-default,#1A1A1A); box-shadow:var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)) }
  :host([variant=secondary-deck]) :is(button,a):not(:disabled):hover{ background:color-mix(in srgb, var(--aha-text-default,#1A1A1A) 5%, var(--aha-white,#fff)) }
  :host([variant=secondary-deck]) :is(button,a):not(:disabled):active{ background:color-mix(in srgb, var(--aha-text-default,#1A1A1A) 10%, var(--aha-white,#fff)) }
  :host([variant=tertiary-deck]) :is(button,a){ background:transparent; border-color:transparent; color:var(--aha-deck-ink,var(--aha-text-default,#1A1A1A)) }
  :host([variant=tertiary-deck]) :is(button,a):not(:disabled):hover{ background:color-mix(in srgb, var(--aha-deck-ink,var(--aha-text-default,#1A1A1A)) 5%, transparent) }
  :host([variant=tertiary-deck]) :is(button,a):not(:disabled):active{ background:color-mix(in srgb, var(--aha-deck-ink,var(--aha-text-default,#1A1A1A)) 10%, transparent) }
  :host([variant=tertiary-deck][icon-only][size=md]) :is(button,a){ position:relative }
  :host([variant=tertiary-deck][icon-only][size=md]) :is(button,a)::before{ content:""; position:absolute; inset:-5px } /* 1px border + 5px = 44px hit box around the 36px square */
  :host([variant=tertiary-deck][icon-only][size=md][sheet]) :is(button,a){ color:var(--aha-icon-muted,#8A8A8A) }
  :host([variant=tertiary-deck][icon-only][size=md][sheet]:not([disabled])) :is(button,a):hover, :host([variant=tertiary-deck][icon-only][size=md][sheet]:not([disabled])) :is(button,a):active{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  :host([variant=tertiary]) :is(button,a){ background:transparent; border-color:transparent; color:var(--aha-text-default,#1A1A1A) }
  :host([variant=tertiary]:not([disabled])) :is(button,a):hover{ background:var(--aha-button-ghost-bg-hover,#E70E680D); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  :host([variant=tertiary]:not([disabled])) :is(button,a):active{ background:var(--aha-button-ghost-bg-press,#E70E680D); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  :host([variant=tertiary][icon-only][size=xs]) :is(button,a){ color:var(--aha-icon-muted,#8A8A8A) }
  :host([variant=tertiary][icon-only][size=xs]:not([disabled])) :is(button,a):hover, :host([variant=tertiary][icon-only][size=xs]:not([disabled])) :is(button,a):active{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  :host([variant=link]) :is(button,a){ background:transparent; border-color:transparent; color:var(--aha-text-link,#E70E68); font-weight:400; padding:0 4px; text-decoration:underline }
  :host([variant=link]:not([disabled])) :is(button,a):hover{ color:var(--aha-text-link-hover,#DB005B); text-decoration:underline }
  :host([variant=positive]) :is(button,a){ background:var(--aha-button-positive-bg,#E70E68); border-color:var(--aha-button-positive-bg,#E70E68); color:var(--aha-button-positive-text,#FFFFFF); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=positive]:not([disabled])) :is(button,a):hover{ background:var(--aha-button-positive-bg-hover,#DB005B); border-color:var(--aha-button-positive-bg-hover,#DB005B); box-shadow:var(--aha-button-elevate-primary-hover,0 4px 12px rgba(231,14,104,.32)) }
  :host([variant=positive]:not([disabled])) :is(button,a):active{ background:var(--aha-button-positive-bg-press,#DB005B); border-color:var(--aha-button-positive-bg-press,#DB005B); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary-alt]) :is(button,a){ background:var(--aha-button-primary-bg,#E70E68); border-color:var(--aha-button-primary-bg,#E70E68); color:var(--aha-button-primary-text,#FFFFFF) }
  :host([variant=primary-alt]:not([disabled])) :is(button,a):hover{ background:var(--aha-button-primary-bg-hover,#DB005B); border-color:var(--aha-button-primary-bg-hover,#DB005B) }
  :host([variant=primary-alt]:not([disabled])) :is(button,a):active{ background:var(--aha-button-primary-bg-press,#DB005B); border-color:var(--aha-button-primary-bg-press,#DB005B) }
  :host([variant=text]) :is(button,a){ background:var(--aha-button-default-bg,#FFFFFF); border-color:transparent; color:var(--aha-text-secondary,#4A4A4A); font-weight:400 }
  :host([variant=text]:not([disabled])) :is(button,a):hover{ background:var(--aha-gray-40,#E3E3E3) }
  :host([variant=text]:not([disabled])) :is(button,a):active{ background:var(--aha-gray-50,#D4D4D4) }
  :host([variant=text-link]) :is(button,a){ background:var(--aha-button-default-bg,#FFFFFF); border-color:transparent; color:var(--aha-text-link,#E70E68); font-weight:400; text-decoration:var(--aha-text-link-decoration,none) }
  :host([variant=text-link]:not([disabled])) :is(button,a):hover, :host([variant=text-link]:not([disabled])) :is(button,a):focus-visible{ color:var(--aha-text-link-hover,#DB005B); text-decoration:underline }
  :host([variant=text-link]:not([disabled])) :is(button,a):active{ color:var(--aha-color-primary-active,#DB005B); text-decoration:underline }
  :host([disabled]) :is(button,a){ cursor:not-allowed; background:var(--aha-button-disabled-bg,#E3E3E3); border-color:var(--aha-button-disabled-bg,#E3E3E3); color:var(--aha-button-disabled-text,#B5B5B5); box-shadow:none }
  :host([disabled][variant=tertiary]) :is(button,a), :host([disabled][variant=link]) :is(button,a),
  :host([disabled][variant=text]) :is(button,a), :host([disabled][variant=text-link]) :is(button,a){ background:transparent; border-color:transparent }
  :host([disabled][variant=tertiary][icon-only][size=xs]) :is(button,a){ color:var(--aha-button-disabled-text,#B5B5B5); background:transparent }
  :host([loading]) :is(button,a){ cursor:progress }
  :host([variant]:not([disabled])) :is(button,a):focus-visible{ outline:var(--aha-button-focus-outline,none); outline-offset:1px; box-shadow:0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-focus-ring,#E70E68) }
  :host([variant=secondary]:not([disabled])) :is(button,a):focus-visible:is(:hover,:active), :host([variant=danger]:not([disabled])) :is(button,a):focus-visible:is(:hover,:active){ box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D), 0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-focus-ring,#E70E68) }
  :host([variant=secondary-deck]:not([disabled])) :is(button,a):focus-visible, :host([variant=tertiary-deck]:not([disabled])) :is(button,a):focus-visible{ box-shadow:none; outline:auto; outline-offset:0 }
  :host([disabled][variant=secondary-deck]) :is(button,a){ background:var(--aha-white,#fff); border-color:color-mix(in srgb, var(--aha-text-default,#1A1A1A) 10%, transparent); color:color-mix(in srgb, var(--aha-text-default,#1A1A1A) 45%, transparent) }
  :host([disabled][variant=tertiary-deck]) :is(button,a){ background:transparent; border-color:transparent; color:color-mix(in srgb, var(--aha-deck-ink,var(--aha-text-default,#1A1A1A)) 45%, transparent) }
  :host([disabled][variant=tertiary-deck][icon-only][size=md][sheet]) :is(button,a){ color:var(--aha-button-disabled-text,#B5B5B5) }
  :host([loading][icon-only][variant=secondary-deck]) slot:not([name]), :host([loading][icon-only][variant=tertiary-deck]) slot:not([name]){ display:none }
  :host([size=lg][shortcut]:not([shortcut=""]):not([icon-only])) :is(button,a){ padding-inline-end:var(--aha-space-8,8px) }
  :host([icon-only]) .shortcut{ display:none }
  :host([variant=primary]) .shortcut, :host([variant=primary-alt]) .shortcut, :host([variant=positive]) .shortcut{ background:var(--aha-button-primary-shortcut-bg,rgba(0,0,0,.2)) }
  :host([disabled]) .shortcut{ background:color-mix(in srgb, currentColor 16%, transparent) }
`;
const escapeAttribute = (value) => String(value).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const SPINNER = '<svg class="spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="28" stroke-dashoffset="10"/></svg>'; // ds-lint-allow: svg (animated loading spinner — motion chrome, not a static catalogue glyph)

export class AhaButton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size', 'disabled', 'loading', 'block', 'icon-only', 'aria-label', 'aria-describedby', 'shortcut', 'href', 'target', 'rel', 'type']; }
  connectedCallback() {
    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'secondary');
    if (!this.hasAttribute('size')) this.setAttribute('size', 'lg');
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'shortcut' && this._shortcut) fillShortcutChip(this._shortcut, this.getAttribute('shortcut'));
    else if (name === 'aria-describedby' && this._button) this._forwardDescription();
    else this._render();
  }
  _forwardDescription() {
    // an id cannot cross into the shadow root, so the ids are resolved here and handed over as elements
    const root = this.getRootNode();
    const ids = (this.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    const elements = root.getElementById ? ids.map((id) => root.getElementById(id)).filter(Boolean) : [];
    if ('ariaDescribedByElements' in this._button) this._button.ariaDescribedByElements = elements.length ? elements : null;
  }
  _render() {
    const loading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled');
    const aria = this.getAttribute('aria-label');
    const href = this.getAttribute('href');
    const lead = loading ? SPINNER : '<slot name="icon"></slot>';
    const linkAttributes = href === null || disabled ? '' : ['href', 'target', 'rel']
      .filter((name) => this.hasAttribute(name))
      .map((name) => ` ${name}="${escapeAttribute(this.getAttribute(name))}"`).join('');
    const tag = linkAttributes ? 'a' : 'button';
    const ariaAttribute = aria ? ` aria-label="${escapeAttribute(aria)}"` : '';
    this.shadowRoot.innerHTML =
      `<style>${STYLE}${SHORTCUT_CHIP_STYLE}</style><${tag} part="button"${linkAttributes}${disabled ? ' disabled' : ''}${ariaAttribute}>${lead}<slot></slot><kbd class="shortcut" part="shortcut" aria-hidden="true" hidden></kbd></${tag}>`;
    this._shortcut = this.shadowRoot.querySelector('.shortcut');
    fillShortcutChip(this._shortcut, this.getAttribute('shortcut'));
    this._button = this.shadowRoot.querySelector('[part=button]');
    this._forwardDescription();
    this._button.addEventListener('click', (e) => {
      if (disabled || loading) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (this.getAttribute('type') === 'submit') this.closest('form')?.requestSubmit();
    });
  }
}
export function defineAhaButton(tag = 'aha-button') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaButton);
}
if (typeof window !== 'undefined') defineAhaButton();
export default { AhaButton, defineAhaButton };
