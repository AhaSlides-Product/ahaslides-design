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

const hostScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(1500);
  const read = (hostId, chartId) => {
    const host = document.getElementById(hostId).getBoundingClientRect();
    const element = document.getElementById(chartId);
    const root = element.shadowRoot;
    const stage = root.querySelector('.svg-stage').getBoundingClientRect();
    const legend = root.querySelector('.legend');
    const legendBox = legend.getBoundingClientRect();
    return {
      stageInside: stage.left >= host.left - 1 && stage.right <= host.right + 1 && stage.bottom <= host.bottom + 1,
      legendInside: legend.hidden || (legendBox.left >= host.left - 1 && legendBox.right <= host.right + 1 && legendBox.bottom <= host.bottom + 1),
      callouts: root.querySelectorAll('.donut-label').length,
      legendScrolls: legend.scrollHeight > legend.clientHeight + 1 && getComputedStyle(legend).overflowY === 'auto',
      contentFits: root.querySelector('.root').scrollHeight <= root.querySelector('.root').clientHeight + 1,
    };
  };
  const fills = [...document.getElementById('narrow').shadowRoot.querySelectorAll('.svg-stage svg:first-of-type path')].map((path) => path.style.fill);
  return { narrow: read('narrowHost', 'narrow'), short: read('shortHost', 'short'), tiny: read('tinyHost', 'tiny'), fills };
})()`;

test('a narrow or short host keeps the plot and legend inside it and swaps callouts for the legend', { skip }, async () => {
  const result = await evaluateInPage(fixture, hostScenarios, { readyExpr: '!!window.pieFixtureReady', timeout: 45000 });
  assert.ok(result.narrow.stageInside, 'pie narrower than a 200px host');
  assert.ok(result.narrow.legendInside, 'legend wraps inside a 200px host');
  assert.equal(result.short.callouts, 0, 'a 200px-tall host has no room for callouts');
  assert.ok(result.short.stageInside && result.short.legendInside);
  assert.ok(result.tiny.stageInside && result.tiny.legendInside);
  assert.ok(result.tiny.legendScrolls, 'six slices scroll inside a 220px-tall host');
  assert.ok(result.tiny.contentFits);
});

test('the first four slices have four different fills', { skip }, async () => {
  const result = await evaluateInPage(fixture, hostScenarios, { readyExpr: '!!window.pieFixtureReady', timeout: 45000 });
  assert.equal(new Set(result.fills.slice(0, 4)).size, 4);
});
