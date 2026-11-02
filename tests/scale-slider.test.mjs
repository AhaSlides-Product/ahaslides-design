import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./scale-slider.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('the readout drops an end label that only repeats the value, and keeps one that differs', { skip }, async () => {
  const result = await evaluateInPage(fixture, `({
    min: document.querySelector('#min-slider').shadowRoot.querySelector('.readout-text').textContent,
    max: document.querySelector('#max-slider').shadowRoot.querySelector('.readout-text').textContent,
    differentLabels: document.querySelector('#different-labels-slider').shadowRoot.querySelector('.readout-text').textContent,
  })`, { readyExpr: '!!window.scaleSliderFixtureReady' });
  assert.deepEqual(result, { min: '1', max: '5', differentLabels: '5: Always' });
});

test('the hover ring is gated behind a real pointer and never applies in a touch/non-hover context, at either end of the scale', { skip }, async () => {
  // A sticky, clipped ring at min/max is a touch-only defect (hover state sticks after a tap, then
  // gets cut by the input's own box), so the gate is proven at the CSS level: find the thumb's
  // `:hover` box-shadow rule, confirm it lives inside a `(hover: hover)` media condition, that the
  // keyboard focus indicator does NOT share that gate, and that the condition evaluates false in
  // this non-hover rendering context (the same context a touchscreen reports).
  const probe = (selector) => `(() => {
    const sheet = document.querySelector('${selector}').shadowRoot.querySelector('style').sheet;
    const mediaRules = [...sheet.cssRules].filter(r => r instanceof CSSMediaRule);
    const hoverRule = mediaRules.find(r => /hover/.test(r.media.mediaText));
    const hasHoverThumbRules = hoverRule
      ? [...hoverRule.cssRules].some(r => /:hover/.test(r.selectorText || '') && /slider-thumb/.test(r.selectorText || ''))
      : false;
    const focusVisibleGated = mediaRules.some(r => [...r.cssRules].some(rr => /focus-visible/.test(rr.selectorText || '')));
    return {
      mediaText: hoverRule ? hoverRule.media.mediaText : null,
      appliesHere: hoverRule ? window.matchMedia(hoverRule.media.mediaText).matches : null,
      hasHoverThumbRules,
      focusVisibleGated,
    };
  })()`;
  const min = await evaluateInPage(fixture, probe('#min-slider'), { readyExpr: '!!window.scaleSliderFixtureReady' });
  const max = await evaluateInPage(fixture, probe('#max-slider'), { readyExpr: '!!window.scaleSliderFixtureReady' });
  for (const result of [min, max]) {
    assert.equal(result.mediaText, '(hover: hover) and (pointer: fine)');
    assert.equal(result.hasHoverThumbRules, true, 'the hover ring rule must sit inside the hover-only media block');
    assert.equal(result.focusVisibleGated, false, 'the keyboard focus indicator must stay unconditional');
    assert.equal(result.appliesHere, false, 'this non-hover rendering context must not paint the ring');
  }
});

test('in a right-to-left page the low label sits flush under the left (min) end and the high label under the right end', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const root = document.querySelector('#rtl-slider').shadowRoot;
    const textBox = (selector) => { const range = document.createRange(); range.selectNodeContents(root.querySelector(selector)); return range.getBoundingClientRect(); };
    const ends = root.querySelector('.ends').getBoundingClientRect();
    const rail = root.querySelector('.rail').getBoundingClientRect();
    const low = textBox('.low');
    const high = textBox('.high');
    return { lowFromLeft: Math.round(low.left - ends.left), highFromRight: Math.round(ends.right - high.right), lowIsLeftOfHigh: low.right < high.left, railLeftOfCentre: rail.left < (ends.left + ends.right) / 2 };
  })()`, { readyExpr: '!!window.scaleSliderFixtureReady' });
  assert.deepEqual(result, { lowFromLeft: 0, highFromRight: 0, lowIsLeftOfHigh: true, railLeftOfCentre: true });
});

test('track="line" paints the rail with the deck ladder 24% rung, while the default stays on the 12% stroke', { skip }, async () => {
  const alpha = (id) => `(() => { const colour = getComputedStyle(document.querySelector('#${id}').shadowRoot.querySelector('.rail')).backgroundColor; return Number((/\\/\\s*([\\d.]+)\\)$/.exec(colour) || /rgba\\([^)]*,\\s*([\\d.]+)\\)$/.exec(colour) || [0, 1])[1]); })()`;
  const line = await evaluateInPage(fixture, alpha('line-track-slider'), { readyExpr: '!!window.scaleSliderFixtureReady' });
  const stroke = await evaluateInPage(fixture, alpha('default-track-slider'), { readyExpr: '!!window.scaleSliderFixtureReady' });
  assert.deepEqual({ line, stroke }, { line: 0.24, stroke: 0.12 });
});
