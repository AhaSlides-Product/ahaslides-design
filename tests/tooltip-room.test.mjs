import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./tooltip-room.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const app = document.querySelector('#app');
  const help = document.querySelector('aha-setting-row').shadowRoot.querySelector('.help');
  const overflow = () => app.scrollHeight - Math.round(app.getBoundingClientRect().height);
  const out = {};
  const events = [];
  app.addEventListener('aha-tooltip-room', (event) => events.push(event.detail));
  await wait(450);
  out.restOverflow = overflow();
  help.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await frame();
  out.openEvent = events.at(-1);
  help.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  await wait(450);
  out.afterHoverOverflow = overflow();
  out.closeEvent = events.at(-1);
  out.parked = help.shadowRoot.querySelector('.bubble').classList.contains('parked');
  return out;
})()`;

test('a closed ? bubble adds nothing to the panel overflow, and an open one announces the room it needs', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.tooltipRoomFixtureReady', timeout: 45000 });
  assert.equal(result.restOverflow, 0);
  assert.equal(result.afterHoverOverflow, 0);
  assert.equal(result.parked, true);
  assert.equal(result.openEvent.open, true);
  assert.ok(result.openEvent.bottom > 56, 'bottom reaches past a one-row panel: ' + result.openEvent.bottom);
  assert.deepEqual(result.closeEvent, { open: false, bottom: 0, top: 0 });
});
