/**
 * @ahaslides-product/design/aha-screen-heading — the shared product page-header primitive.
 *
 *   import '@ahaslides-product/design/aha-screen-heading';   // registers <aha-screen-heading> (+ <aha-breadcrumb>)
 *   <aha-screen-heading title="Welcome, Brian!" highlight="Brian">
 *     <aha-button slot="actions" variant="primary">New presentation</aha-button>
 *   </aha-screen-heading>
 *
 * A product page header: a TITLE AREA on the left (either a page title / greeting — with an optional
 * brand-accent span for a highlighted name, "Welcome, **Brian**!" — OR a `›`-arrow breadcrumb trail
 * for a sub-page) and an ACTIONS AREA on the right (buttons the consumer slots in). Responsive across
 * desktop / tablet / phone; on phone the actions wrap below the title.
 *
 * REUSE, not rewrite: the breadcrumb trail is the shipped <aha-breadcrumb> primitive (never a second
 * breadcrumb), and the actions are whatever <aha-button>s the consumer drops into slot="actions"
 * (never a hand-rolled button). This element only lays the two areas out.
 *
 * Attributes:
 *   title        the page title / greeting (Heading4 — 24 / 600 / --aha-text-default).
 *   highlight    optional substring of `title` rendered in --aha-color-primary (e.g. the person's name).
 *   breadcrumb   optional JSON array [{ label, href? }] — when present, a `›` trail renders as the
 *                title via <aha-breadcrumb> instead of the plain title.
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
import './aha-breadcrumb.js';   // registers <aha-breadcrumb> so a breadcrumb title trail resolves from the DS

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .root{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap }
  .titleArea{ display:flex; flex-direction:column; gap:8px; min-width:0 }
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

  // Render the title with the optional highlight substring wrapped in a brand-accent span.
  _titleHtml() {
    const title = this.getAttribute('title') || '';
    const hl = this.getAttribute('highlight') || '';
    if (!hl || !title.includes(hl)) return esc(title);
    const i = title.indexOf(hl);
    return `${esc(title.slice(0, i))}<span class="hl" part="highlight">${esc(hl)}</span>${esc(title.slice(i + hl.length))}`;
  }

  _render() {
    const crumbs = this._breadcrumb();
    const desc = this.getAttribute('description') || '';
    // The title trail: a reused <aha-breadcrumb> when a breadcrumb is supplied, else the plain title.
    const titleNode = crumbs
      ? `<aha-breadcrumb part="breadcrumb" items='${esc(JSON.stringify(crumbs))}'></aha-breadcrumb>`
      : `<h1 class="title" part="title">${this._titleHtml()}</h1>`;
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
