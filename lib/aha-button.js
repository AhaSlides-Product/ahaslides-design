/**
 * @ahaslides/design/aha-button — the shared Button primitive.
 *
 *   import '@ahaslides/design/aha-button';   // registers <aha-button>
 *   <aha-button variant="primary" size="md">Save</aha-button>
 *   <aha-button icon-only variant="secondary" aria-label="More">…icon…</aha-button>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → identical in React and Vue,
 * and outside any app. Zero dependencies (no Lit). Built to the DS V3 Button spec
 * (Figma node 56611-11049): primary #6A1EBB / hover #8644D4 / label #FDFDFD, brand-tint
 * secondary & tertiary hover, per-tone soft focus ring, subtle elevation, icon 16px.
 */
const STYLE = `
  :host{ display:inline-block }
  :host([block]){ display:block }
  button{
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-weight:600; font-size:14px; line-height:1;
    display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;
    height:36px; padding:0 16px; border:1px solid transparent; border-radius:var(--aha-radius-default,8px);
    background:var(--aha-btn-secondary-bg,#fff); color:var(--aha-text-default,#1A1A1A); border-color:var(--aha-btn-secondary-border,#E3E3E3);
    cursor:pointer; white-space:nowrap; user-select:none; transition:background .12s ease, border-color .12s ease, box-shadow .12s ease }
  button:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-btn-focus-ring,rgba(211,180,255,.3)) }
  ::slotted([slot=icon]){ display:inline-flex; line-height:0; width:16px; height:16px }
  ::slotted([slot=icon]) svg, .spin{ width:16px; height:16px }
  .spin{ animation:aha-spin .7s linear infinite }
  @keyframes aha-spin{ to{ transform:rotate(360deg) } }
  :host([size=sm]) button{ height:28px; padding:0 8px; border-radius:var(--aha-radius-xs,4px); font-size:14px }
  :host([size=md]) button{ height:36px; padding:0 16px; border-radius:var(--aha-radius-default,8px); font-size:14px }
  :host([size=lg]) button{ height:40px; padding:0 20px; border-radius:var(--aha-radius-default,8px); font-size:16px }
  :host([size=xl]) button{ height:52px; padding:0 20px; border-radius:var(--aha-radius-lg,12px); font-size:16px }
  :host([icon-only]) button{ padding:0; gap:0; width:36px }
  :host([icon-only][size=sm]) button{ width:28px } :host([icon-only][size=md]) button{ width:36px }
  :host([icon-only][size=lg]) button{ width:40px } :host([icon-only][size=xl]) button{ width:52px }
  :host([variant=primary]) button{ background:var(--aha-btn-primary-bg,#6A1EBB); border-color:var(--aha-btn-primary-bg,#6A1EBB); color:var(--aha-btn-primary-fg,#FDFDFD); box-shadow:var(--aha-btn-elevate-primary,0 2px 0 0 rgba(0,0,0,.04)) }
  :host([variant=primary]) button:hover{ background:var(--aha-btn-primary-bg-hover,#8644D4); border-color:var(--aha-btn-primary-bg-hover,#8644D4) }
  :host([variant=primary]) button:active{ background:var(--aha-btn-primary-bg-press,#5715A0); border-color:var(--aha-btn-primary-bg-press,#5715A0) }
  :host([variant=secondary]) button{ box-shadow:var(--aha-btn-elevate-secondary,0 2px 0 0 rgba(0,0,0,.016)) }
  :host([variant=secondary]) button:hover{ background:var(--aha-btn-secondary-bg-hover,#F9F5FF); border-color:var(--aha-btn-secondary-border-hover,#A96FF0); color:var(--aha-color-primary,#6A1EBB) }
  :host([variant=secondary]) button:active{ border-color:var(--aha-btn-secondary-border-press,#D4D4D4) }
  :host([variant=tertiary]) button{ background:transparent; border-color:transparent; color:var(--aha-text-default,#1A1A1A) }
  :host([variant=tertiary]) button:hover{ background:var(--aha-btn-tertiary-bg-hover,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  :host([variant=tertiary]) button:active{ background:var(--aha-btn-tertiary-bg-active,#F0E4FF) }
  :host([variant=link]) button{ background:transparent; border-color:transparent; color:var(--aha-text-link,#6A1EBB); font-weight:400; padding:0 4px }
  :host([variant=link]) button:hover{ color:var(--aha-text-link-hover,#8644D4); text-decoration:underline }
  :host([variant=danger]) button{ background:var(--aha-btn-danger-bg,#F5222D); border-color:var(--aha-btn-danger-bg,#F5222D); color:#fff }
  :host([variant=danger]) button:hover{ background:var(--aha-btn-danger-bg-hover,#FF4D4F); border-color:var(--aha-btn-danger-bg-hover,#FF4D4F) }
  :host([variant=danger]) button:active{ background:var(--aha-btn-danger-bg-press,#CF1322); border-color:var(--aha-btn-danger-bg-press,#CF1322) }
  :host([variant=danger]) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-btn-danger-ring,rgba(255,40,80,.2)) }
  :host([variant=positive]) button{ background:var(--aha-btn-positive-bg,#4EF1C5); border-color:var(--aha-btn-positive-bg,#4EF1C5); color:var(--aha-btn-positive-fg,#1A1A1A) }
  :host([variant=positive]) button:hover{ background:var(--aha-btn-positive-bg-hover,#93F5DA); border-color:var(--aha-btn-positive-bg-hover,#93F5DA) }
  :host([variant=positive]) button:active{ background:var(--aha-btn-positive-bg-press,#20E8B5); border-color:var(--aha-btn-positive-bg-press,#20E8B5) }
  :host([variant=positive]) button:focus-visible{ box-shadow:0 0 0 2px var(--aha-btn-focus-ring-success,rgba(32,232,181,.3)) }
  :host([disabled]) button{ cursor:not-allowed; background:var(--aha-btn-disabled-bg,#E3E3E3); border-color:var(--aha-btn-disabled-bg,#E3E3E3); color:var(--aha-btn-disabled-fg,#B5B5B5); box-shadow:none }
  :host([disabled][variant=tertiary]) button, :host([disabled][variant=link]) button{ background:transparent; border-color:transparent }
  :host([loading]) button{ cursor:progress }
`;
const SPINNER = '<svg class="spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="28" stroke-dashoffset="10"/></svg>';

export class AhaButton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'size', 'disabled', 'loading', 'block', 'icon-only', 'aria-label']; }
  connectedCallback() {
    if (!this.hasAttribute('variant')) this.setAttribute('variant', 'secondary');
    if (!this.hasAttribute('size')) this.setAttribute('size', 'md');
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
