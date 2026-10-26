import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./card-select-tooltip.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const tipOf = (id, index) => document.querySelector('#' + id).shadowRoot.querySelectorAll('.tip')[index];
  const bubbleOf = (tip) => tip.shadowRoot.querySelector('.bubble');
  const visible = (tip) => getComputedStyle(bubbleOf(tip)).visibility === 'visible';
  const pointer = (tip, type, pointerType) => tip.dispatchEvent(new PointerEvent(type, { pointerType }));
  const inViewport = (tip) => { const r = bubbleOf(tip).getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; };
  const out = {};

  const tip = tipOf('top', 0);
  const card = tip.querySelector('.card');
  out.text = tip.getAttribute('text');
  out.noTitle = !card.hasAttribute('title');
  out.ariaLabel = card.getAttribute('aria-label');
  out.restHidden = !visible(tip);

  pointer(tip, 'pointerenter', 'mouse'); await frame(); await frame();
  out.mouseHover = visible(tip);
  out.topFlipsBelow = tip.getAttribute('placement').startsWith('bottom');
  out.topInViewport = inViewport(tip);
  pointer(tip, 'pointerleave', 'mouse'); await frame();
  out.mouseLeave = !visible(tip);

  pointer(tip, 'pointerenter', 'touch'); await frame();
  out.touchTap = visible(tip);
  pointer(tip, 'pointerleave', 'touch');

  card.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true })); await frame();
  out.pointerFocus = visible(tip);
  card.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true })); await frame();

  card.focus(); await frame(); await frame();
  out.keyboardFocus = card.matches(':focus-visible') ? visible(tip) : 'not-focus-visible';
  card.blur(); await frame();
  out.afterBlur = !visible(tip);

  const bottom = tipOf('bottom', 1);
  pointer(bottom, 'pointerenter', 'mouse'); await frame(); await frame();
  out.bottomPlacement = bottom.getAttribute('placement');
  out.bottomInViewport = inViewport(bottom);

  const left = tipOf('left', 0);
  pointer(left, 'pointerenter', 'mouse'); await frame(); await frame();
  out.leftInViewport = inViewport(left);

  const right = tipOf('right', 2);
  pointer(right, 'pointerenter', 'mouse'); await frame(); await frame();
  out.rightInViewport = inViewport(right);

  const labelled = tipOf('labelled', 0);
  pointer(labelled, 'pointerenter', 'mouse'); await frame();
  out.labelledNoBubble = getComputedStyle(bubbleOf(labelled)).display === 'none';
  out.labelledTitle = labelled.querySelector('.card').title;

  document.querySelector('#top').removeAttribute('icon-only'); await frame();
  out.toggledTitle = tip.querySelector('.card').title;
  out.toggledNoText = !tip.hasAttribute('text');
  return out;
})()`;

test('icon-only card select shows a tooltip on mouse hover and keyboard focus, never on touch or pointer focus, and never clips', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.cardSelectFixtureReady', timeout: 45000 });
  assert.equal(result.text, 'Bloom');
  assert.equal(result.noTitle, true);
  assert.equal(result.ariaLabel, 'Bloom');
  assert.equal(result.restHidden, true);
  assert.equal(result.mouseHover, true);
  assert.equal(result.topFlipsBelow, true);
  assert.equal(result.topInViewport, true);
  assert.equal(result.mouseLeave, true);
  assert.equal(result.touchTap, false);
  assert.equal(result.pointerFocus, false);
  assert.equal(result.keyboardFocus, true);
  assert.equal(result.afterBlur, true);
  assert.equal(result.bottomPlacement, 'top');
  assert.equal(result.bottomInViewport, true);
  assert.equal(result.leftInViewport, true);
  assert.equal(result.rightInViewport, true);
  assert.equal(result.labelledNoBubble, true);
  assert.equal(result.labelledTitle, 'Bloom');
  assert.equal(result.toggledTitle, 'Bloom');
  assert.equal(result.toggledNoText, true);
});
