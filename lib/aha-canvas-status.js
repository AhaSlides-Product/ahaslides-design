/**
 * @ahaslides-product/design/aha-canvas-status — the status line and response count on a slide canvas (leaf).
 *
 *   import '@ahaslides-product/design/aha-canvas-status';   // registers <aha-canvas-status>
 *   <aha-canvas-status answered="8" total="24"></aha-canvas-status>
 *   <aha-canvas-status text="Voting is open" answered="8" count-text="8 votes"></aha-canvas-status>
 *
 * Free-floating deck text, centred: the status line (18px, the deck ink at 76%) over the count
 * (people glyph + "8 of 24 answered", 20px / 600, the deck ink). No fill and no stroke on any deck,
 * photo decks included. `text=""` hides the line; no `answered` hides the count. It is a polite live
 * region, and updates change text on persistent nodes, so a screen reader hears each new count once.
 */
import './icons.js';

const STYLE = `
  :host{ display:block; color:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); text-align:center }
  .status{ display:flex; flex-direction:column; align-items:center; gap:var(--aha-space-12,12px) }
  .line{ margin:0; font-size:18px; line-height:1.4; font-weight:var(--aha-weight-regular,400);
    color:var(--aha-deck-ink-secondary, color-mix(in srgb, currentColor 76%, transparent)) }
  .count{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); margin:0; font-size:20px; line-height:1.4;
    font-weight:var(--aha-weight-semibold,600); font-variant-numeric:tabular-nums }
  .count aha-icon{ display:inline-flex }
  [hidden]{ display:none !important }
`;

const DEFAULT_TEXT = 'Waiting for answers…';

export class AhaCanvasStatus extends HTMLElement {
  static get observedAttributes() { return ['text', 'answered', 'total', 'count-text']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="status" part="status" role="status" aria-live="polite">` +
        `<p class="line" part="line"></p>` +
        `<p class="count" part="count"><aha-icon name="system-users" size="24" decorative></aha-icon><span class="count-text"></span></p></div>`;
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
    const answered = this.getAttribute('answered');
    const total = this.getAttribute('total');
    const countText = this.getAttribute('count-text') ||
      (answered == null ? '' : total == null ? `${answered} answered` : `${answered} of ${total} answered`);
    root.querySelector('.count-text').textContent = countText;
    root.querySelector('.count').hidden = !countText;
  }
}

export function defineAhaCanvasStatus(tag = 'aha-canvas-status') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCanvasStatus);
  return true;
}
if (typeof window !== 'undefined') defineAhaCanvasStatus();

export default { AhaCanvasStatus, defineAhaCanvasStatus };
