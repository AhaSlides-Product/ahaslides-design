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
  const announced = [];
  tip.addEventListener('open-change', (event) => announced.push(event.detail.open));

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
  out.openChanges = announced.join(',');

  const focusTip = document.querySelector('#focus-tip');
  document.querySelector('#focus-trigger').dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true })); await frame();
  out.focusTriggerAnyFocus = visible(focusTip);
  pointer(focusTip, 'pointerenter', 'mouse');
  document.querySelector('#focus-trigger').dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true })); await frame();
  out.focusTriggerHoverOnly = visible(focusTip);

  const helpTip = document.querySelector('#help-tip');
  pointer(helpTip, 'pointerenter', 'mouse'); await frame();
  out.helpHover = visible(helpTip);
  out.helpLabel = helpTip.shadowRoot.querySelector('.help').getAttribute('aria-label');
  out.customHelpLabel = document.querySelector('#labelled-help-tip').shadowRoot.querySelector('.help').getAttribute('aria-label');

  const tapTip = document.querySelector('#tap-tip');
  const tapTrigger = document.querySelector('#tap-trigger');
  const press = (target, pointerType) => {
    target.dispatchEvent(new PointerEvent('pointerdown', { pointerType, bubbles: true, composed: true }));
    target.dispatchEvent(new PointerEvent('click', { pointerType, detail: 1, bubbles: true, composed: true }));
  };
  pointer(tapTip, 'pointerenter', 'touch');
  press(tapTrigger, 'touch'); await frame();
  out.tapOpens = visible(tapTip);
  press(document.querySelector('#elsewhere'), 'touch'); await frame();
  out.tapElsewhereCloses = visible(tapTip);
  press(tapTrigger, 'touch'); await frame();
  press(tapTrigger, 'touch'); await frame();
  out.secondTapCloses = visible(tapTip);
  pointer(tapTip, 'pointerenter', 'mouse');
  press(tapTrigger, 'mouse'); await frame();
  out.tapModeMouseHover = visible(tapTip);
  pointer(tapTip, 'pointerleave', 'mouse'); await frame();
  out.tapModeMouseLeave = visible(tapTip);
  tapTrigger.focus(); await frame();
  out.tapModeKeyboardFocus = tapTrigger.matches(':focus-visible') ? visible(tapTip) : 'not-focus-visible';
  tapTrigger.blur();
  return out;
})()`;

test('tooltip reveals on mouse hover and keyboard focus, never on touch or pointer focus; hover-tap adds a touch tap', { skip }, async () => {
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
  assert.equal(result.openChanges, 'true,false,true,false');
  assert.equal(result.helpLabel, 'More info');
  assert.equal(result.customHelpLabel, 'About survey URLs');
  assert.equal(result.tapOpens, true);
  assert.equal(result.tapElsewhereCloses, false);
  assert.equal(result.secondTapCloses, false);
  assert.equal(result.tapModeMouseHover, true);
  assert.equal(result.tapModeMouseLeave, false);
  assert.equal(result.tapModeKeyboardFocus, true);
});
