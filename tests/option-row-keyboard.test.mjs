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

test('the delete button is a Tab stop (skipped when disabled), is revealed on focus and deletes on click, with a pointer source', { skip }, async () => {
  const result = await run(`
    const a = row('a');
    const seen = deletes(a);
    const button = a.shadowRoot.querySelector('.delete-button');
    button.shadowRoot.querySelector('button').click();
    const inner = button.shadowRoot.querySelector('button');
    const reveal = () => getComputedStyle(a.shadowRoot.querySelector('.delete')).opacity;
    const rest = reveal();
    inner.focus();
    const focused = { reached: a.shadowRoot.activeElement === button, opacity: reveal() };
    const locked = row('c').shadowRoot.querySelector('.delete-button').shadowRoot.querySelector('button');
    return { tabIndex: inner.tabIndex, rest, focused, seen, lockedDisabled: locked.disabled };`);
  assert.deepEqual(result, { tabIndex: 0, rest: '0', focused: { reached: true, opacity: '1' }, seen: [{ source: 'pointer' }], lockedDisabled: true });
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

async function runEnter(body) {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-enter-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<div id="on"><aha-option-row enternext value="One"></aha-option-row><aha-option-row enternext disabled value="Skip"></aha-option-row><aha-option-row enternext value="Three"></aha-option-row><aha-option-row enternext value="Last"></aha-option-row></div>
<div id="off"><aha-option-row value="x"></aha-option-row><aha-option-row value="y"></aha-option-row></div>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-option-row'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const rows = (id) => [...document.querySelectorAll('#' + id + ' aha-option-row')];
    const area = (r) => r.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea');
    const press = (r, init = {}) => {
      const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true, ...init });
      area(r).dispatchEvent(e);
      return e.defaultPrevented;
    };
    const focusedIndex = (id) => rows(id).findIndex((r) => r.shadowRoot.querySelector('.field').shadowRoot.activeElement === area(r));
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

test('enternext: Enter moves focus to the next enabled row with the caret at the end, skipping a disabled row', { skip }, async () => {
  const result = await runEnter(`
    const [one, , three] = rows('on');
    const seen = []; one.addEventListener('enter-next', (e) => seen.push(e.detail));
    const prevented = press(one);
    const t = area(three);
    return { prevented, seen, focused: focusedIndex('on'), caret: [t.selectionStart, t.selectionEnd, t.value.length], shortcut: area(one).getAttribute('aria-keyshortcuts') };`);
  assert.deepEqual(result, { prevented: true, seen: [{ source: 'keyboard' }], focused: 2, caret: [5, 5, 5], shortcut: 'Backspace Enter' });
});

test('enternext is off by default: Enter does nothing special and no event fires', { skip }, async () => {
  const result = await runEnter(`
    const [x] = rows('off');
    let fired = false; x.addEventListener('enter-next', () => { fired = true; });
    return { prevented: press(x), fired, focused: focusedIndex('off'), shortcut: area(x).getAttribute('aria-keyshortcuts') };`);
  assert.deepEqual(result, { prevented: false, fired: false, focused: -1, shortcut: 'Backspace' });
});

test('enternext ignores Shift+Enter, composition, repeat and other modifiers', { skip }, async () => {
  const result = await runEnter(`
    const [one] = rows('on');
    let fired = 0; one.addEventListener('enter-next', () => { fired++; });
    const out = [{ shiftKey: true }, { isComposing: true }, { repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }].map((i) => press(one, i));
    return { out, fired, focused: focusedIndex('on') };`);
  assert.deepEqual(result, { out: [false, false, false, false, false, false], fired: 0, focused: -1 });
});

test('enternext on the last row keeps focus and still fires; preventDefault on the event stops the move', { skip }, async () => {
  const result = await runEnter(`
    const all = rows('on');
    const last = all[3];
    last.focus();
    let fired = 0; last.addEventListener('enter-next', () => { fired++; });
    press(last);
    const afterLast = { fired, focused: focusedIndex('on') };
    all[0].addEventListener('enter-next', (e) => e.preventDefault());
    press(all[0]);
    return { afterLast, afterCancelled: focusedIndex('on') };`);
  assert.deepEqual(result, { afterLast: { fired: 1, focused: 3 }, afterCancelled: 3 });
});

test('question list enternext passes through to every option row', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-enter-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-question-list id="list" enternext questions='[{"prompt":"Q","options":[{"text":"A"},{"text":"B"}]}]'></aha-question-list>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const rows = [...document.getElementById('list').shadowRoot.querySelectorAll('aha-option-row')];
    const area = (r) => r.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea');
    area(rows[0]).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
    return { all: rows.every((r) => r.hasAttribute('enternext')), focused: rows.findIndex((r) => r.shadowRoot.querySelector('.field').shadowRoot.activeElement === area(r)) };
  })()`, { readyExpr: '!!window.ready' });
  assert.deepEqual(result, { all: true, focused: 1 });
});
