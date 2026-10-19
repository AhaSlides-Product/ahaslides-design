import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(body) {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-keyboard-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-option-row id="a" singleline value="Paris"></aha-option-row>
<aha-option-row id="b" singleline value=""></aha-option-row>
<aha-option-row id="c" singleline value="" candelete="false"></aha-option-row>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-option-row'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const row = (id) => document.getElementById(id);
    const textarea = (r) => r.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea');
    const press = (r, init = {}) => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, composed: true, cancelable: true, ...init });
      textarea(r).dispatchEvent(event);
      return event.defaultPrevented;
    };
    const deletes = (r) => { const seen = []; r.addEventListener('delete', (e) => seen.push(e.detail)); return seen; };
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

test('the delete button is not a tab stop but still deletes on click, with a pointer source', { skip }, async () => {
  const result = await run(`
    const a = row('a');
    const seen = deletes(a);
    const button = a.shadowRoot.querySelector('.delete-button');
    button.shadowRoot.querySelector('button').click();
    return { tabIndex: button.shadowRoot.querySelector('button').tabIndex, seen };`);
  assert.deepEqual(result, { tabIndex: -1, seen: [{ source: 'pointer' }] });
});

test('Backspace in an empty field deletes with a keyboard source; text, modifiers, composition and candelete=false do not', { skip }, async () => {
  const result = await run(`
    const a = row('a'), b = row('b'), c = row('c');
    const seenA = deletes(a), seenB = deletes(b), seenC = deletes(c);
    const withText = press(a);
    const empty = press(b);
    const composing = press(b, { isComposing: true });
    const modified = press(b, { ctrlKey: true });
    const repeated = press(b, { repeat: true });
    const locked = press(c);
    return { withText, empty, composing, modified, repeated, locked, seenA, seenB, seenC };`);
  assert.deepEqual(result, {
    withText: false, empty: true, composing: false, modified: false, repeated: false, locked: false,
    seenA: [], seenB: [{ source: 'keyboard' }], seenC: [],
  });
});

test('the field declares the Backspace shortcut and the tooltip names it, only when delete is allowed', { skip }, async () => {
  const result = await run(`
    const info = (r) => ({ shortcut: textarea(r).getAttribute('aria-keyshortcuts'), tip: r.shadowRoot.querySelector('.delete').getAttribute('text') });
    return { a: info(row('a')), c: info(row('c')) };`);
  assert.deepEqual(result, {
    a: { shortcut: 'Backspace', tip: 'Delete (Backspace when empty)' },
    c: { shortcut: null, tip: 'Delete' },
  });
});

test('focus() puts focus in the row\'s own text field', { skip }, async () => {
  const result = await run(`
    const b = row('b');
    b.focus();
    return { focusedRow: document.activeElement === b, inField: b.shadowRoot.querySelector('.field').shadowRoot.activeElement === textarea(b) };`);
  assert.deepEqual(result, { focusedRow: true, inField: true });
});

test('question list: Backspace on an empty option moves focus to the previous option; a pointer delete leaves focus alone', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-keyboard-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-question-list id="list" questions='[{"prompt":"Q","options":[{"text":"A"},{"text":"B"},{"text":"C"},{"text":""},{"text":""}]}]'></aha-question-list>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const list = document.getElementById('list');
    const rows = () => [...list.shadowRoot.querySelectorAll('.list > .question')[0].querySelectorAll('aha-option-row')];
    const area = (r) => r.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea');
    const backspace = (r) => area(r).dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, composed: true, cancelable: true }));
    const focusedIndex = () => rows().findIndex((r) => r.shadowRoot.querySelector('.field').shadowRoot.activeElement === area(r));
    backspace(rows()[4]);
    const afterLast = { count: rows().length, focused: focusedIndex() };
    backspace(rows()[3]);
    const afterMiddle = { count: rows().length, focused: focusedIndex() };
    rows()[0].shadowRoot.querySelector('.delete-button').shadowRoot.querySelector('button').click();
    const afterPointer = { count: rows().length, focused: focusedIndex() };
    return { afterLast, afterMiddle, afterPointer };
  })()`, { readyExpr: '!!window.ready' });
  assert.deepEqual(result, {
    afterLast: { count: 4, focused: 3 },
    afterMiddle: { count: 3, focused: 2 },
    afterPointer: { count: 2, focused: -1 },
  });
});
