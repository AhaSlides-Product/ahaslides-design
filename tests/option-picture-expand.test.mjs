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
      coversPicture: ['left', 'top', 'right', 'bottom'].every((side) => Math.abs(buttonBox[side] - pictureBox[side]) < 1),
      iconSize: Math.round(button.querySelector('aha-icon').getBoundingClientRect().width),
      iconCentred: (() => { const icon = button.querySelector('aha-icon').getBoundingClientRect(); return Math.abs(icon.left + icon.width / 2 - (pictureBox.left + pictureBox.width / 2)) < 1 && Math.abs(icon.top + icon.height / 2 - (pictureBox.top + pictureBox.height / 2)) < 1; })(),
      idleOpacity: getComputedStyle(button).opacity,
      background: getComputedStyle(button).backgroundColor,
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

test('the whole-picture expand overlay opens the picture in the bottom sheet without selecting or dragging, and Esc closes it', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.expandReady', timeout: 45000 });
  for (const name of ['answerText', 'answerOnly', 'rankText', 'rankOnly']) {
    const out = result[name];
    assert.equal(out.label, 'View larger picture', name);
    assert.ok(out.coversPicture, name + ' overlay covers the whole picture');
    assert.equal(out.iconSize, 24, name + ' icon matches the expandable-row overlay');
    assert.ok(out.iconCentred, name + ' icon is centred on the picture');
    assert.equal(out.idleOpacity, '0', name + ' overlay hidden until hover or focus');
    assert.equal(out.background, 'rgba(0, 0, 0, 0.5)', name + ' same dim as the expandable overlay');
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

const centring = String.raw`(() => {
  const centreY = (element) => { const box = element.getBoundingClientRect(); return box.top + box.height / 2; };
  const offsets = {};
  const measure = (name, host, rowSelector, partSelectors) => {
    const row = host.shadowRoot.querySelector(rowSelector);
    const rowCentre = centreY(row);
    offsets[name] = { rowHeight: Math.round(row.getBoundingClientRect().height) };
    for (const part of partSelectors) offsets[name][part] = Math.abs(centreY(row.querySelector(part)) - rowCentre);
  };
  const rank = document.getElementById('rank');
  measure('answerLong', document.getElementById('answer-long'), '.row', ['.control', '.picture']);
  measure('answerOnly', document.getElementById('answer-only'), '.row', ['.control', '.picture']);
  measure('rankText', rank, '[data-option-id="a"]', ['.badge', '.grip', '.picture']);
  measure('rankOnly', rank, '[data-option-id="b"]', ['.badge', '.grip', '.moves']);
  return offsets;
})()`;

test('side controls and the picture sit at the vertical middle of a tall row', { skip }, async () => {
  const offsets = await evaluateInPage(fixture, centring, { readyExpr: '!!window.expandReady', timeout: 45000 });
  assert.ok(offsets.answerOnly.rowHeight > 150, 'image-only row is tall');
  assert.ok(offsets.answerLong.rowHeight > 60, 'long-text row is tall');
  for (const [name, parts] of Object.entries(offsets)) {
    for (const [part, offset] of Object.entries(parts)) {
      if (part !== 'rowHeight') assert.ok(offset < 1, name + ' ' + part + ' is ' + offset + 'px off the row middle');
    }
  }
});

const hoverShows = String.raw`(() => {
  const pictures = [document.getElementById('answer-text'), document.getElementById('answer-only'), document.getElementById('answer-long')].map((host) => host.shadowRoot.querySelector('.picture'));
  const rank = document.getElementById('rank').shadowRoot;
  pictures.push(...rank.querySelectorAll('.picture'));
  return pictures.map((picture) => { const box = picture.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; });
})()`;
const overlayOpacities = String.raw`[...document.querySelectorAll('aha-answer-option, aha-rank-list')].flatMap((host) => [...host.shadowRoot.querySelectorAll('.expand')].map((button) => getComputedStyle(button).opacity))`;
const dropTouchRule = String.raw`(() => {
  let dropped = 0;
  for (const host of document.querySelectorAll('aha-answer-option, aha-rank-list')) {
    const sheets = [...host.shadowRoot.styleSheets, ...host.shadowRoot.adoptedStyleSheets];
    for (const sheet of sheets) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        if (sheet.cssRules[index].conditionText === '(hover: none)') { sheet.deleteRule(index); dropped += 1; }
      }
    }
  }
  return dropped;
})()`;
const settle = 'new Promise((done) => setTimeout(done, 250))';

test('hovering a picture fades its overlay in and moving away hides it; on a touch screen hover never shows it', { skip }, async () => {
  const outcome = await withPage(fixture, async (command) => {
    const points = await evaluate(command, hoverShows);
    const touch = await evaluate(command, 'matchMedia("(hover: none)").matches');
    const before = await evaluate(command, overlayOpacities);
    const hoverOn = async (index) => {
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: points[index].x, y: points[index].y });
      await evaluate(command, settle);
      return (await evaluate(command, overlayOpacities))[index];
    };
    const touchHovered = [];
    for (let index = 0; index < points.length; index++) touchHovered.push(await hoverOn(index));
    const dropped = await evaluate(command, dropTouchRule);
    const hovered = [];
    for (let index = 0; index < points.length; index++) hovered.push(await hoverOn(index));
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    await evaluate(command, settle);
    return { points: points.length, touch, dropped, before, touchHovered, hovered, after: await evaluate(command, overlayOpacities) };
  }, { readyExpr: '!!window.expandReady', timeout: 45000 });
  assert.equal(outcome.points, 5);
  assert.ok(outcome.touch, 'headless Chrome reports no hover, so it stands in for a touch screen');
  assert.equal(outcome.dropped, 4, 'every host carries the touch rule once');
  assert.deepEqual(outcome.before, ['0', '0', '0', '0', '0']);
  assert.deepEqual(outcome.touchHovered, ['0', '0', '0', '0', '0']);
  assert.deepEqual(outcome.hovered, ['1', '1', '1', '1', '1']);
  assert.deepEqual(outcome.after, ['0', '0', '0', '0', '0']);
});
