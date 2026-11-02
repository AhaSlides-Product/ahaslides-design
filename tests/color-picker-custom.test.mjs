import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./color-picker-custom.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const inPage = async (command, body) => {
  const read = await command('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true });
  if (read.exceptionDetails) throw new Error(read.exceptionDetails.exception?.description || read.exceptionDetails.text);
  return read.result.value;
};

test('custom hex entry fires the picker change once with a normalised value; invalid hex errors and fires nothing; preset-only shows no custom row', { skip }, async () => {
  const state = await withPage(fixture, (command) => inPage(command, `
    const pick = document.getElementById('custom');
    const events = [];
    pick.addEventListener('change', (e) => events.push(e.detail));
    pick.addEventListener('input', (e) => events.push({ leakedInput: true }));
    const hex = pick.shadowRoot.querySelector('.hex');
    const field = hex.shadowRoot.querySelector('.field');
    const type = (text) => {
      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    };
    type('#0af');
    const afterShort = { value: pick.value, label: pick.shadowRoot.querySelector('.label').textContent };
    type('nope');
    const afterInvalid = { value: pick.value, status: hex.getAttribute('status'), invalid: field.getAttribute('aria-invalid') };
    type('1a2b3c');
    pick.shadowRoot.querySelector('.swatch[data-c="#1A1A1A"]').click();
    const preset = document.getElementById('preset');
    return {
      events, afterShort, afterInvalid,
      afterValid: { value: pick.value, status: hex.getAttribute('status'), field: field.value },
      customShown: getComputedStyle(pick.shadowRoot.querySelector('.custom')).display,
      presetShown: getComputedStyle(preset.shadowRoot.querySelector('.custom')).display,
    };`), { readyExpr: '!!window.customFixtureReady' });
  assert.deepEqual(state.events, [
    { value: '#00AAFF', source: 'hex' },
    { value: '#1A2B3C', source: 'hex' },
    { value: '#1A1A1A', source: 'swatch' },
  ]);
  assert.deepEqual(state.afterShort, { value: '#00AAFF', label: '#00AAFF' });
  assert.deepEqual(state.afterInvalid, { value: '#00AAFF', status: 'error', invalid: 'true' });
  assert.equal(state.afterValid.status, null);
  assert.equal(state.customShown, 'flex');
  assert.equal(state.presetShown, 'none');
});
