/**
 * @ahaslides-product/design/aha-breadcrumb — the shared Breadcrumb primitive.
 *
 *   import '@ahaslides-product/design/aha-breadcrumb';   // registers <aha-breadcrumb> (+ <aha-icon>)
 *   <aha-breadcrumb items='[{"label":"Home","href":"/"},{"label":"Slides","href":"/s"},{"label":"Editor"}]'></aha-breadcrumb>
 *
 * A trail of ancestor links ending in the current page. Feed it an `items` JSON array;
 * an entry with an `href` renders a link, the last (or any href-less) entry is the current
 * page. The separator is the DS caret glyph via <aha-icon> — never a hand-rolled mark.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and
 * Vue. Emits a composed `navigate` event with the clicked item's index + href.
 */
import './icons.js';   // registers <aha-icon> so the separator glyph resolves from the DS library

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; line-height:22px }
  .nav{ display:flex; align-items:center; flex-wrap:wrap; gap:8px }
  .crumb{ color:var(--aha-text-secondary,#4A4A4A); text-decoration:none; cursor:pointer;
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .crumb:hover{ color:var(--aha-color-primary,#6A1EBB) }
  .crumb:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .sep{ display:inline-flex; align-items:center; color:var(--aha-icon-muted,#8A8A8A) }
  .current{ color:var(--aha-text-tertiary,#8A8A8A); font-weight:600 }
`;

export class AhaBreadcrumb extends HTMLElement {
  static get observedAttributes() { return ['items']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
  _render() {
    const items = this._items();
    const sep = `<span class="sep" part="separator"><aha-icon name="system-caret-right" size="12" decorative></aha-icon></span>`;
    const html = items.map((it, i) => {
      const last = i === items.length - 1;
      const node = (!last && it.href != null)
        ? `<a class="crumb" part="item" href="${esc(it.href)}" data-i="${i}">${esc(it.label)}</a>`
        : `<span class="current" part="current" aria-current="page">${esc(it.label)}</span>`;
      return node + (last ? '' : sep);
    }).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><nav class="nav" part="nav" aria-label="Breadcrumb">${html}</nav>`;
    this.shadowRoot.querySelectorAll('.crumb').forEach((a) => a.addEventListener('click', (e) => {
      const i = Number(a.getAttribute('data-i'));
      this.dispatchEvent(new CustomEvent('navigate', { bubbles: true, composed: true, detail: { index: i, href: a.getAttribute('href') } }));
    }));
  }
}

export function defineAhaBreadcrumb(tag = 'aha-breadcrumb') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBreadcrumb);
  return true;
}
if (typeof window !== 'undefined') defineAhaBreadcrumb();

export default { AhaBreadcrumb, defineAhaBreadcrumb };
