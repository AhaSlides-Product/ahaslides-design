/**
 * @ahaslides-product/design/icons — the shared, importable icon system.
 *
 *   import '@ahaslides-product/design/icons';                 // registers <aha-icon> (browser)
 *   import { icons, ICON_NAMES } from '@ahaslides-product/design/icons';   // the catalogue (any runtime)
 *
 * Call a glyph BY NAME — never inline an <svg>:  <aha-icon name="system-bell" size="16" />
 * Colour follows currentColor; size is 12 | 16 | 24 | 32. Zero dependencies.
 */
import { icons as REGISTRY, meta } from './icons-registry.js';

export const icons = REGISTRY;
export const ICON_NAMES = Object.keys(REGISTRY).sort();
export const iconMeta = meta;
export const hasIcon = (name) => Object.prototype.hasOwnProperty.call(REGISTRY, name);

const LINE = { 12: 1, 16: 1.5, 24: 2, 32: 2.5 };   // documented size↔stroke pairing (12/16/24/32 only)

function draw(el) {
  const name = el.getAttribute('name');
  const ic = REGISTRY[name];
  const size = parseInt(el.getAttribute('size') || '24', 10);
  const label = el.getAttribute('label') || '';
  const decorative = el.hasAttribute('decorative') || !label;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label.replace(/"/g, '&quot;')}"`;
  if (!el.shadowRoot) el.attachShadow({ mode: 'open' });
  if (!ic) {
    el.shadowRoot.innerHTML = `<span title="unknown icon: ${name}" style="display:inline-block;box-sizing:border-box;width:${size}px;height:${size}px;border:1px dashed var(--aha-color-error,#F5222D);border-radius:4px"></span>`;
    return;
  }
  el.shadowRoot.innerHTML =
    `<style>:host{display:inline-flex;line-height:0;color:inherit;vertical-align:middle}svg{display:block}</style>` +
    `<svg width="${size}" height="${size}" viewBox="${ic.viewBox}" fill="none" ${a11y}>${ic.body}</svg>`;
}

export class AhaIcon extends HTMLElement {
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
