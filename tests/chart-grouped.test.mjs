import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-grouped.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 1500));
  const root = (id) => document.getElementById(id).shadowRoot;
  const titles = (id) => [...root(id).querySelectorAll('.axis-title')].filter((node) => !node.hidden).map((node) => node.textContent);
  const bars = [...root('grouped').querySelectorAll('.gcol-bar')].map((bar) => Math.round(bar.getBoundingClientRect().height));
  const group = root('grouped').querySelector('.gcol-group').getBoundingClientRect();
  const slots = [...root('grouped').querySelectorAll('.gcol-group:first-child .gcol-slot')].map((slot) => slot.getBoundingClientRect());
  return {
    bars,
    sideBySide: slots.every((slot, index) => index === 0 || slot.left >= slots[index - 1].right - 1),
    insideGroup: slots.every((slot) => slot.left >= group.left - 1 && slot.right <= group.right + 1),
    legend: [...root('grouped').querySelectorAll('.lg-label')].map((node) => node.textContent),
    table: [...root('grouped').querySelectorAll('table th')].map((node) => node.textContent),
    titles: { grouped: titles('grouped'), plain: titles('plain'), bar: titles('bar'), line: titles('line'), donut: titles('donutTitled') },
  };
})()`;

test('type="column" with series draws one bar per series side by side, a series legend and a data table', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.groupedFixtureReady', timeout: 45000 });
  assert.equal(result.bars.length, 9);
  assert.ok(result.bars[0] > result.bars[1] && result.bars[1] > result.bars[2], 'heights follow the values 12, 8, 5');
  assert.equal(result.bars[6], 16, 'an all-zero group keeps the stub height');
  assert.ok(result.sideBySide && result.insideGroup);
  assert.deepEqual(result.legend, ['North', 'South', 'East']);
  assert.deepEqual(result.table.slice(0, 4), ['Item', 'North', 'South', 'East']);
});

test('x-title and y-title show on column, bar and line only', { skip }, async () => {
  const { titles } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.groupedFixtureReady', timeout: 45000 });
  assert.deepEqual(titles.grouped, ['Units sold', 'Quarter']);
  assert.deepEqual(titles.bar, ['Option', 'Votes']);
  assert.deepEqual(titles.line, ['Sign-ups', 'Week']);
  assert.deepEqual(titles.plain, []);
  assert.deepEqual(titles.donut, []);
});
