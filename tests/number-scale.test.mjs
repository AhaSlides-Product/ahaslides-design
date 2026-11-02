import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./number-scale.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = { readyExpr: '!!window.numberScaleFixtureReady' };

test('0–10 by default; a tap picks, fires change and moves the single tab stop to the pick', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const scale = document.querySelector('#phone');
    const events = [];
    scale.addEventListener('change', (e) => events.push(e.detail.value));
    const numbers = [...scale.shadowRoot.querySelectorAll('.number')];
    numbers[9].click();
    return {
      labels: numbers.map((n) => n.textContent).join(','),
      value: scale.value, events,
      checked: numbers.filter((n) => n.getAttribute('aria-checked') === 'true').map((n) => n.textContent),
      tabStops: numbers.filter((n) => n.tabIndex === 0).map((n) => n.textContent),
      endName: numbers[0].getAttribute('aria-label'),
    };
  })()`, ready);
  assert.deepEqual(result, { labels: '0,1,2,3,4,5,6,7,8,9,10', value: 9, events: [9], checked: ['9'], tabStops: ['9'], endName: '0, Not at all likely' });
});

test('on a 360px phone the eleven numbers wrap to six per row with no overflow; a wide host keeps one row', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const rows = (id) => new Set([...document.querySelector(id).shadowRoot.querySelectorAll('.number')].map((n) => Math.round(n.getBoundingClientRect().top))).size;
    const phone = document.querySelector('#phone');
    const first = phone.shadowRoot.querySelector('.number').getBoundingClientRect();
    return { phoneRows: rows('#phone'), wideRows: rows('#wide'), overflow: phone.scrollWidth > 360, height: first.height, wideEnough: first.width >= 40, minWidth: Math.min(...[...document.querySelector('#narrow').shadowRoot.querySelectorAll('.number')].map((n) => n.getBoundingClientRect().width)) >= 44 };
  })()`, ready);
  assert.deepEqual(result, { phoneRows: 2, wideRows: 1, overflow: false, height: 48, wideEnough: true, minWidth: true });
});

test('arrow keys move and pick, mirrored in right-to-left; Home and End jump to the ends', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const press = (id, key) => {
      const scale = document.querySelector(id);
      const current = scale.shadowRoot.querySelector('.number[tabindex="0"]');
      current.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
      return scale.value;
    };
    return {
      ltrRight: press('#wide', 'ArrowRight'), ltrRightAgain: press('#wide', 'ArrowRight'), ltrEnd: press('#wide', 'End'), ltrHome: press('#wide', 'Home'),
      rtlLeft: press('#rtl', 'ArrowLeft'), rtlRight: press('#rtl', 'ArrowRight'),
    };
  })()`, ready);
  assert.deepEqual(result, { ltrRight: 1, ltrRightAgain: 2, ltrEnd: 10, ltrHome: 0, rtlLeft: 6, rtlRight: 5 });
});

test('a disabled scale keeps its value and ignores taps and keys', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const scale = document.querySelector('#locked');
    let fired = false;
    scale.addEventListener('change', () => { fired = true; });
    const numbers = [...scale.shadowRoot.querySelectorAll('.number')];
    numbers[0].click();
    numbers[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    return { value: scale.value, fired, count: numbers.length, disabled: numbers.every((n) => n.getAttribute('aria-disabled') === 'true') };
  })()`, ready);
  assert.deepEqual(result, { value: 4, fired: false, count: 5, disabled: true });
});
