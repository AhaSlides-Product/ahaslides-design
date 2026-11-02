import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-strings.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(1200);
  const read = (id) => {
    const chart = document.getElementById(id);
    return { note: chart.shadowRoot.querySelector('.empty-note').textContent, summary: chart.summary };
  };
  const out = { own: read('own'), vi: read('vi'), broken: read('broken') };
  const own = document.getElementById('own');
  own.strings = { emptyNote: 'From the property' };
  await wait(300);
  out.property = read('own');
  own.setAttribute('strings', '{"emptyNote":"Attribute again"}');
  await wait(300);
  out.attributeAgain = read('own');
  return out;
})()`;

test('the strings attribute overrides built-in copy per key, falls back to the locale, and yields to the property until it changes', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.stringsFixtureReady', timeout: 45000 });
  assert.equal(result.own.note, 'No answers yet');
  assert.equal(result.own.summary, 'Answer split. No responses yet.');
  assert.equal(result.vi.note, 'Chưa có phiếu nào');
  assert.match(result.vi.summary, /^Biểu đồ/);
  assert.equal(result.broken.note, 'No responses yet');
  assert.equal(result.property.note, 'From the property');
  assert.equal(result.attributeAgain.note, 'Attribute again');
});
