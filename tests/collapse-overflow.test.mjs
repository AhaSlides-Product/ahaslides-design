import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./collapse-overflow.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const overflowOf = (collapse, selector) => getComputedStyle(collapse.shadowRoot.querySelector(selector)).overflow;
  const out = {};
  const ghost = document.getElementById('ghost');
  const bordered = document.getElementById('bordered');
  const closed = document.getElementById('closed');

  await wait(600);
  out.ghostClip = overflowOf(ghost, '.clip');
  out.borderedClip = overflowOf(bordered, '.clip');
  out.borderedPanel = overflowOf(bordered, '.panel');

  const tooltip = ghost.querySelector('aha-setting-row').shadowRoot.querySelector('aha-tooltip');
  tooltip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await wait(400);
  const bubble = tooltip.shadowRoot.querySelector('.bubble');
  const box = bubble.getBoundingClientRect();
  const clip = ghost.shadowRoot.querySelector('.clip').getBoundingClientRect();
  out.bubbleVisible = getComputedStyle(bubble).visibility === 'visible';
  out.bubbleEscapesClip = box.top < clip.top || box.bottom > clip.bottom || box.left < clip.left || box.right > clip.right;

  return out;
})()`;

const animated = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const clipOf = (collapse) => getComputedStyle(collapse.shadowRoot.querySelector('.clip')).overflow;
  const closed = document.getElementById('closed');
  const out = { atRest: clipOf(closed) };
  closed.setAttribute('open', '');
  await wait(40);
  out.whileOpening = clipOf(closed);
  await wait(500);
  out.onceOpen = clipOf(closed);
  closed.removeAttribute('open');
  await wait(0);
  out.atCloseStart = clipOf(closed);
  return out;
})()`;

const evaluate = (command, expression) =>
  command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }).then((r) => r.result.value);

test('with reduced motion, open content may overflow at once', { skip }, async () => {
  const result = await withPage(fixture, (command) => evaluate(command, scenarios), { readyExpr: '!!window.collapseFixtureReady' });
  assert.equal(result.ghostClip, 'visible');
  assert.equal(result.borderedClip, 'visible');
  assert.equal(result.borderedPanel, 'visible');
  assert.equal(result.bubbleVisible, true);
  assert.equal(result.bubbleEscapesClip, true);
});

test('with motion, the clip holds only while the body animates', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    return evaluate(command, animated);
  }, { readyExpr: '!!window.collapseFixtureReady' });
  assert.equal(result.atRest, 'hidden');
  assert.equal(result.whileOpening, 'hidden');
  assert.equal(result.onceOpen, 'visible');
  assert.equal(result.atCloseStart, 'hidden');
});
