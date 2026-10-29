import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

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
