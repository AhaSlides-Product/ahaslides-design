import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(attributes, body, { lang = 'en', extra = '' } = {}) {
  const file = join(mkdtempSync(join(tmpdir(), 'question-list-host-')), 'page.html');
  writeFileSync(file, `<!doctype html><html lang="${lang}"><body style="width:480px">
<aha-question-list id="list" ${attributes} questions='[
  {"id":"q1","prompt":"First","open":true,"options":[{"id":"a","text":"A","correct":true},{"id":"b","text":"B"}]},
  {"id":"q2","prompt":"Second","options":[{"id":"c","text":"C"},{"id":"d","text":"D"}]},
  {"id":"q3","prompt":"","options":[{"id":"e","text":"E"},{"id":"f","text":"F"}]}]'>${extra}</aha-question-list>
<button id="outside">outside</button>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(async () => {
    const frame = () => new Promise((done) => setTimeout(done, 120));
    const list = document.getElementById('list');
    const root = list.shadowRoot;
    const card = (id) => root.querySelector('.question[data-question-id="' + id + '"]');
    const isOpen = (id) => card(id).querySelector('aha-collapse').hasAttribute('open');
    const clickHead = (id) => card(id).querySelector('aha-collapse').shadowRoot.querySelector('[part~="head"]').click();
    const log = [];
    for (const type of ['change', 'question-toggle', 'question-leave']) list.addEventListener(type, (e) => log.push({ type, detail: type === 'change' ? e.detail.edit : e.detail }));
    ${body}
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
}

test('without the new attributes the list keeps its old behaviour', { skip }, async () => {
  const result = await run('', `
    clickHead('q2'); await frame();
    return { open: [isOpen('q1'), isOpen('q2')], prompt: card('q1').querySelector('aha-counted-input').getAttribute('maxlength'),
      option: card('q1').querySelector('aha-option-row').getAttribute('maxlength'), testids: root.querySelectorAll('[data-testid]').length,
      notices: getComputedStyle(root.querySelector('.notices')).display, toggles: log.filter((entry) => entry.type === 'question-toggle').length };
  `);
  assert.deepEqual(result.open, [true, true]);
  assert.equal(result.prompt, '120');
  assert.equal(result.option, '80');
  assert.equal(result.testids, 0);
  assert.equal(result.notices, 'none');
  assert.equal(result.toggles, 1);
});

test('accordion keeps one question open; question-toggle is cancelable; setQuestionOpen fires nothing', { skip }, async () => {
  const result = await run('accordion', `
    clickHead('q2'); await frame();
    const afterClick = [isOpen('q1'), isOpen('q2'), list.questions[0].open, list.questions[1].open];
    const toggle = log.find((entry) => entry.type === 'question-toggle');
    list.addEventListener('question-toggle', (e) => e.preventDefault(), { once: true });
    clickHead('q3'); await frame();
    const afterCancel = [isOpen('q2'), isOpen('q3'), list.questions[2].open];
    const before = log.length;
    list.setQuestionOpen('q3'); await frame();
    return { afterClick, toggle, afterCancel, afterMethod: [isOpen('q2'), isOpen('q3')], silent: log.slice(before).filter((entry) => entry.type === 'question-toggle').length };
  `);
  assert.deepEqual(result.afterClick, [false, true, false, true]);
  assert.deepEqual(result.toggle.detail, { id: 'q2', index: 1, open: true, source: 'header' });
  assert.deepEqual(result.afterCancel, [true, false, false]);
  assert.deepEqual(result.afterMethod, [false, true]);
  assert.equal(result.silent, 0);
});

test('change names the edit; singlecorrect keeps one correct; markAsCorrect names unmarked options', { skip }, async () => {
  const result = await run(`singlecorrect strings='{"markAsCorrect":"Mark as correct"}'`, `
    const rows = () => [...card('q1').querySelectorAll('aha-option-row')];
    const labels = () => rows().map((row) => row.getAttribute('correctlabel'));
    const before = labels();
    rows()[1].dispatchEvent(new CustomEvent('correct-change', { detail: { correct: true } })); await frame();
    const after = { correct: list.questions[0].options.map((option) => option.correct), labels: labels(), edit: log.at(-1).detail };
    const count = log.length;
    rows()[1].dispatchEvent(new CustomEvent('correct-change', { detail: { correct: false } })); await frame();
    const refused = { correct: list.questions[0].options.map((option) => option.correct), emitted: log.length - count, attribute: rows()[1].hasAttribute('correct') };
    card('q1').querySelector('aha-counted-input').dispatchEvent(new CustomEvent('input', { detail: { value: 'Edited' } }));
    return { before, after, refused, prompt: log.at(-1).detail };
  `);
  assert.deepEqual(result.before, ['Correct answer', 'Mark as correct']);
  assert.deepEqual(result.after, { correct: [false, true], labels: ['Mark as correct', 'Correct answer'], edit: { type: 'option-correct', questionId: 'q1', optionId: 'b' } });
  assert.deepEqual(result.refused, { correct: [false, true], emitted: 0, attribute: true });
  assert.deepEqual(result.prompt, { type: 'prompt', questionId: 'q1' });
});

test('notices render info boxes whose links open and announce a question', { skip }, async () => {
  const result = await run('accordion testid="ql"', `
    list.notices = [
      { tone: 'warning', paragraphs: [['Question ', { question: 'q3', label: '3' }, ' has no prompt.'], 'Fix it before presenting.'] },
      { tone: 'error', paragraphs: ['Two questions share a time.'] },
      { tone: 'bogus', paragraphs: ['dropped'] }];
    await frame();
    const boxes = [...root.querySelectorAll('.notices aha-info-box')];
    const shape = boxes.map((box) => ({ variant: box.getAttribute('variant'), testid: box.dataset.testid, paragraphs: box.querySelectorAll('p').length, text: box.textContent }));
    const live = root.querySelector('.notices').getAttribute('aria-live');
    const link = boxes[0].querySelector('a');
    const linkStyle = getComputedStyle(link), paragraphStyle = getComputedStyle(link.parentElement);
    const linkLook = { tag: link.tagName, buttons: boxes[0].querySelectorAll('aha-button').length, display: linkStyle.display, padding: linkStyle.padding, fontSize: linkStyle.fontSize === paragraphStyle.fontSize, lineHeight: linkStyle.lineHeight === paragraphStyle.lineHeight, weight: linkStyle.fontWeight, colour: linkStyle.color, underline: linkStyle.textDecorationLine, height: link.getBoundingClientRect().height <= parseFloat(paragraphStyle.lineHeight) };
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click); await frame();
    return { shape, live, linkLook, prevented: click.defaultPrevented, open: [isOpen('q1'), isOpen('q3')], toggle: log.find((entry) => entry.type === 'question-toggle').detail };
  `);
  assert.equal(result.live, 'polite');
  assert.deepEqual(result.linkLook, { tag: 'A', buttons: 0, display: 'inline', padding: '0px', fontSize: true, lineHeight: true, weight: '400', colour: 'rgb(219, 0, 91)', underline: 'underline', height: true });
  assert.equal(result.prevented, true);
  assert.deepEqual(result.shape, [
    { variant: 'warning', testid: 'ql-notice-warning', paragraphs: 2, text: 'Question 3 has no prompt.Fix it before presenting.' },
    { variant: 'error', testid: 'ql-notice-error', paragraphs: 1, text: 'Two questions share a time.' }]);
  assert.deepEqual(result.open, [false, true]);
  assert.deepEqual(result.toggle, { id: 'q3', index: 2, open: true, source: 'notice' });
});

test('a plain link written in an info box or alert is inline text in the DS link style', { skip }, async () => {
  const result = await run('', `
    const host = document.createElement('div');
    host.innerHTML = '<style>a{color:#E70E68}</style><aha-info-box id="ib" variant="warning">Questions <a href="#q2">2</a> and <a href="#q3">3</a> have no prompt.</aha-info-box><aha-alert id="al">See <a href="#q1">question 1</a>.</aha-alert>';
    document.body.append(host); await frame();
    const read = (id) => { const link = document.querySelector('#' + id + ' a'); const style = getComputedStyle(link);
      return { display: style.display, padding: style.padding, weight: style.fontWeight, colour: style.color, underline: style.textDecorationLine, fontSize: style.fontSize, lineHeight: style.lineHeight, textHeight: link.getBoundingClientRect().height <= 21 }; };
    return { infoBox: read('ib'), alert: read('al') };
  `);
  const expected = { display: 'inline', padding: '0px', weight: '400', colour: 'rgb(219, 0, 91)', underline: 'underline', fontSize: '14px', lineHeight: '21px', textHeight: true };
  assert.deepEqual(result.infoBox, expected);
  assert.deepEqual(result.alert, expected);
});

test('question-leave fires once when focus or a press leaves a question, slotted content counting as inside', { skip }, async () => {
  const result = await run('', `
    card('q1').querySelector('aha-counted-input').shadowRoot.querySelector('input').focus(); await frame();
    document.getElementById('slotted').focus(); await frame();
    const insideSlot = log.filter((entry) => entry.type === 'question-leave').length;
    document.getElementById('outside').focus(); await frame();
    const afterFocus = log.filter((entry) => entry.type === 'question-leave').map((entry) => entry.detail);
    card('q1').querySelector('aha-counted-input').shadowRoot.querySelector('input').focus(); await frame();
    document.getElementById('outside').blur();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); await frame();
    return { insideSlot, afterFocus, total: log.filter((entry) => entry.type === 'question-leave').length };
  `, { extra: '<input id="slotted" slot="body-q1" aria-label="Time">' });
  assert.equal(result.insideSlot, 0);
  assert.deepEqual(result.afterFocus, [{ id: 'q1', index: 0 }]);
  assert.equal(result.total, 2);
});

test('question-leave counts a press inside a question that never took focus', { skip }, async () => {
  const result = await run('', `
    card('q2').querySelector('.prompt').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    document.getElementById('outside').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); await frame();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); await frame();
    return log.filter((entry) => entry.type === 'question-leave').map((entry) => entry.detail);
  `);
  assert.deepEqual(result, [{ id: 'q2', index: 1 }]);
});

test('same-shape questions patch in place and keep focus; current, untitled and dir apply', { skip }, async () => {
  const result = await run('multiline promptmaxlength="1000" optionmaxlength="60" testid="ql"', `
    const field = card('q1').querySelector('aha-counted-textarea');
    field.shadowRoot.querySelector('textarea').focus(); await frame();
    const next = list.questions.map((question) => ({ ...question, options: question.options.map((option) => ({ ...option })) }));
    next[0].prompt = 'First, rewritten';
    next[0].status = { message: 'Needs a time', tone: 'warning' };
    next[1].current = true;
    next[2].untitled = 'Add your question';
    list.questions = next; await frame();
    const sameNode = card('q1').querySelector('aha-counted-textarea') === field;
    return { sameNode, focused: root.activeElement === field, value: field.value, rows: [field.getAttribute('minrows'), field.getAttribute('maxrows'), field.getAttribute('maxlength')],
      option: card('q1').querySelector('aha-option-row').getAttribute('maxlength'), tone: card('q1').dataset.tone, status: root.querySelector('[data-testid="ql-status-q1"]')?.getAttribute('message'),
      current: [card('q2').querySelector('aha-collapse').hasAttribute('selected'), card('q2').hasAttribute('data-current')],
      untitled: card('q3').querySelector('.prompt').textContent, dir: card('q1').querySelector('.prompt').getAttribute('dir'),
      testids: ['ql-count', 'ql-item-q1', 'ql-title-q1', 'ql-delete-q1', 'ql-prompt-q1', 'ql-option-a', 'ql-add-option-q1', 'ql-add-question'].filter((id) => !root.querySelector('[data-testid="' + id + '"]')),
      ids: [card('q1').dataset.questionId, card('q1').querySelector('aha-option-row').dataset.optionId] };
  `);
  assert.equal(result.sameNode, true);
  assert.equal(result.focused, true);
  assert.equal(result.value, 'First, rewritten');
  assert.deepEqual(result.rows, ['1', '3', '1000']);
  assert.equal(result.option, '60');
  assert.equal(result.tone, 'warning');
  assert.equal(result.status, 'Needs a time');
  assert.deepEqual(result.current, [true, true]);
  assert.equal(result.untitled, 'Add your question');
  assert.equal(result.dir, 'auto');
  assert.deepEqual(result.testids, []);
  assert.deepEqual(result.ids, ['q1', 'a']);
});

test('count picks the plural category for the page language and falls back to countOne/countOther', { skip }, async () => {
  const result = await run(`strings='{"countOne":"{count} вопрос","countFew":"{count} вопроса","countMany":"{count} вопросов"}'`, `
    const counts = [];
    for (const n of [3, 1]) { list.questions = list.questions.slice(0, n); await frame(); counts.push(root.querySelector('.count').textContent); }
    return counts;
  `, { lang: 'ru' });
  assert.deepEqual(result, ['3 вопроса', '1 вопрос']);
});

test('accordion keeps only the first open question when a host writes back several', { skip }, async () => {
  const result = await run('accordion', `
    const openIds = () => ['q1', 'q2', 'q3'].filter(isOpen);
    const first = openIds();
    const model = list.questions.map((question) => ({ ...question, open: question.id !== 'q3' }));
    list.questions = model; await frame();
    const patched = openIds();
    list.questions = model.map((question) => ({ ...question, open: question.id !== 'q1' })); await frame();
    return { first, patched, later: openIds(), model: list.questions.map((question) => question.open) };
  `);
  assert.deepEqual(result.first, ['q1']);
  assert.deepEqual(result.patched, ['q1']);
  assert.deepEqual(result.later, ['q2']);
  assert.deepEqual(result.model, [false, true, false]);
});
