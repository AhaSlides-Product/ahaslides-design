import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./chart-pie.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(1500);
  const read = (id) => {
    const root = document.getElementById(id).shadowRoot;
    const centre = root.querySelector('.donut-centre');
    return { slices: root.querySelectorAll('.svg-stage svg:first-of-type path').length, centreOpacity: centre.style.opacity, aria: document.getElementById(id).getAttribute('aria-label'), summary: root.textContent.includes('Pie chart') };
  };
  const out = { pie: read('pie'), donut: read('donut') };
  const pie = document.getElementById('pie');
  pie.setAttribute('type', 'donut');
  await wait(1200);
  out.switchedCentre = read('pie').centreOpacity;
  return out;
})()`;

test('type="pie" draws the slices with no centre hole and is named a pie chart', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.pieFixtureReady', timeout: 45000 });
  assert.equal(result.pie.slices, 3);
  assert.equal(result.pie.centreOpacity, '0');
  assert.equal(result.donut.centreOpacity, '1');
  assert.ok(result.pie.summary);
  assert.ok(!result.donut.summary);
  assert.equal(result.switchedCentre, '1');
});
