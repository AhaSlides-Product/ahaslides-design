import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./card-select-preview.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const el = document.querySelector('#looks');
  const cards = () => [...el.shadowRoot.querySelectorAll('.card')];
  const out = {};
  const changes = [];
  el.addEventListener('change', (e) => changes.push(e.detail.value));

  out.assigned = cards().map((c) => c.querySelector('slot').assignedElements().map((n) => n.textContent).join());
  out.groupName = el.shadowRoot.querySelector('[role="radiogroup"]').getAttribute('aria-label');
  out.ariaLabels = cards().map((c) => c.getAttribute('aria-label'));
  out.previewHidden = cards().every((c) => c.querySelector('.preview').getAttribute('aria-hidden') === 'true');
  const box = cards()[0].querySelector('.preview').getBoundingClientRect();
  out.ratio = Math.round((box.width / box.height) * 100) / 100;
  out.labelClipped = cards()[0].querySelector('.card-label').getBoundingClientRect().width <= 1;
  out.shownLabelWidth = document.querySelector('#shown').shadowRoot.querySelector('.card-label').getBoundingClientRect().width;

  out.noneChecked = cards().every((c) => c.getAttribute('aria-checked') === 'false');
  out.tabStops = cards().map((c) => c.tabIndex);

  el.querySelector('[slot="bold"]').click(); await frame();
  out.afterSlotClick = el.value;
  const sel = getComputedStyle(cards()[2]);
  out.selBg = sel.backgroundColor;
  out.selRing = sel.boxShadow;
  out.selBorder = sel.borderTopColor;

  el.value = 'retired'; await frame();
  out.unknownNoneChecked = cards().every((c) => c.getAttribute('aria-checked') === 'false');
  out.unknownTabStops = cards().map((c) => c.tabIndex);
  out.changes = changes;
  return out;
})()`;

test('preview tiles show the app-drawn slot, select by click on it, ring the selection without a fill, name the group, and keep one tab stop with no value', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.cardSelectFixtureReady', timeout: 45000 });
  assert.deepEqual(r.assigned, ['Classic', 'Modern', 'Bold']);
  assert.equal(r.groupName, 'Certificate design');
  assert.deepEqual(r.ariaLabels, ['Classic', 'Modern', 'Bold']);
  assert.equal(r.previewHidden, true);
  assert.equal(r.ratio, 1.41);
  assert.equal(r.labelClipped, true);
  assert.ok(r.shownLabelWidth > 20, 'hide-labels="false" leaves the label visible');
  assert.equal(r.noneChecked, true);
  assert.deepEqual(r.tabStops, [0, -1, -1]);
  assert.equal(r.afterSlotClick, 'bold');
  assert.equal(r.selBg, 'rgb(255, 255, 255)');
  assert.equal(r.selRing, 'rgb(231, 14, 104) 0px 0px 0px 2px');
  assert.equal(r.selBorder, 'rgb(255, 255, 255)');
  assert.equal(r.unknownNoneChecked, true);
  assert.deepEqual(r.unknownTabStops, [0, -1, -1]);
  assert.deepEqual(r.changes, ['bold']);
});
