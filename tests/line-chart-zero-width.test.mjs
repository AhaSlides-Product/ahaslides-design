import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./line-chart-zero-width.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const clipWidth = (id) => document.getElementById(id).shadowRoot.querySelector('clipPath rect').getAttribute('width');
  const linePath = () => document.getElementById('live').shadowRoot.querySelector('g[clip-path] path');
  await wait(1500);
  const out = { hidden: clipWidth('hidden'), noLabels: clipWidth('no-labels') };
  const before = linePath();
  const live = document.getElementById('live');
  live.data = { labels: ['Mon', 'Tue', 'Wed'], series: [{ label: 'Sign-ups', values: [30, 20, 10] }] };
  await wait(1500);
  out.samePathNode = before === linePath();
  out.liveClip = clipWidth('live');
  return out;
})()`;

test('a line chart drawn at zero width or with no periods never sets a NaN clip width', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.lineFixtureReady', timeout: 45000 });
  assert.notEqual(result.hidden, 'NaN');
  assert.notEqual(result.noLabels, 'NaN');
  assert.ok(Number(result.liveClip) > 0);
});

test('new data morphs the existing line path instead of rebuilding it', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.lineFixtureReady', timeout: 45000 });
  assert.equal(result.samePathNode, true);
});
