import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-colors.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(1200);
  const fills = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.col-bar')].map((bar) => getComputedStyle(bar).backgroundColor);
  const out = { host: fills('host'), brand: fills('brand') };
  document.getElementById('host').removeAttribute('colors');
  await wait(300);
  out.cleared = fills('host');
  return out;
})()`;

test('colors replaces the series on the default brand palette, and removing it restores the brand series', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.colorsFixtureReady', timeout: 45000 });
  assert.deepEqual(result.host, ['rgb(10, 20, 30)', 'rgb(40, 50, 60)']);
  assert.notDeepEqual(result.brand, result.host);
  assert.deepEqual(result.cleared, result.brand);
});
