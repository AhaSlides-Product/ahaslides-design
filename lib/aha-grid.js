/**
 * @ahaslides-product/design/aha-grid — the shared Grid layout primitive.
 *
 *   import '@ahaslides-product/design/aha-grid';   // registers <aha-grid>
 *   <aha-grid columns="3" gap="middle">…</aha-grid>                 // fixed 3 equal tracks
 *   <aha-grid columns="4" gap="middle small">…</aha-grid>          // gutter [h,v] — 16 col / 8 row
 *   <aha-grid columns="4" responsive gap="middle">…</aha-grid>     // tracks collapse on narrow widths
 *   <aha-grid min="220" gap="large">…</aha-grid>                    // responsive auto-fit
 *   <aha-grid columns="3" justify="center" align="center">…</aha-grid>
 *
 * A CSS-grid container with the DS spacing scale baked into `gap`. Give it a fixed `columns`
 * count (equal 1fr tracks) or a `min` track width for a responsive auto-fit layout. Mirrors the
 * AntD Row/Col vocabulary over a CSS grid: a `gutter` (one value, or `"h v"` for separate
 * horizontal/vertical spacing), `justify`/`align` of the tracks, and a `responsive` toggle that
 * lets a fixed-column grid reflow to fewer columns as the container narrows. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. Layout only: it never paints a background. No interactive state → no motion.
 */
// Named gutter steps map to the DS spacing scale (8 / 16 / 24). A raw number → px.
const GAP = { none: '0px', small: '8px', middle: '16px', large: '24px' };
// justify → justify-content; align → align-items. Named DS steps kept intentionally small.
const JUSTIFY = { start: 'start', center: 'center', end: 'end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
const ALIGN = { start: 'start', center: 'center', end: 'end', stretch: 'stretch' };
const len = (v) => (/^\d+$/.test(v) ? v + 'px' : v);
const step = (v) => (v == null ? null : (GAP[v] || len(v)));

const STYLE = `
  :host{ display:grid; box-sizing:border-box; color:var(--aha-text-default,#1A1A1A) }
`;

export class AhaGrid extends HTMLElement {
  static get observedAttributes() { return ['columns', 'min', 'gap', 'gutter', 'justify', 'align', 'responsive']; }
  connectedCallback() { if (!this.shadowRoot) { this.attachShadow({ mode: 'open' }); this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`; } this._apply(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    // gap / gutter — a single value, or "h v" for separate column/row spacing (AntD's [h,v] gutter).
    const raw = this.getAttribute('gap') ?? this.getAttribute('gutter');
    if (raw == null) { this.style.gap = ''; }
    else {
      const parts = raw.trim().split(/\s+/);
      const col = step(parts[0]);
      const row = parts.length > 1 ? step(parts[1]) : col;
      this.style.gap = `${row} ${col}`;   // grid `gap` is `row-gap column-gap`
    }

    const min = this.getAttribute('min');
    const cols = this.getAttribute('columns');
    const responsive = this.hasAttribute('responsive');
    if (min) {
      // explicit responsive auto-fit: tracks are at least `min` wide, count follows the container
      this.style.gridTemplateColumns = `repeat(auto-fit, minmax(${len(min)}, 1fr))`;
    } else if (cols && responsive) {
      // fixed intent, but let tracks collapse: auto-fit up to N, each never wider than an even share
      this.style.gridTemplateColumns = `repeat(auto-fit, minmax(min(100%, calc((100% - ${cols - 1} * var(--aha-grid-gap-x, 16px)) / ${cols})), 1fr))`;
    } else if (cols) {
      this.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    } else {
      this.style.gridTemplateColumns = '';
    }

    // keep the responsive collapse math in sync with the real horizontal gutter
    if (cols && responsive) {
      const parts = (raw || 'middle').trim().split(/\s+/);
      this.style.setProperty('--aha-grid-gap-x', step(parts[0]) || '16px');
    } else {
      this.style.removeProperty('--aha-grid-gap-x');
    }

    const justify = this.getAttribute('justify');
    this.style.justifyContent = justify && JUSTIFY[justify] ? JUSTIFY[justify] : '';
    const align = this.getAttribute('align');
    this.style.alignItems = align && ALIGN[align] ? ALIGN[align] : '';
  }
}

export function defineAhaGrid(tag = 'aha-grid') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaGrid);
  return true;
}
if (typeof window !== 'undefined') defineAhaGrid();

export default { AhaGrid, defineAhaGrid };
