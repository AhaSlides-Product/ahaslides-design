/**
 * @ahaslides-product/design/aha-canvas-play — the centred Play control drawn on a slide canvas.
 *
 *   import '@ahaslides-product/design/aha-canvas-play';   // registers <aha-canvas-play>
 *   <aha-canvas-play size="hero" label="Play video"></aha-canvas-play>
 *
 * A round button: the system-play glyph, white, on a --aha-color-primary disc, with no shadow. `size` is
 * md (48px), lg (64px) or hero (96px, the centred in-canvas Play over a video or media slide); default lg.
 * Keyboard focus draws the deck focus ring: a 2px gap in the deck background (--aha-button-focus-gap) and a 2px
 * ring in the deck ink (--aha-button-focus-ring), both written by applyCanvasDeck. A host listens for the native
 * `click`. `label` is the accessible name (default "Play"); pass a translated string in the product.
 */
import './icons.js';

const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .box{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; padding:0; margin:0;
    width:var(--size,64px); height:var(--size,64px); border:0; border-radius:50%; cursor:pointer;
    background:var(--aha-color-primary,#E70E68); color:var(--aha-text-inverse,#FFFFFF); box-shadow:none;
    transition:background-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="md"]) .box{ --size:48px }
  :host([size="hero"]) .box{ --size:96px }
  .box:hover{ background:var(--aha-color-primary-hover,#DB005B) }
  .box:active{ background:var(--aha-color-primary-active,var(--aha-color-primary-hover,#DB005B)) }
  .box:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-button-focus-gap,var(--aha-bg-base,#FFFFFF)), 0 0 0 4px var(--aha-button-focus-ring,var(--aha-color-primary,#E70E68)) }
  :host([disabled]) .box{ cursor:not-allowed; opacity:.5; pointer-events:none }
  aha-icon{ display:block; transform:translateX(2px) }
  @media (prefers-reduced-motion: reduce){ .box{ transition:none } }
`;

const GLYPH_SIZE = { md: 24, lg: 32, hero: 32 };

export class AhaCanvasPlay extends HTMLElement {
  static get observedAttributes() { return ['size', 'label', 'disabled']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><button class="box" part="button" type="button"><aha-icon name="system-play" decorative></aha-icon></button>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  focus(options) { this.shadowRoot?.querySelector('.box')?.focus(options); }

  _sync() {
    const button = this.shadowRoot.querySelector('.box');
    button.setAttribute('aria-label', this.getAttribute('label') || 'Play');
    button.toggleAttribute('disabled', this.hasAttribute('disabled'));
    this.shadowRoot.querySelector('aha-icon').setAttribute('size', String(GLYPH_SIZE[this.getAttribute('size')] ?? GLYPH_SIZE.lg));
  }
}

export function defineAhaCanvasPlay(tag = 'aha-canvas-play') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCanvasPlay);
  return true;
}
if (typeof window !== 'undefined') defineAhaCanvasPlay();

export default { AhaCanvasPlay, defineAhaCanvasPlay };
