import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-tooltip-edge-overflow.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const root = document.documentElement;
  const tooltip = document.getElementById('edge');
  const bubble = tooltip.shadowRoot.querySelector('.bubble');
  await wait(50);
  const out = { hiddenOverflow: root.scrollWidth - root.clientWidth };
  tooltip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await wait(400);
  out.visible = getComputedStyle(bubble).visibility === 'visible';
  const before = getComputedStyle(bubble, '::before');
  out.bridgeWidth = parseFloat(before.width);
  out.bridgeHeight = parseFloat(before.height);
  const box = bubble.getBoundingClientRect();
  out.bubbleWidth = box.width;
  out.bubbleHeight = box.height;
  return out;
})()`;

test('a hidden tooltip at the right edge adds no horizontal overflow, and its hover bridge returns when open', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    const r = await command('Runtime.evaluate', { expression: scenario, awaitPromise: true, returnByValue: true });
    return r.result.value;
  }, { readyExpr: '!!window.tooltipFixtureReady' });
  assert.ok(result.hiddenOverflow <= 0, `hidden tooltip overflows by ${result.hiddenOverflow}px`);
  assert.equal(result.visible, true);
  assert.ok(result.bridgeWidth >= result.bubbleWidth + 18 - 0.5, 'open bubble keeps its 9px hover bridge');
  assert.ok(result.bridgeHeight >= result.bubbleHeight + 18 - 0.5);
});
