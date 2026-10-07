import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./audience-lock.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const tick = () => new Promise((done) => setTimeout(done, 20));
  const $ = (id) => document.getElementById(id);
  const out = {};
  await tick();
  out.hostDisabledSliderKept = $('host-disabled-slider').hasAttribute('disabled');
  out.hostLockedSubmitKept = $('host-locked-submit').hasAttribute('locked');
  out.hostDisabledInputKept = $('host-disabled-input').hasAttribute('disabled');

  $('submit').lock('b');
  await tick();
  out.lockedSliderDisabled = $('lockable-slider').hasAttribute('disabled');
  out.lockedList = $('list').locked;
  $('submit').unlock();
  await tick();
  out.unlockedSliderEnabled = !$('lockable-slider').hasAttribute('disabled');

  $('submit').lock('a');
  await tick();
  $('list').removeAttribute('lock-key');
  await tick();
  out.listReleasedWithoutKey = !$('list').locked;

  const slider = $('unset-slider');
  const changes = [];
  slider.addEventListener('change', (event) => changes.push(event.detail.value));
  slider.shadowRoot.querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await tick();
  out.unsetMinimumChanges = changes;
  out.unsetCleared = !slider.hasAttribute('unset');

  const tap = async (target, landOn) => {
    const changes = [];
    target.addEventListener('change', (event) => changes.push(event.detail.value));
    const input = target.shadowRoot.querySelector('input');
    const at = { bubbles: true, composed: true, clientX: 10, clientY: 10, pointerId: 1 };
    input.dispatchEvent(new PointerEvent('pointerdown', at));
    if (landOn != null) { input.value = String(landOn); input.dispatchEvent(new Event('input', { bubbles: true })); }
    input.dispatchEvent(new PointerEvent('pointerup', at));
    await tick();
    return { changes, unset: target.hasAttribute('unset') };
  };
  out.tapOnRestingThumb = await tap($('tap-slider'));
  out.dragGatedTap = await tap($('drag-gated-slider'), 5);
  return out;
})()`;

test('the submission lock only adds a lock, never clears a host-set one, an unset scale can pick its minimum, and a commit-on-drag tap only previews', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.audienceLockFixtureReady', timeout: 45000 });
  assert.deepEqual(result, {
    hostDisabledSliderKept: true,
    hostLockedSubmitKept: true,
    hostDisabledInputKept: true,
    lockedSliderDisabled: true,
    lockedList: true,
    unlockedSliderEnabled: true,
    listReleasedWithoutKey: true,
    unsetMinimumChanges: [0],
    unsetCleared: true,
    tapOnRestingThumb: { changes: [1], unset: false },
    dragGatedTap: { changes: [], unset: true },
  });
});
