/**
 * @ahaslides-product/design/aha-grid — the shared Grid layout primitive.
 *
 *   import '@ahaslides-product/design/aha-grid';   // registers <aha-grid>
 *   <aha-grid columns="3" gap="middle">…</aha-grid>
 *   <aha-grid min="220" gap="large">…</aha-grid>   // responsive auto-fit
 *
 * A CSS-grid container with the DS spacing scale baked into `gap`. Give it a fixed
 * `columns` count (equal 1fr tracks) or a `min` track width for a responsive auto-fit
 * layout. ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in
 * React and Vue. Zero dependencies. Layout only: it never paints a background.
 */
const GAP = { small: '8px', middle: '16px', large: '24px' };
const STYLE = `
  :host{ display:grid; box-sizing:border-box; color:var(--aha-text-default,#1A1A1A) }
`;

export class AhaGrid extends HTMLElement {
  static get observedAttributes() { return ['columns', 'min', 'gap']; }
  connectedCallback() { if (!this.shadowRoot) { this.attachShadow({ mode: 'open' }); this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`; } this._apply(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    const gap = this.getAttribute('gap');
    this.style.gap = gap == null ? '' : (GAP[gap] || (/^\d+$/.test(gap) ? gap + 'px' : gap));
    const min = this.getAttribute('min');
    const cols = this.getAttribute('columns');
    this.style.gridTemplateColumns = min
      ? `repeat(auto-fit, minmax(${/^\d+$/.test(min) ? min + 'px' : min}, 1fr))`
      : cols ? `repeat(${cols}, minmax(0, 1fr))` : '';
  }
}

export function defineAhaGrid(tag = 'aha-grid') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaGrid);
  return true;
}
if (typeof window !== 'undefined') defineAhaGrid();

export default { AhaGrid, defineAhaGrid };
