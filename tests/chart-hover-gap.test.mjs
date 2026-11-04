import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixtureFor = (type) => pathToFileURL(fileURLToPath(new URL('./chart-hover-gap.html', import.meta.url))).href + '?type=' + type;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  await wait(1500);
  const root = document.getElementById('chart').shadowRoot;
  const nodes = [...root.querySelectorAll('[data-cat]')].filter((node) => node.dataset.cat !== '');
  const byCat = new Map();
  for (const node of nodes) if (!byCat.has(node.dataset.cat)) byCat.set(node.dataset.cat, node);
  const cats = [...byCat.keys()];
  const move = (target) => target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true }));
  const fadedOthers = () => nodes.filter((node) => node.dataset.cat !== cats[1] && node.classList.contains('is-faded')).length;
  const gap = root.querySelector('.viz');
  move(byCat.get(cats[1]));
  await wait(50);
  const samples = { onBar: fadedOthers() };
  move(gap);
  await wait(40);
  samples.inGap = fadedOthers();
  move(byCat.get(cats[2]));
  await wait(50);
  samples.nextBarActive = byCat.get(cats[2]).classList.contains('is-hl');
  samples.nextBarFadedOthers = nodes.filter((node) => node.dataset.cat !== cats[2] && node.classList.contains('is-faded')).length;
  return samples;
})()`;

for (const type of ['column', 'bar']) {
  test(`${type}: moving between bars through a gap keeps the other bars faded`, { skip }, async () => {
    const result = await evaluateInPage(fixtureFor(type), scenario, { readyExpr: '!!window.hoverFixtureReady', timeout: 45000 });
    assert.ok(result.onBar > 0, 'other bars fade while a bar is hovered');
    assert.equal(result.inGap, result.onBar, 'the gap does not un-fade the other bars');
    assert.equal(result.nextBarActive, true);
    assert.ok(result.nextBarFadedOthers > 0);
  });
}

test('column: an out-of-focus bar fades further than its text, so it cannot pass for the 30% series', { skip }, async () => {
  const opacities = await evaluateInPage(fixtureFor('column'), String.raw`(async () => {
    const root = document.getElementById('chart').shadowRoot;
    await new Promise((done) => setTimeout(done, 1500));
    const slots = [...root.querySelectorAll('.col-slot[data-cat]')];
    slots[1].dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true }));
    await new Promise((done) => setTimeout(done, 450));
    const effective = (node) => { let opacity = 1; for (let at = node; at && at !== root; at = at.parentElement) opacity *= parseFloat(getComputedStyle(at).opacity); return Math.round(opacity * 100) / 100; };
    return { bar: effective(slots[0].querySelector('.col-bar')), value: effective(slots[0].querySelector('.value')) };
  })()`, { readyExpr: '!!window.hoverFixtureReady', timeout: 45000 });
  assert.deepEqual(opacities, { bar: 0.15, value: 0.4 });
});
