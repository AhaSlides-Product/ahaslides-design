import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-nps.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 1500));
  const read = (id) => {
    const chart = document.getElementById(id), root = chart.shadowRoot;
    const score = root.querySelector('.nps-score');
    return {
      summary: chart.summary,
      fills: [...root.querySelectorAll('.col-bar')].map((bar) => getComputedStyle(bar).backgroundColor),
      brackets: [...root.querySelectorAll('.nps-bracket')].map((node) => node.style.gridColumn + ' ' + node.querySelector('.nps-name').textContent + ' ' + node.querySelector('.nps-value').textContent),
      score: score && !score.hidden ? score.textContent : null,
      tableRows: root.querySelectorAll('tbody tr').length,
      values: [...root.querySelectorAll('.col-slot .value-main')].map((node) => node.textContent),
      note: [...root.querySelectorAll('.empty-note')].filter((node) => !node.hidden).map((node) => node.textContent),
      barVisibility: (() => { const bar = root.querySelector('.col-bar'); return bar ? getComputedStyle(bar).visibility : null; })(),
      columns: root.querySelectorAll('.col-bar').length,
      segments: [...root.querySelectorAll('.nps-bar .stack-segment')].filter((node) => node.offsetWidth > 0).map((node) => node.style.width + ' ' + getComputedStyle(node).backgroundColor),
      key: [...root.querySelectorAll('.nps-key-item')].filter((node) => node.offsetWidth > 0).map((node) => node.textContent),
    };
  };
  return Object.fromEntries(['host', 'empty', 'plain', 'zero', 'short', 'invalid', 'narrow', 'ratings', 'brackets', 'hostScore', 'bracketsEmpty'].map((id) => [id, read(id)]));
})()`;

test('nps splits ratings into detractor, passive and promoter brackets, scores them, and takes host colours in that order', { skip }, async () => {
  const { host, empty, plain, zero, short, invalid, narrow } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  const [detractor, passive, promoter] = ['rgb(200, 0, 0)', 'rgb(100, 100, 100)', 'rgb(0, 150, 0)'];
  assert.deepEqual(host.fills, [...Array(7).fill(detractor), passive, passive, promoter, promoter]);
  assert.deepEqual(host.brackets, ['1 / 8 Detractors 18 · 22%', '8 / 10 Passives 23 · 29%', '10 / 12 Promoters 39 · 49%']);
  assert.equal(host.score, 'NPS +27');
  assert.match(host.summary, /^NPS distribution\. NPS \+27\. Promoters: 39 · 49%\. Passives: 23 · 29%\. Detractors: 18 · 22%\. 80 responses\.$/);
  assert.equal(host.tableRows, 14);
  assert.equal(empty.score, null);
  assert.equal(empty.summary, 'NPS distribution. No responses yet.');
});

test('nps shows the visible empty note with no coloured stubs, and a tied score reads 0 not -0', { skip }, async () => {
  const { empty, zero } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  assert.deepEqual(empty.note, ['No responses yet']);
  assert.equal(empty.barVisibility, 'hidden');
  assert.equal(zero.score, 'NPS 0');
});

test('nps fills missing or invalid host colours by position with the defaults', { skip }, async () => {
  const { plain, short, invalid } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  assert.equal(short.fills[0], 'rgb(200, 0, 0)');
  assert.equal(short.fills[7], plain.fills[7]);
  assert.equal(short.fills[9], plain.fills[9]);
  assert.notEqual(plain.fills[0], plain.fills[9]);
  assert.equal(invalid.fills[0], 'rgb(200, 0, 0)');
  assert.equal(invalid.fills[7], plain.fills[7]);
  assert.equal(invalid.fills[9], 'rgb(0, 150, 0)');
});

test('nps uses compact counts above the columns at narrow widths', { skip }, async () => {
  const { narrow, host } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  assert.deepEqual(narrow.values.slice(8), ['1.2K', '3.4K', '18K']);
  assert.equal(host.values[10], '21');
});

test('nps counts raw 0 to 10 ratings into the per-score columns, skipping anything that is not one', { skip }, async () => {
  const { ratings } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  assert.deepEqual(ratings.values, ['1', '0', '0', '1', '0', '0', '0', '0', '1', '1', '2']);
  assert.deepEqual(ratings.brackets, ['1 / 8 Detractors 2 · 33%', '8 / 10 Passives 1 · 17%', '10 / 12 Promoters 3 · 50%']);
  assert.equal(ratings.score, 'NPS +17');
  assert.deepEqual(ratings.segments, []);
});

test('nps with bracket totals only draws one split bar, the key and the score, and no per-score columns', { skip }, async () => {
  const { brackets, hostScore, bracketsEmpty } = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.npsFixtureReady', timeout: 45000 });
  assert.equal(brackets.columns, 0);
  assert.deepEqual(brackets.segments, ['20% rgb(200, 0, 0)', '20% rgb(100, 100, 100)', '60% rgb(0, 150, 0)']);
  assert.deepEqual(brackets.key, ['Detractors10 · 20%', 'Passives10 · 20%', 'Promoters30 · 60%']);
  assert.equal(brackets.score, 'NPS +40');
  assert.equal(brackets.tableRows, 3);
  assert.match(brackets.summary, /^NPS distribution\. NPS \+40\. Promoters: 30 · 60%\. Passives: 10 · 20%\. Detractors: 10 · 20%\. 50 responses\.$/);
  assert.equal(hostScore.score, 'NPS +42');
  assert.deepEqual(bracketsEmpty.note, ['No responses yet']);
  assert.deepEqual(bracketsEmpty.segments, []);
});
