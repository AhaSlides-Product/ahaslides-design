/**
 * @ahaslides-product/design/aha-card — the shared Card primitive.
 *
 *   import '@ahaslides-product/design/aha-card';   // registers <aha-card>
 *   <aha-card card-title="Live poll">Body content</aha-card>
 *
 * A surface that groups related content — an optional cover image, a title header with a right-aligned
 * `extra` action, a body, and an optional footer of `actions`. The DS V3 Card is a FAMILY, not a single
 * box: `size` (default · small) tunes the padding, `bordered` toggles the outline, `hoverable` lifts the
 * card on hover, and `loading` swaps the body for a shimmer skeleton. ONE element, shadow-DOM CSS, themed
 * only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 *
 * Slots:
 *   (default)   the body content
 *   cover       a full-bleed image/media strip above the header (no inset)
 *   extra       a right-aligned header action (a link or button)
 *   actions     a footer row of actions, ruled off from the body
 *
 * Hover lift, border colour and shadow all animate via the shared motion tokens on a PERSISTENT node —
 * :host([hoverable]:hover) toggles the .card class state, the subtree is never rebuilt on hover, so the
 * transition actually fires.
 */
const STYLE = `
  :host{ display:block }
  .card{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-lg,12px); overflow:hidden;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    transition:box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }

  /* borderless variant — a flat surface with no outline */
  :host([bordered="false"]) .card{ border-color:transparent }

  /* cover — full-bleed media above the header, no inset */
  .cover{ display:block }
  .cover ::slotted(*){ display:block; width:100%; margin:0 }

  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:16px 20px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:16px; line-height:24px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .body{ padding:20px; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  .actions{ display:flex; align-items:center; gap:8px; padding:12px 20px;
    border-top:1px solid var(--aha-split,#F1F1F1) }

  /* small size — tighter padding, smaller title (antd Card size=small) */
  :host([size="small"]) .head{ padding:8px 12px; font-size:14px; line-height:22px }
  :host([size="small"]) .body{ padding:12px }
  :host([size="small"]) .actions{ padding:8px 12px }

  :host([hoverable]) .card{ cursor:pointer }
  :host([hoverable]:hover) .card{ border-color:var(--aha-border-hover,#D3B4FF); box-shadow:0 4px 12px var(--aha-ink-a10,rgba(26,26,46,.1)) }

  /* loading skeleton — a shimmer that sweeps a persistent set of bars */
  .skeleton{ display:flex; flex-direction:column; gap:12px }
  .sk-bar{ height:14px; border-radius:var(--aha-radius-sm,4px);
    background:linear-gradient(90deg, var(--aha-bg-hover,#F7F7F7) 25%, var(--aha-split,#F1F1F1) 37%, var(--aha-bg-hover,#F7F7F7) 63%);
    background-size:400% 100%; animation:sk-sweep var(--aha-motion-slow,.3s) linear infinite;
    animation-duration:1.4s }
  .sk-bar.w60{ width:60% }
  .sk-bar.w80{ width:80% }
  @keyframes sk-sweep{ 0%{ background-position:100% 0 } 100%{ background-position:0 0 } }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important; animation:none !important } }
`;

const SKELETON = `<div class="skeleton" aria-hidden="true"><div class="sk-bar w60"></div><div class="sk-bar"></div><div class="sk-bar"></div><div class="sk-bar w80"></div></div>`;

export class AhaCard extends HTMLElement {
  static get observedAttributes() { return ['card-title', 'loading']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const title = this.getAttribute('card-title');
    const loading = this.hasAttribute('loading');
    const head = title
      ? `<div class="head" part="head"><span class="title">${title}</span><span class="extra"><slot name="extra"></slot></span></div>`
      : '';
    const body = loading
      ? `<div class="body" part="body" aria-busy="true">${SKELETON}</div>`
      : `<div class="body" part="body"><slot></slot></div>`;
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><div class="card" part="card">` +
      `<div class="cover" part="cover"><slot name="cover"></slot></div>` +
      head + body +
      `<div class="actions" part="actions" role="group"><slot name="actions"></slot></div>` +
      `</div>`;
    // Hide the cover / actions wrappers when their slot is empty (no stray border/padding).
    this._syncSlot('cover');
    this._syncSlot('actions');
  }
  _syncSlot(name) {
    const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
    if (!slot) return;
    const wrap = slot.parentElement;
    const sync = () => { wrap.style.display = slot.assignedNodes().length ? '' : 'none'; };
    sync();
    slot.addEventListener('slotchange', sync);
  }
}

export function defineAhaCard(tag = 'aha-card') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCard);
  return true;
}
if (typeof window !== 'undefined') defineAhaCard();

export default { AhaCard, defineAhaCard };
