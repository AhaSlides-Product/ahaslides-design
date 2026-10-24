import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(attributes, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'question-list-strings-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="width:420px">
<aha-question-list id="list" ${attributes} questions='[
  {"id":"q1","prompt":"","open":true,"options":[{"text":"A"},{"text":"B"}]},
  {"id":"q2","prompt":"Second","options":[{"text":"A"},{"text":"B"}]}]'></aha-question-list>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(async () => { const frame = () => new Promise((done) => setTimeout(done, 250)); ${body} })()`, { readyExpr: '!!window.ready', timeout: 45000 });
}

const dump = `
  const root = document.getElementById('list').shadowRoot;
  const texts = (selector, attribute) => [...root.querySelectorAll(selector)].map((n) => attribute ? n.getAttribute(attribute) : n.textContent.trim());
`;

test('English copy is unchanged without strings', { skip }, async () => {
  const result = await run('', `${dump}
    return { count: texts('.count')[0], add: texts('.add-question', 'label')[0], tips: texts('.delete', 'text'), deletes: texts('.delete aha-button', 'aria-label'),
      untitled: texts('.prompt')[0], correct: [...root.querySelectorAll('aha-option-row')][0].shadowRoot.querySelector('.correct').getAttribute('aria-label') };
  `);
  assert.equal(result.count, '2 questions');
  assert.equal(result.add, 'Add question');
  assert.deepEqual(result.tips, ['Delete question', 'Delete question']);
  assert.deepEqual(result.deletes, ['Delete question 1', 'Delete question 2']);
  assert.equal(result.untitled, 'Untitled question');
  assert.equal(result.correct, 'Correct answer');
});

test('strings translate every built-in copy, from the attribute and the property', { skip }, async () => {
  const strings = JSON.stringify({ countOther: '{count} Fragen', countOne: '{count} Frage', addQuestion: 'Frage hinzufügen', question: 'Frage', options: 'Optionen', addOption: 'Option hinzufügen',
    deleteQuestion: 'Frage löschen', deleteQuestionN: 'Frage {n} löschen', questionN: 'Frage {n}', untitledQuestion: 'Frage ohne Titel', correctAnswer: 'Richtige Antwort' });
  const result = await run(`strings='${strings}'`, `${dump}
    const snapshot = () => ({ count: texts('.count')[0], add: texts('.add-question', 'label')[0], addOption: texts('.opts > aha-add-item-button', 'label')[0], tip: texts('.delete', 'text')[0],
      deleteName: texts('.delete aha-button', 'aria-label')[0], untitled: texts('.prompt')[0], rows: texts('aha-setting-row[layout="stack"]', 'label').slice(0, 2),
      correct: root.querySelector('aha-option-row').shadowRoot.querySelector('.correct').getAttribute('aria-label') });
    const fromAttribute = snapshot();
    const list = document.getElementById('list');
    list.removeAttribute('strings');
    list.strings = { countOther: '{count} preguntas' };
    await frame();
    return { fromAttribute, property: { count: texts('.count')[0], add: texts('.add-question', 'label')[0] } };
  `);
  assert.deepEqual(result.fromAttribute, { count: '2 Fragen', add: 'Frage hinzufügen', addOption: 'Option hinzufügen', tip: 'Frage löschen', deleteName: 'Frage 1 löschen',
    untitled: 'Frage ohne Titel', rows: ['Frage', 'Optionen'], correct: 'Richtige Antwort' });
  assert.deepEqual(result.property, { count: '2 preguntas', add: 'Add question' });
});

test('question-add and question-delete are cancelable intents; unhandled they edit and emit change', { skip }, async () => {
  const result = await run('', `
    const list = document.getElementById('list');
    const root = list.shadowRoot;
    const log = [];
    let prevent = true;
    list.addEventListener('question-add', (e) => { log.push(['add', e.detail.index, e.cancelable]); if (prevent) e.preventDefault(); });
    list.addEventListener('question-delete', (e) => { log.push(['delete', e.detail.index, e.detail.question.prompt]); if (prevent) e.preventDefault(); });
    let changes = 0;
    list.addEventListener('change', () => { changes++; });
    root.querySelector('.add-question').dispatchEvent(new CustomEvent('add'));
    root.querySelectorAll('.delete aha-button')[1].click();
    const prevented = { length: list.questions.length, changes };
    prevent = false;
    root.querySelector('.add-question').dispatchEvent(new CustomEvent('add'));
    root.querySelectorAll('.delete aha-button')[1].click();
    return { log, prevented, length: list.questions.length, changes };
  `);
  assert.deepEqual(result.log, [['add', 2, true], ['delete', 1, 'Second'], ['add', 2, true], ['delete', 1, 'Second']]);
  assert.deepEqual(result.prevented, { length: 2, changes: 0 });
  assert.equal(result.length, 2);
  assert.equal(result.changes, 2);
});

test('canvas count: total adds "of N" and its name; without total it is unchanged; strings translate it', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'canvas-count-total-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-canvas-count id="plain" answered="12"></aha-canvas-count>
<aha-canvas-count id="total" answered="12" total="30"></aha-canvas-count>
<aha-canvas-count id="verdict" correct="1" wrong="2" total="30"></aha-canvas-count>
<aha-canvas-count id="de" answered="12" total="30" strings='{"ofTotal":"von {total}","answeredOfTotal":"{answered} von {total} beantwortet"}'></aha-canvas-count>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-canvas-count'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const read = (id) => { const root = document.getElementById(id).shadowRoot; const of = root.querySelector('.of'); return { name: root.querySelector('.box').getAttribute('aria-label'), of: of.hidden ? null : of.textContent }; };
    return { plain: read('plain'), total: read('total'), verdict: read('verdict'), de: read('de') };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  assert.deepEqual(result.plain, { name: '12 answered', of: null });
  assert.deepEqual(result.total, { name: '12 of 30 answered', of: 'of 30' });
  assert.deepEqual(result.verdict, { name: '1 correct, 2 incorrect', of: null });
  assert.deepEqual(result.de, { name: '12 von 30 beantwortet', of: 'von 30' });
});
