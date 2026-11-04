import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

globalThis.HTMLElement ??= class {};
const { parseTime } = await import('../lib/aha-timepicker.js');

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-timepicker.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('parseTime reads a real 24-hour time and refuses the rest', () => {
  for (const [text, minutes] of [['00:00', 0], ['9:30', 570], ['09.30', 570], ['0930', 570], ['23:59', 1439], ['０９：３０', 570], ['٠٩:٣٠', 570], ['09:30:15', 570]]) assert.equal(parseTime(text), minutes, text);
  for (const text of ['24:00', '12:60', '25:00', '09:30:75', '9', '12:5', 'noon', '', null]) assert.equal(parseTime(text), null, String(text));
});

test('aha-timepicker types, picks by keyboard and mouse, commits at once, clears, and aha-form-item reads it', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const KEYS = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27, PageDown: 34, PageUp: 33, Home: 36, End: 35, Tab: 9 };
    const press = async (key) => {
      const code = KEYS[key];
      const fields = { key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code };
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...fields, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const type = async (text) => { for (const ch of text) await command('Input.insertText', { text: ch }); };
    const host = (id) => `document.getElementById('${id}')`;
    const root = (id) => `${host(id)}.shadowRoot`;
    const field = (id) => `${root(id)}.querySelector('.field')`;
    const state = (id) => evaluate(`[${host(id)}.value, ${field(id)}.value]`);
    const active = (id) => evaluate(`(() => { const a = ${field(id)}.getAttribute('aria-activedescendant'); const row = a && ${root(id)}.getElementById(a); return row ? row.getAttribute('aria-label') : null; })()`);
    const row = (id, unit, text) => `[...${root(id)}.querySelectorAll('[role=option]')].find((o) => o.getAttribute('aria-label') === '${unit} ${text}')`;
    const point = async (expression, kind, button = 'left') => {
      const box = await evaluate(`(() => { const e = ${expression}; e.scrollIntoView?.({ block: 'nearest' }); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
      for (const type of kind) await command('Input.dispatchMouseEvent', { type, x: box[0], y: box[1], button, clickCount: 1 });
    };
    const click = (expression) => point(expression, ['mousePressed', 'mouseReleased']);
    const out = {};

    await evaluate(`${host('plain')}.focus()`);
    await press('ArrowDown');
    out.opened = await evaluate(`[${host('plain')}.open, ${field('plain')}.getAttribute('aria-expanded'), ${field('plain')}.getAttribute('aria-controls').split(' ').length]`);
    out.startActive = await active('plain');
    out.centred = await evaluate(`(() => { const list = ${root('plain')}.querySelector('.list'); const o = ${row('plain', 'Hour', '09')}; const seen = list.getBoundingClientRect(); const b = o.getBoundingClientRect(); return b.top >= seen.top && b.bottom <= seen.bottom; })()`);
    await press('ArrowUp');
    await press('ArrowRight');
    await press('End');
    await press('PageUp');
    await press('ArrowDown');
    out.movedActive = await active('plain');
    out.notCommittedByArrows = await evaluate(`${host('plain')}.value`);
    await press('ArrowLeft');
    await press('Home');
    await press('ArrowUp');
    out.wrapped = await active('plain');
    await press('ArrowRight');
    await press('Enter');
    out.picked = await state('plain');
    out.pickedOpen = await evaluate(`${host('plain')}.open`);
    out.pickEvents = await evaluate('window.log.map((e) => e.join(":"))');

    await evaluate('window.log.length = 0');
    await press('ArrowDown');
    await press('ArrowUp');
    await press('Escape');
    out.escape = [await evaluate(`${host('plain')}.open`), ...(await state('plain'))];

    await evaluate(`${field('plain')}.select()`);
    await type('25:00');
    await press('Enter');
    out.impossibleReverts = await state('plain');
    await evaluate(`${field('plain')}.select()`);
    await type('7.05');
    await evaluate('document.activeElement.blur()');
    out.typedCommits = await state('plain');
    out.typeEvents = await evaluate('window.log.map((e) => e.join(":"))');

    await evaluate('window.log.length = 0');
    await click(field('plain'));
    out.clickOpens = await evaluate(`${host('plain')}.open`);
    await click(row('plain', 'Hour', '14'));
    out.hourCommits = [...(await state('plain')), await evaluate(`${host('plain')}.open`), await active('plain')];
    await click(row('plain', 'Minute', '45'));
    out.minuteCloses = [...(await state('plain')), await evaluate(`${host('plain')}.open`)];
    out.clickEvents = await evaluate('window.log.filter((e) => e[1] === "change").map((e) => e[2])');

    await click(field('plain'));
    await evaluate(`${host('plain')}.open`);
    await click(`${host('after')}`);
    out.outsideCloses = await evaluate(`${host('plain')}.open`);

    await evaluate(`${host('plain')}.focus()`);
    await press('ArrowDown');
    await press('Tab');
    out.tabStops = await evaluate(`[document.activeElement.id, ${host('plain')}.open]`);

    await evaluate(`${host('plain')}.focus()`);
    await click(`${root('plain')}.querySelector('.clear')`);
    out.cleared = [...(await state('plain')), await evaluate('window.log.slice(-1)[0]')];

    await evaluate(`${host('fixed')}.focus()`);
    await evaluate(`${field('fixed')}.select()`);
    await evaluate(`document.execCommand('delete')`);
    await evaluate('document.activeElement.blur()');
    out.noClearKeeps = await state('fixed');

    await evaluate(`${host('named')}.focus()`);
    await press('ArrowDown');
    out.named = await evaluate(`(() => { const f = ${field('named')}; return [f.getAttribute('aria-label'), f.getAttribute('role'), f.disabled, f.placeholder, ${root('named')}.querySelector('.list').getAttribute('aria-label')]; })()`);
    out.namedActive = await active('named');
    await click(row('named', 'Heure', '08'));
    out.emptyHourTakesMinuteZero = await state('named');
    await press('Escape');

    await evaluate(`${host('rtl')}.open = true`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    out.rtl = await evaluate(`(() => { const r = ${root('rtl')}; const wrap = r.querySelector('.wrap').getBoundingClientRect(); const panel = r.querySelector('.panel').getBoundingClientRect(); const [hours, minutes] = r.querySelectorAll('.list'); return [Math.round(panel.right) === Math.round(wrap.right), hours.getBoundingClientRect().left < minutes.getBoundingClientRect().left]; })()`);
    await evaluate(`${host('rtl')}.open = false`);

    const timeItem = host('time-item');
    out.itemValue = await evaluate(`[${timeItem}.value, JSON.stringify([...new FormData(document.getElementById('form'))])]`);
    out.itemWidth = await evaluate(`getComputedStyle(document.querySelector('#time-item aha-timepicker')).width === getComputedStyle(${timeItem}.shadowRoot.querySelector('.body')).width`);
    await evaluate(`document.querySelector('#time-item aha-timepicker').value = null`);
    out.required = await evaluate(`${timeItem}.validate()`);
    await evaluate(`${timeItem}.reset()`);
    out.reset = await evaluate(`${timeItem}.value`);
    await evaluate(`document.querySelector('#time-item aha-timepicker').value = '08:00'; document.getElementById('form').reset()`);
    out.formReset = await evaluate(`${timeItem}.value`);
    out.impossibleRequired = await evaluate(`(async () => [${host('bad-item')}.value, await ${host('bad-item')}.validate()])()`);

    out.seconds = await state('seconds');
    await evaluate(`${field('seconds')}.focus(); ${field('seconds')}.select()`);
    await type('10:45');
    await press('Escape');
    await evaluate('document.activeElement.blur()');
    out.closedEscapeDropsTyping = await state('seconds');
    await click(field('seconds'));
    await evaluate(`${field('seconds')}.select()`);
    await type('10:4');
    await press('ArrowLeft');
    out.typingKeepsCaret = await evaluate(`${field('seconds')}.selectionStart`);
    await press('Escape');
    await click(field('seconds'));
    await evaluate(`${host('seconds')}.value = '14:10'`);
    await click(row('seconds', 'Minute', '45'));
    out.minuteKeepsNewHour = await state('seconds');

    await click(field('blank'));
    await press('Enter');
    out.enterInventsNoTime = await state('blank');
    await point(field('blank'), ['mousePressed', 'mouseReleased'], 'right');
    out.rightClickStaysShut = await evaluate(`${host('blank')}.open`);
    const shutState = `[${host('blank')}.open, ${field('blank')}.getAttribute('aria-expanded'), ${field('blank')}.hasAttribute('aria-activedescendant')]`;
    const reattach = `((blank) => { blank.remove(); document.body.append(blank); })(${host('blank')})`;
    out.openState = await evaluate(`${host('blank')}.open = true; ${shutState}`);
    out.reattachedShut = await evaluate(`${reattach}; ${shutState}`);
    await click(field('blank'));
    await press('ArrowDown');
    out.reattachedFocusedShut = await evaluate(`${reattach}; ${shutState}`);
    out.unbuiltCloses = await evaluate(`(() => { const spare = document.createElement('aha-timepicker'); spare.setAttribute('open', ''); spare.open = false; return spare.open; })()`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.opened, [true, 'true', 2]);
  assert.equal(r.startActive, 'Hour 09');
  assert.equal(r.centred, true);
  assert.equal(r.movedActive, 'Minute 55');
  assert.equal(r.notCommittedByArrows, '09:30');
  assert.equal(r.wrapped, 'Hour 23');
  assert.deepEqual(r.picked, ['23:55', '23:55']);
  assert.equal(r.pickedOpen, false);
  assert.deepEqual(r.pickEvents, ['plain:input:23:55', 'plain:change:23:55']);
  assert.deepEqual(r.escape, [false, '23:55', '23:55']);
  assert.deepEqual(r.impossibleReverts, ['23:55', '23:55']);
  assert.deepEqual(r.typedCommits, ['07:05', '07:05']);
  assert.deepEqual(r.typeEvents, ['plain:input:07:05', 'plain:change:07:05']);
  assert.equal(r.clickOpens, true);
  assert.deepEqual(r.hourCommits, ['14:05', '14:05', true, 'Minute 05']);
  assert.deepEqual(r.minuteCloses, ['14:45', '14:45', false]);
  assert.deepEqual(r.clickEvents, ['14:05', '14:45']);
  assert.equal(r.outsideCloses, false);
  assert.deepEqual(r.tabStops, ['named', false]);
  assert.deepEqual(r.cleared, [null, '', ['plain', 'change', null]]);
  assert.deepEqual(r.noClearKeeps, ['17:00', '17:00']);
  assert.deepEqual(r.named, ['Reminder', 'combobox', false, 'HH:MM', 'Heure']);
  assert.equal(r.namedActive, 'Heure 00');
  assert.deepEqual(r.emptyHourTakesMinuteZero, ['08:00', '08:00']);
  assert.deepEqual(r.rtl, [true, true]);
  assert.deepEqual(r.itemValue, ['17:30', '[["deadline","17:30"]]']);
  assert.equal(r.itemWidth, true);
  assert.equal(r.required, 'We need this one.');
  assert.equal(r.reset, '17:30');
  assert.equal(r.formReset, '17:30');
  assert.deepEqual(r.impossibleRequired, ['', 'We need this one.']);
  assert.deepEqual(r.seconds, ['09:30', '09:30']);
  assert.deepEqual(r.closedEscapeDropsTyping, ['09:30', '09:30']);
  assert.equal(r.typingKeepsCaret, 3);
  assert.deepEqual(r.minuteKeepsNewHour, ['14:45', '14:45']);
  assert.deepEqual(r.enterInventsNoTime, [null, '']);
  assert.equal(r.rightClickStaysShut, false);
  assert.deepEqual(r.openState, [true, 'true', true]);
  assert.deepEqual(r.reattachedShut, [false, 'false', false]);
  assert.deepEqual(r.reattachedFocusedShut, [false, 'false', false]);
  assert.equal(r.unbuiltCloses, false);
});
