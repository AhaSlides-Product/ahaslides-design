import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./rate-deck-numbers.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const gray40 = 'rgb(227, 227, 227)';

async function evaluate(expression) {
  return withPage(fixture, async (command) => {
    const read = await command('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression });
    return read.result.value;
  }, { readyExpr: '!!window.rateFixtureReady' });
}

test('surface="deck" paints the empty star from the deck ladder and falls back to gray-40 without it', { skip }, async () => {
  const empty = await evaluate(`Object.fromEntries(['plain', 'deck-no-tokens', 'plain-in-deck', 'deck-star'].map((id) =>
    [id, getComputedStyle(document.getElementById(id).shadowRoot.querySelector('.star:not(.on) .base svg path')).fill]))`);
  assert.equal(empty.plain, gray40);
  assert.equal(empty['deck-no-tokens'], gray40);
  assert.equal(empty['plain-in-deck'], gray40, 'without surface="deck" the deck tokens are ignored');
  assert.equal(empty['deck-star'], 'rgb(10, 20, 30)');
});

test('character="number" draws numbered cells and steps in whole numbers even with allow-half', { skip }, async () => {
  const result = await evaluate(`(async () => {
    const numbers = document.getElementById('numbers');
    const root = numbers.shadowRoot;
    const digits = [...root.querySelectorAll('.base .digit')].map((digit) => digit.textContent).join(',');
    const filled = getComputedStyle(root.querySelector('.star.on .fill'));
    const filledDigit = getComputedStyle(root.querySelector('.star.on .fill .digit')).color;
    const emptyCell = getComputedStyle(root.querySelector('.star:not(.on) .base'));
    root.querySelector('.stars').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const deck = document.getElementById('deck-numbers').shadowRoot;
    const deckEmpty = getComputedStyle(deck.querySelector('.star:not(.on) .base'));
    return {
      digits, filledBg: filled.backgroundColor, filledDigit, emptyBorder: emptyCell.borderTopColor, emptyDigit: emptyCell.color,
      afterArrow: numbers.value,
      deckBorder: deckEmpty.borderTopColor, deckDigit: deckEmpty.color,
      deckFilledDigit: getComputedStyle(deck.querySelector('.star.on .fill .digit')).color,
    };
  })()`);
  assert.equal(result.digits, '1,2,3,4');
  assert.equal(result.filledBg, 'rgb(231, 14, 104)');
  assert.equal(result.filledDigit, 'rgb(255, 255, 255)');
  assert.equal(result.emptyBorder, gray40);
  assert.equal(result.emptyDigit, 'rgb(26, 26, 26)');
  assert.equal(result.afterArrow, 3);
  assert.equal(result.deckBorder, 'rgb(10, 20, 30)');
  assert.equal(result.deckDigit, 'rgb(1, 2, 3)');
  assert.equal(result.deckFilledDigit, 'rgb(4, 5, 6)');
});

test('size="lg" gives every star and every number cell a 44px hit area, and the default stays 24px', { skip }, async () => {
  const sizes = await evaluate(`Object.fromEntries(['regular', 'large', 'large-numbers'].map((id) => {
    const star = document.getElementById(id).shadowRoot.querySelector('.star');
    const box = star.getBoundingClientRect();
    const glyph = star.querySelector('.base').getBoundingClientRect();
    return [id, { width: box.width, height: box.height, glyphWidth: glyph.width }];
  }))`);
  assert.deepEqual(sizes.regular, { width: 24, height: 24, glyphWidth: 24 });
  assert.deepEqual(sizes.large, { width: 44, height: 44, glyphWidth: 32 });
  assert.deepEqual(sizes['large-numbers'], { width: 44, height: 44, glyphWidth: 44 });
});

test('min="0" adds a 0 cell, value 0 fills only that cell, and no value fills nothing', { skip }, async () => {
  const result = await evaluate(`(() => {
    const cells = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.star')];
    const unrated = document.getElementById('zero-unrated');
    const before = cells('zero-unrated').map((cell) => cell.classList.contains('on'));
    unrated.shadowRoot.querySelector('.stars').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    return {
      digits: cells('zero').map((cell) => cell.querySelector('.base .digit').textContent).join(','),
      zero: cells('zero').map((cell) => cell.classList.contains('on')),
      checked: cells('zero').map((cell) => cell.getAttribute('aria-checked')),
      before, firstPick: unrated.value, firstPickOn: cells('zero-unrated').map((cell) => cell.classList.contains('on')),
    };
  })()`);
  assert.equal(result.digits, '0,1,2,3');
  assert.deepEqual(result.zero, [true, false, false, false]);
  assert.deepEqual(result.checked, ['true', 'false', 'false', 'false']);
  assert.deepEqual(result.before, [false, false, false, false]);
  assert.equal(result.firstPick, 0);
  assert.deepEqual(result.firstPickOn, [true, false, false, false]);
});
