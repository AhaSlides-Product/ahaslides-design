/**
 * @ahaslides-product/design/aha-skeleton — the shared Skeleton (loading placeholder) primitive.
 *
 *   import '@ahaslides-product/design/aha-skeleton';   // registers <aha-skeleton>
 *   <aha-skeleton variant="title"></aha-skeleton>
 *   <aha-skeleton variant="avatar"></aha-skeleton>
 *
 * A greyed placeholder that holds layout while content loads. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * shimmer is an opacity PULSE (no gradient fill), respecting the no-gradient-on-fills rule.
 */
const STYLE = `
  :host{ display:block }
  .block{ background:var(--aha-gray-30,#F1F1F1); border-radius:var(--aha-radius-xs,4px);
    animation:aha-skeleton-pulse 1.6s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }
  :host([variant="text"]) .block{ height:16px; width:100% }
  :host([variant="title"]) .block{ height:24px; width:38% }
  :host([variant="button"]) .block{ height:32px; width:96px; border-radius:var(--aha-radius-default,8px) }
  :host([variant="avatar"]) .block{ height:40px; width:40px; border-radius:var(--aha-radius-pill,999px) }
  :host([active="false"]) .block{ animation:none }
  @keyframes aha-skeleton-pulse{ 0%,100%{ opacity:1 } 50%{ opacity:.45 } }
  @media (prefers-reduced-motion: reduce){ .block{ animation:none } }
`;

export class AhaSkeleton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'active']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="block" part="block" aria-hidden="true"></span>`;
    }
  }
}

export function defineAhaSkeleton(tag = 'aha-skeleton') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSkeleton);
  return true;
}
if (typeof window !== 'undefined') defineAhaSkeleton();

export default { AhaSkeleton, defineAhaSkeleton };
