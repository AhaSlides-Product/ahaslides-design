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
 * Attributes:
 *   items        JSON array (above).
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
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; line-height:22px }
  .nav{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; list-style:none; margin:0; padding:0 }
  .li{ display:inline-flex; align-items:center; gap:8px }
  .crumb{ display:inline-flex; align-items:center; gap:6px;
    color:var(--aha-text-secondary,#4A4A4A); text-decoration:none; cursor:pointer;
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .crumb:hover{ color:var(--aha-color-primary,#6A1EBB) }
  .crumb:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .crumb[aria-disabled="true"]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed; pointer-events:none }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .sep{ display:inline-flex; align-items:center; color:var(--aha-icon-muted,#8A8A8A); user-select:none }
  .current{ display:inline-flex; align-items:center; gap:6px; color:var(--aha-text-default,#1A1A1A); font-weight:600 }
  /* the collapse toggle — a persistent <button>; hover animates via the shared motion tokens */
  .ellipsis{ display:inline-flex; align-items:center; padding:0 4px; border:0; background:transparent; font:inherit; line-height:1;
    color:var(--aha-text-secondary,#4A4A4A); cursor:pointer; border-radius:var(--aha-radius-xs,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .ellipsis:hover{ color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-hover,#F7F7F7) }
  .ellipsis:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
`;

export class AhaBreadcrumb extends HTMLElement {
  static get observedAttributes() { return ['items', 'separator', 'maxItems', 'maxitems']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (name === 'items' || name === 'maxItems' || name === 'maxitems') this._expanded = false;   // a new trail collapses afresh
    if (this.shadowRoot) this._render();
  }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _maxItems() { const n = parseInt(this.getAttribute('maxItems') || this.getAttribute('maxitems') || '0', 10); return Number.isFinite(n) && n > 1 ? n : 0; }

  _sepHtml() {
    // caret (default) draws the DS glyph; slash is a token-coloured "/" text divider.
    if ((this.getAttribute('separator') || 'caret') === 'slash') return `<span class="sep" part="separator" aria-hidden="true">/</span>`;
    return `<span class="sep" part="separator"><aha-icon name="system-caret-right" size="12" decorative></aha-icon></span>`;
  }
  _crumbHtml(it, i, isCurrent) {
    const icon = it.icon ? `<aha-icon name="${esc(it.icon)}" size="14" aria-hidden="true"></aha-icon>` : '';
    if (isCurrent || it.href == null) {
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

    const html = cells.map((cell, ci) => {
      const isLast = ci === cells.length - 1;
      if (cell.__kind === 'ellipsis') {
        return this._liHtml(`<button class="ellipsis" part="ellipsis" type="button" aria-label="Show hidden breadcrumbs" aria-expanded="false">…</button>`, isLast);
      }
      const isCurrent = cell.i === items.length - 1;
      return this._liHtml(this._crumbHtml(cell.it, cell.i, isCurrent), isLast);
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
