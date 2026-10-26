import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./input-form.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-input is form-associated, submits on Enter, names itself and points at its list', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => {
      const out = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return out.result.value;
    };
    const press = async (key, code, keyCode, text) => {
      const fields = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
      await command('Input.dispatchKeyEvent', { type: 'keyDown', ...(text ? { text, unmodifiedText: text } : {}), ...fields });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const enterIn = async (id) => { await evaluate(`document.getElementById('${id}').focus()`); await press('Enter', 'Enter', 13, '\r'); };
    const inner = (id, expr) => `document.getElementById('${id}').shadowRoot.querySelector('.field')${expr}`;

    await enterIn('search');
    await enterIn('with-button');
    await enterIn('with-disabled-button');
    await enterIn('two-first');
    await enterIn('date-first');
    await evaluate(`document.getElementById('external').focus()`);
    await press('X', 'KeyX', 88, 'X');
    await new Promise((resolve) => setTimeout(resolve, 50));

    const out = {};
    out.counts = await evaluate('window.submitCounts');
    out.formData = await evaluate(`JSON.stringify([...new FormData(document.getElementById('external-label-form'))])`);
    out.searchForm = await evaluate(`JSON.stringify([...new FormData(document.getElementById('search-form'))])`);
    out.controlsMatch = await evaluate(`(() => { const f = ${inner('search', '')}; return 'ariaControlsElements' in f ? (f.ariaControlsElements || []).map((el) => el.id).join() : 'unsupported'; })()`);
    out.visibleLabel = await evaluate(`document.getElementById('search').shadowRoot.querySelector('.label').textContent`);
    out.labelPointsAtField = await evaluate(`(() => { const r = document.getElementById('search').shadowRoot; return r.querySelector('.label').control === r.querySelector('.field'); })()`);
    out.externalName = await evaluate(inner('external', '.getAttribute("aria-label")'));
    out.externalLabels = await evaluate(`document.getElementById('external').labels.length`);

    await evaluate(`document.activeElement && document.activeElement.blur()`);
    await evaluate(`document.getElementById('external-label').click()`);
    out.externalLabelFocus = await evaluate(`document.activeElement === document.getElementById('external')`);
    await evaluate(`document.getElementById('search').shadowRoot.querySelector('.label').click()`);
    out.visibleLabelFocus = await evaluate(`document.activeElement === document.getElementById('search')`);

    await evaluate(`document.getElementById('reset').click()`);
    out.afterReset = await evaluate(`document.getElementById('external').value`);
    out.fieldAfterReset = await evaluate(inner('external', '.value'));
    out.fieldsetDisabled = await evaluate(inner('in-fieldset', '.disabled'));
    return out;
  }, { readyExpr: '!!window.inputFormFixtureReady' });

  assert.equal(result.counts['search-form'], 1, 'Enter in a lone field submits its form once');
  assert.equal(result.counts['button-form'], 1, 'with an aha-button submit it still submits once');
  assert.equal(result.counts['disabled-button-form'], 0, 'a disabled default button blocks implicit submit');
  assert.equal(result.counts['two-field-form'], 0, 'two fields and no submit button: no implicit submit, as native');
  assert.equal(result.counts['date-form'], 0, 'a native date input also blocks implicit submit, as native');
  assert.deepEqual(JSON.parse(result.searchForm), [['q', 'intro']], 'value joins the form data under name');
  const [[, typed]] = JSON.parse(result.formData);
  assert.ok(typed.endsWith('X'), 'typed text reaches the form data');
  assert.equal(result.visibleLabel, 'Find a course');
  assert.equal(result.labelPointsAtField, true, 'the label is a real label for the inner field');
  assert.equal(result.visibleLabelFocus, true, 'clicking the visible label focuses the field');
  assert.equal(result.externalLabels, 1, 'an external label for= the host is associated');
  assert.equal(result.externalName, 'Workspace name', 'the external label names the inner field');
  assert.equal(result.externalLabelFocus, true, 'clicking the external label focuses the field');
  assert.ok(result.controlsMatch === 'results' || result.controlsMatch === 'unsupported', `aria-controls resolves (${result.controlsMatch})`);
  assert.equal(result.afterReset, 'Aha', 'form reset restores the initial value');
  assert.equal(result.fieldAfterReset, 'Aha');
  assert.equal(result.fieldsetDisabled, true, 'a disabled fieldset disables the inner field');
});

test('aha-input source declares the form-association hooks', () => {
  const source = readFileSync(new URL('../lib/aha-input.js', import.meta.url), 'utf8');
  for (const hook of ['static get formAssociated()', 'formResetCallback()', 'formDisabledCallback(', 'setFormValue(', 'ariaControlsElements', 'delegatesFocus: true']) {
    assert.ok(source.includes(hook), hook);
  }
});
