import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-datepicker.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-datepicker types, picks by keyboard and mouse, keeps min / max, clears, and aha-form-item reads it', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const KEYS = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27, PageDown: 34, PageUp: 33, Home: 36, End: 35 };
    const press = async (key, modifiers = 0) => {
      const code = KEYS[key];
      const fields = { key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers };
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...fields, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const type = async (text) => { for (const ch of text) await command('Input.insertText', { text: ch }); };
    const root = (id) => `document.getElementById('${id}').shadowRoot`;
    const field = (id) => `${root(id)}.querySelector('.field')`;
    const state = (id) => evaluate(`[document.getElementById('${id}').value, ${field(id)}.value]`);
    const active = (id) => evaluate(`(() => { const f = ${field(id)}; const id = f.getAttribute('aria-activedescendant'); const cell = id && ${root(id)}.getElementById(id); return [${root(id)}.querySelector('.title').textContent, cell ? cell.getAttribute('aria-label').replace(/,/g, '') : null]; })()`);
    const click = async (expression) => {
      const box = await evaluate(`(() => { const b = (${expression}).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
      for (const type of ['mousePressed', 'mouseReleased']) await command('Input.dispatchMouseEvent', { type, x: box[0], y: box[1], button: 'left', clickCount: 1 });
    };
    const out = {};

    await evaluate(`document.getElementById('plain').focus()`);
    await press('ArrowDown');
    out.opened = await evaluate(`[document.getElementById('plain').open, ${field('plain')}.getAttribute('aria-expanded'), [...${root('plain')}.querySelectorAll('th')].map((th) => th.getAttribute('abbr'))[0]]`);
    out.startActive = await active('plain');
    await press('ArrowDown');
    await press('ArrowRight');
    await press('End');
    out.movedActive = await active('plain');
    const activeId = () => evaluate(`${field('plain')}.getAttribute('aria-activedescendant')`);
    const idBefore = await activeId();
    await press('PageDown');
    out.clampedToMax = await active('plain');
    out.newActiveId = idBefore !== await activeId();
    out.disabledAfterMax = await evaluate(`${root('plain')}.querySelector('td[data-date][aria-label*="16 December"]').getAttribute('aria-disabled')`);
    await press('Enter');
    out.picked = await state('plain');
    out.pickedOpen = await evaluate(`document.getElementById('plain').open`);
    out.pickEvents = await evaluate('window.log.map((e) => e.join(":"))');

    await evaluate('window.log.length = 0');
    await evaluate(`${field('plain')}.select()`);
    await type('2026-2-30');
    await press('Enter');
    out.impossibleReverts = await state('plain');
    await evaluate(`${field('plain')}.select()`);
    await type('2027-01-05');
    await evaluate('document.activeElement.blur()');
    out.outsideMaxReverts = await state('plain');
    await evaluate(`document.getElementById('plain').focus()`);
    await evaluate(`${field('plain')}.select()`);
    await type('2026-10-2');
    await evaluate('document.activeElement.blur()');
    out.typedCommits = await state('plain');
    out.typeEvents = await evaluate('window.log.map((e) => e.join(":"))');

    await evaluate(`document.getElementById('plain').focus()`);
    await press('ArrowDown');
    await press('ArrowUp');
    await press('Escape');
    out.escape = [await evaluate(`document.getElementById('plain').open`), ...(await state('plain'))];

    await click(`${field('plain')}`);
    out.clickOpens = await evaluate(`document.getElementById('plain').open`);
    await click(`${root('plain')}.querySelector('td[data-date][aria-label*="15 October"] .day')`);
    out.clickPicked = await state('plain');
    await click(`${root('plain')}.querySelector('.clear')`);
    out.cleared = [...(await state('plain')), await evaluate('window.log.slice(-1)[0]')];

    await evaluate(`document.getElementById('plain').focus()`);
    await evaluate(`${field('plain')}.select()`);
    await type('\uFF12\uFF10\uFF12\uFF16\uFF0D\uFF11\uFF11\uFF0D\uFF10\uFF13');
    await press('Enter');
    out.fullWidthCommits = await state('plain');

    await evaluate(`${field('plain')}.select()`);
    await type('2026-11-10');
    await press('ArrowDown');
    await press('ArrowRight');
    await press('Enter');
    out.arrowAfterTyping = await state('plain');

    await press('ArrowDown');
    await evaluate(`${field('plain')}.select()`);
    await type('2026-11-20');
    await evaluate(`${field('plain')}.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true }))`);
    out.imeEnterIgnored = [await evaluate(`document.getElementById('plain').open`), ...(await state('plain'))];
    await press('Escape');

    out.named = await evaluate(`(() => { const f = ${field('named')}; return [f.getAttribute('aria-label'), f.getAttribute('role'), f.disabled, f.placeholder]; })()`);
    await evaluate(`document.getElementById('named').value = '2026-03-01'; document.getElementById('named').open = true`);
    out.sundayFirst = await evaluate(`[[...${root('named')}.querySelectorAll('th')].map((th) => th.getAttribute('abbr'))[0], ${root('named')}.querySelector('.title').textContent, ${root('named')}.querySelector('tbody tr td[data-date]').cellIndex]`);
    await evaluate(`document.getElementById('named').open = false`);
    await evaluate(`document.getElementById('named').setAttribute('locale', 'th-TH'); document.getElementById('named').open = true`);
    out.gregorianTitle = await evaluate(`${root('named')}.querySelector('.title').textContent.includes('2026')`);
    await evaluate(`document.getElementById('named').open = false; document.getElementById('named').value = null`);
    await evaluate(`${field('named')}.focus()`);
    await type('2026-05-06');
    await evaluate(`document.getElementById('named').value = null; document.activeElement.blur()`);
    out.clearedTyping = await evaluate(`[document.getElementById('named').value, ${field('named')}.value]`);

    out.itemValue = await evaluate(`(() => { const item = document.getElementById('date-item'); return [item.value, JSON.stringify([...new FormData(document.getElementById('form'))])]; })()`);
    out.itemWidth = await evaluate(`getComputedStyle(document.querySelector('#date-item aha-datepicker')).width === getComputedStyle(document.getElementById('date-item').shadowRoot.querySelector('.body')).width`);
    await evaluate(`document.querySelector('#date-item aha-datepicker').value = null`);
    out.required = await evaluate(`document.getElementById('date-item').validate()`);
    await evaluate(`document.getElementById('date-item').reset()`);
    out.reset = await evaluate(`document.getElementById('date-item').value`);
    out.impossibleRequired = await evaluate(`(async () => [document.getElementById('bad-item').value, await document.getElementById('bad-item').validate()])()`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.opened, [true, 'true', 'Monday']);
  assert.deepEqual(r.startActive, ['November 2026', 'Wednesday 4 November 2026']);
  assert.deepEqual(r.movedActive, ['November 2026', 'Sunday 15 November 2026']);
  assert.deepEqual(r.clampedToMax, ['December 2026', 'Tuesday 15 December 2026']);
  assert.equal(r.newActiveId, true);
  assert.equal(r.disabledAfterMax, 'true');
  assert.deepEqual(r.picked, ['2026-12-15', '2026-12-15']);
  assert.equal(r.pickedOpen, false);
  assert.deepEqual(r.pickEvents, ['plain:input:2026-12-15', 'plain:change:2026-12-15']);
  assert.deepEqual(r.impossibleReverts, ['2026-12-15', '2026-12-15']);
  assert.deepEqual(r.outsideMaxReverts, ['2026-12-15', '2026-12-15']);
  assert.deepEqual(r.typedCommits, ['2026-10-02', '2026-10-02']);
  assert.deepEqual(r.typeEvents, ['plain:input:2026-10-02', 'plain:change:2026-10-02']);
  assert.deepEqual(r.fullWidthCommits, ['2026-11-03', '2026-11-03']);
  assert.deepEqual(r.arrowAfterTyping, ['2026-11-11', '2026-11-11']);
  assert.deepEqual(r.imeEnterIgnored, [true, '2026-11-11', '2026-11-20']);
  assert.deepEqual(r.escape, [false, '2026-10-02', '2026-10-02']);
  assert.equal(r.clickOpens, true);
  assert.deepEqual(r.clickPicked, ['2026-10-15', '2026-10-15']);
  assert.deepEqual(r.cleared, [null, '', ['plain', 'change', null]]);
  assert.deepEqual(r.named, ['Joined on', 'combobox', false, 'YYYY-MM-DD']);
  assert.deepEqual(r.sundayFirst, ['Sunday', 'March 2026', 0]);
  assert.equal(r.gregorianTitle, true);
  assert.deepEqual(r.clearedTyping, [null, '']);
  assert.deepEqual(r.itemValue, ['2026-01-31', '[["joined","2026-01-31"]]']);
  assert.equal(r.itemWidth, true);
  assert.equal(r.required, 'We need this one.');
  assert.equal(r.reset, '2026-01-31');
  assert.deepEqual(r.impossibleRequired, ['', 'We need this one.']);
});
