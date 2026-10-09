/**
 * @ahaslides-product/design/icons — the shared, importable icon system.
 *
 *   import '@ahaslides-product/design/icons';                 // registers <aha-icon> (browser)
 *   import { icons, ICON_NAMES } from '@ahaslides-product/design/icons';   // the catalogue (any runtime)
 *
 * Call a glyph BY NAME — never inline an <svg>:  <aha-icon name="system-bell" size="16" />
 * Colour follows currentColor; size is 12 | 16 | 24 | 32, and the runtime draws every stroke at exactly
 * 1 / 1.5 / 2 / 2.5 px for 12 / 16 / 24 / 32 whatever the glyph's viewBox. Zero dependencies.
 */
import { icons as REGISTRY, meta } from './icons-registry.js';

export const icons = REGISTRY;
export const ICON_NAMES = Object.keys(REGISTRY).sort();
export const iconMeta = meta;
export const hasIcon = (name) => Object.prototype.hasOwnProperty.call(REGISTRY, name);

export const LINE = { 12: 1, 16: 1.5, 24: 2, 32: 2.5 };

const GRID_SIZES = Object.keys(LINE).map(Number);
const nearestGridSize = (size) => GRID_SIZES.reduce((best, step) => (Math.abs(step - size) < Math.abs(best - size) ? step : best));

/** Stroke width in viewBox units that renders as exactly LINE[size] screen pixels, whatever the glyph's viewBox. */
export function strokeWidthFor(size, viewBox) {
  const viewBoxWidth = parseFloat(String(viewBox).split(/[\s,]+/)[2]) || size;
  return +(LINE[nearestGridSize(size)] * viewBoxWidth / size).toFixed(4);
}

function draw(el) {
  const name = el.getAttribute('name');
  const ic = REGISTRY[name];
  const size = parseInt(el.getAttribute('size') || '24', 10);
  const label = el.getAttribute('label') || '';
  const decorative = el.hasAttribute('decorative') || !label;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label.replace(/"/g, '&quot;')}"`;
  if (!el.shadowRoot) el.attachShadow({ mode: 'open' });
  if (!ic) {
    // Build via DOM so the (author-supplied) name is set as text on .title, never parsed as HTML.
    const span = document.createElement('span');
    span.title = `unknown icon: ${name}`;
    span.setAttribute('style', `display:inline-block;box-sizing:border-box;width:${size}px;height:${size}px;border:1px dashed var(--aha-color-error,#1A1A1A);border-radius:4px`);
    el.shadowRoot.replaceChildren(span);
    return;
  }
  el.shadowRoot.innerHTML =
    `<style>:host{display:inline-flex;line-height:0;color:inherit;vertical-align:middle}svg{display:block}svg [stroke]{stroke-width:${strokeWidthFor(size, ic.viewBox)}}</style>` +
    `<svg width="${size}" height="${size}" viewBox="${ic.viewBox}" fill="none" ${a11y}>${ic.body}</svg>`;
}

export class AhaIcon extends (typeof HTMLElement === "undefined" ? class {} : HTMLElement) {
  static get observedAttributes() { return ['name', 'size', 'label', 'decorative']; }
  connectedCallback() { draw(this); }
  attributeChangedCallback() { if (this.shadowRoot) draw(this); }
}

/** Register <aha-icon> once. Safe to call repeatedly; no-op outside a DOM. */
export function defineAhaIcon(tag = 'aha-icon') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaIcon);
  return true;
}

// Auto-register on import in a browser, so `import '@ahaslides-product/design/icons'` is all a consumer needs.
if (typeof window !== 'undefined') defineAhaIcon();

export default { icons, ICON_NAMES, hasIcon, AhaIcon, defineAhaIcon };
