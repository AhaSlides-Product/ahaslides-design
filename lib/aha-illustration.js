/**
 * The <aha-illustration> element and the art it draws from, without any art of its own.
 *
 * Art reaches the element through registerIllustrations(), so a surface pays only for the pictures
 * it loads: lib/illustrations-empty.js holds the empty-state art, lib/illustrations.js holds every
 * illustration. Either can load first, and an element already on the page redraws when its art arrives.
 *
 * A name with no art stays a blank box of the requested size until the full catalogue has loaded,
 * because a page may still be fetching it. Only then is the name truly unknown: a dashed error box.
 */
// Kept on globalThis because two copies of the package on one page (an app and a kit) define one element.
const artStore = (globalThis[Symbol.for('ahaslides-design.illustration-art')] ??= {
  art: Object.create(null),
  catalogueLoaded: false,
  waitingForArt: new Set(),
});

function drawMissingArt(el, name) {
  // sized from the requested edge (default 128)
  const size = parseInt(el.getAttribute('size') || '128', 10);
  const span = document.createElement('span');
  const box = `display:inline-block;box-sizing:border-box;width:${size}px;height:${size}px`;
  if (artStore.catalogueLoaded) {
    span.title = `unknown illustration: ${name}`;
    span.setAttribute('style', `${box};border:1px dashed var(--aha-color-error,#1A1A1A);border-radius:8px`);
  } else {
    span.title = `illustration not loaded: ${name}. Import @ahaslides-product/design/illustrations to draw it.`;
    span.setAttribute('style', box);
    if (el.isConnected) artStore.waitingForArt.add(el);
  }
  el.shadowRoot.replaceChildren(span);
}

function draw(el) {
  const name = el.getAttribute('name');
  const art = artStore.art[name];
  const label = el.getAttribute('label') || '';
  const decorative = el.hasAttribute('decorative') || !label;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label.replace(/"/g, '&quot;')}"`;
  if (!el.shadowRoot) el.attachShadow({ mode: 'open' });
  artStore.waitingForArt.delete(el);
  if (!art) {
    drawMissingArt(el, name);
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

/**
 * Add art by name and redraw every element on the page that was waiting for it.
 * @param {Record<string, { viewBox: string, body: string, w: number, h: number }>} art
 * @param {{ catalogueLoaded?: boolean }} [options] true when this is the whole catalogue, so a name
 *   still missing afterwards is a mistake and shows the error box.
 */
export function registerIllustrations(art, { catalogueLoaded = false } = {}) {
  Object.assign(artStore.art, art);
  if (catalogueLoaded) artStore.catalogueLoaded = true;
  [...artStore.waitingForArt].forEach(draw);
}

export class AhaIllustration extends HTMLElement {
  static get observedAttributes() { return ['name', 'size', 'label', 'decorative']; }
  connectedCallback() { draw(this); }
  disconnectedCallback() { artStore.waitingForArt.delete(this); }
  attributeChangedCallback() { if (this.shadowRoot) draw(this); }
}

/** Register <aha-illustration> once. Safe to call repeatedly; no-op outside a DOM. */
export function defineAhaIllustration(tag = 'aha-illustration') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaIllustration);
  return true;
}

if (typeof window !== 'undefined') defineAhaIllustration();
