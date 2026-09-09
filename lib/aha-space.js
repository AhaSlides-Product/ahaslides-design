/**
 * @ahaslides-product/design/aha-space — the shared Space primitive.
 *
 *   import '@ahaslides-product/design/aha-space';   // registers <aha-space>
 *   <aha-space size="middle"><button>A</button><button>B</button></aha-space>
 *
 * Sets an even, DS-scale gap between a small inline set of items — the quiet spacer you
 * reach for between buttons, tags, or inline controls. `size` takes the named steps
 * small/middle/large (8/16/24) or a raw pixel number; `direction="vertical"` stacks them.
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
`;

export class AhaSpace extends HTMLElement {
  static get observedAttributes() { return ['size', 'direction', 'align', 'wrap']; }
  connectedCallback() { if (!this.shadowRoot) { this.attachShadow({ mode: 'open' }); this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`; } this._apply(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    const size = this.getAttribute('size') || 'small';
    this.style.gap = SIZE[size] || (/^\d+$/.test(size) ? size + 'px' : size);
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
