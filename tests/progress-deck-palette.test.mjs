import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./progress-deck-palette.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const readBars = () => withPage(fixture, async (command) => {
  const read = await command('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const shadowOf = (id) => {
        const host = document.querySelector('#' + id);
        return id === 'bar' ? host.shadowRoot.querySelector('aha-progress').shadowRoot : host.shadowRoot;
      };
      const out = {};
      for (const id of ['product', 'deck', 'deck-unflavoured', 'deck-success', 'bar', 'own-ink']) {
        const root = shadowOf(id);
        const track = getComputedStyle(root.querySelector('.track'));
        out[id] = { track: track.backgroundColor, border: track.borderTopWidth, fill: getComputedStyle(root.querySelector('.fill')).backgroundColor };
      }
      return out;
    })()`,
  });
  return read.result.value;
}, { readyExpr: '!!window.progressFixtureReady' });

test('palette="deck" draws the bar from the deck ladder; without it the bar keeps the product colours', { skip }, async () => {
  const bars = await readBars();
  const product = { track: 'rgb(241, 241, 241)', border: '0px', fill: 'rgb(231, 14, 104)' };
  assert.deepEqual(bars.product, product);
  assert.deepEqual(bars['deck-unflavoured'], product, 'a bar inside an applyDeck() root without palette is unchanged');
  for (const id of ['deck', 'bar']) {
    assert.match(bars[id].track, /^(rgba\(255, 255, 255, 0\.12\)|color\(srgb 1 1 1 \/ 0\.12\))$/, `${id} track is the deck ink at 12%`);
    assert.equal(bars[id].border, '1px', `${id} track has the hairline`);
    assert.equal(bars[id].fill, 'rgb(231, 14, 104)', `${id} fill is the deck accent`);
  }
  assert.equal(bars['deck-success'].fill, 'rgb(26, 26, 26)', 'a status still recolours the fill');
  assert.equal(bars['own-ink'].fill, 'rgb(0, 0, 0)', 'accent on the element sets its own fill');
});
