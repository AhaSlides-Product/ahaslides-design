/**
 * @ahaslides-product/design/aha-product-lockup — the AhaSlides product lockup: The Splash, the
 * AhaSlides wordmark and a product name, as one brand mark for the top-left of a site or app header.
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
 * The Splash and the word AhaSlides are the Logo library artwork (the wordmark's paths are the
 * official logo's, unchanged); only the product name is live Plus Jakarta Sans. Everything is sized
 * in em so nothing scales apart. The box keeps a 0.1em bleed past the ink at the right, top and
 * bottom, so a clipping parent never cuts a glyph or The Splash.
 */
const DEFAULT_SIZE = 20;
const MINIMUM_SIZE = 18;
const FONT_FAMILY = 'AhaSlides Lockup';
const SPLASH = {
  colour: new URL('../logo/thesplash.svg', import.meta.url).href,
  inverse: new URL('../logo/thesplash-white.svg', import.meta.url).href,
};
const WORDMARK = {
  colour: new URL('../logo/ahaslides-wordmark.svg', import.meta.url).href,
  inverse: new URL('../logo/ahaslides-wordmark-white.svg', import.meta.url).href,
};

/* The Splash file has padding around the artwork; these em values crop to the artwork's bounds
   (753.96 units high in a 788-unit artboard) so the 1.325em height is the visible Splash.
   The wordmark file's viewBox is its ink box; its capitals (97.57 units) are set to the 0.75em
   cap height of Plus Jakarta Sans so they line up with the product name, the S overshooting the
   baseline by 1.68 units. The 0.188em gap is the official logo's Splash-to-A gap at that scale. */
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; color:var(--aha-text-default,#1A1A1A) }
  :host([tone="inverse"]){ color:var(--aha-text-inverse,#FFFFFF) }
  :host([hidden]){ display:none }
  .lockup{ display:flex; align-items:center; gap:.188em; font-size:${DEFAULT_SIZE}px; line-height:1.3;
    font-family:"${FONT_FAMILY}",var(--aha-font-product,"Plus Jakarta Sans",sans-serif); letter-spacing:-.03em;
    white-space:nowrap; overflow:visible; padding:.1em .1em .1em 0 }
  .splash{ position:relative; top:.0355em; flex:none; width:1.2853em; height:1.325em; overflow:visible }
  .splash img{ position:absolute; left:-.0534em; top:-.0533em; width:1.4094em; height:1.3848em; max-width:none }
  .text{ overflow:visible }
  /* an inline-block stops a parent link's underline from propagating into the mark */
  .ink{ display:inline-block; padding-inline-end:.03em; text-decoration:none }
  .word{ width:4.3723em; height:.7778em; vertical-align:-.0129em; max-width:none }
  .name{ font-weight:400 }
  .lockup:not(.has-product) .space, .lockup:not(.has-product) .name{ display:none }
  :host([variant="compact"]) .has-product .word, :host([variant="compact"]) .has-product .space{ display:none }
  :host([variant="compact"]) .name{ font-weight:600 }
  :host([variant="splash"]) .text{ display:none }
  @media (max-width:479.98px){
    :host(:not([variant])) .has-product .word, :host(:not([variant])) .has-product .space,
    :host([variant="auto"]) .has-product .word, :host([variant="auto"]) .has-product .space{ display:none }
    :host(:not([variant])) .name, :host([variant="auto"]) .name{ font-weight:600 }
  }
  @container aha-header (max-width:479.98px){
    :host(:not([variant])) .has-product .word, :host(:not([variant])) .has-product .space,
    :host([variant="auto"]) .has-product .word, :host([variant="auto"]) .has-product .space{ display:none }
    :host(:not([variant])) .name, :host([variant="auto"]) .name{ font-weight:600 }
  }
`;

function loadLockupFont() {
  if (typeof document === 'undefined' || document.getElementById('aha-product-lockup-font')) return;
  const face = (weight, url) => `@font-face{font-family:"${FONT_FAMILY}";font-weight:${weight};font-display:swap;`
    + `src:local("Plus Jakarta Sans"),url("${url}") format("woff2")}`;
  const style = document.createElement('style');
  style.id = 'aha-product-lockup-font';
  style.textContent = face(400, new URL('../fonts/PlusJakartaSans-Regular.woff2', import.meta.url).href)
    + face(600, new URL('../fonts/PlusJakartaSans-SemiBold.woff2', import.meta.url).href);
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
        + '<span class="text" part="text"><span class="ink"><img class="word" part="wordmark" alt="" draggable="false"><span class="space"> </span><span class="name"></span></span></span>'
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
    lockup.classList.toggle('has-product', Boolean(product));
    lockup.setAttribute('aria-label', product ? `AhaSlides ${product}` : 'AhaSlides');
    root.querySelector('.name').textContent = product;
    const tone = this.getAttribute('tone') === 'inverse' ? 'inverse' : 'colour';
    for (const [selector, src] of [['.splash img', SPLASH[tone]], ['.word', WORDMARK[tone]]]) {
      const image = root.querySelector(selector);
      if (image.getAttribute('src') !== src) image.setAttribute('src', src);
    }
  }
}

export function defineAhaProductLockup(tag = 'aha-product-lockup') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProductLockup);
  return true;
}
if (typeof window !== 'undefined') defineAhaProductLockup();

export default { AhaProductLockup, defineAhaProductLockup };
