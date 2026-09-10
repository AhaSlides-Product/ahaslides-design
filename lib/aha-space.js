/**
 * @ahaslides-product/design/aha-space — the shared Space primitive.
 *
 *   import '@ahaslides-product/design/aha-space';   // registers <aha-space>
 *   <aha-space size="middle"><button>A</button><button>B</button></aha-space>
 *
 * Sets an even, DS-scale gap between a small inline set of items — the quiet spacer you
 * reach for between buttons, tags, or inline controls. `size` takes the named steps
 * small/middle/large (8/16/24) or a raw pixel number; `direction="vertical"` stacks them;
 * `align` sets cross-axis alignment; `wrap` lets a row flow onto multiple lines; and
 * `split` rules a thin divider between adjacent items.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and
 * Vue. Zero dependencies. Layout only: it never paints a background.
 */
const SIZE = { small: '8px', middle: '16px', large: '24px' };
const ALIGN = { start: 'flex-start', end: 'flex-end', center: 'center', baseline: 'baseline' };
const STYLE = `
  :host{ display:inline-flex; box-sizing:border-box; flex-direction:row; align-items:center;
    color:var(--aha-text-default,#1A1A1A) }
  :host([direction="vertical"]){ display:flex; flex-direction:column; align-items:stretch }
  :host([wrap]){ flex-wrap:wrap }
  /* split: a thin divider ruled between adjacent items (token-bound, no extra DOM). */
  :host([split]) ::slotted(*){ padding-inline-start:var(--aha-space-split-gap,0) }
  :host([split]) ::slotted(:not(:first-child)){
    border-inline-start:1px solid var(--aha-split,#F1F1F1); padding-inline-start:var(--aha-space-split-gap,0) }
  :host([split][direction="vertical"]) ::slotted(:not(:first-child)){
    border-inline-start:0; border-block-start:1px solid var(--aha-split,#F1F1F1); padding-inline-start:0 }
`;

export class AhaSpace extends HTMLElement {
  static get observedAttributes() { return ['size', 'direction', 'align', 'wrap', 'split']; }
  connectedCallback() { if (!this.shadowRoot) { this.attachShadow({ mode: 'open' }); this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`; } this._apply(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    const size = this.getAttribute('size') || 'small';
    const gap = SIZE[size] || (/^\d+$/.test(size) ? size + 'px' : size);
    this.style.gap = gap;
    // With split on, half the gap becomes the divider's inner padding so it sits centred between items.
    this.style.setProperty('--aha-space-split-gap', this.hasAttribute('split') ? `calc(${gap} / 2)` : '0');
    if (this.hasAttribute('split')) this.style.gap = `calc(${gap} / 2)`;
    const align = this.getAttribute('align');
    this.style.alignItems = align ? (ALIGN[align] || '') : '';
  }
}

export function defineAhaSpace(tag = 'aha-space') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSpace);
  return true;
}
if (typeof window !== 'undefined') defineAhaSpace();

export default { AhaSpace, defineAhaSpace };
