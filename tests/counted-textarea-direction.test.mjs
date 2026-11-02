import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./counted-textarea-direction.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-counted-textarea passes dir to its inner field and leaves it unset otherwise', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true })).result.value;
    const field = (id) => `document.getElementById('${id}').shadowRoot.querySelector('.field')`;
    return {
      auto: await evaluate(`getComputedStyle(${field('rtl')}).direction`),
      plain: await evaluate(`${field('plain')}.hasAttribute('dir')`),
    };
  }, { readyExpr: '!!window.countedTextareaFixtureReady' });

  assert.equal(result.auto, 'rtl', 'dir="auto" reads a right-to-left answer right to left');
  assert.equal(result.plain, false, 'no dir attribute leaves the inner field unchanged');
});
