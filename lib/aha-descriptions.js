/**
 * @ahaslides-product/design/aha-descriptions — the shared Descriptions primitive.
 *
 *   import '@ahaslides-product/design/aha-descriptions';   // registers <aha-descriptions>
 *
 *   // Light-DOM children (each child = one item, `label` attr + content = value):
 *   <aha-descriptions desc-title="Account">
 *     <div label="Plan">Pro</div>
 *     <div label="Seats" span="2">25 of 50</div>
 *   </aha-descriptions>
 *
 *   // …or an `items` JSON tree — [{label, value, span?}]:
 *   <aha-descriptions desc-title="Account" bordered column="2" size="small" layout="horizontal"
 *     items='[{"label":"Plan","value":"Pro"},{"label":"Seats","value":"25 of 50","span":2}]'>
 *   </aha-descriptions>
 *
 * A read-only label/value grid summarising one entity's fields. The DS V3 / antd Descriptions is a
 * FAMILY, not a fixed two-column list: it flows N `column`s per row (an item may `span` several),
 * lays out `horizontal` (label : value side-by-side) or `vertical` (label over value), renders
 * `bordered` (a ruled table with cell borders + a tinted label column) or plain (dividers only), and
 * scales padding by `size` (default · small · large). ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .desc{ border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    overflow:hidden; background:var(--aha-bg-container,#FFFFFF) }
  .title{ padding:12px 16px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }

  /* body — CSS grid of N column label/value pairs; a cell may span columns */
  .grid{ display:grid; font-size:14px; line-height:22px }

  /* horizontal (default): label : value pairs flow across the row */
  .cell{ box-sizing:border-box }
  .label{ color:var(--aha-text-secondary,#4A4A4A); font-weight:600; white-space:nowrap }
  .value{ color:var(--aha-text-default,#1A1A1A) }

  /* ---- PLAIN (default) — row dividers only, no cell borders ----------------- */
  :host(:not([bordered])) .cell{ padding:12px 16px; border-bottom:1px solid var(--aha-split,#F1F1F1) }
  :host(:not([bordered])) .label{ padding-right:8px }
  :host(:not([bordered])) .cell.last-row{ border-bottom:none }

  /* ---- BORDERED — a ruled table: tinted label column, cell borders ---------- */
  :host([bordered]) .grid{ gap:0 }
  :host([bordered]) .cell{ padding:12px 16px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    border-right:1px solid var(--aha-split,#F1F1F1) }
  :host([bordered]) .label{ background:var(--aha-bg-container-secondary,#F7F7F7);
    border-right:1px solid var(--aha-split,#F1F1F1) }

  /* ---- SIZE — padding scale (default · small · large) ----------------------- */
  :host([size="small"]) .cell{ padding:8px 12px }
  :host([size="small"]) .title{ padding:8px 12px }
  :host([size="large"]) .cell{ padding:16px 20px }
  :host([size="large"]) .title{ padding:16px 20px }

  /* ---- VERTICAL layout — label stacked over value -------------------------- */
  :host([layout="vertical"]) .label{ white-space:normal }
`;

export class AhaDescriptions extends HTMLElement {
  static get observedAttributes() { return ['desc-title', 'items', 'column', 'bordered', 'size', 'layout']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }   // full rebuild (not a per-state toggle)

  // items may come from an `items` JSON tree OR from light-DOM children (label attr + content)
  _items() {
    const raw = this.getAttribute('items');
    if (raw) { try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch { /* fall through */ } }
    return [...this.children].map((c) => ({
      label: c.getAttribute('label') || '',
      value: c.innerHTML,
      span: parseInt(c.getAttribute('span'), 10) || 1,
    }));
  }

  _render() {
    const items = this._items();
    const column = Math.max(1, parseInt(this.getAttribute('column'), 10) || (this.getAttribute('layout') === 'vertical' ? 3 : 2));
    const vertical = this.getAttribute('layout') === 'vertical';

    // Column template: horizontal = [label value] per column; vertical = one track per column.
    const track = vertical ? '1fr' : 'auto 1fr';
    const cols = new Array(column).fill(track).join(' ');

    // Lay items into rows of `column`, tracking which items land in the final row (plain-mode
    // divider suppression). An item that doesn't fit the remaining columns wraps to a new row.
    const rows = [];
    let cur = [];
    let used = 0;
    items.forEach((it) => {
      const span = Math.min(column, Math.max(1, parseInt(it.span, 10) || 1));
      if (used + span > column && cur.length) { rows.push(cur); cur = []; used = 0; }
      cur.push({ ...it, span });
      used += span;
    });
    if (cur.length) rows.push(cur);

    const cells = [];
    rows.forEach((row, ri) => {
      const lastRow = ri === rows.length - 1 ? ' last-row' : '';
      row.forEach((it) => {
        const label = esc(it.label || '');
        const value = it.value == null ? '' : String(it.value);
        if (vertical) {
          cells.push(`<div class="cell label${lastRow}" part="label" style="grid-column:span ${it.span}">${label}</div>`);
          cells.push(`<div class="cell value${lastRow}" part="value" style="grid-column:span ${it.span}">${value}</div>`);
        } else {
          // label cell (1 col) + value cell (span*2-1 cols) → the pair fills `span` columns
          const valueSpan = it.span * 2 - 1;
          cells.push(`<div class="cell label${lastRow}" part="label">${label}</div>`);
          cells.push(`<div class="cell value${lastRow}" part="value" style="grid-column:span ${valueSpan}">${value}</div>`);
        }
      });
    });

    const title = this.getAttribute('desc-title');
    const head = title ? `<div class="title" part="title">${esc(title)}</div>` : '';
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><div class="desc" part="desc">${head}` +
      `<div class="grid" style="grid-template-columns:${cols}">${cells.join('')}</div></div>`;
  }
}

export function defineAhaDescriptions(tag = 'aha-descriptions') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaDescriptions);
  return true;
}
if (typeof window !== 'undefined') defineAhaDescriptions();

export default { AhaDescriptions, defineAhaDescriptions };
