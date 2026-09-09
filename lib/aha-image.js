/**
 * @ahaslides-product/design/aha-image — the shared Image primitive.
 *
 *   import '@ahaslides-product/design/aha-image';   // registers <aha-image>
 *   <aha-image src="/cover.jpg" alt="Deck cover" width="240" height="150"></aha-image>
 *
 * A framed image with rounded corners and a hover mask that invites a preview. The image scales
 * and the mask fades in on hover — both animate on a PERSISTENT node via the shared motion tokens.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 */
const STYLE = `
  :host{ display:inline-block }
  .frame{ position:relative; display:block; overflow:hidden; cursor:pointer;
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container-secondary,#F7F7F7) }
  .img{ display:block; width:100%; height:100%; object-fit:cover;
    transition:transform var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .mask{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-bg-overlay,rgba(26,26,46,.7)); opacity:0;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .frame:hover .img{ transform:scale(1.06) }
  .frame:hover .mask{ opacity:1 }
  @media (prefers-reduced-motion: reduce){ .img,.mask{ transition:none !important } .frame:hover .img{ transform:none } }
`;

export class AhaImage extends HTMLElement {
  static get observedAttributes() { return ['src', 'alt', 'width', 'height']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }
  _render() {
    const src = this.getAttribute('src') || '';
    const alt = this.getAttribute('alt') || '';
    const w = this.getAttribute('width'), h = this.getAttribute('height');
    const size = `${w ? `width:${Number(w)}px;` : ''}${h ? `height:${Number(h)}px;` : ''}`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="frame" part="frame" style="${size}">
        <img class="img" part="img" src="${src}" alt="${alt}"/>
        <div class="mask" part="mask"><slot>Preview</slot></div>
      </div>`;
  }
}

export function defineAhaImage(tag = 'aha-image') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImage);
  return true;
}
if (typeof window !== 'undefined') defineAhaImage();

export default { AhaImage, defineAhaImage };
