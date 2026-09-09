/**
 * @ahaslides-product/design/aha-flex — the shared Flex layout primitive.
 *
 *   import '@ahaslides-product/design/aha-flex';   // registers <aha-flex>
 *   <aha-flex gap="middle" align="center"><button>A</button><button>B</button></aha-flex>
 *
 * A flexbox container with the DS spacing scale baked in — `gap` takes the named steps
 * small/middle/large (8/16/24) or a raw pixel number, plus direction/align/justify/wrap.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and
 * Vue. Zero dependencies. Layout only: it never paints a background.
 */
const GAP = { small: '8px', middle: '16px', large: '24px' };
const ALIGN = { start: 'flex-start', end: 'flex-end', center: 'center', baseline: 'baseline', stretch: 'stretch' };
const JUSTIFY = { start: 'flex-start', end: 'flex-end', center: 'center', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
const STYLE = `
  :host{ display:flex; box-sizing:border-box; color:var(--aha-text-default,#1A1A1A) }
  :host([wrap]){ flex-wrap:wrap }
`;

export class AhaFlex extends HTMLElement {
  static get observedAttributes() { return ['gap', 'direction', 'align', 'justify', 'wrap']; }
  connectedCallback() { if (!this.shadowRoot) { this.attachShadow({ mode: 'open' }); this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`; } this._apply(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    const gap = this.getAttribute('gap');
    this.style.gap = gap == null ? '' : (GAP[gap] || (/^\d+$/.test(gap) ? gap + 'px' : gap));
    this.style.flexDirection = this.getAttribute('direction') || '';
    this.style.alignItems = ALIGN[this.getAttribute('align')] || '';
    this.style.justifyContent = JUSTIFY[this.getAttribute('justify')] || '';
  }
}

export function defineAhaFlex(tag = 'aha-flex') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaFlex);
  return true;
}
if (typeof window !== 'undefined') defineAhaFlex();

export default { AhaFlex, defineAhaFlex };
