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
      values: [...root.querySelectorAll('.scol-slot')].map((slot) => {
        const value = slot.querySelector('.scol-value'), bar = slot.querySelector('.scol-bar');
        return {
          text: value.textContent, shown: getComputedStyle(value).visibility !== 'hidden',
          inside: value.classList.contains('is-inside'), box: box(value), bar: box(bar),
          ink: getComputedStyle(value).color, fill: getComputedStyle(bar).backgroundColor,
        };
      }),
    };
  };
  return Object.fromEntries(['okr', 'average', 'phone', 'negative', 'nrr', 'narrow', 'narrowdecimal'].map((id) => [id, read(id)]));
})()`;

const overlaps = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
const clearOfReference = ({ line, label, values }) => values.every((value) => !value.shown
  || (!(value.box.top < line.top + 1 && value.box.bottom > line.top - 1) && (!label || !overlaps(value.box, label))));

const charts = ['okr', 'average', 'phone', 'negative', 'nrr', 'narrow', 'narrowdecimal'];
for (const id of charts) {
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

const channels = (colour) => colour.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = (colour) => {
  const [red, green, blue] = channels(colour).map((channel) => { const unit = channel / 255; return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const contrast = (first, second) => { const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a); return (high + 0.05) / (low + 0.05); };

for (const id of charts) {
  test(`an inside value stays within its bar and reads at 4.5:1 (${id})`, { skip }, async () => {
    const result = await evaluateInPage(fixture, measure, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
    for (const value of result[id].values.filter((entry) => entry.inside)) {
      assert.ok(value.box.left >= value.bar.left - 0.5 && value.box.right <= value.bar.right + 0.5, `${value.text} spills past its bar`);
      assert.ok(contrast(value.ink, value.fill) >= 4.5, `${value.text}: ${value.ink} on ${value.fill}`);
    }
  });
}

test('every palette fill, alpha ones included, gets an ink at 4.5:1 over white, or none', { skip }, async () => {
  const fills = ['rgb(231, 14, 104)', 'rgb(0, 0, 0)', 'rgba(231, 14, 104, 0.3)', 'rgb(168, 168, 168)', 'rgba(231, 14, 104, 0.05)', 'rgba(0, 0, 0, 0.5)'];
  const inks = await evaluateInPage(fixture, `(${JSON.stringify(fills)}).map((fill) => window.inkWithBestContrast(fill, 'rgb(26, 26, 26)'))`, { readyExpr: '!!window.columnFixtureReady', timeout: 45000 });
  assert.match(inks[0], /^var\(--aha-viz-ink-inverse/);
  const flatten = (colour) => {
    const [red, green, blue, alpha = 1] = colour.match(/[\d.]+/g).map(Number);
    return `rgb(${[red, green, blue].map((channel) => channel * alpha + 255 * (1 - alpha)).join(', ')})`;
  };
  fills.forEach((fill, index) => {
    if (inks[index] === null) return;
    const ink = inks[index].startsWith('var(') ? 'rgb(255, 255, 255)' : inks[index];
    assert.ok(contrast(ink, flatten(fill)) >= 4.5, `${fill} with ${inks[index]}`);
  });
  assert.ok(inks.some((ink, index) => ink !== null && fills[index].includes('0.3')), 'the 30% pink fill gets an ink that reads');
  assert.equal(inks[5], null, 'a fill no ink reaches 4.5:1 on gets none, so the label goes outside the bar');
});
