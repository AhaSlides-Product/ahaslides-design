import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./tooltip-reveal.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const visible = (tip) => getComputedStyle(tip.shadowRoot.querySelector('.bubble')).visibility === 'visible';
  const pointer = (tip, type, pointerType) => tip.dispatchEvent(new PointerEvent(type, { pointerType }));
  const tip = document.querySelector('#tip');
  const trigger = document.querySelector('#trigger');
  const out = {};

  pointer(tip, 'pointerenter', 'mouse'); await frame();
  out.mouseHover = visible(tip);
  pointer(tip, 'pointerleave', 'mouse'); await frame();
  out.mouseLeave = visible(tip);

  pointer(tip, 'pointerenter', 'touch'); await frame();
  out.touchTap = visible(tip);
  pointer(tip, 'pointerleave', 'touch');

  trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true })); await frame();
  out.pointerFocus = visible(tip);
  trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true })); await frame();

  trigger.focus(); await frame();
  out.keyboardFocus = trigger.matches(':focus-visible') ? visible(tip) : 'not-focus-visible';
  trigger.blur(); await frame();
  out.afterBlur = visible(tip);

  const focusTip = document.querySelector('#focus-tip');
  document.querySelector('#focus-trigger').dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true })); await frame();
  out.focusTriggerAnyFocus = visible(focusTip);
  pointer(focusTip, 'pointerenter', 'mouse');
  document.querySelector('#focus-trigger').dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true })); await frame();
  out.focusTriggerHoverOnly = visible(focusTip);

  const helpTip = document.querySelector('#help-tip');
  pointer(helpTip, 'pointerenter', 'mouse'); await frame();
  out.helpHover = visible(helpTip);
  return out;
})()`;

test('tooltip reveals on mouse hover and keyboard focus, never on touch or pointer focus', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.tooltipFixtureReady', timeout: 45000 });
  assert.equal(result.mouseHover, true);
  assert.equal(result.mouseLeave, false);
  assert.equal(result.touchTap, false);
  assert.equal(result.pointerFocus, false);
  assert.equal(result.keyboardFocus, true);
  assert.equal(result.afterBlur, false);
  assert.equal(result.focusTriggerAnyFocus, true);
  assert.equal(result.focusTriggerHoverOnly, false);
  assert.equal(result.helpHover, true);
});
