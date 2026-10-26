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
 *   notices   optional InfoBoxes (info, warning, error) between the head and the questions, set through `notices`
 *   question  a bordered DS Collapse whose header reads "N. <prompt>" clamped to two lines, with header slots
 *             at every position (start, marker, before, after, end), an optional status line under it, a warning/error border, and a
 *             secondary small trash Button (+ "Delete question" tooltip) centred on the card's top-right
 *             corner, revealed on hover or keyboard focus and a Tab stop (exactly OptionRow's delete)
 *   body      a stacked SettingRow "Question" over a CountedInput (a CountedTextarea of 1 to 3 rows with
 *             `multiline`), then a stacked SettingRow "Options" over the question's OptionRows and a full-width
 *             "Add option" AddItemButton
 *   add       a full-width "Add question" AddItemButton under the list
 * Limits are conveyed by the add buttons disabling at `max` / `maxoptions` and the deletes disabling at
 * `min` / `minoptions` (SETTINGS-36). `allowimage` gives every option the per-option image control,
 * whose `image-*` intents bubble out of the list. Shadow-DOM CSS, themed only by --aha-* tokens.
 * Emits composed `change` CustomEvent<{questions, edit}> on every edit; `edit` names what changed:
 * `{ type, questionId, optionId? }`, type prompt | option-text | option-correct | option-add | option-delete |
 * question-add | question-delete.
 *
 * Intent events: before the list adds or deletes a question it fires a cancelable, composed `question-add`
 * (`detail: { index }`, the position it would insert at, the end of the list) or `question-delete`
 * (`detail: { index, question }`, the question about to go, so a host can offer Undo). Call `preventDefault()` to
 * handle it yourself (insert at the video playhead, confirm first) and set `el.questions`; left alone, the list
 * does it and then emits `change` as before.
 *
 * Open state for hosts that track it: a header click or a notice link fires a cancelable, composed
 * `question-toggle` (`detail: { id, index, open, source }`, source "header" | "notice") before the question opens
 * or closes; `preventDefault()` keeps it as it was. `accordion` keeps at most one question open.
 * `setQuestionOpen(id, open)` opens or closes one from code (no event). `question-leave` (`detail: { id, index }`)
 * fires once each time focus or a pointer press moves out of a question it was in (its card and its slotted
 * content), so a host that saves or validates on leaving knows when. Setting `questions` again with the same
 * question and option ids in the same order updates the fields in place, so a host that writes every edit back
 * keeps the caret and focus; any other model change rebuilds the list.
 *
 * Copy: every built-in string is English by default and overridable through `strings` (property object or JSON
 * attribute). Keys: `countOne` / `countOther` ("{count} question(s)"), plus `countZero` / `countTwo` / `countFew` /
 * `countMany` picked by Intl.PluralRules for the element's `lang` (or the nearest ancestor's), `addQuestion`, `question`,
 * `options`, `addOption`, `deleteQuestion` (tooltip), `deleteQuestionN` ("Delete question {n}"), `questionN`
 * ("Question {n}"), `untitledQuestion`, `questionPlaceholder`, `correctAnswer` (the options' correct-toggle name),
 * `markAsCorrect` (that name on an option not marked correct; defaults to `correctAnswer`), `optionPlaceholder`,
 * `deleteOption`, `deleteOptionHint`, `reorderOption`, `reorderOptionHint` (the option rows' field, delete and
 * drag-handle copy). Omitted keys keep English; the optional image control keeps its own copy.
 *
 * Header slots, keyed by question id, filled with any number of light-DOM children (non-interactive only —
 * the header is a button), in this order: `start-<id>` (right after the caret), `marker-<id>` (replaces the
 * "N." number; the header keeps a hidden "Question N" name), `before-<id>` / `after-<id>` (either side of the
 * prompt), `end-<id>` (the trailing edge). Children in one slot sit 6px apart; slotted items never shrink;
 * the prompt wraps to at most two lines, then ellipsises.
 *   <aha-question-list><aha-tag slot="before-q1">00:23</aha-tag></aha-question-list>
 *
 * Body slot `body-<id>` holds INTERACTIVE light-DOM children (a SettingRow with a time input and stepper, say)
 * inside the open body of question `<id>`, above the "Question" row. The body is not the header button, so
 * focus, clicks, keys and edits there never toggle the collapse. A closed question hides it (not focusable);
 * it follows its question by id across reorder, add and delete, and an id with no question renders nothing.
 * Native `input` / `change` events from slotted children reach the list's host untouched; the list's own
 * `change` carries `detail.questions`.
 * Per-question `status: { message, tone }` (tone info | warning | error, default info) renders an
 * <aha-field-error> under the header, visible collapsed and open; a warning or error tone also recolours the
 * card border (--aha-border-warning / --aha-border-error; part `question-warning` / `question-error`).
 * Per-question `current: true` gives the header the Collapse's selected look (the item at the playhead, say);
 * `untitled` replaces the "Untitled question" header text of that question while its prompt is empty.
 *
 * Test hooks: every question card carries `data-question-id` and every option row `data-option-id`. With
 * `testid="<prefix>"` the list also stamps `data-testid` on its parts: `<prefix>-count`, `<prefix>-notice-<tone>`,
 * `<prefix>-item-<id>`, `<prefix>-title-<id>`, `<prefix>-status-<id>`, `<prefix>-delete-<id>`, `<prefix>-prompt-<id>`,
 * `<prefix>-option-<optionId>`, `<prefix>-add-option-<id>` and `<prefix>-add-question`.
 */
import './aha-setting-row.js';
import './aha-collapse.js';
import './aha-counted-input.js';
import './aha-counted-textarea.js';
import './aha-option-row.js';
import './aha-add-item-button.js';
import './aha-button.js';
import './aha-tooltip.js';
import './aha-field-error.js';
import './aha-info-box.js';
import './icons.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .count{ font-size:12px; line-height:18px; color:var(--aha-text-secondary,#4A4A4A); white-space:nowrap }
  .notices{ display:flex; flex-direction:column; gap:var(--aha-space-8,8px); margin-top:var(--aha-space-8,8px);
    --aha-text-link:var(--aha-text-default,#1A1A1A); --aha-text-link-hover:var(--aha-text-default,#1A1A1A) }
  .notices:empty{ display:none }
  .notices p{ margin:0 }
  .notices p + p{ margin-top:var(--aha-space-6,6px) }
  .notices aha-button{ vertical-align:baseline }
  .list{ display:flex; flex-direction:column; gap:12px; margin-top:8px }
  .list:empty{ display:none }
  .question{ position:relative }
  .question aha-collapse::part(head){ box-sizing:border-box; align-items:flex-start; min-height:52px; padding:calc(var(--aha-space-12,12px) + 3px) var(--aha-space-16,16px); font-size:14px; line-height:22px; font-weight:400;
    background:var(--aha-gray-15,#FAFAFA); transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .question aha-collapse::part(caret){ margin-top:calc(var(--aha-space-4,4px) - 1px) }
  .question aha-collapse::part(head):hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .question aha-collapse[selected]::part(head){ background:var(--aha-bg-hover,#F7F7F7) }
  .question aha-collapse[open]::part(head){ box-shadow:inset 0 -1px 0 var(--aha-border-default,#E3E3E3) }
  .title{ display:block; min-width:0 }
  .line{ display:flex; align-items:flex-start; gap:var(--aha-space-6,6px); min-width:0 }
  .marker{ position:relative; flex:0 0 auto; display:inline-flex; align-items:center; gap:var(--aha-space-6,6px); min-height:22px }
  .start, .before, .after, .end{ flex:0 0 auto; display:none; align-items:center; gap:var(--aha-space-6,6px); min-height:22px }
  .start[data-filled], .before[data-filled], .after[data-filled], .end[data-filled]{ display:inline-flex }
  .question[data-tone="warning"] aha-collapse::part(panel){ border-color:var(--aha-border-warning,#1A1A1A) }
  .question[data-tone="error"] aha-collapse::part(panel){ border-color:var(--aha-border-error,#1A1A1A) }
  .prompt{ flex:1 1 auto; min-width:0; overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; line-clamp:2; white-space:normal; overflow-wrap:anywhere }
  .marker:not([data-filled]) .name{ display:none }
  .name{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
  .status{ white-space:normal }
  .status[data-tone="warning"]{ color:var(--aha-text-secondary,#4A4A4A) }
  .delete{ position:absolute; top:-14px; right:-14px; z-index:2; opacity:0;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .question:hover .delete, .question:focus-within .delete, .delete:focus-within{ opacity:1 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
  .body-slot{ display:none; flex-direction:column; gap:var(--aha-space-16,16px) }
  .body-slot[data-filled]{ display:flex }
  .question aha-collapse:not([open]) .body-slot{ visibility:hidden }
  .fields{ display:flex; flex-direction:column; gap:16px; padding-top:16px }
  .fields aha-counted-textarea{ width:100% }
  .opts{ display:flex; flex-direction:column; gap:8px }
  .add-question{ margin-top:12px }
`;

const DEFAULT_STRINGS = {
  countOne: '{count} question',
  countOther: '{count} questions',
  addQuestion: 'Add question',
  question: 'Question',
  options: 'Options',
  addOption: 'Add option',
  deleteQuestion: 'Delete question',
  deleteQuestionN: 'Delete question {n}',
  questionN: 'Question {n}',
  untitledQuestion: 'Untitled question',
  questionPlaceholder: 'Type your question',
  correctAnswer: 'Correct answer',
  optionPlaceholder: 'Option text',
  deleteOption: 'Delete',
  deleteOptionHint: 'Delete (Backspace when empty)',
  reorderOption: 'Drag to reorder',
  reorderOptionHint: 'Drag to reorder, or use the arrow keys',
};
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));

const STATUS_TONES = ['info', 'warning', 'error'];
const NOTICE_VARIANTS = { info: 'information', warning: 'warning', error: 'error' };
const SLOTTED_NAME = /^(?:start|marker|before|after|end|body)-(.+)$/;

let uid = 0;
const nextId = (prefix) => prefix + (++uid);

const normaliseParagraph = (paragraph) => (Array.isArray(paragraph) ? paragraph : [paragraph])
  .map((part) => (typeof part === 'string' ? { text: part } : part))
  .filter((part) => part && (typeof part.text === 'string' || (part.question != null && typeof part.label === 'string')));

const normaliseNotices = (value) => (Array.isArray(value) ? value : [])
  .filter((notice) => notice && NOTICE_VARIANTS[notice.tone || 'info'])
  .map((notice) => ({ tone: notice.tone || 'info', paragraphs: (Array.isArray(notice.paragraphs) ? notice.paragraphs : []).map(normaliseParagraph).filter((parts) => parts.length) }))
  .filter((notice) => notice.paragraphs.length);

export class AhaQuestionList extends HTMLElement {
  static get observedAttributes() { return ['label', 'help', 'max', 'min', 'minoptions', 'maxoptions', 'allowimage', 'disabled', 'strings', 'multiline', 'promptmaxlength', 'optionmaxlength', 'singlecorrect', 'testid', 'lang']; }
  get questions() { return this._questions || []; }
  set questions(value) {
    const next = (Array.isArray(value) ? value : []).map(this._normalise);
    if (this.shadowRoot && this._questions && this._views && this._sameShape(next)) { this._patch(next); return; }
    this._questions = next;
    this._build();
  }
  get strings() { return this._strings || {}; }
  set strings(value) { this._strings = value && typeof value === 'object' ? value : {}; this._build(); }
  get notices() { return this._notices || []; }
  set notices(value) { this._notices = normaliseNotices(value); this._fillNotices(); }
  _customStrings() {
    if (this._strings) return this._strings;
    try { return JSON.parse(this.getAttribute('strings') || '{}') || {}; } catch { return {}; }
  }
  _text(key, values = {}) {
    const custom = this._customStrings();
    const template = typeof custom?.[key] === 'string' ? custom[key] : DEFAULT_STRINGS[key];
    return fill(template, values);
  }
  _countText(count) {
    const custom = this._customStrings();
    let category = null;
    try { category = new Intl.PluralRules(this.closest('[lang]')?.getAttribute('lang') || undefined).select(count); } catch { category = null; }
    const pluralKey = category && 'count' + category[0].toUpperCase() + category.slice(1);
    if (pluralKey && typeof custom?.[pluralKey] === 'string') return fill(custom[pluralKey], { count });
    return this._text(count === 1 ? 'countOne' : 'countOther', { count });
  }
  _correctLabel(correct) {
    const custom = this._customStrings();
    return !correct && typeof custom?.markAsCorrect === 'string' ? custom.markAsCorrect : this._text('correctAnswer');
  }
  _testId(node, suffix) {
    const prefix = this.getAttribute('testid');
    if (prefix) node.setAttribute('data-testid', `${prefix}-${suffix}`);
  }
  _maxLength(name, fallback) { return this.getAttribute(name) || fallback; }
  get _max() { return parseInt(this.getAttribute('max') || '0', 10) || Infinity; }
  get _min() { return parseInt(this.getAttribute('min') || '1', 10); }
  get _minOptions() { return parseInt(this.getAttribute('minoptions') || '2', 10); }
  get _maxOptions() { return parseInt(this.getAttribute('maxoptions') || '0', 10) || Infinity; }

  _normalise(question) {
    return {
      id: question.id || nextId('q'),
      prompt: question.prompt || '',
      open: !!question.open,
      ...(question.status?.message ? { status: { message: String(question.status.message), tone: STATUS_TONES.includes(question.status.tone) ? question.status.tone : 'info' } } : {}),
      ...(question.current ? { current: true } : {}),
      ...(typeof question.untitled === 'string' && question.untitled ? { untitled: question.untitled } : {}),
      options: (question.options || []).map((option) => ({ id: option.id || nextId('o'), text: option.text || '', correct: !!option.correct })),
    };
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // the inner controls' own events must not escape: the list's one `change` carries the model, and only `image-*` intents bubble out
      for (const type of ['change', 'input', 'correct-change', 'delete', 'toggle', 'add']) this.shadowRoot.addEventListener(type, (e) => { if (!this.contains(e.target)) e.stopPropagation(); });
      this.shadowRoot.addEventListener('slotchange', (e) => this._syncSlot(e.target));
      this.shadowRoot.addEventListener('focusin', (e) => this._enter(this._questionIdAt(e.composedPath())));
      this.shadowRoot.addEventListener('focusout', (e) => this._focusLeft(e));
      this._onPointerDown = (e) => this._pointerDown(e);
    }
    this.ownerDocument.addEventListener('pointerdown', this._onPointerDown, true);
    if (!this._questions) {
      try { this._questions = JSON.parse(this.getAttribute('questions') || '[]').map(this._normalise); } catch { this._questions = []; }
    }
    this._build();
  }
  disconnectedCallback() { this.ownerDocument.removeEventListener('pointerdown', this._onPointerDown, true); }
  attributeChangedCallback() { if (this.shadowRoot) this._build(); }

  // A data change (questions, limits) rebuilds the tree; field edits and open/closed mutate in place.
  _build() {
    if (!this.shadowRoot) return;
    const questions = this._questions || [];
    this._views = new Map();
    const head = document.createElement('aha-setting-row');
    head.setAttribute('part', 'head');
    head.setAttribute('label', this.getAttribute('label') || 'Questions');
    if (this.getAttribute('help')) head.setAttribute('help', this.getAttribute('help'));
    const count = document.createElement('span');
    count.slot = 'control';
    count.className = 'count';
    count.setAttribute('part', 'count');
    this._testId(count, 'count');
    count.textContent = this._countText(questions.length);
    head.appendChild(count);

    const notices = document.createElement('div');
    notices.className = 'notices';
    notices.setAttribute('part', 'notices');
    notices.setAttribute('aria-live', 'polite');
    this._noticesNode = notices;

    const list = document.createElement('div');
    list.className = 'list';
    list.setAttribute('part', 'list');
    questions.forEach((question, index) => list.appendChild(this._question(question, index)));
    this._drawnShape = questions.map((question) => Object.assign(question.options.map((option) => option.id), { questionId: question.id }));

    const addQuestion = document.createElement('aha-add-item-button');
    addQuestion.className = 'add-question';
    addQuestion.setAttribute('part', 'add-question');
    this._testId(addQuestion, 'add-question');
    addQuestion.setAttribute('label', this._text('addQuestion'));
    addQuestion.toggleAttribute('disabled', questions.length >= this._max || this.hasAttribute('disabled'));
    addQuestion.addEventListener('add', () => this._addQuestion());

    const style = document.createElement('style');
    style.textContent = STYLE;
    this.shadowRoot.replaceChildren(style, head, notices, list, addQuestion);
    this._fillNotices();
    this.shadowRoot.querySelectorAll('.title slot, .body-slot slot').forEach((slot) => this._syncSlot(slot));
  }

  _syncSlot(slot) {
    slot.parentElement.toggleAttribute('data-filled', slot.assignedNodes().length > 0);
  }

  _fillNotices() {
    const holder = this._noticesNode;
    if (!holder) return;
    holder.replaceChildren(...this.notices.map((notice) => {
      const box = document.createElement('aha-info-box');
      box.setAttribute('variant', NOTICE_VARIANTS[notice.tone]);
      box.dataset.tone = notice.tone;
      this._testId(box, `notice-${notice.tone}`);
      for (const parts of notice.paragraphs) {
        const paragraph = document.createElement('p');
        for (const part of parts) {
          if (part.question == null) { paragraph.append(part.text); continue; }
          const link = document.createElement('aha-button');
          link.setAttribute('variant', 'link');
          link.setAttribute('size', 'xs');
          link.dataset.questionId = String(part.question);
          link.textContent = part.label;
          link.addEventListener('click', () => this._requestOpen(String(part.question), true, 'notice'));
          paragraph.append(link);
        }
        box.append(paragraph);
      }
      return box;
    }));
  }

  _question(question, index) {
    const wrap = document.createElement('div');
    wrap.className = 'question';
    wrap.dataset.questionId = question.id;
    this._testId(wrap, `item-${question.id}`);

    const collapse = document.createElement('aha-collapse');
    collapse.toggleAttribute('open', question.open);
    collapse.addEventListener('toggle', (e) => { if (e.target === collapse) this._headerToggled(question, collapse, e.detail.open); });
    const title = document.createElement('span');
    title.slot = 'header';
    title.className = 'title';
    const line = document.createElement('span');
    line.className = 'line';
    const slotted = (className, part, slotPrefix, fallback) => {
      const holder = document.createElement('span');
      holder.className = className;
      holder.setAttribute('part', part);
      const slot = document.createElement('slot');
      slot.name = `${slotPrefix}-${question.id}`;
      if (fallback) slot.append(fallback);
      holder.append(slot);
      return holder;
    };
    const number = document.createElement('span');
    number.textContent = `${index + 1}.`;
    const marker = slotted('marker', 'marker', 'marker', number);
    const accessibleName = document.createElement('span');
    accessibleName.className = 'name';
    accessibleName.textContent = this._text('questionN', { n: index + 1 });
    marker.append(accessibleName);
    const promptText = document.createElement('span');
    promptText.className = 'prompt';
    promptText.setAttribute('part', 'prompt');
    promptText.setAttribute('dir', 'auto');
    this._testId(promptText, `title-${question.id}`);
    const setTitle = () => { promptText.textContent = question.prompt.trim() || question.untitled || this._text('untitledQuestion'); };
    setTitle();
    line.append(slotted('start', 'start', 'start'), marker, slotted('before', 'before', 'before'), promptText, slotted('after', 'after', 'after'), slotted('end', 'end', 'end'));
    title.append(line);

    const fields = document.createElement('div');
    fields.className = 'fields';

    const promptRow = document.createElement('aha-setting-row');
    promptRow.setAttribute('layout', 'stack');
    promptRow.setAttribute('label', this._text('question'));
    const multiline = this.hasAttribute('multiline');
    const prompt = document.createElement(multiline ? 'aha-counted-textarea' : 'aha-counted-input');
    prompt.slot = 'control';
    if (multiline) { prompt.setAttribute('minrows', '1'); prompt.setAttribute('maxrows', '3'); }
    prompt.setAttribute('maxlength', this._maxLength('promptmaxlength', '120'));
    prompt.setAttribute('placeholder', this._text('questionPlaceholder'));
    prompt.setAttribute('aria-label', this._text('questionN', { n: index + 1 }));
    this._testId(prompt, `prompt-${question.id}`);
    prompt.value = question.prompt;
    prompt.addEventListener('input', (e) => {
      if (!(e instanceof CustomEvent)) return;
      question.prompt = e.detail.value;
      setTitle();
      this._emit({ type: 'prompt', questionId: question.id });
    });
    promptRow.appendChild(prompt);

    const optionsRow = document.createElement('aha-setting-row');
    optionsRow.setAttribute('layout', 'stack');
    optionsRow.setAttribute('label', this._text('options'));
    const options = document.createElement('div');
    options.slot = 'control';
    options.className = 'opts';
    const view = { question, options: new Map(question.options.map((option) => [option.id, option])), wrap, collapse, title, prompt, setTitle, rows: new Map(), status: null };
    this._views.set(question.id, view);
    question.options.forEach((option, optionIndex) => options.appendChild(this._option(question, option, index, optionIndex)));
    const addOption = document.createElement('aha-add-item-button');
    addOption.setAttribute('label', this._text('addOption'));
    this._testId(addOption, `add-option-${question.id}`);
    addOption.toggleAttribute('disabled', question.options.length >= this._maxOptions);
    addOption.addEventListener('add', () => this._addOption(index));
    options.appendChild(addOption);
    optionsRow.appendChild(options);

    fields.append(slotted('body-slot', 'body-slot', 'body'), promptRow, optionsRow);
    collapse.append(title, fields);

    const tip = document.createElement('aha-tooltip');
    tip.className = 'delete';
    tip.setAttribute('text', this._text('deleteQuestion'));
    const remove = document.createElement('aha-button');
    remove.setAttribute('variant', 'secondary');
    remove.setAttribute('size', 'sm');
    remove.setAttribute('icon-only', '');
    remove.setAttribute('aria-label', this._text('deleteQuestionN', { n: index + 1 }));
    this._testId(remove, `delete-${question.id}`);
    remove.toggleAttribute('disabled', this._questions.length <= this._min);
    remove.innerHTML = '<aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon>';
    remove.addEventListener('click', () => this._removeQuestion(index));
    tip.appendChild(remove);

    wrap.append(collapse, tip);
    this._applyHeaderState(view, question);
    return wrap;
  }

  _applyHeaderState(view, question) {
    const tone = question.status?.tone;
    const highlighted = tone === 'warning' || tone === 'error';
    view.wrap.setAttribute('part', highlighted ? `question question-${tone}` : 'question');
    if (highlighted) view.wrap.dataset.tone = tone; else delete view.wrap.dataset.tone;
    view.collapse.toggleAttribute('selected', !!question.current);
    view.wrap.toggleAttribute('data-current', !!question.current);
    if (!question.status) { view.status?.remove(); view.status = null; return; }
    if (!view.status) {
      view.status = document.createElement('aha-field-error');
      view.status.className = 'status';
      view.status.setAttribute('part', 'status');
      this._testId(view.status, `status-${question.id}`);
      view.title.append(view.status);
    }
    view.status.dataset.tone = question.status.tone;
    if (question.status.tone === 'info') { view.status.setAttribute('tone', 'info'); view.status.removeAttribute('icon'); } else { view.status.setAttribute('icon', ''); view.status.removeAttribute('tone'); }
    view.status.setAttribute('message', question.status.message);
  }

  _option(question, option, questionIndex, optionIndex) {
    const row = document.createElement('aha-option-row');
    row.dataset.optionId = option.id;
    this._testId(row, `option-${option.id}`);
    row.setAttribute('orderable', '');
    row.setAttribute('correctable', '');
    row.setAttribute('maxlength', this._maxLength('optionmaxlength', '80'));
    row.setAttribute('correctlabel', this._correctLabel(option.correct));
    row.setAttribute('placeholder', this._text('optionPlaceholder'));
    row.setAttribute('deletelabel', this._text('deleteOption'));
    row.setAttribute('deletehint', this._text('deleteOptionHint'));
    row.setAttribute('reorderlabel', this._text('reorderOption'));
    row.setAttribute('reorderhint', this._text('reorderOptionHint'));
    if (this.hasAttribute('allowimage')) row.setAttribute('image', '');
    row.value = option.text;
    if (option.correct) row.setAttribute('correct', '');
    if (question.options.length <= this._minOptions) row.setAttribute('candelete', 'false');
    this._views.get(question.id)?.rows.set(option.id, row);
    row.addEventListener('input', (e) => { if (!(e instanceof CustomEvent)) return; option.text = e.detail.value; this._emit({ type: 'option-text', questionId: question.id, optionId: option.id }); });
    row.addEventListener('correct-change', (e) => this._correctChanged(question, option, e.detail.correct));
    row.addEventListener('delete', (e) => {
      const before = question.options.length;
      this._removeOption(questionIndex, optionIndex);
      if (e.detail?.source !== 'keyboard' || this._questions[questionIndex].options.length === before) return;
      const rows = this.shadowRoot.querySelectorAll('.list > .question')[questionIndex]?.querySelectorAll('aha-option-row');
      rows?.[Math.max(0, optionIndex - 1)]?.focus();
    });
    return row;
  }

  _correctChanged(question, option, correct) {
    if (this.hasAttribute('singlecorrect')) {
      if (!correct) { this._syncOptionRows(question); return; }
      question.options.forEach((other) => { other.correct = other === option; });
    } else {
      option.correct = correct;
    }
    this._syncOptionRows(question);
    this._emit({ type: 'option-correct', questionId: question.id, optionId: option.id });
  }

  _syncOptionRows(question) {
    const view = this._views?.get(question.id);
    if (!view) return;
    for (const option of question.options) {
      const row = view.rows.get(option.id);
      if (!row) continue;
      if (row.value !== option.text) row.value = option.text;
      row.toggleAttribute('correct', option.correct);
      row.setAttribute('correctlabel', this._correctLabel(option.correct));
    }
  }

  // Compared with the ids drawn at the last build, not the live model: a host may hand back the same array reordered.
  _sameShape(next) {
    const drawn = this._drawnShape || [];
    return drawn.length === next.length && drawn.every((optionIds, index) => {
      const other = next[index];
      return optionIds.questionId === other.id && optionIds.length === other.options.length
        && optionIds.every((optionId, optionIndex) => optionId === other.options[optionIndex].id);
    });
  }

  // Keeps the model objects the controls' handlers hold, so an in-place update never strands an edit.
  _patch(next) {
    this._questions = next.map((incoming) => {
      const view = this._views.get(incoming.id);
      const question = view.question;
      question.prompt = incoming.prompt;
      question.open = incoming.open;
      if (incoming.status) question.status = incoming.status; else delete question.status;
      if (incoming.current) question.current = true; else delete question.current;
      if (incoming.untitled) question.untitled = incoming.untitled; else delete question.untitled;
      question.options = incoming.options.map((option) => Object.assign(view.options.get(option.id), { text: option.text, correct: option.correct }));
      if (view.prompt.value !== question.prompt) view.prompt.value = question.prompt;
      view.setTitle();
      if (view.collapse.hasAttribute('open') !== question.open) { if (!question.open) this._leave(question.id); view.collapse.toggleAttribute('open', question.open); }
      this._applyHeaderState(view, question);
      this._syncOptionRows(question);
      return question;
    });
  }

  _headerToggled(question, collapse, open) {
    const intent = this._toggleIntent(question.id, open, 'header');
    if (!this.dispatchEvent(intent)) { collapse.toggleAttribute('open', !open); return; }
    this._setOpen(question, open);
  }

  _toggleIntent(id, open, source) {
    const index = this._questions.findIndex((question) => question.id === id);
    return new CustomEvent('question-toggle', { bubbles: true, composed: true, cancelable: true, detail: { id, index, open, source } });
  }

  _requestOpen(id, open, source) {
    const question = this._questions.find((candidate) => candidate.id === id);
    if (!question) return;
    if (question.open !== open && !this.dispatchEvent(this._toggleIntent(id, open, source))) return;
    this._setOpen(question, open);
    if (open) this._views.get(id)?.wrap.scrollIntoView?.({ block: 'nearest' });
  }

  setQuestionOpen(id, open = true) {
    const question = this._questions?.find((candidate) => candidate.id === id);
    if (question) this._setOpen(question, !!open);
  }

  _setOpen(question, open) {
    question.open = open;
    const view = this._views?.get(question.id);
    if (view && view.collapse.hasAttribute('open') !== open) view.collapse.toggleAttribute('open', open);
    if (!open) { this._leave(question.id); return; }
    if (this.hasAttribute('accordion')) this._closeOthers(question);
  }

  _closeOthers(question) {
    for (const other of this._questions) {
      if (other === question || !other.open) continue;
      other.open = false;
      this._views?.get(other.id)?.collapse.removeAttribute('open');
      this._leave(other.id);
    }
  }

  _questionIdAt(path) {
    for (const node of path) {
      if (node === this) return null;
      if (node instanceof HTMLElement && node.parentElement === this) return SLOTTED_NAME.exec(node.slot || '')?.[1] ?? null;
      if (node instanceof HTMLElement && node.classList?.contains('question') && node.dataset.questionId) return node.dataset.questionId;
    }
    return null;
  }

  _enter(id) {
    if (id == null) return;
    this._entered ||= new Set();
    this._entered.add(id);
  }

  _leave(id) {
    if (!this._entered?.delete(id)) return;
    const index = this._questions.findIndex((question) => question.id === id);
    if (index < 0) return;
    this.dispatchEvent(new CustomEvent('question-leave', { bubbles: true, composed: true, detail: { id, index } }));
  }

  _focusLeft(event) {
    const from = this._questionIdAt(event.composedPath());
    if (from == null || !event.relatedTarget) return;
    const to = this._questionIdAt(this._pathOf(event.relatedTarget));
    if (to !== from) this._leave(from);
  }

  _pathOf(node) {
    const path = [];
    for (let current = node; current; current = current.parentNode || current.host) path.push(current);
    return path;
  }

  _pointerDown(event) {
    const at = this._questionIdAt(event.composedPath());
    for (const id of [...(this._entered || [])]) if (id !== at) this._leave(id);
    this._enter(at);
  }

  _addQuestion() {
    if (this._questions.length >= this._max) return;
    const intent = new CustomEvent('question-add', { bubbles: true, composed: true, cancelable: true, detail: { index: this._questions.length } });
    if (!this.dispatchEvent(intent)) return;
    const added = this._normalise({ open: true, options: [{}, {}] });
    if (this.hasAttribute('accordion')) this._closeOthers(added);
    this._questions.push(added);
    this._build(); this._emit({ type: 'question-add', questionId: added.id });
  }
  _removeQuestion(index) {
    if (this._questions.length <= this._min) return;
    const intent = new CustomEvent('question-delete', { bubbles: true, composed: true, cancelable: true, detail: { index, question: this._questions[index] } });
    if (!this.dispatchEvent(intent)) return;
    const [removed] = this._questions.splice(index, 1);
    this._entered?.delete(removed.id);
    this._build(); this._emit({ type: 'question-delete', questionId: removed.id });
  }
  _addOption(questionIndex) {
    const question = this._questions[questionIndex];
    if (question.options.length >= this._maxOptions) return;
    const option = { id: nextId('o'), text: '', correct: false };
    question.options.push(option);
    this._build(); this._emit({ type: 'option-add', questionId: question.id, optionId: option.id });
  }
  _removeOption(questionIndex, optionIndex) {
    const question = this._questions[questionIndex];
    if (question.options.length <= this._minOptions) return;
    const [removed] = question.options.splice(optionIndex, 1);
    this._build(); this._emit({ type: 'option-delete', questionId: question.id, optionId: removed.id });
  }
  _emit(edit) { this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { questions: this._questions, edit } })); }
}

export function defineAhaQuestionList(tag = 'aha-question-list') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaQuestionList);
  return true;
}
if (typeof window !== 'undefined') defineAhaQuestionList();

export default { AhaQuestionList, defineAhaQuestionList };
