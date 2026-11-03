import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-stacked.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 1500));
  const root = (id) => document.getElementById(id).shadowRoot;
  const hatched = (node) => getComputedStyle(node, '::before').maskImage !== 'none';
  const segments = (id) => [...root(id).querySelectorAll('.stack-segment')];
  const tipFor = (node) => {
    const box = node.getBoundingClientRect();
    node.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
    return [...root('ten').querySelectorAll('.tip .tip-line')].map((line) => line.textContent);
  };
  const tenSegments = segments('ten');
  const otherLegend = [...root('ten').querySelectorAll('.lg-item')].pop();
  return {
    segmentHatch: segments('six').map(hatched),
    swatchHatch: [...root('six').querySelectorAll('.lg-item .swatch')].map(hatched),
    legend: [...root('ten').querySelectorAll('.lg-label')].map((node) => node.textContent),
    otherLegendTip: otherLegend._tip.lines,
    otherSegmentTip: tipFor(tenSegments[tenSegments.length - 1]),
    tableHead: [...root('ten').querySelectorAll('table thead th')].map((node) => node.textContent),
    labelDir: root('six').querySelector('.stack-label').dir,
    legendDir: root('six').querySelector('.lg-label').dir,
  };
})()`;

test('stacked series 5 and 6 repeat colours 1 and 2 with a hatch on the segment and its legend swatch', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.stackedFixtureReady', timeout: 45000 });
  assert.deepEqual(result.segmentHatch, [false, false, false, false, true, true]);
  assert.deepEqual(result.swatchHatch, [false, false, false, false, true, true]);
});

test('stacked series past the cap fold into Other, and the legend, tooltip and data table name each merged series', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.stackedFixtureReady', timeout: 45000 });
  assert.deepEqual(result.legend, ['C1', 'C2', 'C3', 'C4', 'C5', 'Other (5)']);
  assert.deepEqual(result.otherLegendTip, ['C6', 'C7', 'C8', 'C9', 'C10']);
  assert.equal(result.otherSegmentTip.length, 6);
  assert.match(result.otherSegmentTip[0], /^Other \(5\): /);
  assert.deepEqual(result.otherSegmentTip.slice(1).map((line) => line.split(':')[0]), ['C6', 'C7', 'C8', 'C9', 'C10']);
  assert.deepEqual(result.tableHead.slice(1), ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
});

test('labels taken from data resolve their own direction', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.stackedFixtureReady', timeout: 45000 });
  assert.equal(result.labelDir, 'auto');
  assert.equal(result.legendDir, 'auto');
});
