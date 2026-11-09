import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./tooltip-shortcut-size.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = String.raw`(async () => {
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const out = {};
  for (const id of ['plain', 'single', 'redo', 'enter', 'lg']) {
    const root = document.getElementById(id).shadowRoot;
    const bubble = root.querySelector('.bubble').getBoundingClientRect();
    const chip = root.querySelector('.shortcut');
    const box = chip.hidden ? null : chip.getBoundingClientRect();
    const icon = chip.querySelector('aha-icon');
    out[id] = {
      bubbleHeight: Math.round(bubble.height),
      chipWidth: box && Math.round(box.width), chipHeight: box && Math.round(box.height),
      chipFont: box && getComputedStyle(chip).fontSize,
      iconSize: icon && icon.getAttribute('size'),
    };
  }
  return out;
})()`;

test('default-size tooltip with a shortcut stays 30px tall with an 18px chip; size lg keeps 36px and 24px', { skip }, async () => {
  const r = await evaluateInPage(fixture, measure, { readyExpr: '!!window.tooltipFixtureReady', timeout: 45000 });
  assert.equal(r.plain.bubbleHeight, 30);
  for (const id of ['single', 'redo', 'enter']) {
    assert.equal(r[id].bubbleHeight, 30, id);
    assert.equal(r[id].chipHeight, 18, id);
    assert.equal(r[id].chipFont, '12px', id);
  }
  assert.equal(r.single.chipWidth, 18);
  assert.ok(r.redo.chipWidth > 18);
  assert.equal(r.enter.chipWidth, 18);
  assert.equal(r.enter.iconSize, '12');
  assert.equal(r.lg.bubbleHeight, 36);
  assert.equal(r.lg.chipWidth, 24);
  assert.equal(r.lg.chipHeight, 24);
  assert.equal(r.lg.chipFont, '14px');
});
