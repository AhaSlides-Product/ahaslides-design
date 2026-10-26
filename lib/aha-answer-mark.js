/**
 * @ahaslides-product/design/aha-answer-mark — the one mark for a correct or incorrect answer.
 *
 *   import '@ahaslides-product/design/aha-answer-mark';   // registers <aha-answer-mark>
 *   <aha-answer-mark result="correct"></aha-answer-mark>              // white tick on the green disc, 20px
 *   <aha-answer-mark result="incorrect" size="16" decorative></aha-answer-mark>
 *
 * A white system-check (correct) or system-x (incorrect) on a solid --aha-answer-correct /
 * --aha-answer-wrong disc (colour rule 11.3: solid colour is only for the tick or cross disc). The disc
 * is the size: 16 | 20 (default) | 24 | 32; the glyph inside is 12 | 12 | 16 | 24. The pair is fixed
 * (rule 11.4): no deck, theme or accent recolours it, so it reads the same on the canvas, the audience
 * phone and the report. Accessible name "Correct" / "Incorrect" (role="img"); pass a translated `label`,
 * or `decorative` when visible text beside it already says the result.
 */
import './icons.js';

const SIZES = { 16: 12, 20: 12, 24: 16, 32: 24 };
const DEFAULT_SIZE = 20;

const STYLE = `
  :host{ display:inline-flex; flex:0 0 auto; vertical-align:middle; line-height:0 }
  .disc{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
    width:20px; height:20px; border-radius:50%;
    background:var(--aha-answer-correct); color:var(--aha-white,#FFFFFF) }
  :host([size="16"]) .disc{ width:16px; height:16px }
  :host([size="24"]) .disc{ width:24px; height:24px }
  :host([size="32"]) .disc{ width:32px; height:32px }
  :host([result="incorrect"]) .disc{ background:var(--aha-answer-wrong) }
`;

export class AhaAnswerMark extends HTMLElement {
  static get observedAttributes() { return ['result', 'size', 'label', 'decorative']; }
  get result() { return this.getAttribute('result') === 'incorrect' ? 'incorrect' : 'correct'; }
  set result(value) { this.setAttribute('result', value); }
  get size() { const size = Number(this.getAttribute('size')); return SIZES[size] ? size : DEFAULT_SIZE; }
  set size(value) { this.setAttribute('size', String(value)); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<span class="disc" part="disc"><aha-icon name="system-check" size="12" decorative></aha-icon></span>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const incorrect = this.result === 'incorrect';
    const glyph = this.shadowRoot.querySelector('aha-icon');
    glyph.setAttribute('name', incorrect ? 'system-x' : 'system-check');
    glyph.setAttribute('size', String(SIZES[this.size]));
    if (this.hasAttribute('decorative')) {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    } else {
      this.removeAttribute('aria-hidden');
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.getAttribute('label') || (incorrect ? 'Incorrect' : 'Correct'));
    }
  }
}

export function defineAhaAnswerMark(tag = 'aha-answer-mark') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAnswerMark);
  return true;
}
if (typeof window !== 'undefined') defineAhaAnswerMark();

export default { AhaAnswerMark, defineAhaAnswerMark };
