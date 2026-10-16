import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./column-reference-labels.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 1500));
  const box = (node) => { const rect = node.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; };
  const read = (id) => {
    const root = document.getElementById(id).shadowRoot;
    const label = root.querySelector('.scol-reference-label');
    return {
      line: box(root.querySelector('.scol-reference')),
      label: label.hidden ? null : box(label),
      values: [...root.querySelectorAll('.scol-value')].map((value) => ({
        text: value.textContent, shown: getComputedStyle(value).visibility !== 'hidden',
        inside: value.classList.contains('is-inside'), box: box(value),
      })),
    };
  };
  return { okr: read('okr'), average: read('average'), phone: read('phone'), negative: read('negative') };
})()`;

const overlaps = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
const clearOfReference = ({ line, label, values }) => values.every((value) => !value.shown
  || (!(value.box.top < line.top + 1 && value.box.bottom > line.top - 1) && (!label || !overlaps(value.box, label))));

for (const id of ['okr', 'average', 'phone', 'negative']) {
  test(`no value label touches the reference line or its label (${id})`, { skip }, async () => {
    const result = await evaluateInPage(fixture, measure, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
    assert.ok(result[id].values.every((value) => value.shown), 'every value stays shown');
    assert.ok(clearOfReference(result[id]), JSON.stringify(result[id]));
  });
}

test('a value label that would sit on the line moves inside its bar', { skip }, async () => {
  const { okr } = await evaluateInPage(fixture, measure, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
  assert.ok(okr.values.some((value) => value.inside));
});
