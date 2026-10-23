/**
 * @ahaslides-product/design/aha-answer-result — a read-only answer row for product screens.
 *
 *   import '@ahaslides-product/design/aha-answer-result';   // registers <aha-answer-result>
 *   <aha-answer-result result="incorrect" label="Response">Tea</aha-answer-result>
 *   <aha-answer-result result="correct" label="Response">Coffee</aha-answer-result>
 *   <aha-answer-result label="Correct answer">Coffee</aha-answer-result>
 *
 * Shows what a participant answered, or the answer key, on the Report and Session Report. `result` picks the row:
 * "incorrect" is a 2px --aha-answer-wrong ring over the 5% wrong tint plus the answer mark (cross); "correct"
 * is a 1px --aha-answer-correct edge over the 5% correct tint plus the mark (tick); "key" (default) is the
 * answer key, plain: default border, no tint, no mark. The text is always the default ink at regular weight
 * (colour rules 11.2 and 11.5). The slot holds the answer text; `label` is an optional caption above it.
 */
import './aha-answer-mark.js';

const MOTION = 'var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1))';

const STYLE = `
  :host{ display:block; min-width:0 }
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:var(--aha-space-12, 12px); width:100%;
    min-height:var(--aha-space-44, 44px); padding:var(--aha-space-8, 8px) var(--aha-space-12, 12px);
    border:1px solid var(--aha-border-default, #E3E3E3); border-radius:var(--aha-radius-default, 8px);
    background:var(--aha-white, #FFFFFF); color:var(--aha-text-default, #1A1A1A);
    transition:background ${MOTION}, border-color ${MOTION}, box-shadow ${MOTION} }
  :host([result="correct"]) .row{ border-color:var(--aha-answer-correct); background:var(--aha-answer-correct-tint-5) }
  :host([result="incorrect"]) .row{ border-color:var(--aha-answer-wrong); background:var(--aha-answer-wrong-tint-5);
    box-shadow:inset 0 0 0 1px var(--aha-answer-wrong) }
  .mark{ display:none }
  :host([result="correct"]) .mark, :host([result="incorrect"]) .mark{ display:flex }
  .body{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:var(--aha-space-2, 2px) }
  .caption{ display:none; font-size:var(--aha-size-sm, 12px); line-height:16px; color:var(--aha-text-secondary, #4A4A4A) }
  :host([label]) .caption{ display:block }
  .text{ font-size:var(--aha-size-default, 14px); line-height:20px; font-weight:var(--aha-weight-regular, 400); overflow-wrap:anywhere }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaAnswerResult extends HTMLElement {
  static get observedAttributes() { return ['result', 'label', 'mark-label']; }
  get result() {
    const value = this.getAttribute('result');
    return value === 'correct' || value === 'incorrect' ? value : 'key';
  }
  set result(value) { this.setAttribute('result', value); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="row" part="row"><aha-answer-mark class="mark" part="mark"></aha-answer-mark>` +
        `<div class="body"><span class="caption" part="caption"></span><span class="text" part="text"><slot></slot></span></div></div>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const mark = this.shadowRoot.querySelector('.mark');
    mark.setAttribute('result', this.result === 'incorrect' ? 'incorrect' : 'correct');
    const markLabel = this.getAttribute('mark-label');
    if (markLabel) mark.setAttribute('label', markLabel); else mark.removeAttribute('label');
    this.shadowRoot.querySelector('.caption').textContent = this.getAttribute('label') || '';
  }
}

export function defineAhaAnswerResult(tag = 'aha-answer-result') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAnswerResult);
  return true;
}
if (typeof window !== 'undefined') defineAhaAnswerResult();

export default { AhaAnswerResult, defineAhaAnswerResult };
