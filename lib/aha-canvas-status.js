/**
 * @ahaslides-product/design/aha-canvas-status — the status line on a slide canvas (leaf).
 *
 *   import '@ahaslides-product/design/aha-canvas-status';   // registers <aha-canvas-status>
 *   <aha-canvas-status></aha-canvas-status>                        // "Waiting for answers…"
 *   <aha-canvas-status text="Voting is open"></aha-canvas-status>
 *
 * Free-floating deck text, centred: the status line (18px, the deck ink at 76%). No fill and no
 * stroke on any deck, photo decks included. `text=""` hides the line. It is a polite live region.
 */
const STYLE = `
  :host{ display:block; color:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); text-align:center }
  .status{ display:flex; flex-direction:column; align-items:center }
  .line{ margin:0; font-size:18px; line-height:1.4; font-weight:var(--aha-weight-regular,400);
    color:var(--aha-deck-ink-secondary, color-mix(in srgb, currentColor 76%, transparent)) }
  [hidden]{ display:none !important }
`;

const DEFAULT_TEXT = 'Waiting for answers…';

export class AhaCanvasStatus extends HTMLElement {
  static get observedAttributes() { return ['text']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="status" part="status" role="status" aria-live="polite">` +
        `<p class="line" part="line"></p></div>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const root = this.shadowRoot;
    const text = this.hasAttribute('text') ? this.getAttribute('text') : DEFAULT_TEXT;
    const line = root.querySelector('.line');
    line.textContent = text;
    line.hidden = !text;
  }
}

export function defineAhaCanvasStatus(tag = 'aha-canvas-status') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCanvasStatus);
  return true;
}
if (typeof window !== 'undefined') defineAhaCanvasStatus();

export default { AhaCanvasStatus, defineAhaCanvasStatus };
