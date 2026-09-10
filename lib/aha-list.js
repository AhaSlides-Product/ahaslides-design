/**
 * @ahaslides-product/design/aha-list — the shared List primitive.
 *
 *   import '@ahaslides-product/design/aha-list';   // registers <aha-list>
 *   <aha-list list-title="Recent decks" bordered
 *     items='[{"title":"Team offsite","description":"12 slides","avatar":"system-user-circle",
 *              "actions":[{"key":"edit","icon":"system-pencil-simple"},{"key":"del","icon":"system-trash","danger":true}]}]'>
 *   </aha-list>
 *
 * A vertical list of uniform rows — a recent-items feed, a participant list, a settings list.
 * Two ways to feed it, mix freely:
 *   • `items` — a JSON array of structured rows: { title, description?, avatar?, actions?:[{key,icon,danger?}] }.
 *     The row lays out an optional leading avatar/icon, a title + description meta block, and a
 *     trailing actions cluster.
 *   • light-DOM children — each becomes one plain row (the free-form escape hatch).
 *
 * Config: `size` (small · default · large row padding), `bordered` (outer container border),
 * `split` (row dividers on/off — on by default), `list-title` (header), `footer` (footer text),
 * `loading` (skeleton rows). The last row drops its divider; rows highlight on hover when the row is
 * interactive (has actions). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. Emits a composed `action` (detail {key, index}) on an action click.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .list{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF); border-radius:var(--aha-radius-lg,12px); overflow:hidden }
  /* bordered — outer container border (opt-in) */
  :host([bordered]) .list{ border:1px solid var(--aha-border,#E3E3E3) }

  .head{ padding:14px 20px; font-size:15px; line-height:22px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .foot{ padding:12px 20px; font-size:13px; line-height:20px; color:var(--aha-text-tertiary,#8A8A8A) }

  /* row — a persistent node; background animates on hover (never rebuilt per-state) */
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:12px; padding:12px 20px;
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  /* size — row vertical padding scale */
  :host([size="small"]) .row{ padding-top:8px; padding-bottom:8px }
  :host([size="large"]) .row{ padding-top:16px; padding-bottom:16px }
  /* split — row dividers (on by default; the header + first row keep the header rule) */
  .row + .row, .head + .row, .head + .rows > .row:first-child{ border-top:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .row + .row{ border-top:none }
  .head{ border-bottom:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .head{ border-bottom:none }
  .foot{ border-top:1px solid var(--aha-split,#F1F1F1) }
  :host([split="false"]) .foot{ border-top:none }
  /* interactive rows (actions present) highlight on hover */
  .row.interactive:hover{ background:var(--aha-bg-hover,#F7F7F7) }

  .avatar{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center;
    width:36px; height:36px; border-radius:var(--aha-radius-pill,999px); background:var(--aha-bg-accent,#F9F5FF);
    color:var(--aha-color-primary,#6A1EBB) }
  .meta{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px }
  .title{ font-weight:600; color:var(--aha-text-default,#1A1A1A); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .desc{ color:var(--aha-text-tertiary,#8A8A8A); font-size:13px; line-height:20px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .actions{ flex:0 0 auto; display:inline-flex; align-items:center; gap:4px }
  .act{ display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border:0;
    border-radius:var(--aha-radius-sm,6px); background:transparent; color:var(--aha-text-tertiary,#8A8A8A); cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .act:hover{ background:var(--aha-bg-hover,#F7F7F7); color:var(--aha-text-default,#1A1A1A) }
  .act:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }
  .act.danger:hover{ background:color-mix(in srgb, var(--aha-color-error,#F5222D) 8%, transparent); color:var(--aha-color-error,#F5222D) }

  /* loading skeleton — a shimmer bar on a persistent node */
  .skeleton{ height:12px; border-radius:var(--aha-radius-xs,4px); background:var(--aha-split,#F1F1F1);
    animation:aha-shimmer var(--aha-motion-slow,.3s) ease-in-out infinite alternate }
  @keyframes aha-shimmer{ from{ opacity:.55 } to{ opacity:1 } }

  ::slotted(*){ display:block; box-sizing:border-box; padding:12px 20px;
    font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  ::slotted(*:hover){ background:var(--aha-bg-hover,#F7F7F7) }
  @media (prefers-reduced-motion: reduce){ .row, .act, ::slotted(*){ transition:none !important } .skeleton{ animation:none } }
`;

export class AhaList extends HTMLElement {
  static get observedAttributes() { return ['list-title', 'footer', 'items', 'size', 'bordered', 'split', 'loading']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _items() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }

  _rowHtml(it, i) {
    const avatar = it.avatar
      ? `<span class="avatar" part="avatar"><aha-icon name="${esc(it.avatar)}" size="20" aria-hidden="true"></aha-icon></span>`
      : '';
    const desc = it.description ? `<div class="desc">${esc(it.description)}</div>` : '';
    const meta = `<div class="meta"><div class="title">${esc(it.title || '')}</div>${desc}</div>`;
    const acts = Array.isArray(it.actions) && it.actions.length
      ? `<div class="actions" part="actions">` + it.actions.map((a) =>
          `<button class="act${a.danger ? ' danger' : ''}" part="action" data-key="${esc(a.key || '')}" data-index="${i}"` +
          `${a.label ? ` aria-label="${esc(a.label)}"` : ''}><aha-icon name="${esc(a.icon)}" size="16" aria-hidden="true"></aha-icon></button>`
        ).join('') + `</div>`
      : '';
    const interactive = acts ? ' interactive' : '';
    return `<div class="row${interactive}" part="row" role="listitem">${avatar}${meta}${acts}</div>`;
  }
  _skeletonHtml() {
    return Array.from({ length: 3 }, () =>
      `<div class="row" part="row"><div class="meta"><div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:35%"></div></div></div>`
    ).join('');
  }
  _render() {
    const title = this.getAttribute('list-title');
    const footer = this.getAttribute('footer');
    const loading = this.hasAttribute('loading');
    const head = title ? `<div class="head" part="head">${esc(title)}</div>` : '';
    const foot = footer ? `<div class="foot" part="foot">${esc(footer)}</div>` : '';
    const items = this._items();
    const body = loading
      ? `<div class="rows" role="list">${this._skeletonHtml()}</div>`
      : items.length
        ? `<div class="rows" role="list">${items.map((it, i) => this._rowHtml(it, i)).join('')}</div>`
        : `<slot></slot>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="list" part="list">${head}${body}${foot}</div>`;
    this.shadowRoot.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('action', {
        bubbles: true, composed: true,
        detail: { key: b.getAttribute('data-key'), index: Number(b.getAttribute('data-index')) },
      }));
    }));
  }
}

export function defineAhaList(tag = 'aha-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaList);
  return true;
}
if (typeof window !== 'undefined') defineAhaList();

export default { AhaList, defineAhaList };
