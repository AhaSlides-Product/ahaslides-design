import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-enter-submit.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('Enter in a field submits the form of an <aha-button type="submit"> once, and only when it may', { skip }, async () => {
  const counts = await withPage(fixture, async (command) => {
    const pressEnterIn = async (fieldId) => {
      await command('Runtime.evaluate', { expression: `document.getElementById(${JSON.stringify(fieldId)}).focus()` });
      const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
      await command('Input.dispatchKeyEvent', { type: 'keyDown', text: '\r', unmodifiedText: '\r', ...key });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
    };
    await pressEnterIn('two-fields-name');
    await pressEnterIn('one-field-email');
    await pressEnterIn('required-empty-name');
    await pressEnterIn('disabled-button-name');
    for (const id of ['click-prevented-button', 'click-allowed-button']) {
      await command('Runtime.evaluate', { expression: `document.getElementById('${id}').shadowRoot.querySelector('button').click()` });
    }
    await command('Runtime.evaluate', { expression: 'new Promise((resolve) => setTimeout(resolve, 50))', awaitPromise: true });
    const read = await command('Runtime.evaluate', { expression: 'JSON.stringify(window.submitCounts)', returnByValue: true, awaitPromise: true });
    return JSON.parse(read.result.value);
  }, { readyExpr: '!!window.enterSubmitFixtureReady' });
  assert.equal(counts['two-fields'], 1, 'two fields: Enter submits once');
  assert.equal(counts['one-field'], 1, 'one field: Enter submits once, not again through the browser');
  assert.equal(counts['required-empty'], 0, 'an empty required field blocks the submit');
  assert.equal(counts['disabled-button'], 0, 'a disabled button blocks the submit');
  assert.equal(counts['click-prevented'], 0, 'preventDefault in a click listener on the host stops the submit');
  assert.equal(counts['click-allowed'], 1, 'a click submits once');
});
