/**
 * @ahaslides-product/design/aha-product-lockup — the AhaSlides product lockup: The Splash, the
 * word AhaSlides and a product name, as one brand mark for the top-left of a site or app header.
 *
 *   import '@ahaslides-product/design/aha-product-lockup';   // registers <aha-product-lockup>
 *   <a href="/"><aha-product-lockup product="Docs"></aha-product-lockup></a>
 *   <aha-product-lockup product="Games" variant="compact"></aha-product-lockup>
 *   <aha-product-lockup product="Careers" tone="inverse"></aha-product-lockup>
 *   <aha-product-lockup></aha-product-lockup>                 <!-- no product yet: Splash + AhaSlides -->
 *
 * Attributes
 *   product   the product or site name ("Docs", "Agent Fleet"); absent = Splash + AhaSlides only
 *   variant   auto (default: full, compact below a 480 px header) · full · compact · splash
 *   tone      colour (default, on light) · inverse (all white, on a dark or brand-colour header)
 *   size      type size in px, default 20, never below 18; the Splash and gap scale with it
 *
 * The accessible name is always the full lockup text ("AhaSlides Docs"), whichever variant shows.
 * The text is live Plus Jakarta Sans and the Splash is the Logo library file, sized in em so the
 * two never scale apart. The box keeps a 0.1em bleed past the ink at the right, top and bottom, so a
 * clipping parent never cuts a glyph or The Splash.
 */
const DEFAULT_SIZE = 20;
const MINIMUM_SIZE = 18;
const FONT_FAMILY = 'AhaSlides Lockup';
const asset = (path) => new URL(path, import.meta.url).href;
const SPLASH = { colour: asset('../logo/thesplash.svg'), inverse: asset('../logo/thesplash-white.svg') };

/* The Splash file has padding around the artwork; these em values crop to the artwork's bounds
   (753.96 units high in a 788-unit artboard) so the 1.325em height is the visible Splash. */
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; color:var(--aha-text-default,#1A1A1A) }
  :host([tone="inverse"]){ color:var(--aha-text-inverse,#FFFFFF) }
  :host([hidden]){ display:none }
  .lockup{ display:flex; align-items:center; gap:.36em; font-size:${DEFAULT_SIZE}px; line-height:1.3;
    font-family:"${FONT_FAMILY}",var(--aha-font-product,"Plus Jakarta Sans",sans-serif); letter-spacing:-.03em;
    white-space:nowrap; overflow:visible; padding:.1em .1em .1em 0 }
  .splash{ position:relative; top:.0355em; flex:none; width:1.2853em; height:1.325em; overflow:visible }
  .splash img{ position:absolute; left:-.0534em; top:-.0533em; width:1.4094em; height:1.3848em; max-width:none }
  .text{ overflow:visible }
  /* an inline-block stops a parent link's underline from propagating into the mark */
  .ink{ display:inline-block; padding-inline-end:.03em; text-decoration:none }
  .word{ font-weight:600 }
  .name{ font-weight:400 }
  :host(:not([product])) .space, :host(:not([product])) .name,
  :host([product=""]) .space, :host([product=""]) .name{ display:none }
  :host([product]:not([product=""])[variant="compact"]) .word,
  :host([product]:not([product=""])[variant="compact"]) .space{ display:none }
  :host([variant="compact"]) .name{ font-weight:600 }
  :host([variant="splash"]) .text{ display:none }
  @media (max-width:479.98px){
    :host([product]:not([product=""]):not([variant])) .word, :host([product]:not([product=""]):not([variant])) .space,
    :host([product]:not([product=""])[variant="auto"]) .word, :host([product]:not([product=""])[variant="auto"]) .space{ display:none }
    :host(:not([variant])) .name, :host([variant="auto"]) .name{ font-weight:600 }
  }
  @container aha-header (max-width:479.98px){
    :host([product]:not([product=""]):not([variant])) .word, :host([product]:not([product=""]):not([variant])) .space,
    :host([product]:not([product=""])[variant="auto"]) .word, :host([product]:not([product=""])[variant="auto"]) .space{ display:none }
    :host(:not([variant])) .name, :host([variant="auto"]) .name{ font-weight:600 }
  }
`;

function loadLockupFont() {
  if (typeof document === 'undefined' || document.getElementById('aha-product-lockup-font')) return;
  const face = (weight, file) => `@font-face{font-family:"${FONT_FAMILY}";font-weight:${weight};font-display:swap;`
    + `src:local("Plus Jakarta Sans"),url("${asset(`../fonts/${file}`)}") format("woff2")}`;
  const style = document.createElement('style');
  style.id = 'aha-product-lockup-font';
  style.textContent = face(400, 'PlusJakartaSans-Regular.woff2') + face(600, 'PlusJakartaSans-SemiBold.woff2');
  document.head.appendChild(style);
}

export class AhaProductLockup extends HTMLElement {
  static get observedAttributes() { return ['product', 'variant', 'tone', 'size']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      loadLockupFont();
      this.attachShadow({ mode: 'open' }).innerHTML = `<style>${STYLE}</style>`
        + '<span class="lockup" part="lockup" role="img">'
        + '<span class="splash" part="splash"><img alt="" draggable="false"></span>'
        + '<span class="text" part="text"><span class="ink"><span class="word">AhaSlides</span><span class="space"> </span><span class="name"></span></span></span>'
        + '</span>';
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  get product() { return (this.getAttribute('product') || '').trim(); }
  set product(value) { this.setAttribute('product', value); }

  _sync() {
    const root = this.shadowRoot;
    const product = this.product;
    const size = Math.max(MINIMUM_SIZE, parseFloat(this.getAttribute('size')) || DEFAULT_SIZE);
    const lockup = root.querySelector('.lockup');
    lockup.style.fontSize = `${size}px`;
    lockup.setAttribute('aria-label', product ? `AhaSlides ${product}` : 'AhaSlides');
    root.querySelector('.name').textContent = product;
    const splash = this.getAttribute('tone') === 'inverse' ? SPLASH.inverse : SPLASH.colour;
    const image = root.querySelector('.splash img');
    if (image.getAttribute('src') !== splash) image.setAttribute('src', splash);
  }
}

export function defineAhaProductLockup(tag = 'aha-product-lockup') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProductLockup);
  return true;
}
if (typeof window !== 'undefined') defineAhaProductLockup();

export default { AhaProductLockup, defineAhaProductLockup };
