/**
 * @ahaslides-product/design/aha-button — the shared Button primitive.
 *
 *   import '@ahaslides-product/design/aha-button';   // registers <aha-button>
 *   <aha-button variant="primary" size="md">Save</aha-button>
 *   <aha-button icon-only variant="secondary" aria-label="More">…icon…</aha-button>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → identical in React and Vue,
 * and outside any app. Zero dependencies (no Lit). Built to the DS V3 Button spec
 * (Figma node 56611-11049): primary #6A1EBB / hover #8644D4 / label #FDFDFD, brand-tint
 * secondary & tertiary hover, per-tone soft focus ring, subtle elevation, icon 16px.
 *
 * Colours bind to the NAMED button semantic-token layer (--aha-button-*), a definition-layer
 * indirection over the core tokens (e.g. --aha-button-primary-bg: var(--aha-color-primary)), so
 * button theming can move independently of the core palette. Each var() keeps the same effective
 * fallback → the render is byte-identical to the raw --aha-btn-* seeds.
 */
const STYLE = `
  :host{ display:inline-block }
  :host([block]){ display:block }
  button{
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-weight:600; font-size:14px; line-height:1;
    display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;
    height:36px; padding:0 16px; border:1px solid transparent; border-radius:var(--aha-radius-default,8px);
    background:var(--aha-button-default-bg,#fff); color:var(--aha-button-default-text,#1A1A1A); border-color:var(--aha-button-default-border,#E3E3E3);
    cursor:pointer; white-space:nowrap; user-select:none; transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  button:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-button-focus-ring,rgba(211,180,255,.3)) }
  ::slotted([slot=icon]){ display:inline-flex; line-height:0; width:16px; height:16px }
  ::slotted([slot=icon]) svg, .spin{ width:16px; height:16px }
  .spin{ animation:aha-spin .7s linear infinite }
  @keyframes aha-spin{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ button{ transition:none } }
  :host([size=sm]) button{ height:28px; padding:0 8px; border-radius:var(--aha-radius-xs,4px); font-size:14px }
  :host([size=md]) button{ height:36px; padding:0 16px; border-radius:var(--aha-radius-default,8px); font-size:14px }
  :host([size=lg]) button{ height:40px; padding:0 20px; border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([icon-only]) button{ padding:0; gap:0; width:36px }
  :host([icon-only][size=sm]) button{ width:28px } :host([icon-only][size=md]) button{ width:36px }
  :host([icon-only][size=lg]) button{ width:40px }
  :host([variant=primary]) button{ background:var(--aha-button-primary-bg,#6A1EBB); border-color:var(--aha-button-primary-bg,#6A1EBB); color:var(--aha-button-primary-text,#FDFDFD); box-shadow:var(--aha-button-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary]) button:hover{ background:var(--aha-button-primary-bg-hover,#8644D4); border-color:var(--aha-button-primary-bg-hover,#8644D4) }
  :host([variant=primary]) button:active{ background:var(--aha-button-primary-bg-press,#5715A0); border-color:var(--aha-button-primary-bg-press,#5715A0) }
  :host([variant=secondary]) button{ box-shadow:var(--aha-button-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)) }
  :host([variant=secondary]) button:hover{ background:var(--aha-button-default-bg-hover,#F9F5FF); border-color:var(--aha-button-default-border-hover,#A96FF0); color:var(--aha-color-primary,#6A1EBB) }
  :host([variant=secondary]) button:active{ border-color:var(--aha-button-default-border-press,#D4D4D4) }
  :host([variant=tertiary]) button{ background:transparent; border-color:transparent; color:var(--aha-text-default,#1A1A1A) }
  :host([variant=tertiary]) button:hover{ background:var(--aha-button-ghost-bg-hover,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  :host([variant=tertiary]) button:active{ background:var(--aha-button-ghost-bg-press,#F0E4FF) }
  :host([variant=link]) button{ background:transparent; border-color:transparent; color:var(--aha-text-link,#6A1EBB); font-weight:400; padding:0 4px }
  :host([variant=link]) button:hover{ color:var(--aha-text-link-hover,#8644D4); text-decoration:underline }
  :host([variant=danger]) button{ background:var(--aha-button-danger-bg,#F5222D); border-color:var(--aha-button-danger-bg,#F5222D); color:var(--aha-button-danger-text,#fff) }
  :host([variant=danger]) button:hover{ background:var(--aha-button-danger-bg-hover,#FF4D4F); border-color:var(--aha-button-danger-bg-hover,#FF4D4F) }
  :host([variant=danger]) button:active{ background:var(--aha-button-danger-bg-press,#CF1322); border-color:var(--aha-button-danger-bg-press,#CF1322) }
  :host([variant=danger]) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-button-danger-ring,rgba(255,40,80,.2)) }
  :host([variant=positive]) button, :host([variant=success]) button{ background:var(--aha-button-positive-bg,#4EF1C5); border-color:var(--aha-button-positive-bg,#4EF1C5); color:var(--aha-button-positive-text,#1A1A1A) }
  :host([variant=positive]) button:hover, :host([variant=success]) button:hover{ background:var(--aha-button-positive-bg-hover,#93F5DA); border-color:var(--aha-button-positive-bg-hover,#93F5DA) }
  :host([variant=positive]) button:active, :host([variant=success]) button:active{ background:var(--aha-button-positive-bg-press,#20E8B5); border-color:var(--aha-button-positive-bg-press,#20E8B5) }
  :host([variant=positive]) button:focus-visible, :host([variant=success]) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-button-focus-ring-success,rgba(32,232,181,.3)) }
  :host([variant=essential]) button{ background:var(--aha-coral-50,#FF9068); border-color:var(--aha-coral-50,#FF9068); color:var(--aha-text-inverse,#fff) }
  :host([variant=essential]) button:hover{ background:var(--aha-coral-40,#FFAD8C); border-color:var(--aha-coral-40,#FFAD8C) }
  :host([variant=essential]) button:active{ background:var(--aha-coral-60,#FF7747); border-color:var(--aha-coral-60,#FF7747) }
  :host([variant=pro]) button{ background:var(--aha-teal-60,#16C49A); border-color:var(--aha-teal-60,#16C49A); color:var(--aha-text-inverse,#fff) }
  :host([variant=pro]) button:hover{ background:var(--aha-teal-50,#20E8B5); border-color:var(--aha-teal-50,#20E8B5) }
  :host([variant=pro]) button:active{ background:var(--aha-teal-70,#13A181); border-color:var(--aha-teal-70,#13A181) }
  :host([variant=branding]) button{ background:var(--aha-pink-60,#FF4081); border-color:var(--aha-pink-60,#FF4081); color:var(--aha-text-inverse,#fff) }
  :host([variant=branding]) button:hover{ background:var(--aha-pink-70,#D92B6B); border-color:var(--aha-pink-70,#D92B6B) }
  :host([variant=branding]) button:active{ background:var(--aha-pink-80,#B31B57); border-color:var(--aha-pink-80,#B31B57) }
  :host([variant=primary-alt]) button{ background:var(--aha-button-primary-bg,#6A1EBB); border-color:var(--aha-button-primary-bg,#6A1EBB); color:var(--aha-button-primary-text,#FDFDFD) }
  :host([variant=primary-alt]) button:hover{ background:var(--aha-button-primary-bg-hover,#8644D4); border-color:var(--aha-button-primary-bg-hover,#8644D4) }
  :host([variant=primary-alt]) button:active{ background:var(--aha-button-primary-bg-press,#5715A0); border-color:var(--aha-button-primary-bg-press,#5715A0) }
  :host([variant=text]) button{ background:var(--aha-button-default-bg,#fff); border-color:transparent; color:var(--aha-text-secondary,#4A4A4A); font-weight:400 }
  :host([variant=text]) button:hover{ background:var(--aha-gray-40,#E3E3E3) }
  :host([variant=text]) button:active{ color:var(--aha-color-primary,#6A1EBB) }
  :host([variant=text-link]) button{ background:var(--aha-button-default-bg,#fff); border-color:transparent; color:var(--aha-text-link,#6A1EBB); font-weight:400 }
  :host([variant=text-link]) button:hover{ color:var(--aha-text-link-hover,#A96FF0) }
  :host([variant=text-link]) button:active{ color:var(--aha-color-primary,#6A1EBB) }
  :host([disabled]) button{ cursor:not-allowed; background:var(--aha-button-disabled-bg,#E3E3E3); border-color:var(--aha-button-disabled-bg,#E3E3E3); color:var(--aha-button-disabled-text,#B5B5B5); box-shadow:none }
  :host([disabled][variant=tertiary]) button, :host([disabled][variant=link]) button,
  :host([disabled][variant=text]) button, :host([disabled][variant=text-link]) button{ background:transparent; border-color:transparent }
  :host([loading]) button{ cursor:progress }
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
      `<style>${STYLE}</style><button part="button"${disabled ? ' disabled' : ''}${aria ? ` aria-label="${aria}"` : ''}>${lead}<slot></slot></button>`;
    const btn = this.shadowRoot.querySelector('button');
    btn.addEventListener('click', (e) => { if (disabled || loading) { e.preventDefault(); e.stopImmediatePropagation(); } });
  }
}
export function defineAhaButton(tag = 'aha-button') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaButton);
}
if (typeof window !== 'undefined') defineAhaButton();
export default { AhaButton, defineAhaButton };
