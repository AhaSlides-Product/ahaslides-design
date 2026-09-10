/**
 * @ahaslides-product/design/aha-pagination — the shared Pagination primitive.
 *
 *   import '@ahaslides-product/design/aha-pagination';   // registers <aha-pagination> (+ <aha-icon>)
 *   <aha-pagination total="248" page-size="20" current="3"></aha-pagination>
 *   <aha-pagination pages="12" current="3" size="small"></aha-pagination>
 *   <aha-pagination pages="12" current="3" simple></aha-pagination>
 *
 * A page selector for a paged list or table — prev / numbered pages / next. The DS V3 Pagination
 * is a family, not one shape: it computes a page WINDOW with ellipses ("…") for long ranges from
 * `total`+`page-size` (or a direct `pages` count); it comes in two `size`s (default 32px, `small`
 * 24px); a `simple` mode collapses the numbers to "prev · n / total · next"; and the whole control
 * can be `disabled`. The current page is brand-filled; prev/next disable at the ends and carry the
 * DS caret glyph via <aha-icon>. Hover animates via the shared motion tokens on PERSISTENT nodes.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Emits a composed `change` event (detail { page }).
 */
import './icons.js';   // registers <aha-icon> so the prev/next caret glyphs resolve from the DS library

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px }
  .pg{ display:flex; align-items:center; gap:6px }
  .page,.nav-btn{ box-sizing:border-box; min-width:32px; height:32px; padding:0 6px;
    display:inline-flex; align-items:center; justify-content:center;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .page:not(.current):not([disabled]):hover,.nav-btn:not([disabled]):hover{ border-color:var(--aha-border-hover,#D3B4FF); color:var(--aha-color-primary,#6A1EBB) }
  .page:focus-visible,.nav-btn:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
  .page.current{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB); color:var(--aha-text-inverse,#FFFFFF) }
  .page[disabled],.nav-btn[disabled]{ color:var(--aha-text-disabled,#B5B5B5); border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed }
  .page.current[disabled]{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB); color:var(--aha-text-inverse,#FFFFFF); opacity:.55 }
  .ellipsis{ min-width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; color:var(--aha-text-tertiary,#8A8A8A) }

  /* size=small — the compact 24px scale */
  :host([size="small"]){ font-size:12px }
  :host([size="small"]) .page,:host([size="small"]) .nav-btn,:host([size="small"]) .ellipsis{ min-width:24px; height:24px; padding:0 4px }
  :host([size="small"]) .page,:host([size="small"]) .nav-btn{ border-radius:var(--aha-radius-sm,6px) }

  /* simple mode — prev · n / total · next */
  .simple{ min-width:auto; padding:0 8px; color:var(--aha-text-default,#1A1A1A); font-weight:600 }
  .simple b{ color:var(--aha-color-primary,#6A1EBB) }
`;

// A compact page window with ellipses: [1 … lo…hi … total]; short ranges list every page.
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const lo = Math.max(2, current - 1), hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push('…');
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push('…');
  out.push(total);
  return out;
}

export class AhaPagination extends HTMLElement {
  static get observedAttributes() { return ['total', 'page-size', 'pages', 'current', 'size', 'simple', 'disabled']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  get totalPages() {
    // `pages` (a direct count) wins; otherwise derive from total ÷ page-size.
    const direct = this.getAttribute('pages');
    if (direct != null && direct !== '') return Math.max(1, Math.floor(Number(direct) || 1));
    return Math.max(1, Math.ceil(Number(this.getAttribute('total') || 0) / Number(this.getAttribute('page-size') || 10)));
  }
  get current() { return Math.min(this.totalPages, Math.max(1, Number(this.getAttribute('current') || 1))); }
  get disabled() { return this.hasAttribute('disabled'); }
  _go(page) {
    if (this.disabled) return;
    const p = Math.min(this.totalPages, Math.max(1, page));
    if (p === this.current) return;
    this.setAttribute('current', String(p));   // reflect; observedAttributes re-renders (aria-current can't desync)
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { page: p } }));
  }
  _render() {
    const cur = this.current, total = this.totalPages, off = this.disabled;
    const simple = this.hasAttribute('simple');
    const nav = (dir, atEnd) =>
      `<button class="nav-btn" part="nav" data-dir="${dir}" ${off || atEnd ? 'disabled' : ''} aria-label="${dir === -1 ? 'Previous page' : 'Next page'}"><aha-icon name="system-caret-${dir === -1 ? 'left' : 'right'}" size="16" decorative></aha-icon></button>`;
    let body;
    if (simple) {
      body = `<span class="simple" part="simple" aria-current="page" aria-label="Page ${cur} of ${total}"><b>${cur}</b> / ${total}</span>`;
    } else {
      body = pageList(cur, total).map((p) => p === '…'
        ? `<span class="ellipsis" part="ellipsis" aria-hidden="true">…</span>`
        : `<button class="page${p === cur ? ' current' : ''}" part="page" data-page="${p}" ${off ? 'disabled' : ''} aria-label="Page ${p}" ${p === cur ? 'aria-current="page"' : ''}>${p}</button>`).join('');
    }
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><nav class="pg" part="pg" role="navigation" aria-label="Pagination">${nav(-1, cur <= 1)}${body}${nav(1, cur >= total)}</nav>`;
    this.shadowRoot.querySelectorAll('.page').forEach((b) => b.addEventListener('click', () => { if (!b.hasAttribute('disabled')) this._go(Number(b.getAttribute('data-page'))); }));
    this.shadowRoot.querySelectorAll('.nav-btn').forEach((b) => b.addEventListener('click', () => { if (!b.hasAttribute('disabled')) this._go(cur + Number(b.getAttribute('data-dir'))); }));
  }
}

export function defineAhaPagination(tag = 'aha-pagination') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPagination);
  return true;
}
if (typeof window !== 'undefined') defineAhaPagination();

export default { AhaPagination, defineAhaPagination };
