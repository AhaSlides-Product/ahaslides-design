import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./badge-partial.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = `(() => {
  const read = (id) => {
    const chip = document.querySelector('#' + id).shadowRoot.querySelector('.chip');
    const style = getComputedStyle(chip);
    const icon = chip.querySelector('aha-icon');
    const mark = chip.querySelector('aha-answer-mark');
    const box = chip.getBoundingClientRect();
    return { label: chip.querySelector('.chip-label').textContent, background: style.backgroundColor, colour: style.color,
      height: box.height, icon: icon ? icon.getAttribute('name') : null, iconSize: icon ? icon.getBoundingClientRect().width : null, mark: !!mark };
  };
  return { partial: read('partial'), partialDefault: read('partial-default'), correct: read('correct'), beta: read('beta') };
})()`;

test('a partially correct badge is grey with ink text and a neutral minus glyph, never the answer colour', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const read = await command('Runtime.evaluate', { expression: measure, returnByValue: true });
    return read.result.value;
  }, { readyExpr: '!!window.badgePartialFixtureReady' });
  assert.equal(result.partial.label, 'Partially correct');
  assert.equal(result.partial.icon, 'system-minus');
  assert.equal(result.partial.mark, false);
  assert.equal(result.partial.height, 20);
  assert.equal(result.partialDefault.height, 28);
  assert.equal(result.partial.iconSize, 16);
  assert.equal(result.partialDefault.iconSize, 16);
  assert.equal(result.partial.background, result.beta.background);
  assert.equal(result.partial.colour, result.correct.colour);
  assert.notEqual(result.partial.background, result.correct.background);
});
