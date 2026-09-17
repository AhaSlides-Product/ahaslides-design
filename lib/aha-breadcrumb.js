/**
 * @ahaslides-product/design/aha-breadcrumb — the shared Breadcrumb primitive.
 *
 *   import '@ahaslides-product/design/aha-breadcrumb';   // registers <aha-breadcrumb> (+ <aha-icon>)
 *   <aha-breadcrumb items='[{"label":"Home","href":"/","icon":"system-house"},{"label":"Slides","href":"/s"},{"label":"Editor"}]'></aha-breadcrumb>
 *
 * A trail of ancestor links ending in the current page. Feed it an `items` JSON array; each entry:
 *   { label, href?, icon?, disabled? }
 * An entry with an `href` renders a link; the LAST (or any href-less) entry is the current page —
 * non-link, `aria-current="page"`, in a stronger colour. A leading `icon` is drawn by name via
 * <aha-icon> from the DS library (never a hand-rolled glyph). A `disabled` entry is muted + inert.
 *
 * PAGE TITLE — this element also carries the page heading. `size="page-title"` renders the current
 * crumb as a REAL heading (an <h1> by default, `heading-level` picks h1–h6): a single-item trail is
 * the page title on its own (Heading4 24/600), and a longer trail is the heading with its ancestor
 * path in front (18/600). This is why AhaSlides has no separate "page title" component — the breadcrumb
 * IS the page title. Never hand-roll a plain <h1> for a page header; reach for this instead.
 *
 * Attributes:
 *   items        JSON array (above).
 *   size         "default" (13/22, sub-page nav) | "mini" (12/18, compact) |
 *                "page-title" (the current crumb becomes the page heading — 24/600 solo, 18/600 in a trail).
 *   heading-level  1–6 — the heading tag used for the current crumb in size="page-title" (default 1).
 *   separator    "caret" (the DS caret glyph, default) | "slash" (a "/" divider).
 *   maxItems     collapse the middle into an ellipsis "…" when the trail is longer than N,
 *                always keeping the first crumb + the last (maxItems − 1). 0/absent = never collapse.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Links + the ellipsis toggle animate on hover via the shared motion tokens on persistent nodes.
 * Emits a composed `navigate` event (detail { index, href }) on a link click; the ellipsis expands
 * the collapsed trail in place (no navigation).
 */
import './icons.js';   // registers <aha-icon> so the separator + leading glyphs resolve from the DS library

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    font-size:13px; line-height:22px; letter-spacing:.2px }
  :host([size="mini"]){ font-size:12px; line-height:18px; letter-spacing:.3px }
  :host([size="page-title"]){ font-size:18px; line-height:1.3; letter-spacing:.2px }
  .nav{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; list-style:none; margin:0; padding:0 }
  :host([size="mini"]) .nav{ gap:4px }
  .li{ display:inline-flex; align-items:center; gap:8px }
  :host([size="mini"]) .li{ gap:4px }
  /* crumb text inherits the size scale from :host; only colour + weight differ per role */
  .crumb{ display:inline-flex; align-items:center; gap:6px; font:inherit; letter-spacing:inherit;
    color:var(--aha-text-secondary,#4A4A4A); text-decoration:none; cursor:pointer;
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .crumb:hover{ color:var(--aha-color-primary,#6A1EBB) }
  .crumb:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .crumb[aria-disabled="true"]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; pointer-events:none }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .sep{ display:inline-flex; align-items:center; color:var(--aha-icon-muted,#8A8A8A); user-select:none }
  .current{ display:inline-flex; align-items:center; gap:6px; font:inherit; letter-spacing:inherit;
    color:var(--aha-text-default,#1A1A1A); font-weight:600; margin:0 }
  /* page title — the whole trail reads at heading weight; the standalone title is Heading4 24/600 */
  :host([size="page-title"]) .crumb{ font-weight:600 }
  :host([size="page-title"]) .current.solo{ font-size:24px; letter-spacing:0 }
  :host([size="page-title"]) .ellipsis{ font-size:14px; font-weight:400 }
  /* the collapse toggle — a persistent <button>; hover animates via the shared motion tokens */
  .ellipsis{ display:inline-flex; align-items:center; padding:0 4px; border:0; background:transparent; font:inherit; line-height:1;
    color:var(--aha-text-secondary,#4A4A4A); cursor:pointer; border-radius:var(--aha-radius-xs,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .ellipsis:hover{ color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-hover,#F7F7F7) }
  .ellipsis:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
`;

export class AhaBreadcrumb extends HTMLElement {
  static get observedAttributes() { return ['items', 'separator', 'size', 'heading-level', 'headinglevel', 'maxItems', 'maxitems']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (name === 'items' || name === 'maxItems' || name === 'maxitems') this._expanded = false;   // a new trail collapses afresh
    if (this.shadowRoot) this._render();
  }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _maxItems() { const n = parseInt(this.getAttribute('maxItems') || this.getAttribute('maxitems') || '0', 10); return Number.isFinite(n) && n > 1 ? n : 0; }
  _size() { const s = (this.getAttribute('size') || 'default').toLowerCase(); return s === 'mini' || s === 'page-title' ? s : 'default'; }
  _headingTag() { const n = parseInt(this.getAttribute('heading-level') || this.getAttribute('headinglevel') || '1', 10); return `h${Number.isFinite(n) && n >= 1 && n <= 6 ? n : 1}`; }
  _iconSize() { return this._size() === 'mini' ? 12 : this._size() === 'page-title' ? 16 : 14; }
  _sepSize() { return this._size() === 'page-title' ? 16 : 12; }

  _sepHtml() {
    // caret (default) draws the DS glyph; slash is a token-coloured "/" text divider.
    if ((this.getAttribute('separator') || 'caret') === 'slash') return `<span class="sep" part="separator" aria-hidden="true">/</span>`;
    return `<span class="sep" part="separator"><aha-icon name="system-caret-right" size="${this._sepSize()}" decorative></aha-icon></span>`;
  }
  _crumbHtml(it, i, isCurrent, solo) {
    const icon = it.icon ? `<aha-icon name="${esc(it.icon)}" size="${this._iconSize()}" aria-hidden="true"></aha-icon>` : '';
    if (isCurrent || it.href == null) {
      // In page-title size the current crumb IS the page heading — render a real <h1>..<h6>.
      // `solo` (the only crumb) gets the larger standalone Heading4 treatment.
      if (this._size() === 'page-title') {
        const tag = this._headingTag();
        return `<${tag} class="current${solo ? ' solo' : ''}" part="current" aria-current="page">${icon}${esc(it.label)}</${tag}>`;
      }
      return `<span class="current" part="current" aria-current="page">${icon}${esc(it.label)}</span>`;
    }
    if (it.disabled) {
      return `<span class="crumb" part="item" aria-disabled="true">${icon}${esc(it.label)}</span>`;
    }
    return `<a class="crumb" part="item" href="${esc(it.href)}" data-i="${i}">${icon}${esc(it.label)}</a>`;
  }
  _liHtml(inner, isLast) { return `<li class="li" part="crumb">${inner}${isLast ? '' : this._sepHtml()}</li>`; }

  _render() {
    const items = this._items();
    const max = this._maxItems();
    // collapse the middle: keep item[0] + an ellipsis toggle + the trailing (max-1) items, until the
    // user clicks the ellipsis (this._expanded), which reveals the full trail in place.
    let cells;
    if (max && items.length > max && !this._expanded) {
      const tailStart = items.length - (max - 1);
      cells = [{ __kind: 'crumb', it: items[0], i: 0 }, { __kind: 'ellipsis' },
        ...items.slice(tailStart).map((it, k) => ({ __kind: 'crumb', it, i: tailStart + k }))];
    } else {
      cells = items.map((it, i) => ({ __kind: 'crumb', it, i }));
    }
    // the standalone page title: a single crumb, no ancestor path in front of it
    const solo = items.length === 1;

    const html = cells.map((cell, ci) => {
      const isLast = ci === cells.length - 1;
      if (cell.__kind === 'ellipsis') {
        return this._liHtml(`<button class="ellipsis" part="ellipsis" type="button" aria-label="Show hidden breadcrumbs" aria-expanded="false">…</button>`, isLast);
      }
      const isCurrent = cell.i === items.length - 1;
      return this._liHtml(this._crumbHtml(cell.it, cell.i, isCurrent, solo), isLast);
    }).join('');

    this.shadowRoot.innerHTML = `<style>${STYLE}</style><nav part="root" aria-label="Breadcrumb"><ol class="nav" part="nav">${html}</ol></nav>`;
    this.shadowRoot.querySelectorAll('.crumb[data-i]').forEach((a) => a.addEventListener('click', (e) => {
      // A real <a href> would trigger a native full-page reload; the DS emits an SPA navigate instead.
      e.preventDefault();
      const i = Number(a.getAttribute('data-i'));
      this.dispatchEvent(new CustomEvent('navigate', { bubbles: true, composed: true, detail: { index: i, href: a.getAttribute('href') } }));
    }));
    const ell = this.shadowRoot.querySelector('.ellipsis');
    if (ell) ell.addEventListener('click', () => { this._expanded = true; this._render(); });
  }
}

export function defineAhaBreadcrumb(tag = 'aha-breadcrumb') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBreadcrumb);
  return true;
}
if (typeof window !== 'undefined') defineAhaBreadcrumb();

export default { AhaBreadcrumb, defineAhaBreadcrumb };
