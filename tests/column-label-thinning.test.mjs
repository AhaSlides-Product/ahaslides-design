import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./column-label-thinning.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 1500));
  const read = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.col-label')].map((label) => {
    const text = label.querySelector('.col-label-text');
    const box = text.getBoundingClientRect();
    return { text: text.textContent, shown: getComputedStyle(label).visibility !== 'hidden', left: box.left, right: box.right, clipped: text.scrollWidth > text.clientWidth + 1 };
  });
  return { phone: read('phone'), wide: read('wide') };
})()`;

test('signed column labels on a phone are thinned from the latest period, never ellipsised', { skip }, async () => {
  const { phone } = await evaluateInPage(fixture, measure, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
  const shown = phone.filter((label) => label.shown);
  assert.ok(shown.length > 1 && shown.length < phone.length);
  assert.equal(phone.at(-1).shown, true);
  assert.ok(shown.every((label) => !label.clipped));
  for (let index = 1; index < shown.length; index++) assert.ok(shown[index].left >= shown[index - 1].right);
});

test('signed column labels that fit keep every label', { skip }, async () => {
  const { wide } = await evaluateInPage(fixture, measure, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
  assert.ok(wide.every((label) => label.shown && !label.clipped));
});
