import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./audience-close-button.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = `(() => {
  const inner = (id) => document.querySelector('#' + id).shadowRoot.querySelector('button');
  const box = (id) => { const r = inner(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
  const hostAt = (id, dx, dy) => {
    const r = inner(id).getBoundingClientRect();
    return document.elementFromPoint(r.x + dx, r.y + dy)?.id ?? null;
  };
  const hitSlop = (id) => {
    const r = inner(id).getBoundingClientRect();
    return { just: hostAt(id, -3, r.height / 2), far: hostAt(id, -6, r.height / 2), justRight: hostAt(id, r.width + 3, r.height / 2), justBelow: hostAt(id, r.width / 2, r.height + 3), farBelow: hostAt(id, r.width / 2, r.height + 6) };
  };
  const colour = (id) => getComputedStyle(inner(id)).color;
  return { close: box('close'), sheet: box('sheet'), touch: box('touch'), foundation: box('foundation'),
    closeSlop: hitSlop('close'), touchSlop: hitSlop('touch'), foundationSlop: hitSlop('foundation'),
    closeColour: colour('close'), sheetColour: colour('sheet') };
})()`;

test('the audience close is drawn 36 x 36 with a 44 x 44 hit area, and no other button gains one', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const read = await command('Runtime.evaluate', { expression: measure, returnByValue: true });
    return read.result.value;
  }, { readyExpr: '!!window.audienceCloseFixtureReady' });
  assert.deepEqual([result.close.width, result.close.height], [36, 36]);
  assert.deepEqual([result.sheet.width, result.sheet.height], [36, 36]);
  assert.deepEqual([result.touch.width, result.touch.height], [48, 48]);
  assert.equal(result.closeSlop.just, 'close');
  assert.equal(result.closeSlop.justRight, 'close');
  assert.equal(result.closeSlop.justBelow, 'close');
  assert.notEqual(result.closeSlop.far, 'close');
  assert.notEqual(result.closeSlop.farBelow, 'close');
  assert.notEqual(result.touchSlop.just, 'touch');
  assert.notEqual(result.foundationSlop.just, 'foundation');
});

test('the sheet close is muted grey at rest and text-default on hover and press; the deck close keeps the deck ink', { skip }, async () => {
  const states = await withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    const colourIn = async (id, forcedPseudoClasses) => {
      const inner = await command('Runtime.evaluate', { expression: `document.querySelector('#${id}').shadowRoot.querySelector('button')` });
      const { nodeId } = await command('DOM.requestNode', { objectId: inner.result.objectId });
      await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
      const read = await command('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector('#${id}').shadowRoot.querySelector('button')).color`, returnByValue: true });
      return read.result.value;
    };
    await command('Runtime.evaluate', { expression: `document.documentElement.style.setProperty('--aha-deck-ink', '#FFFFFF')` });
    const result = { sheetRest: await colourIn('sheet', []), sheetHover: await colourIn('sheet', ['hover']), sheetActive: await colourIn('sheet', ['active']), deckRest: await colourIn('close', []) };
    await command('Runtime.evaluate', { expression: `document.querySelector('#sheet').setAttribute('disabled', '')` });
    result.sheetDisabled = await colourIn('sheet', []);
    result.sheetDisabledHover = await colourIn('sheet', ['hover']);
    return result;
  }, { readyExpr: '!!window.audienceCloseFixtureReady' });
  assert.equal(states.sheetRest, 'rgb(138, 138, 138)');
  assert.equal(states.sheetHover, 'rgb(26, 26, 26)');
  assert.equal(states.sheetActive, 'rgb(26, 26, 26)');
  assert.equal(states.deckRest, 'rgb(255, 255, 255)');
  assert.equal(states.sheetDisabled, 'rgb(181, 181, 181)');
  assert.equal(states.sheetDisabledHover, 'rgb(181, 181, 181)');
});
