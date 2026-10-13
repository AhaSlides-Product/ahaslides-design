/**
 * @ahaslides-product/design/aha-status-icon — the shared progress status glyph (<aha-icon> + state colour).
 *
 *   import '@ahaslides-product/design/aha-status-icon';   // registers <aha-status-icon> (+ <aha-icon>)
 *   <aha-status-icon status="in-progress" size="16"></aha-status-icon>
 *
 * Progress state of any item that can be started and finished (a lesson, a task, a step):
 * not-started · in-progress · completed. Glyphs are summoned BY NAME from the icon library and colour comes
 * from --aha-* tokens. not-started and completed share system-check-circle and differ only by colour, so the
 * accessible name (defaults to the state in English; pass a translated `label`) is what carries state for them.
 */
import './icons.js';

const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; line-height:0; color:var(--aha-gray-60,#B5B5B5) }
  :host([status="in-progress"]){ color:var(--aha-color-primary,#E70E68) }
  :host([status="completed"]){ color:var(--aha-color-success,#1A1A1A) }
`;

const GLYPH = {
  'not-started': 'system-check-circle',
  'in-progress': 'system-circle-dashed',
  'completed': 'system-check-circle',
};
const DEFAULT_LABEL = { 'not-started': 'Not started', 'in-progress': 'In progress', 'completed': 'Completed' };
const SIZES = ['12', '16', '24', '32'];

export class AhaStatusIcon extends HTMLElement {
  static get observedAttributes() { return ['status', 'size', 'label']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><aha-icon part="icon"></aha-icon>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }
  _sync() {
    const status = GLYPH[this.getAttribute('status')] ? this.getAttribute('status') : 'not-started';
    const size = SIZES.includes(this.getAttribute('size')) ? this.getAttribute('size') : '16';
    const icon = this.shadowRoot.querySelector('aha-icon');
    icon.setAttribute('name', GLYPH[status]);
    icon.setAttribute('size', size);
    icon.setAttribute('label', this.getAttribute('label') || DEFAULT_LABEL[status]);
  }
}

export function defineAhaStatusIcon(tag = 'aha-status-icon') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatusIcon);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatusIcon();

export default { AhaStatusIcon, defineAhaStatusIcon };
