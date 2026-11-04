import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./flex-scroll-fade.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const fade = (el) => [el.style.getPropertyValue('--aha-flex-fade-start'), el.style.getPropertyValue('--aha-flex-fade-end')];
  const scroller = document.getElementById('scroller');
  const plain = document.getElementById('plain');
  await frame();
  const out = { atStart: fade(scroller), fits: fade(document.getElementById('fits')) };
  scroller.scrollLeft = 10;
  await frame();
  out.near = fade(scroller);
  scroller.scrollLeft = scroller.scrollWidth;
  await frame();
  out.atEnd = fade(scroller);
  scroller.scrollLeft = 0;
  scroller.lastElementChild.focus();
  await frame();
  out.focusScrolled = scroller.scrollLeft > 0;
  const reversed = document.getElementById('reversed');
  out.reversed = [reversed.style.getPropertyValue('--aha-flex-fade-dir'), ...fade(reversed)];
  out.plainWraps = getComputedStyle(plain).overflowX;
  out.plainShrinks = getComputedStyle(plain.firstElementChild).flexShrink;
  out.page = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
})()`;

test('a scroll row fades only the edge with more to see, and Tab reaches the last item', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    await command('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 1, mobile: false });
    const res = await command('Runtime.evaluate', { expression: scenario, awaitPromise: true, returnByValue: true });
    return res.result.value;
  }, { readyExpr: '!!window.flexFixtureReady' });
  assert.deepEqual(r.atStart, ['0px', '24px'], 'scrolled to start: no start fade, full end fade');
  assert.deepEqual(r.near, ['10px', '24px'], 'the start fade grows with the distance scrolled');
  assert.deepEqual(r.atEnd, ['24px', '0px'], 'scrolled to end: no end fade');
  assert.deepEqual(r.fits, ['0px', '0px'], 'a row that fits never fades');
  assert.deepEqual(r.reversed, ['to left', '0px', '24px'], 'row-reverse starts at the right, so the clipped left edge fades');
  assert.equal(r.focusScrolled, true, 'focusing a clipped item scrolls it into view');
  assert.equal(r.plainWraps, 'visible', 'a row without scroll keeps its overflow');
  assert.equal(r.plainShrinks, '1', 'a row without scroll keeps flex-shrink');
  assert.ok(r.page <= 0, 'the page itself never scrolls sideways');
});
