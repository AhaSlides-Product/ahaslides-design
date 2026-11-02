/**
 * @ahaslides-product/design/aha-palette-swatch — a theme's colour palette as five rising chips.
 *
 *   import '@ahaslides-product/design/aha-palette-swatch';   // registers <aha-palette-swatch>
 *   <aha-palette-swatch colors="#1A1A1A|#E70E68|#4A4A4A|#D4D4D4|#FFFFFF" label="Ocean palette"></aha-palette-swatch>
 *
 * The chips are the presenter's theme-thumbnail palette: five rounded bars of rising heights on a
 * 152 × 33 frame, filled in order from `colors`. The colours are the THEME's own data, not DS hues,
 * so the element paints whatever the host passes; a palette shorter than five leaves the later
 * chips outlined and unfilled. The frame fills its host's width and keeps the 152:33 ratio.
 *
 * Attributes:
 *   colors — pipe-separated CSS colours, first five used; invalid entries leave that chip unfilled
 *   label  — accessible name; set → role="img" with that aria-label, unset → decorative (aria-hidden)
 *
 * Shadow DOM built once; attribute changes restyle the persistent chips in place.
 */
const CHIP_COUNT = 5;

const STYLE = `
  :host{ display:block; width:100% }
  :host([hidden]){ display:none }
  .frame{ display:grid; grid-template-columns:repeat(${CHIP_COUNT},1fr); column-gap:1.65%;
    align-items:end; width:100%; aspect-ratio:152 / 33 }
  .chip{ box-sizing:border-box; height:100%; background:transparent;
    border:.5px solid var(--aha-gray-35,#EBEBEB); border-radius:var(--aha-radius-xs,4px) var(--aha-radius-xs,4px) 0 0 }
  .chip:nth-child(1){ height:81%; border-bottom-left-radius:var(--aha-radius-xs,4px) }
  .chip:nth-child(2){ height:57% }
  .chip:nth-child(3){ height:96% }
  .chip:nth-child(4){ height:72% }
  .chip:nth-child(5){ height:48%; border-bottom-right-radius:var(--aha-radius-xs,4px) }
`;

function isPaintable(value) {
  if (!value) return false;
  if (typeof CSS !== 'undefined' && CSS.supports) return CSS.supports('color', value);
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

export function parsePaletteColors(attributeValue) {
  return String(attributeValue || '')
    .split('|')
    .map((value) => value.trim())
    .slice(0, CHIP_COUNT)
    .map((value) => (isPaintable(value) ? value : ''));
}

export class AhaPaletteSwatch extends HTMLElement {
  static get observedAttributes() { return ['colors', 'label']; }

  get colors() { return this.getAttribute('colors') || ''; }
  set colors(value) { this.setAttribute('colors', Array.isArray(value) ? value.join('|') : String(value)); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const chips = Array.from({ length: CHIP_COUNT }, () => '<span class="chip" part="chip"></span>').join('');
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="frame" part="frame">${chips}</div>`;
    }
    this._sync();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const colors = parsePaletteColors(this.getAttribute('colors'));
    this.shadowRoot.querySelectorAll('.chip').forEach((chip, index) => {
      const color = colors[index] || '';
      chip.style.background = color;
      chip.toggleAttribute('data-empty', !color);
    });
    const label = this.getAttribute('label');
    const frame = this.shadowRoot.querySelector('.frame');
    if (label) {
      frame.setAttribute('role', 'img');
      frame.setAttribute('aria-label', label);
      frame.removeAttribute('aria-hidden');
    } else {
      frame.removeAttribute('role');
      frame.removeAttribute('aria-label');
      frame.setAttribute('aria-hidden', 'true');
    }
  }
}

export function defineAhaPaletteSwatch(tag = 'aha-palette-swatch') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPaletteSwatch);
  return true;
}
if (typeof window !== 'undefined') defineAhaPaletteSwatch();

export default { AhaPaletteSwatch, defineAhaPaletteSwatch, parsePaletteColors };
