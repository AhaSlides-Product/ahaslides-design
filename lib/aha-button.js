/**
 * @ahaslides-product/design/aha-button — the shared Button primitive.
 *
 *   import '@ahaslides-product/design/aha-button';   // registers <aha-button>
 *   <aha-button variant="primary" size="md">Save</aha-button>
 *   <aha-button icon-only variant="secondary" aria-label="More">…icon…</aha-button>
 *   <aha-button variant="primary" size="xl">Reveal</aha-button>   // 52px: in-canvas presenter controls read from room distance
 *   <aha-button variant="primary" size="touch" block>Submit</aha-button>   // 48px, 8px corners: the audience phone's primary action
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → identical in React and Vue,
 * and outside any app. Zero dependencies (no Lit). Built to the DS V3 Button spec
 * (Figma node 56611-11049), recoloured by the 2026-10-07 colour rules: primary #E70E68 / hover #DB005B / label #FFFFFF, pale-pink
 * secondary & tertiary hover/active with a Vivid Pink label, subtle elevation, icon 16px. Status carries no hue, so the three status variants differ by
 * shape: danger is a default-ink fill, success a default-ink outline on white, positive (Upgrade, encourage) Vivid Pink like primary.
 * Keyboard focus draws a 2px solid ring outside a 2px gap: Vivid Pink, or default ink on danger and success.
 *
 * Colours bind to the NAMED button semantic-token layer (--aha-button-*), a definition-layer
 * indirection over the core tokens (e.g. --aha-button-primary-bg: var(--aha-color-primary)), so
 * button theming can move independently of the core palette. Each var() keeps the same effective
 * fallback → the render is byte-identical to the raw --aha-btn-* seeds.
 */
const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([block]){ display:block }
  button{
    font-family:inherit; font-weight:600; font-size:14px; line-height:1;
    display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;
    height:36px; padding:0 16px; border:1px solid transparent; border-radius:var(--aha-radius-default,8px);
    background:var(--aha-button-default-bg,#FFFFFF); color:var(--aha-button-default-text,#1A1A1A); border-color:var(--aha-button-default-border,#E3E3E3);
    cursor:pointer; white-space:nowrap; user-select:none; transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  ::slotted([slot=icon]){ display:inline-flex; line-height:0; width:16px; height:16px }
  ::slotted([slot=icon]) svg, .spin{ width:16px; height:16px }
  .spin{ animation:aha-spin .7s linear infinite }
  @keyframes aha-spin{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ button{ transition:none } }
  :host([size=sm]) button{ height:28px; padding:0 8px; border-radius:var(--aha-radius-xs,4px); font-size:14px }
  :host([size=md]) button{ height:36px; padding:0 16px; border-radius:var(--aha-radius-default,8px); font-size:14px }
  :host([size=lg]) button{ height:40px; padding:0 20px; border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([size=xl]) button{ height:52px; padding:0 var(--aha-space-28,28px); border-radius:var(--aha-radius-lg,12px); font-size:16px }
  :host([size=touch]) button{ height:48px; padding:0 var(--aha-space-24,24px); border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([icon-only]) button{ padding:0; gap:0; width:36px }
  :host([icon-only][size=sm]) button{ width:28px } :host([icon-only][size=md]) button{ width:36px }
  :host([icon-only][size=lg]) button{ width:40px }
  :host([icon-only][size=xl]) button{ width:52px }
  :host([icon-only][size=touch]) button{ width:48px }
  :host([variant=primary]) button{ background:var(--aha-button-primary-bg,#E70E68); border-color:var(--aha-button-primary-bg,#E70E68); color:var(--aha-button-primary-text,#FFFFFF); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary]) button:hover{ background:var(--aha-button-primary-bg-hover,#DB005B); border-color:var(--aha-button-primary-bg-hover,#DB005B); box-shadow:var(--aha-button-elevate-primary-hover,0 4px 12px rgba(231,14,104,.32)) }
  :host([variant=primary]) button:active{ background:var(--aha-button-primary-bg-press,#DB005B); border-color:var(--aha-button-primary-bg-press,#DB005B); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=secondary]) button{ box-shadow:var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)) }
  :host([variant=secondary]) button:hover{ background:var(--aha-button-default-bg-hover,#FEF3F7); border-color:var(--aha-button-default-border-hover,#E70E68); color:var(--aha-button-default-text-hover,var(--aha-text-link,#E70E68)) }
  :host([variant=secondary]) button:active{ background:var(--aha-button-default-bg-hover,#FEF3F7); border-color:var(--aha-button-default-border-press,#DB005B); color:var(--aha-button-default-text-hover,var(--aha-text-link,#E70E68)) }
  :host([variant=tertiary]) button{ background:transparent; border-color:transparent; color:var(--aha-text-default,#1A1A1A) }
  :host([variant=tertiary]) button:hover{ background:var(--aha-button-ghost-bg-hover,#FEF3F7); color:var(--aha-button-default-text-hover,var(--aha-text-link,#E70E68)) }
  :host([variant=tertiary]) button:active{ background:var(--aha-button-ghost-bg-press,#FEF3F7); color:var(--aha-button-default-text-hover,var(--aha-text-link,#E70E68)) }
  :host([variant=link]) button{ background:transparent; border-color:transparent; color:var(--aha-text-link,#E70E68); font-weight:400; padding:0 4px; text-decoration:underline }
  :host([variant=link]) button:hover{ color:var(--aha-text-link-hover,#DB005B); text-decoration:underline }
  :host([variant=danger]) button{ background:var(--aha-button-danger-bg,#1A1A1A); border-color:var(--aha-button-danger-bg,#1A1A1A); color:var(--aha-button-danger-text,#FFFFFF) }
  :host([variant=danger]) button:hover{ background:var(--aha-button-danger-bg-hover,#4A4A4A); border-color:var(--aha-button-danger-bg-hover,#4A4A4A) }
  :host([variant=danger]) button:active{ background:var(--aha-button-danger-bg-press,#616161); border-color:var(--aha-button-danger-bg-press,#616161) }
  :host([variant=success]) button{ background:var(--aha-button-default-bg,#FFFFFF); border-color:var(--aha-border-success,#1A1A1A); color:var(--aha-text-positive,#1A1A1A) }
  :host([variant=success]) button:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  :host([variant=success]) button:active{ background:var(--aha-gray-40,#E3E3E3) }
  :host([variant=positive]) button{ background:var(--aha-button-positive-bg,#E70E68); border-color:var(--aha-button-positive-bg,#E70E68); color:var(--aha-button-positive-text,#FFFFFF); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=positive]) button:hover{ background:var(--aha-button-positive-bg-hover,#DB005B); border-color:var(--aha-button-positive-bg-hover,#DB005B); box-shadow:var(--aha-button-elevate-primary-hover,0 4px 12px rgba(231,14,104,.32)) }
  :host([variant=positive]) button:active{ background:var(--aha-button-positive-bg-press,#DB005B); border-color:var(--aha-button-positive-bg-press,#DB005B); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary-alt]) button{ background:var(--aha-button-primary-bg,#E70E68); border-color:var(--aha-button-primary-bg,#E70E68); color:var(--aha-button-primary-text,#FFFFFF) }
  :host([variant=primary-alt]) button:hover{ background:var(--aha-button-primary-bg-hover,#DB005B); border-color:var(--aha-button-primary-bg-hover,#DB005B) }
  :host([variant=primary-alt]) button:active{ background:var(--aha-button-primary-bg-press,#DB005B); border-color:var(--aha-button-primary-bg-press,#DB005B) }
  :host([variant=text]) button{ background:var(--aha-button-default-bg,#FFFFFF); border-color:transparent; color:var(--aha-text-secondary,#4A4A4A); font-weight:400 }
  :host([variant=text]) button:hover{ background:var(--aha-gray-40,#E3E3E3) }
  :host([variant=text]) button:active{ background:var(--aha-gray-50,#D4D4D4) }
  :host([variant=text-link]) button{ background:var(--aha-button-default-bg,#FFFFFF); border-color:transparent; color:var(--aha-text-link,#E70E68); font-weight:400; text-decoration:var(--aha-text-link-decoration,none) }
  :host([variant=text-link]:not([disabled])) button:hover{ color:var(--aha-text-link-hover,#DB005B) }
  :host([variant=text-link]:not([disabled])) button:active{ color:var(--aha-color-primary-active,#DB005B) }
  :host([disabled]) button{ cursor:not-allowed; background:var(--aha-button-disabled-bg,#E3E3E3); border-color:var(--aha-button-disabled-bg,#E3E3E3); color:var(--aha-button-disabled-text,#B5B5B5); box-shadow:none }
  :host([disabled][variant=tertiary]) button, :host([disabled][variant=link]) button,
  :host([disabled][variant=text]) button, :host([disabled][variant=text-link]) button{ background:transparent; border-color:transparent }
  :host([loading]) button{ cursor:progress }
  :host(:not([disabled])) button:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-focus-ring,#E70E68) }
  :host([variant=danger]:not([disabled])) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-danger-ring,#1A1A1A) }
  :host([variant=success]:not([disabled])) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-focus-ring-success,#1A1A1A) }
`;
const SPINNER = '<svg class="spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="28" stroke-dashoffset="10"/></svg>'; // ds-lint-allow: svg (animated loading spinner — motion chrome, not a static catalogue glyph)

export class AhaButton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size', 'disabled', 'loading', 'block', 'icon-only', 'aria-label']; }
  connectedCallback() {
    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'secondary');
    if (!this.hasAttribute('size')) this.setAttribute('size', 'lg');
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const loading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled');
    const aria = this.getAttribute('aria-label');
    const lead = loading ? SPINNER : '<slot name="icon"></slot>';
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><button part="button"${disabled ? ' disabled' : ''}${aria ? ` aria-label="${aria.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)}"` : ''}>${lead}<slot></slot></button>`;
    const btn = this.shadowRoot.querySelector('button');
    btn.addEventListener('click', (e) => { if (disabled || loading) { e.preventDefault(); e.stopImmediatePropagation(); } });
  }
}
export function defineAhaButton(tag = 'aha-button') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaButton);
}
if (typeof window !== 'undefined') defineAhaButton();
export default { AhaButton, defineAhaButton };
