import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./controls-slots-variants.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(200);
  const byId = (id) => document.getElementById(id);
  const wrap = (id) => getComputedStyle(byId(id).shadowRoot.querySelector('.wrap'));
  const field = (id) => byId(id).shadowRoot.querySelector('.field');
  const out = {};
  const label = byId('next').shadowRoot.querySelector('slot:not([name])').getBoundingClientRect();
  const end = byId('next').querySelector('[slot=icon-end]').getBoundingClientRect();
  out.endAfterLabel = end.left >= label.right - 1;
  out.endWidth = end.width;
  out.plain = { border: wrap('plain').borderTopColor, background: wrap('plain').backgroundColor };
  out.borderless = { border: wrap('borderless').borderTopColor, background: wrap('borderless').backgroundColor };
  byId('borderless').shadowRoot.querySelector('.wrap').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  out.error = wrap('borderless-error').borderTopColor;
  field('borderless').focus();
  await wait(300);
  out.focused = { border: wrap('borderless').borderTopColor, shadow: wrap('borderless').boxShadow };
  out.fonts = { plain: getComputedStyle(field('plain')).fontFamily, mono: getComputedStyle(field('mono')).fontFamily };
  const panel = byId('panel');
  const toggles = [];
  panel.addEventListener('toggle', (event) => toggles.push(event.detail.open));
  let actions = 0;
  byId('extra-action').addEventListener('click', () => { actions += 1; });
  byId('extra-action').click();
  out.afterExtra = { open: panel.hasAttribute('open'), toggles: toggles.length, actions };
  panel.shadowRoot.querySelector('.head').click();
  out.afterHead = { open: panel.hasAttribute('open'), toggles: toggles.length };
  return out;
})()`;

test('button end icon, input borderless and monospace, collapse extra click', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    return command('Runtime.evaluate', { expression: scenario, awaitPromise: true, returnByValue: true }).then((r) => r.result.value);
  }, { readyExpr: '!!window.controlsFixtureReady' });
  assert.equal(result.endAfterLabel, true);
  assert.equal(result.endWidth, 16);
  assert.equal(result.plain.border, 'rgb(227, 227, 227)');
  assert.equal(result.borderless.border, 'rgba(0, 0, 0, 0)');
  assert.equal(result.borderless.background, 'rgba(0, 0, 0, 0)');
  assert.equal(result.error, 'rgb(26, 26, 26)');
  assert.equal(result.focused.border, 'rgb(231, 14, 104)');
  assert.notEqual(result.focused.shadow, 'none');
  assert.match(result.fonts.mono, /Menlo/);
  assert.doesNotMatch(result.fonts.plain, /Menlo/);
  assert.deepEqual(result.afterExtra, { open: false, toggles: 0, actions: 1 });
  assert.deepEqual(result.afterHead, { open: true, toggles: 1 });
});
