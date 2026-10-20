/**
 * @ahaslides-product/design/aha-question-list — an editable list of collapsible questions.
 *
 *   import '@ahaslides-product/design/aha-question-list';   // registers <aha-question-list>
 *   <aha-question-list label="Questions" help="Each question runs as its own round." max="10" allowimage></aha-question-list>
 *   el.questions = [{ id:'q1', prompt:'…', open:true, options:[{ id:'o1', text:'…', correct:true }] }];
 *
 * The composite settings surface for an editable list of questions (SETTINGS-31/36), laid out as the
 * settings lab's QuestionList and composed only from DS components:
 *   head      a SettingRow — the list label (+ optional "?" help) LEFT, the "N questions" count RIGHT
 *   list      ONE bordered rounded block holding every question, rows split by 1px dividers, no gap
  question  a borderless DS Collapse row (transparent header; the open row's header takes --aha-gray-15) whose header reads "N. <prompt>", with a tertiary small trash
 *             Button (+ "Delete question" tooltip) on the header's trailing edge
 *   body      a stacked SettingRow "Question" over a CountedInput, then a stacked SettingRow "Options"
 *             over the question's OptionRows and a full-width "Add option" AddItemButton
 *   add       a full-width "Add question" AddItemButton under the list
 * Limits are conveyed by the add buttons disabling at `max` / `maxoptions` and the deletes disabling at
 * `min` / `minoptions` (SETTINGS-36). `allowimage` gives every option the per-option image control,
 * whose `image-*` intents bubble out of the list. Shadow-DOM CSS, themed only by --aha-* tokens.
 * Emits composed `change` CustomEvent<{questions}> on every edit.
 */
import './aha-setting-row.js';
import './aha-collapse.js';
import './aha-counted-input.js';
import './aha-option-row.js';
import './aha-add-item-button.js';
import './aha-button.js';
import './aha-tooltip.js';
import './icons.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .count{ font-size:12px; line-height:18px; color:var(--aha-text-secondary,#4A4A4A); white-space:nowrap }
  .list{ display:flex; flex-direction:column; margin-top:8px; overflow:hidden; box-sizing:border-box;
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF) }
  .list:empty{ display:none }
  .question{ position:relative }
  .question + .question{ border-top:1px solid var(--aha-border-default,#E3E3E3) }
  .question aha-collapse::part(panel){ border:0; border-radius:0 }
  /* room on the header's trailing edge for the delete, which sits over it (a button cannot nest in the header button) */
  .question aha-collapse::part(head){ box-sizing:border-box; min-height:52px; padding:12px 52px 12px 16px; font-size:14px; line-height:22px; font-weight:400;
    background:transparent; transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .question aha-collapse::part(head):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .question aha-collapse[open]::part(head){ background:var(--aha-gray-15,#FAFAFA); box-shadow:inset 0 -1px 0 var(--aha-border-default,#E3E3E3) }
  .delete{ position:absolute; top:11px; right:12px }
  .fields{ display:flex; flex-direction:column; gap:16px; padding-top:16px }
  .opts{ display:flex; flex-direction:column; gap:8px }
  .add-question{ margin-top:12px }
`;

let uid = 0;
const nextId = (prefix) => prefix + (++uid);

export class AhaQuestionList extends HTMLElement {
  static get observedAttributes() { return ['label', 'help', 'max', 'min', 'minoptions', 'maxoptions', 'allowimage', 'disabled']; }
  get questions() { return this._questions || []; }
  set questions(value) { this._questions = (Array.isArray(value) ? value : []).map(this._normalise); this._build(); }
  get _max() { return parseInt(this.getAttribute('max') || '0', 10) || Infinity; }
  get _min() { return parseInt(this.getAttribute('min') || '1', 10); }
  get _minOptions() { return parseInt(this.getAttribute('minoptions') || '2', 10); }
  get _maxOptions() { return parseInt(this.getAttribute('maxoptions') || '0', 10) || Infinity; }

  _normalise(question) {
    return {
      id: question.id || nextId('q'),
      prompt: question.prompt || '',
      open: !!question.open,
      options: (question.options || []).map((option) => ({ id: option.id || nextId('o'), text: option.text || '', correct: !!option.correct })),
    };
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // the inner controls' own events must not escape: the list's one `change` carries the model, and only `image-*` intents bubble out
      for (const type of ['change', 'input', 'correct-change', 'delete', 'toggle', 'add']) this.shadowRoot.addEventListener(type, (e) => e.stopPropagation());
    }
    if (!this._questions) {
      try { this._questions = JSON.parse(this.getAttribute('questions') || '[]').map(this._normalise); } catch { this._questions = []; }
    }
    this._build();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._build(); }

  // A data change (questions, limits) rebuilds the tree; field edits and open/closed mutate in place.
  _build() {
    if (!this.shadowRoot) return;
    const questions = this._questions || [];
    const head = document.createElement('aha-setting-row');
    head.setAttribute('part', 'head');
    head.setAttribute('label', this.getAttribute('label') || 'Questions');
    if (this.getAttribute('help')) head.setAttribute('help', this.getAttribute('help'));
    const count = document.createElement('span');
    count.slot = 'control';
    count.className = 'count';
    count.setAttribute('part', 'count');
    count.textContent = `${questions.length} question${questions.length === 1 ? '' : 's'}`;
    head.appendChild(count);

    const list = document.createElement('div');
    list.className = 'list';
    list.setAttribute('part', 'list');
    questions.forEach((question, index) => list.appendChild(this._question(question, index)));

    const addQuestion = document.createElement('aha-add-item-button');
    addQuestion.className = 'add-question';
    addQuestion.setAttribute('part', 'add-question');
    addQuestion.setAttribute('label', 'Add question');
    addQuestion.toggleAttribute('disabled', questions.length >= this._max || this.hasAttribute('disabled'));
    addQuestion.addEventListener('add', () => this._addQuestion());

    const style = document.createElement('style');
    style.textContent = STYLE;
    this.shadowRoot.replaceChildren(style, head, list, addQuestion);
  }

  _question(question, index) {
    const wrap = document.createElement('div');
    wrap.className = 'question';
    wrap.setAttribute('part', 'question');

    const collapse = document.createElement('aha-collapse');
    collapse.toggleAttribute('open', question.open);
    collapse.addEventListener('toggle', (e) => { if (e.target === collapse) question.open = e.detail.open; });
    const title = document.createElement('span');
    title.slot = 'header';
    const setTitle = () => { title.textContent = `${index + 1}. ${question.prompt.trim() || 'Untitled question'}`; };
    setTitle();

    const fields = document.createElement('div');
    fields.className = 'fields';

    const promptRow = document.createElement('aha-setting-row');
    promptRow.setAttribute('layout', 'stack');
    promptRow.setAttribute('label', 'Question');
    const prompt = document.createElement('aha-counted-input');
    prompt.slot = 'control';
    prompt.setAttribute('maxlength', '120');
    prompt.setAttribute('placeholder', 'Type your question');
    prompt.setAttribute('aria-label', `Question ${index + 1}`);
    prompt.value = question.prompt;
    prompt.addEventListener('input', (e) => {
      if (!(e instanceof CustomEvent)) return;
      question.prompt = e.detail.value;
      setTitle();
      this._emit();
    });
    promptRow.appendChild(prompt);

    const optionsRow = document.createElement('aha-setting-row');
    optionsRow.setAttribute('layout', 'stack');
    optionsRow.setAttribute('label', 'Options');
    const options = document.createElement('div');
    options.slot = 'control';
    options.className = 'opts';
    question.options.forEach((option, optionIndex) => options.appendChild(this._option(question, option, index, optionIndex)));
    const addOption = document.createElement('aha-add-item-button');
    addOption.setAttribute('label', 'Add option');
    addOption.toggleAttribute('disabled', question.options.length >= this._maxOptions);
    addOption.addEventListener('add', () => this._addOption(index));
    options.appendChild(addOption);
    optionsRow.appendChild(options);

    fields.append(promptRow, optionsRow);
    collapse.append(title, fields);

    const tip = document.createElement('aha-tooltip');
    tip.className = 'delete';
    tip.setAttribute('text', 'Delete question');
    const remove = document.createElement('aha-button');
    remove.setAttribute('variant', 'tertiary');
    remove.setAttribute('size', 'sm');
    remove.setAttribute('icon-only', '');
    remove.setAttribute('aria-label', `Delete question ${index + 1}`);
    remove.toggleAttribute('disabled', this._questions.length <= this._min);
    remove.innerHTML = '<aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon>';
    remove.addEventListener('click', () => this._removeQuestion(index));
    tip.appendChild(remove);

    wrap.append(collapse, tip);
    return wrap;
  }

  _option(question, option, questionIndex, optionIndex) {
    const row = document.createElement('aha-option-row');
    row.setAttribute('orderable', '');
    row.setAttribute('correctable', '');
    row.setAttribute('maxlength', '80');
    if (this.hasAttribute('allowimage')) row.setAttribute('image', '');
    row.value = option.text;
    if (option.correct) row.setAttribute('correct', '');
    if (question.options.length <= this._minOptions) row.setAttribute('candelete', 'false');
    row.addEventListener('input', (e) => { if (!(e instanceof CustomEvent)) return; option.text = e.detail.value; this._emit(); });
    row.addEventListener('correct-change', (e) => { option.correct = e.detail.correct; this._emit(); });
    row.addEventListener('delete', (e) => {
      const before = question.options.length;
      this._removeOption(questionIndex, optionIndex);
      if (e.detail?.source !== 'keyboard' || this._questions[questionIndex].options.length === before) return;
      const rows = this.shadowRoot.querySelectorAll('.list > .question')[questionIndex]?.querySelectorAll('aha-option-row');
      rows?.[Math.max(0, optionIndex - 1)]?.focus();
    });
    return row;
  }

  _addQuestion() {
    if (this._questions.length >= this._max) return;
    this._questions.push(this._normalise({ open: true, options: [{}, {}] }));
    this._build(); this._emit();
  }
  _removeQuestion(index) {
    if (this._questions.length <= this._min) return;
    this._questions.splice(index, 1);
    this._build(); this._emit();
  }
  _addOption(questionIndex) {
    const question = this._questions[questionIndex];
    if (question.options.length >= this._maxOptions) return;
    question.options.push({ id: nextId('o'), text: '', correct: false });
    this._build(); this._emit();
  }
  _removeOption(questionIndex, optionIndex) {
    const question = this._questions[questionIndex];
    if (question.options.length <= this._minOptions) return;
    question.options.splice(optionIndex, 1);
    this._build(); this._emit();
  }
  _emit() { this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { questions: this._questions } })); }
}

export function defineAhaQuestionList(tag = 'aha-question-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaQuestionList);
  return true;
}
if (typeof window !== 'undefined') defineAhaQuestionList();

export default { AhaQuestionList, defineAhaQuestionList };
