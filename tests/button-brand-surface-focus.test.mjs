import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-brand-surface-focus.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const white = 'rgb(255, 255, 255)';
const vividPink = 'rgb(231, 14, 104)';

async function focusRingById(ids) {
  return withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    const rings = {};
    for (const id of ids) {
      const inner = await command('Runtime.evaluate', { expression: `document.querySelector('#${id}').shadowRoot.querySelector('button')` });
      const { nodeId } = await command('DOM.requestNode', { objectId: inner.result.objectId });
      await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] });
      const read = await command('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const style = getComputedStyle(document.querySelector('#${id}').shadowRoot.querySelector('button'));
          const shadowColours = style.boxShadow.match(/rgba?\\([^)]*\\)/g) || [];
          const outlined = style.outlineStyle !== 'none' && style.outlineStyle !== 'auto';
          return { ring: outlined ? style.outlineColor : shadowColours.at(-1), gap: shadowColours[0] };
        })()`,
      });
      rings[id] = read.result.value;
    }
    return rings;
  }, { readyExpr: '!!window.brandSurfaceFixtureReady' });
}

test('surface="brand" draws a white focus ring outside a Vivid Pink gap; the default ring stays Vivid Pink', { skip }, async () => {
  const rings = await focusRingById(['white-surface', 'brand-primary', 'brand-secondary', 'page-override']);
  assert.equal(rings['white-surface'].ring, vividPink);
  assert.equal(rings['white-surface'].gap, white);
  for (const id of ['brand-primary', 'brand-secondary']) {
    assert.equal(rings[id].ring, white, id);
    assert.equal(rings[id].gap, vividPink, id);
  }
  assert.equal(rings['page-override'].ring, 'rgb(1, 2, 3)', 'a page rule on the element still re-points the ring');
});
