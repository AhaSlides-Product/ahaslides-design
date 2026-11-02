import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./counted-input-types.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-counted-input gives the inner field its type, phone keyboard and direction', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true })).result.value;
    const field = (id) => `document.getElementById('${id}').shadowRoot.querySelector('.field')`;
    return {
      types: await evaluate(`['email', 'url', 'password', 'unknown'].map((id) => document.getElementById(id).shadowRoot.querySelector('.field').type)`),
      decimal: await evaluate(`[${field('decimal')}.inputMode, ${field('decimal')}.type, ${field('decimal')}.value]`),
      direction: await evaluate(`getComputedStyle(${field('rtl')}).direction`),
    };
  }, { readyExpr: '!!window.countedInputFixtureReady' });

  assert.deepEqual(result.types, ['email', 'url', 'password', 'text'], 'email, url and password reach the field; any other type renders as text');
  assert.deepEqual(result.decimal, ['decimal', 'text', '1e'], 'inputmode="decimal" keeps a text field, so partial input survives');
  assert.equal(result.direction, 'rtl', 'dir="auto" reads a right-to-left answer right to left');
});
