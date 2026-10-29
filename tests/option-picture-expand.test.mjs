import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome, withPage } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./option-picture-expand.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const results = {};
  const sheet = () => document.querySelector('aha-bottom-sheet');
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  const run = async (name, host, rowSelector, expectedTitle) => {
    const root = host.shadowRoot;
    const row = root.querySelector(rowSelector);
    const picture = row.querySelector('.picture');
    const button = picture.querySelector('.expand');
    const pictureBox = picture.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const out = {
      label: button.getAttribute('aria-label'),
      inCorner: buttonBox.right <= pictureBox.right && buttonBox.top >= pictureBox.top && pictureBox.right - buttonBox.right < 8 && buttonBox.top - pictureBox.top < 8,
      size: Math.round(buttonBox.width),
    };
    let picked = 0;
    let changed = 0;
    host.addEventListener('pick', () => { picked += 1; });
    host.addEventListener('change', () => { changed += 1; });
    button.focus();
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, isPrimary: true, clientY: 10 }));
    out.dragging = !!root.querySelector('[data-dragging]');
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, isPrimary: true, clientY: 10 }));
    button.click();
    await wait(300);
    const opened = sheet();
    out.opened = !!opened && opened.hasAttribute('open');
    out.sheetImage = opened && opened.shadowRoot.querySelector('.picture').getAttribute('src') === picture.querySelector('img').getAttribute('src');
    out.title = opened && opened.shadowRoot.querySelector('.title').textContent;
    out.expectedTitle = expectedTitle;
    out.pictureHeightFits = opened && opened.shadowRoot.querySelector('.picture').getBoundingClientRect().height <= innerHeight - 128 + 1;
    out.picked = picked;
    out.changed = changed;
    out.selected = host.hasAttribute('selected');
    escape();
    await wait(300);
    out.closed = !sheet();
    out.focusBack = root.activeElement === button;
    results[name] = out;
  };
  await run('answerText', document.getElementById('answer-text'), '.row', 'Purple door');
  await run('answerOnly', document.getElementById('answer-only'), '.row', '');
  await run('rankText', document.getElementById('rank'), '[data-option-id="a"]', 'Purple door');
  await run('rankOnly', document.getElementById('rank'), '[data-option-id="b"]', '');
  results.order = document.getElementById('rank').value;
  return results;
})()`;

test('the corner expand button opens the picture in the bottom sheet without selecting or dragging, and Esc closes it', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.expandReady', timeout: 45000 });
  for (const name of ['answerText', 'answerOnly', 'rankText', 'rankOnly']) {
    const out = result[name];
    assert.equal(out.label, 'View larger picture', name);
    assert.ok(out.inCorner, name + ' sits in the picture corner');
    assert.ok(out.opened, name + ' opens the sheet');
    assert.ok(out.sheetImage, name + ' shows the same picture');
    assert.equal(out.title, out.expectedTitle, name + ' title');
    assert.ok(out.pictureHeightFits, name + ' picture fits the viewport');
    assert.equal(out.dragging, false, name + ' no drag');
    assert.equal(out.picked, 0, name + ' no pick');
    assert.equal(out.changed, 0, name + ' no change');
    assert.equal(out.selected, false, name + ' not selected');
    assert.ok(out.closed, name + ' Esc closes');
    assert.ok(out.focusBack, name + ' focus returns to the button');
  }
  assert.equal(result.answerOnly.size, 32);
  assert.equal(result.answerText.size, 24);
  assert.deepEqual(result.order, ['a', 'b']);
});

const focusExpand = (hostId, rowSelector) => String.raw`(() => {
  const host = document.getElementById('${hostId}');
  const button = host.shadowRoot.querySelector('${rowSelector} .expand');
  button.focus();
  return host.shadowRoot.activeElement === button;
})()`;
const sheetOpen = String.raw`(async () => { await new Promise((done) => setTimeout(done, 300)); const sheet = document.querySelector('aha-bottom-sheet'); const open = !!sheet && sheet.hasAttribute('open'); if (sheet) sheet.close(); await new Promise((done) => setTimeout(done, 300)); return open; })()`;
const keys = {
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
};
const evaluate = async (command, expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

test('Enter and Space on the focused expand button open the sheet from the keyboard, in both components', { skip }, async () => {
  const outcomes = await withPage(fixture, async (command) => {
    const seen = {};
    for (const [host, selector] of [['answer-text', '.row'], ['answer-only', '.row'], ['rank', '[data-option-id="a"]'], ['rank', '[data-option-id="b"]']]) {
      for (const [name, spec] of Object.entries(keys)) {
        const focused = await evaluate(command, focusExpand(host, selector));
        await command('Input.dispatchKeyEvent', { type: 'keyDown', ...spec });
        await command('Input.dispatchKeyEvent', { type: 'keyUp', key: spec.key, code: spec.code, windowsVirtualKeyCode: spec.windowsVirtualKeyCode });
        seen[host + selector + name] = { focused, opened: await evaluate(command, sheetOpen) };
      }
    }
    return seen;
  }, { readyExpr: '!!window.expandReady', timeout: 45000 });
  for (const [name, outcome] of Object.entries(outcomes)) {
    assert.ok(outcome.focused, name + ' button focused');
    assert.ok(outcome.opened, name + ' opens from the keyboard');
  }
});

const lateLabel = String.raw`(() => {
  const answer = document.getElementById('answer-text');
  const rank = document.getElementById('rank');
  answer.setAttribute('expand-picture-label', 'Xem ảnh lớn');
  rank.setAttribute('expand-picture-label', 'Xem ảnh lớn');
  return [answer.shadowRoot.querySelector('.expand').getAttribute('aria-label'), ...[...rank.shadowRoot.querySelectorAll('.expand')].map((button) => button.getAttribute('aria-label'))];
})()`;

test('a later expand-picture-label change updates the button name', { skip }, async () => {
  const labels = await evaluateInPage(fixture, lateLabel, { readyExpr: '!!window.expandReady', timeout: 45000 });
  assert.deepEqual(labels, ['Xem ảnh lớn', 'Xem ảnh lớn', 'Xem ảnh lớn']);
});
