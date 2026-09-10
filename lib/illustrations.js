/**
 * @ahaslides-product/design/illustrations — the shared, importable illustration system.
 *
 *   import '@ahaslides-product/design/illustrations';                 // registers <aha-illustration> (browser)
 *   import { illustrations, ILLUSTRATION_NAMES } from '@ahaslides-product/design/illustrations';  // the catalogue
 *
 * Call spot art BY NAME — never paste an <svg>:  <aha-illustration name="empty-team" size="128" />
 * Unlike <aha-icon> (one-colour, currentColor), an illustration is MULTI-COLOUR: it keeps its own
 * palette and just scales, preserving aspect ratio via the viewBox. Size is a single edge (px); the
 * other edge follows the art's intrinsic ratio. Zero dependencies.
 */
import { illustrations as REGISTRY, meta } from './illustrations-registry.js';

export const illustrations = REGISTRY;
export const ILLUSTRATION_NAMES = Object.keys(REGISTRY).sort();
export const illustrationMeta = meta;
export const hasIllustration = (name) => Object.prototype.hasOwnProperty.call(REGISTRY, name);

function draw(el) {
  const name = el.getAttribute('name');
  const art = REGISTRY[name];
  const label = el.getAttribute('label') || '';
  const decorative = el.hasAttribute('decorative') || !label;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label.replace(/"/g, '&quot;')}"`;
  if (!el.shadowRoot) el.attachShadow({ mode: 'open' });
  if (!art) {
    // unknown name → a visible dashed error box, sized from the requested edge (default 128)
    const size = parseInt(el.getAttribute('size') || '128', 10);
    const span = document.createElement('span');
    span.title = `unknown illustration: ${name}`;
    span.setAttribute('style', `display:inline-block;box-sizing:border-box;width:${size}px;height:${size}px;border:1px dashed var(--aha-color-error, #F5222D);border-radius:8px`);
    el.shadowRoot.replaceChildren(span);
    return;
  }
  // Scale from a single `size` edge along the art's LONGER side, preserving aspect via the viewBox;
  // default to the art's own intrinsic pixels when no size is given.
  const req = el.getAttribute('size');
  let w = art.w, h = art.h;
  if (req != null && req !== '') {
    const s = parseInt(req, 10);
    if (art.w >= art.h) { w = s; h = Math.round(s * art.h / art.w); }
    else { h = s; w = Math.round(s * art.w / art.h); }
  }
  el.shadowRoot.innerHTML =
    `<style>:host{display:inline-flex;line-height:0;vertical-align:middle}svg{display:block}</style>` +
    `<svg width="${w}" height="${h}" viewBox="${art.viewBox}" fill="none" ${a11y}>${art.body}</svg>`;   // ds-lint-allow: svg (illustration runtime draws the registry glyph)
}

export class AhaIllustration extends HTMLElement {
  static get observedAttributes() { return ['name', 'size', 'label', 'decorative']; }
  connectedCallback() { draw(this); }
  attributeChangedCallback() { if (this.shadowRoot) draw(this); }
}

/** Register <aha-illustration> once. Safe to call repeatedly; no-op outside a DOM. */
export function defineAhaIllustration(tag = 'aha-illustration') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaIllustration);
  return true;
}

// Auto-register on import in a browser, so `import '…/illustrations'` is all a consumer needs.
if (typeof window !== 'undefined') defineAhaIllustration();

export default { illustrations, ILLUSTRATION_NAMES, hasIllustration, AhaIllustration, defineAhaIllustration };
