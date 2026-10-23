/**
 * @ahaslides-product/design/aha-canvas-count — the answer count drawn on a slide canvas (leaf).
 *
 *   import '@ahaslides-product/design/aha-canvas-count';   // registers <aha-canvas-count>
 *   <aha-canvas-count correct="12" wrong="3"></aha-canvas-count>   // verdict: ✓ 12 people | ✗ 3 people
 *   <aha-canvas-count answered="24"></aha-canvas-count>            // answered only: 24 people, no verdict
 *
 * A small filled container (the deck container set from applyCanvasDeck): 40px tall, radius 8,
 * the deck container fill and no stroke, frosted on a photo deck. Setting `correct` or
 * `wrong` shows the verdict form; otherwise it shows how many answered. The whole count is one
 * accessible group whose name is the sentence ("12 correct, 3 incorrect"); pass a translated
 * `label` in the product.
 */
import './icons.js';
import './aha-answer-mark.js';

const STYLE = `
  :host{ display:inline-block; color:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .box{ display:inline-flex; align-items:center; gap:var(--aha-space-8,8px); box-sizing:border-box; height:40px;
    padding:var(--aha-space-8,8px) var(--aha-space-16,16px) var(--aha-space-8,8px) var(--aha-space-8,8px);
    border-radius:var(--aha-deck-container-radius-sm, var(--aha-radius-default,8px));
    background:var(--aha-deck-container-fill, color-mix(in srgb, currentColor 8%, transparent));
    -webkit-backdrop-filter:blur(var(--aha-blur-md,20px)); backdrop-filter:blur(var(--aha-blur-md,20px)) }
  .box.is-answered{ padding-inline:var(--aha-space-16,16px) }
  .part{ display:inline-flex; align-items:center; gap:var(--aha-space-6,6px) }
  .number{ font-size:16px; line-height:1; font-weight:var(--aha-weight-semibold,600); font-variant-numeric:tabular-nums }
  .unit{ display:inline-flex; color:var(--aha-deck-ink-secondary, color-mix(in srgb, currentColor 76%, transparent)) }
  .divider{ align-self:stretch; width:1px; background:var(--aha-deck-stroke, color-mix(in srgb, currentColor 12%, transparent)) }
  .inner{ display:contents }
  [hidden]{ display:none !important }
`;

const count = (value) => Math.max(0, parseInt(value ?? '0', 10) || 0);

export class AhaCanvasCount extends HTMLElement {
  static get observedAttributes() { return ['correct', 'wrong', 'answered', 'label']; }
  get verdict() { return this.hasAttribute('correct') || this.hasAttribute('wrong'); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const part = (kind) =>
        `<span class="part" data-part="${kind}">` +
          (kind === 'answered' ? '' : `<aha-answer-mark class="disc is-${kind}" result="${kind === 'correct' ? 'correct' : 'incorrect'}" size="20" decorative></aha-answer-mark>`) +
          `<span class="number"></span><aha-icon class="unit" name="system-user" size="16" decorative></aha-icon></span>`;
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="box" part="box" role="group">` +
        `<span class="inner" aria-hidden="true">${part('correct')}<span class="divider" data-part="divider"></span>${part('wrong')}${part('answered')}</span></div>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const root = this.shadowRoot;
    const verdict = this.verdict;
    const values = { correct: count(this.getAttribute('correct')), wrong: count(this.getAttribute('wrong')), answered: count(this.getAttribute('answered')) };
    for (const kind of ['correct', 'wrong', 'answered']) {
      const part = root.querySelector(`[data-part="${kind}"]`);
      part.hidden = verdict === (kind === 'answered');
      part.querySelector('.number').textContent = String(values[kind]);
    }
    root.querySelector('[data-part="divider"]').hidden = !verdict;
    const box = root.querySelector('.box');
    box.classList.toggle('is-answered', !verdict);
    box.setAttribute('aria-label', this.getAttribute('label') ||
      (verdict ? `${values.correct} correct, ${values.wrong} incorrect` : `${values.answered} answered`));
  }
}

export function defineAhaCanvasCount(tag = 'aha-canvas-count') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCanvasCount);
  return true;
}
if (typeof window !== 'undefined') defineAhaCanvasCount();

export default { AhaCanvasCount, defineAhaCanvasCount };
