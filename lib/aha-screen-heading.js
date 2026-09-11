/**
 * @ahaslides-product/design/aha-screen-heading — the shared product page-header primitive.
 *
 *   import '@ahaslides-product/design/aha-screen-heading';   // registers <aha-screen-heading> (+ <aha-breadcrumb>)
 *   <aha-screen-heading title="Welcome, Brian!" highlight="Brian">
 *     <aha-button slot="actions" variant="primary">New presentation</aha-button>
 *   </aha-screen-heading>
 *
 * A product page header: a TITLE AREA on the left (either a page title / breadcrumb trail — OR a
 * brand-accent greeting, "Welcome, **Brian**!") and an ACTIONS AREA on the right (buttons the consumer
 * slots in). Responsive across desktop / tablet / phone; on phone the actions wrap below the title.
 *
 * REUSE, not rewrite: the PAGE TITLE is the shipped <aha-breadcrumb size="page-title"> primitive — the
 * DS's single owner of the page-heading role — for BOTH a top-level title (a single-crumb page title)
 * and a sub-page `›` trail (the heading with its ancestor path in front). This element never hand-rolls
 * an <h1> for a page title; the one <h1> it renders itself is the accent-name greeting, which the
 * breadcrumb can't express (a coloured substring mid-label). Actions are whatever <aha-button>s the
 * consumer drops into slot="actions" (never a hand-rolled button). This element only lays the two
 * areas out.
 *
 * Attributes:
 *   title        the page title (rendered as the current crumb of <aha-breadcrumb size="page-title">,
 *                Heading4 24 / 600 / --aha-text-default) — or, with `highlight`, a brand-accent greeting.
 *   highlight    optional substring of `title` rendered in --aha-color-primary (e.g. the person's name).
 *                When set, the title is a greeting <h1> (the accent span the breadcrumb can't render).
 *   breadcrumb   optional JSON array [{ label, href? }] — when present, a `›` trail renders as the
 *                page title via <aha-breadcrumb size="page-title"> instead of the plain title.
 *   description  optional subtitle (14 / --aha-text-secondary) under the title.
 *   device       "desktop" (default) | "tablet" | "phone" — deterministic responsive layout for the
 *                docs / qa. Desktop + tablet: title left, actions right on one row. Phone: actions
 *                wrap below the title.
 *
 * Slot:
 *   actions      the right-hand action buttons (drop <aha-button>s here).
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. The
 * layout is static (no interactive state of its own), so it ships no transition; any motion lives on
 * the reused <aha-button> / <aha-breadcrumb> children.
 */
import './aha-breadcrumb.js';   // registers <aha-breadcrumb> — the DS page-title / trail primitive

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .root{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap }
  .titleArea{ display:flex; flex-direction:column; gap:8px; min-width:0 }
  /* the accent greeting — the one title the breadcrumb can't render (a coloured name mid-label);
     matches the breadcrumb page-title solo exactly (24 / 600 / line-height 1.3 / letter-spacing 0). */
  .title{ margin:0; font-size:24px; line-height:1.3; font-weight:600; letter-spacing:0;
    color:var(--aha-text-default,#1A1A1A) }
  .hl{ color:var(--aha-color-primary,#6A1EBB) }
  .desc{ margin:0; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  .actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; flex:0 0 auto }
  ::slotted([slot="actions"]){ flex:0 0 auto }
  /* Deterministic responsive layout for the docs / qa (mirrors the Figma device variants). */
  :host([device="phone"]) .root{ flex-direction:column; align-items:stretch }
  :host([device="phone"]) .actions{ justify-content:flex-start }
`;

export class AhaScreenHeading extends HTMLElement {
  static get observedAttributes() { return ['title', 'highlight', 'breadcrumb', 'description', 'device']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _breadcrumb() {
    const raw = this.getAttribute('breadcrumb');
    if (!raw) return null;
    try { const a = JSON.parse(raw); return Array.isArray(a) && a.length ? a : null; } catch { return null; }
  }

  // Render the greeting title with the highlight substring wrapped in a brand-accent span.
  _titleHtml() {
    const title = this.getAttribute('title') || '';
    const hl = this.getAttribute('highlight') || '';
    if (!hl || !title.includes(hl)) return esc(title);
    const i = title.indexOf(hl);
    return `${esc(title.slice(0, i))}<span class="hl" part="highlight">${esc(hl)}</span>${esc(title.slice(i + hl.length))}`;
  }

  _render() {
    const crumbs = this._breadcrumb();
    const title = this.getAttribute('title') || '';
    const hl = this.getAttribute('highlight') || '';
    const desc = this.getAttribute('description') || '';
    // The page title. A sub-page trail and a plain page title BOTH delegate to the shipped
    // <aha-breadcrumb size="page-title"> (the DS page-heading role). The one exception is the
    // brand-accent greeting, which the breadcrumb can't render (a coloured span mid-label) — that
    // stays a local <h1>, styled to match the breadcrumb page-title solo.
    let titleNode;
    if (crumbs) {
      titleNode = `<aha-breadcrumb part="breadcrumb" size="page-title" heading-level="1" items='${esc(JSON.stringify(crumbs))}'></aha-breadcrumb>`;
    } else if (hl && title.includes(hl)) {
      titleNode = `<h1 class="title" part="title">${this._titleHtml()}</h1>`;
    } else {
      titleNode = `<aha-breadcrumb part="title" size="page-title" heading-level="1" items='${esc(JSON.stringify([{ label: title }]))}'></aha-breadcrumb>`;
    }
    const descNode = desc ? `<p class="desc" part="description">${esc(desc)}</p>` : '';

    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <header class="root" part="root">
        <div class="titleArea" part="title-area">${titleNode}${descNode}</div>
        <div class="actions" part="actions"><slot name="actions"></slot></div>
      </header>`;
  }
}

export function defineAhaScreenHeading(tag = 'aha-screen-heading') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaScreenHeading);
  return true;
}
if (typeof window !== 'undefined') defineAhaScreenHeading();

export default { AhaScreenHeading, defineAhaScreenHeading };
