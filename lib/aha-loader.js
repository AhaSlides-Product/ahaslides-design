/**
 * @ahaslides-product/design/aha-loader — the AhaSlides environment-transition loading SCREEN.
 *
 *   import '@ahaslides-product/design/aha-loader';   // registers <aha-loader> (+ <aha-illustration>)
 *   <aha-loader></aha-loader>
 *   <aha-loader label="Opening the editor…"></aha-loader>
 *
 * A full-surface branded loading screen shown while a new environment boots — moving from the
 * workspace to the Presentation editor, or from the editor to the Presenting view. It fills its
 * container (make that container full-screen for a real transition) on a white ground and cycles
 * five branded illustration tiles with a staggered soft-flow: each tile fades + slides + unblurs
 * in, holds, then fades out, so exactly one is prominent at a time.
 *
 * REUSE, not rewrite — the five graphics are the shared <aha-illustration> spot art (loader-award,
 * loader-wand, loader-plane, loader-ballot, loader-chart), called BY NAME, never an inline <svg>.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * The loop is a decorative keyframe animation on a non-interactive surface; the easing binds to the
 * shared --aha-ease-* motion tokens and the whole thing stills under prefers-reduced-motion.
 */
import './illustrations.js';   // registers <aha-illustration> so the five loader-* tiles resolve from the DS registry

const TILES = ['loader-award', 'loader-wand', 'loader-plane', 'loader-ballot', 'loader-chart'];

const STYLE = `
  :host{ display:flex; align-items:center; justify-content:center; box-sizing:border-box;
    width:100%; height:100%; min-height:240px; background:var(--aha-white,#FFFFFF);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .stage{ position:relative; display:flex; align-items:center; justify-content:center;
    width:100%; height:100% }
  /* Absolute with no offsets keeps each tile at its flex-centred static position, so all five
     stack dead-centre; the keyframe then slides them from there. */
  .icon-card{ position:absolute; display:flex; align-items:center; justify-content:center;
    width:120px; height:120px; border-radius:var(--aha-radius-xl,16px);
    background:var(--aha-bg-container,#FFFFFF); opacity:0;
    animation:aha-loader-soft-flow var(--aha-loader-duration,7.5s) var(--aha-ease-in-out,ease) infinite;
    will-change:transform,opacity,filter }
  .card-1{ animation-delay:0s }
  .card-2{ animation-delay:1.5s }
  .card-3{ animation-delay:3s }
  .card-4{ animation-delay:4.5s }
  .card-5{ animation-delay:6s }

  @keyframes aha-loader-soft-flow{
    0%{ opacity:0; transform:translateX(20px) scale(.9); filter:blur(4px) }
    5%{ opacity:1; transform:translateX(0) scale(1); filter:blur(0) }
    15%{ opacity:1; transform:translateX(0) scale(1); filter:blur(0) }
    20%{ opacity:0; transform:translateX(-20px) scale(.95); filter:blur(4px) }
    100%{ opacity:0; transform:translateX(-20px) scale(.95) }
  }

  /* Respect reduced-motion: still the loop and hold one branded tile so the screen stays legible. */
  @media (prefers-reduced-motion: reduce){
    .icon-card{ animation:none; opacity:0 }
    .card-1{ opacity:1 }
  }
`;

export class AhaLoader extends HTMLElement {
  static get observedAttributes() { return ['label']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
    this._syncA11y();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._syncA11y(); }
  _syncA11y() {
    // A loading screen is a live status region, not an interactive control.
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-label', this.getAttribute('label') || 'Loading');
  }
  _render() {
    const cards = TILES.map((name, i) =>
      `<div class="icon-card card-${i + 1}" part="tile">` +
        `<aha-illustration name="${name}" size="96" decorative></aha-illustration>` +
      `</div>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="stage" part="stage">${cards}</div>`;
  }
}

export function defineAhaLoader(tag = 'aha-loader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLoader);
  return true;
}
if (typeof window !== 'undefined') defineAhaLoader();

export default { AhaLoader, defineAhaLoader };
