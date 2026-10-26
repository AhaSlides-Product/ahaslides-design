import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
globalThis.HTMLElement ??= class {};
const { deckTokens, applyDeckTokens } = await import('../lib/deck.js');
const { deckVars } = await import('../lib/audience-deck.js');
const { canvasDeckVars } = await import('../lib/canvas-deck.js');

const INKS = ['#1A1A1A', '#FFFFFF', 'rgb(40, 80, 200)'];

test('both surface entries re-export the shared ladder from deck.js', () => {
  for (const entry of ['audience', 'canvas']) {
    const source = readFileSync(new URL(`../lib/${entry}.js`, import.meta.url), 'utf8');
    assert.match(source, /export \{ applyDeckTokens, deckTokens, readableTextInk \} from '\.\/deck\.js';/, entry);
  }
});

test('audience and canvas write every shared token with the same value', () => {
  for (const ink of INKS) {
    const shared = deckTokens(ink);
    const audience = deckVars({ ink, accent: '#E70E68' });
    const canvas = canvasDeckVars({ ink, accent: '#E70E68', background: '#FFFFFF' });
    for (const [name, value] of Object.entries(shared)) {
      assert.equal(audience[name], value, `audience ${name} for ${ink}`);
      assert.equal(canvas[name], value, `canvas ${name} for ${ink}`);
    }
  }
});

test('secondary ink is 76% and the stroke 12%', () => {
  const tokens = deckTokens('#1A1A1A');
  assert.match(tokens['--aha-deck-ink-secondary'], /#1A1A1A var\(--aha-viz-mix-secondary, 76%\)/);
  assert.match(tokens['--aha-deck-stroke'], /#1A1A1A var\(--aha-viz-mix-stroke, 12%\)/);
  assert.match(tokens['--aha-deck-stroke-chip'], /var\(--aha-viz-mix-stroke-chip, 20%\)/);
  assert.match(tokens['--aha-deck-stroke-hover'], /#1A1A1A 60%/);
});

test('the deprecated names alias the new ones', () => {
  const tokens = deckTokens('#FFFFFF');
  assert.equal(tokens['--aha-deck-ink-muted'], 'var(--aha-deck-ink-secondary)');
  assert.equal(tokens['--aha-deck-edge'], 'var(--aha-deck-stroke)');
  assert.equal(tokens['--aha-deck-edge-hover'], 'var(--aha-deck-stroke-hover)');
});

test('applyDeckTokens writes the ladder and clears it when the ink goes away', () => {
  const props = new Map();
  const target = { style: { setProperty: (n, v) => props.set(n, v), removeProperty: (n) => props.delete(n) } };
  applyDeckTokens(target, { ink: '#1A1A1A' });
  assert.equal(props.get('--aha-deck-ink'), '#1A1A1A');
  assert.equal(props.get('--aha-deck-edge'), 'var(--aha-deck-stroke)');
  applyDeckTokens(target, {});
  assert.equal(props.size, 0);
});
