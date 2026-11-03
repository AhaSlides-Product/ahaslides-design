import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-input-number.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-input-number types, steps, clamps and rounds exact decimals, and aha-form-item reads it', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const KEYS = { ArrowUp: 38, ArrowDown: 40, Enter: 13, Tab: 9 };
    const press = async (key, modifiers = 0) => {
      const code = KEYS[key];
      const fields = { key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers };
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...fields, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const type = async (text) => { for (const ch of text) await command('Input.insertText', { text: ch }); };
    const focus = (id) => evaluate(`document.getElementById('${id}').focus()`);
    const blur = () => evaluate('document.activeElement && document.activeElement.blur()');
    const field = (id) => `document.getElementById('${id}').shadowRoot.querySelector('.field')`;
    const state = (id) => evaluate(`(() => { const el = document.getElementById('${id}'); const f = ${field(id)}; return [el.value, f.value]; })()`);
    const clearLog = () => evaluate('window.log.length = 0');
    const out = {};

    await focus('plain');
    await type('-1a.2.5');
    out.typed = await state('plain');
    out.typedEvents = await evaluate('window.log.map((e) => e.join(":"))');
    await evaluate(`${field('plain')}.select()`);
    await type('99');
    out.outOfRangeWhileTyping = await state('plain');
    await blur();
    out.clampedOnBlur = await state('plain');
    out.blurEvents = await evaluate('window.log.slice(-2).map((e) => e.join(":"))');

    await clearLog();
    await evaluate(`${field('plain')}.select()`);
    await type('0.2');
    await focus('plain');
    await press('ArrowUp');
    out.exactStep = await state('plain');
    await press('ArrowDown', 8);
    out.shiftStep = await state('plain');
    out.stepEvents = await evaluate('window.log.slice(-4).map((e) => e.join(":"))');
    await evaluate(`${field('plain')}.select()`);
    await type('-');
    await blur();
    out.junkReverts = await state('plain');
    await focus('plain');
    await evaluate(`${field('plain')}.select()`);
    await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
    await press('Enter');
    out.emptied = await evaluate(`[document.getElementById('plain').value, Number.isNaN(document.getElementById('plain').valueAsNumber), window.log.slice(-1)[0]]`);

    await clearLog();
    await focus('money');
    await type('1.004');
    await blur();
    out.precision = await state('money');
    await focus('money');
    await evaluate(`${field('money')}.select()`);
    await type('7');
    await blur();
    out.precisionCut = await state('money');
    out.stringEvents = await evaluate('window.log.filter((e) => e[1] === "change").map((e) => typeof e[2] + ":" + e[2])');

    await evaluate(`document.getElementById('big').stepUp()`);
    out.bigStep = await state('big');

    out.aria = await evaluate(`(() => { const f = ${field('plain')}; return [f.getAttribute('role'), f.getAttribute('aria-valuemin'), f.getAttribute('aria-valuemax')]; })()`);
    out.named = await evaluate(`(() => { const el = document.getElementById('named'); const r = el.shadowRoot; const f = r.querySelector('.field'); return [f.getAttribute('aria-label'), f.getAttribute('aria-valuenow'), getComputedStyle(r.querySelector('.stepper')).display, f.disabled, f.readOnly, r.querySelector('.step-up').getAttribute('aria-label')]; })()`);
    await evaluate(`document.getElementById('named').setAttribute('increase-label', 'Plus')`);
    out.relabel = await evaluate(`document.getElementById('named').shadowRoot.querySelector('.step-up').getAttribute('aria-label')`);

    out.created = await evaluate(`(() => { const el = document.createElement('aha-input-number'); el.value = 4; document.body.append(el); return [el instanceof customElements.get('aha-input-number'), el.value, el.shadowRoot.querySelector('.field').value]; })()`);

    out.itemValue = await evaluate(`(() => { const item = document.getElementById('age-item'); return [item.value, typeof item.value, JSON.stringify([...new FormData(document.getElementById('form'))])]; })()`);
    out.itemWidth = await evaluate(`getComputedStyle(document.querySelector('#age-item aha-input-number')).width === getComputedStyle(document.getElementById('age-item').shadowRoot.querySelector('.body')).width`);
    await evaluate(`document.querySelector('#age-item aha-input-number').value = null`);
    out.required = await evaluate(`document.getElementById('age-item').validate()`);
    await evaluate(`document.getElementById('age-item').reset()`);
    out.reset = await evaluate(`[document.getElementById('age-item').value, document.querySelector('#age-item aha-input-number').getAttribute('status')]`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.typed, ['-1.25', '-1.25']);
  assert.deepEqual(r.typedEvents, ['plain:input:-1', 'plain:input:-1.2', 'plain:input:-1.25']);
  assert.deepEqual(r.outOfRangeWhileTyping, ['9', '99']);
  assert.deepEqual(r.clampedOnBlur, ['10', '10']);
  assert.deepEqual(r.blurEvents, ['plain:input:10', 'plain:change:10']);
  assert.deepEqual(r.exactStep, ['0.3', '0.3']);
  assert.deepEqual(r.shiftStep, ['-0.7', '-0.7']);
  assert.deepEqual(r.stepEvents, ['plain:input:0.3', 'plain:change:0.3', 'plain:input:-0.7', 'plain:change:-0.7']);
  assert.deepEqual(r.junkReverts, ['-0.7', '-0.7']);
  assert.deepEqual(r.emptied, [null, true, ['plain', 'change', null]]);
  assert.deepEqual(r.precision, ['1', '1.00']);
  assert.deepEqual(r.precisionCut, ['1', '1.00']);
  assert.deepEqual(r.stringEvents, ['string:1']);
  assert.deepEqual(r.bigStep, ['12345678901234567891.1', '12345678901234567891.1']);
  assert.deepEqual(r.aria, ['spinbutton', '-5', '10']);
  assert.deepEqual(r.named, ['Minimum score', '3', 'none', false, false, 'Increase']);
  assert.equal(r.relabel, 'Plus');
  assert.deepEqual(r.created, [true, '4', '4']);
  assert.deepEqual(r.itemValue, [30, 'number', '[["age","30"]]']);
  assert.equal(r.itemWidth, true);
  assert.equal(r.required, 'We need this one.');
  assert.deepEqual(r.reset, [30, null]);
});
