/**
 * @ahaslides-product/design/aha-canvas-count — the answer count drawn on a slide canvas (leaf).
 *
 *   import '@ahaslides-product/design/aha-canvas-count';   // registers <aha-canvas-count>
 *   <aha-canvas-count correct="12" wrong="3"></aha-canvas-count>   // verdict: ✓ 12 people | ✗ 3 people
 *   <aha-canvas-count answered="24"></aha-canvas-count>            // answered only: 24 people, no verdict
 *   <aha-canvas-count answered="12" total="30"></aha-canvas-count> // answered of a known total: 12 of 30 people
 *
 * A small filled container (the deck container set from applyCanvasDeck): 40px tall, radius 8,
 * the deck container fill and no stroke, frosted on a photo deck. Setting `correct` or
 * `wrong` shows the verdict form; otherwise it shows how many answered. The whole count is one
 * accessible group whose name is the sentence ("12 correct, 3 incorrect"); pass a translated
 * `label` in the product.
 *
 * `total` (answered-only form) adds the "of 30" after the count and makes the name "12 of 30 answered". Without it
 * the render is unchanged. Built-in copy is English and overridable through `strings` (property object or JSON
 * attribute): `ofTotal` ("of {total}", the visible text), `answeredOfTotal` ("{answered} of {total} answered"),
 * `answered` ("{answered} answered") and `correctWrong` ("{correct} correct, {wrong} incorrect"). `label` still wins.
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
  .of{ font-size:14px; line-height:1; font-variant-numeric:tabular-nums; color:var(--aha-deck-ink-secondary, color-mix(in srgb, currentColor 76%, transparent)) }
  .unit{ display:inline-flex; color:var(--aha-deck-ink-secondary, color-mix(in srgb, currentColor 76%, transparent)) }
  .divider{ align-self:stretch; width:1px; background:var(--aha-deck-stroke, color-mix(in srgb, currentColor 12%, transparent)) }
  .inner{ display:contents }
  [hidden]{ display:none !important }
`;

const DEFAULT_STRINGS = {
  ofTotal: 'of {total}',
  answeredOfTotal: '{answered} of {total} answered',
  answered: '{answered} answered',
  correctWrong: '{correct} correct, {wrong} incorrect',
};
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
const count = (value) => Math.max(0, parseInt(value ?? '0', 10) || 0);

export class AhaCanvasCount extends HTMLElement {
  static get observedAttributes() { return ['correct', 'wrong', 'answered', 'total', 'label', 'strings']; }
  get strings() { return this._strings || {}; }
  set strings(value) { this._strings = value && typeof value === 'object' ? value : {}; if (this.shadowRoot) this._sync(); }
  _text(key, values) {
    let custom = this._strings;
    if (!custom) { try { custom = JSON.parse(this.getAttribute('strings') || '{}'); } catch { custom = {}; } }
    return fill(typeof custom?.[key] === 'string' ? custom[key] : DEFAULT_STRINGS[key], values);
  }
  get verdict() { return this.hasAttribute('correct') || this.hasAttribute('wrong'); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const part = (kind) =>
        `<span class="part" data-part="${kind}">` +
          (kind === 'answered' ? '' : `<aha-answer-mark class="disc is-${kind}" result="${kind === 'correct' ? 'correct' : 'incorrect'}" size="20" decorative></aha-answer-mark>`) +
          `<span class="number"></span>${kind === 'answered' ? '<span class="of" hidden></span>' : ''}<aha-icon class="unit" name="system-user" size="16" decorative></aha-icon></span>`;
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
    const hasTotal = !verdict && this.hasAttribute('total');
    const total = count(this.getAttribute('total'));
    const of = root.querySelector('.of');
    of.hidden = !hasTotal;
    of.textContent = hasTotal ? this._text('ofTotal', { total }) : '';
    root.querySelector('[data-part="divider"]').hidden = !verdict;
    const box = root.querySelector('.box');
    box.classList.toggle('is-answered', !verdict);
    box.setAttribute('aria-label', this.getAttribute('label') ||
      (verdict ? this._text('correctWrong', values) : this._text(hasTotal ? 'answeredOfTotal' : 'answered', { ...values, total })));
  }
}

export function defineAhaCanvasCount(tag = 'aha-canvas-count') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCanvasCount);
  return true;
}
if (typeof window !== 'undefined') defineAhaCanvasCount();

export default { AhaCanvasCount, defineAhaCanvasCount };
