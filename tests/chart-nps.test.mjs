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
      barVisibility: getComputedStyle(root.querySelector('.col-bar')).visibility,
    };
  };
  return Object.fromEntries(['host', 'empty', 'plain', 'zero', 'short', 'invalid', 'narrow'].map((id) => [id, read(id)]));
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
