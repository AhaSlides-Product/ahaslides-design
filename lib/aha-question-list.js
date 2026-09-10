/**
 * @ahaslides-product/design/aha-question-list — an editable list of collapsible questions.
 *
 *   import '@ahaslides-product/design/aha-question-list';   // registers <aha-question-list>
 *   el.questions = [{ id:'q1', prompt:'…', options:[{ id:'o1', text:'…', correct:true }] }];
 *
 * The composite settings surface for an editable list of questions (SETTINGS-31/36): each question is a
 * collapsible NumberedItem (a prompt field + its OptionRow choices), and a full-width "+ Add question"
 * button sits beneath, disabling at `max`. It COMPOSES the DS composites it is built from — NumberedItem
 * (the grey card, chip, header, collapse and delete) and OptionRow (each choice) — never re-implementing
 * them. No "X of Y" counter: limits are conveyed by +Add disabling at max and delete disabling at min
 * (SETTINGS-36). Question delete disables at `min`; option delete disables at `minoptions`. Reuses
 * <aha-numbered-item>, <aha-option-row>, <aha-counted-input> and <aha-icon>. Shadow-DOM CSS, themed only
 * by --aha-* tokens. Emits composed `change` CustomEvent<{questions}> on every edit.
 */
import './aha-numbered-item.js';     // the collapsible grey-card question wrapper
import './aha-option-row.js';        // each choice
import './aha-counted-input.js';     // the prompt field
import './icons.js';                 // <aha-icon> for the +Add glyph

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .list{ display:flex; flex-direction:column; gap:12px }
  .prompt{ display:block; width:100%; margin-bottom:8px }
  .prompt aha-counted-input{ width:100% }
  .opts{ display:flex; flex-direction:column; gap:8px }
  .add-opt{ align-self:flex-start; margin-top:8px }
  .add-opt, .add-q{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; gap:6px;
    height:32px; padding:0 12px; font:inherit; font-size:14px; font-weight:600; cursor:pointer;
    color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-container,#fff);
    border:1px dashed var(--aha-border-hover,#D3B4FF); border-radius:var(--aha-radius-default,8px);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  /* the primary "+ Add question" spans the full panel width (SETTINGS-31) */
  .add-q{ width:100%; margin-top:12px }
  .add-opt aha-icon, .add-q aha-icon{ color:currentColor }
  .add-opt:hover, .add-q:hover{ background:var(--aha-bg-accent,#F9F5FF) }
  .add-q:disabled, .add-opt:disabled{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); background:var(--aha-bg-container-disabled,#F1F1F1) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

let _uid = 0;

export class AhaQuestionList extends HTMLElement {
  static get observedAttributes() { return ['max', 'min', 'minoptions', 'maxoptions', 'disabled']; }
  get questions() { return this._qs || []; }
  set questions(v) { this._qs = (Array.isArray(v) ? v : []).map(this._norm); this._build(); }
  get _max() { return parseInt(this.getAttribute('max') || '0', 10) || Infinity; }
  get _min() { return parseInt(this.getAttribute('min') || '1', 10); }
  get _minOpts() { return parseInt(this.getAttribute('minoptions') || '2', 10); }
  get _maxOpts() { return parseInt(this.getAttribute('maxoptions') || '0', 10) || Infinity; }

  _norm(q) { return { id: q.id || 'q' + (++_uid), prompt: q.prompt || '', options: (q.options || []).map((o) => ({ id: o.id || 'o' + (++_uid), text: o.text || '', correct: !!o.correct })) }; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._qs) { try { this._qs = JSON.parse(this.getAttribute('questions') || '[]').map(this._norm); } catch { this._qs = []; } }
    this._build();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._build(); }

  // Rebuild the composed tree on a DATA change (questions/limits). Collapse + field edits mutate in
  // place on the composed elements; only add/remove (structural) rebuilds — data, not an animated state.
  _build() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="list" part="list"></div>` +
      `<button class="add-q" part="add-question" type="button"><aha-icon name="system-plus" size="16" aria-hidden="true"></aha-icon>Add question</button>`;
    const list = this.shadowRoot.querySelector('.list');
    const qs = this._qs || [];
    qs.forEach((q, qi) => {
      const item = document.createElement('aha-numbered-item');
      item.setAttribute('n', String(qi + 1));
      item.setAttribute('label', 'Question');
      item.setAttribute('collapsible', '');
      item.setAttribute('deletable', '');
      if (qs.length <= this._min) item.setAttribute('candelete', 'false');
      item.addEventListener('delete', () => this._removeQuestion(qi));

      const prompt = document.createElement('aha-counted-input');
      prompt.className = 'prompt';
      prompt.setAttribute('maxlength', '120');
      prompt.setAttribute('placeholder', 'Question prompt');
      prompt.value = q.prompt;
      prompt.addEventListener('input', (e) => { q.prompt = e.detail.value; this._emit(); });

      const opts = document.createElement('div');
      opts.className = 'opts';
      q.options.forEach((o, oi) => {
        const row = document.createElement('aha-option-row');
        row.setAttribute('correctable', '');
        row.setAttribute('maxlength', '80');
        row.value = o.text;
        if (o.correct) row.setAttribute('correct', '');
        if (q.options.length <= this._minOpts) row.setAttribute('candelete', 'false');
        row.addEventListener('input', (e) => { o.text = e.detail.value; this._emit(); });
        row.addEventListener('correct-change', (e) => { o.correct = e.detail.correct; this._emit(); });
        row.addEventListener('delete', () => this._removeOption(qi, oi));
        opts.appendChild(row);
      });

      const addOpt = document.createElement('button');
      addOpt.type = 'button';
      addOpt.className = 'add-opt';
      addOpt.innerHTML = `<aha-icon name="system-plus" size="14" aria-hidden="true"></aha-icon>Add option`;
      addOpt.disabled = q.options.length >= this._maxOpts;
      addOpt.addEventListener('click', () => this._addOption(qi));

      item.append(prompt, opts, addOpt);
      list.appendChild(item);
    });
    const addQ = this.shadowRoot.querySelector('.add-q');
    addQ.disabled = qs.length >= this._max || this.hasAttribute('disabled');
    addQ.addEventListener('click', () => this._addQuestion());
  }

  _addQuestion() { if (this._qs.length >= this._max) return; this._qs.push(this._norm({ options: [{}, {}] })); this._build(); this._emit(); }
  _removeQuestion(i) { if (this._qs.length <= this._min) return; this._qs.splice(i, 1); this._build(); this._emit(); }
  _addOption(qi) { const q = this._qs[qi]; if (q.options.length >= this._maxOpts) return; q.options.push(this._norm({ options: [{}] }).options[0]); this._build(); this._emit(); }
  _removeOption(qi, oi) { const q = this._qs[qi]; if (q.options.length <= this._minOpts) return; q.options.splice(oi, 1); this._build(); this._emit(); }
  _emit() { this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { questions: this._qs } })); }
}

export function defineAhaQuestionList(tag = 'aha-question-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaQuestionList);
  return true;
}
if (typeof window !== 'undefined') defineAhaQuestionList();

export default { AhaQuestionList, defineAhaQuestionList };
