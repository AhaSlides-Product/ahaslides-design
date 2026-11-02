import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./progress-deck-palette.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const READ = `(() => {
  const shadowOf = (id) => {
    const host = document.querySelector('#' + id);
    return id === 'bar' ? host.shadowRoot.querySelector('aha-progress').shadowRoot : host.shadowRoot;
  };
  const readLine = (id) => {
    const root = shadowOf(id);
    const track = getComputedStyle(root.querySelector('.track'));
    return { track: track.backgroundColor, border: track.borderTopWidth, fill: getComputedStyle(root.querySelector('.fill')).backgroundColor, label: getComputedStyle(root.querySelector('.info')).color };
  };
  const out = {};
  for (const id of ['product', 'themed', 'deck', 'deck-unflavoured', 'deck-success', 'bar', 'own-ink', 'stray-accent', 'toggle']) out[id] = readLine(id);
  const ring = shadowOf('own-circle');
  out['own-circle'] = { fill: getComputedStyle(ring.querySelector('.fill-c')).stroke, track: getComputedStyle(ring.querySelector('.track-c')).stroke, label: getComputedStyle(ring.querySelector('.center')).color };
  const steps = shadowOf('own-steps');
  out['own-steps'] = { on: getComputedStyle(steps.querySelector('.step.on')).backgroundColor, off: getComputedStyle(steps.querySelector('.step:not(.on)')).backgroundColor };
  return out;
})()`;

const readBars = () => withPage(fixture, async (command) => (await command('Runtime.evaluate', { returnByValue: true, expression: READ })).result.value, { readyExpr: '!!window.progressFixtureReady' });

const readAfterChanges = () => withPage(fixture, async (command) => {
  const evaluate = async (expression) => (await command('Runtime.evaluate', { returnByValue: true, expression })).result.value;
  const toggle = `document.querySelector('#toggle')`;
  const fillOf = (id) => `getComputedStyle(document.querySelector('#${id}').shadowRoot.querySelector('.fill')).backgroundColor`;
  const trackOf = `getComputedStyle(${toggle}.shadowRoot.querySelector('.track'))`;
  const steps = [];
  await evaluate(`${toggle}.setAttribute('accent', '#000000')`);
  steps.push(await evaluate(fillOf('toggle')));
  await evaluate(`${toggle}.setAttribute('palette', 'deck')`);
  steps.push(await evaluate(fillOf('toggle')));
  await evaluate(`${toggle}.setAttribute('accent', '#336699')`);
  steps.push(await evaluate(fillOf('toggle')));
  await evaluate(`${toggle}.setAttribute('ink', '#102030')`);
  steps.push(await evaluate(`${trackOf}.backgroundColor`));
  await evaluate(`${toggle}.removeAttribute('palette')`);
  steps.push(await evaluate(fillOf('toggle')));
  steps.push(await evaluate(`${trackOf}.borderTopWidth`));
  steps.push(await evaluate(`${toggle}.style.getPropertyValue('--aha-color-primary') + '|' + ${toggle}.style.getPropertyValue('--aha-deck-accent')`));
  return steps;
}, { readyExpr: '!!window.progressFixtureReady' });

const INK_TWELVE = /^(rgba\(16, 32, 48, 0\.12\)|color\(srgb 0\.0627\d* 0\.1254\d*? 0\.188\d* \/ 0\.12\))$/;

test('palette="deck" draws the bar from the deck ladder; without it the bar keeps the product colours', { skip }, async () => {
  const bars = await readBars();
  const product = { track: 'rgb(241, 241, 241)', border: '0px', fill: 'rgb(231, 14, 104)' };
  const productBar = ({ track, border, fill }) => ({ track, border, fill });
  assert.deepEqual(productBar(bars.product), product);
  assert.deepEqual(productBar(bars['deck-unflavoured']), { ...product, fill: 'rgb(0, 163, 255)' }, 'inside an applyDeck() root without palette only the fill follows the inherited --aha-color-primary; the track stays product');
  assert.deepEqual(productBar(bars['stray-accent']), product, 'ink and accent without palette="deck" do not recolour the bar');
  assert.equal(bars.themed.fill, 'rgb(51, 102, 153)', 'a consumer inline --aha-color-primary survives connect');
  for (const id of ['deck', 'bar']) {
    assert.match(bars[id].track, /^(rgba\(255, 255, 255, 0\.12\)|color\(srgb 1 1 1 \/ 0\.12\))$/, `${id} track is the deck ink at 12%`);
    assert.equal(bars[id].border, '1px', `${id} track has the hairline`);
    assert.equal(bars[id].fill, 'rgb(0, 163, 255)', `${id} fill is the deck accent, not the product pink`);
  }
  assert.equal(bars['deck-success'].fill, 'rgb(26, 26, 26)', 'a status still recolours the fill');
  assert.equal(bars['own-ink'].fill, 'rgb(0, 0, 0)', 'accent on the element sets its own fill');
  assert.match(bars['own-ink'].track, INK_TWELVE, 'ink on the element sets its own track');
  assert.notEqual(bars['own-ink'].label, bars.deck.label, 'ink on the element sets its own label colour');
  assert.equal(bars['own-circle'].fill, 'rgb(0, 0, 0)', 'the ring fill takes the element accent');
  assert.match(bars['own-circle'].track, INK_TWELVE, 'the ring track takes the element ink');
  assert.equal(bars['own-steps'].on, 'rgb(0, 0, 0)', 'an on step takes the element accent');
});

test('palette, accent and ink changed after connect are re-read, and removing palette clears them', { skip }, async () => {
  const [strayAccent, deckAccent, newAccent, inkTrack, afterRemove, afterBorder, leftover] = await readAfterChanges();
  assert.equal(strayAccent, 'rgb(231, 14, 104)', 'accent without palette leaves the product fill');
  assert.equal(deckAccent, 'rgb(0, 0, 0)', 'adding palette="deck" applies the accent already set');
  assert.equal(newAccent, 'rgb(51, 102, 153)', 'a later accent change is re-read');
  assert.match(inkTrack, INK_TWELVE, 'a later ink change is re-read');
  assert.equal(afterRemove, 'rgb(231, 14, 104)', 'removing palette returns the product fill');
  assert.equal(afterBorder, '0px');
  assert.equal(leftover, '|', 'removing palette clears the inline variables');
});
