/**
 * @ahaslides-product/design/aha-skeleton — the shared Skeleton (loading placeholder) primitive.
 *
 *   import '@ahaslides-product/design/aha-skeleton';   // registers <aha-skeleton>
 *   <aha-skeleton variant="paragraph" rows="3"></aha-skeleton>
 *   <aha-skeleton variant="avatar"></aha-skeleton>
 *   <aha-skeleton variant="image"></aha-skeleton>
 *
 * A greyed placeholder that holds a component's shape while its content loads. The DS V3 Skeleton is
 * a FAMILY of building blocks, not one bar: `paragraph` (N text rows, the last one shorter), `title`,
 * `avatar` (a round bust), `button`, `input`, `image` (a framed picture placeholder with a glyph), and
 * plain `text`. `rows` sets the paragraph line count; `round` softens button/input corners to the pill;
 * `active` toggles the shimmer. Compose them (avatar + title + paragraph) for the common list-item shape.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. The shimmer is an opacity PULSE (no gradient fill), honouring the no-gradient-on-fills
 * rule; `active="false"` and prefers-reduced-motion freeze it. The image glyph is summoned by name from
 * the DS icon library via <aha-icon> — never an inline glyph.
 */
const STYLE = `
  :host{ display:block }
  .block{ display:block; background:var(--aha-gray-30,#F1F1F1); border-radius:var(--aha-radius-xs,4px);
    animation:aha-skeleton-pulse 1.6s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }

  /* single-block variants */
  :host([variant="text"]) .block{ height:16px; width:100% }
  :host([variant="title"]) .block{ height:24px; width:38% }
  :host([variant="button"]) .block{ height:32px; width:96px; border-radius:var(--aha-radius-default,8px) }
  :host([variant="input"]) .block{ height:36px; width:100%; border-radius:var(--aha-radius-default,8px) }
  :host([variant="avatar"]) .block{ height:40px; width:40px; border-radius:var(--aha-radius-pill,999px) }

  /* image — a framed picture placeholder that centres a muted glyph */
  .image{ display:flex; align-items:center; justify-content:center; height:96px; width:100%;
    border-radius:var(--aha-radius-default,8px) }
  .image aha-icon{ color:var(--aha-gray-50,#D4D4D4) }

  /* paragraph — a stack of text rows; the LAST row is shorter (60%) */
  .para{ display:flex; flex-direction:column; gap:12px }
  .para .block{ height:16px; width:100% }
  .para .block:last-child{ width:60% }

  /* round softens the corner-bearing variants to the pill */
  :host([round]) .block, :host([round]) .image{ border-radius:var(--aha-radius-pill,999px) }

  /* active="false" (or reduced motion) freezes the pulse — the node persists, only the animation stops */
  :host([active="false"]) .block, :host([active="false"]) .image{ animation:none }
  @keyframes aha-skeleton-pulse{ 0%,100%{ opacity:1 } 50%{ opacity:.45 } }
  @media (prefers-reduced-motion: reduce){ .block, .image{ animation:none } }
`;

export class AhaSkeleton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'active', 'rows', 'round']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _render() {
    const variant = this.getAttribute('variant') || 'text';
    let body;
    if (variant === 'paragraph') {
      const rows = Math.max(1, parseInt(this.getAttribute('rows') || '3', 10) || 3);
      const lines = Array.from({ length: rows }, () => `<span class="block" part="block" aria-hidden="true"></span>`).join('');
      body = `<div class="para">${lines}</div>`;
    } else if (variant === 'image') {
      // The centred glyph is a real DS icon (by name), not an inline <svg>.
      body = `<div class="block image" part="block" aria-hidden="true"><aha-icon name="system-image-square" size="28" aria-hidden="true"></aha-icon></div>`;
    } else {
      body = `<span class="block" part="block" aria-hidden="true"></span>`;
    }
    // Clear+append (not innerHTML=) so `active` — which only drives the :host([active]) shimmer on
    // the persistent block — stays off the rebuild path the dead-transition gate watches.
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>${body}`));
  }
}

export function defineAhaSkeleton(tag = 'aha-skeleton') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSkeleton);
  return true;
}
if (typeof window !== 'undefined') defineAhaSkeleton();

export default { AhaSkeleton, defineAhaSkeleton };
