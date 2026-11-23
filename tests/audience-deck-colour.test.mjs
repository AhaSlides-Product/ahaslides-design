import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement ??= class {};
const { parseColour, deckVars } = await import('../lib/audience-deck.js');

test('an 8-digit hex is composited over white', () => {
  assert.deepEqual(parseColour('#E70E680D'), [254, 243, 247]);
  assert.deepEqual(parseColour('#E70E684D'), [248, 182, 209]);
  assert.deepEqual(parseColour('#E70E68FF'), [231, 14, 104]);
});

test('a 4-digit hex expands then composites over white', () => {
  assert.deepEqual(parseColour('#0008'), [119, 119, 119]);
  assert.deepEqual(parseColour('#f00f'), [255, 0, 0]);
});

test('6 and 3-digit hex and rgba() are unchanged', () => {
  assert.deepEqual(parseColour('#E70E68'), [231, 14, 104]);
  assert.deepEqual(parseColour('#fff'), [255, 255, 255]);
  assert.deepEqual(parseColour('rgba(231, 14, 104, 0.05)'), [231, 14, 104]);
});

test('the primary hover glow takes the deck accent, not the brand pink', () => {
  assert.equal(deckVars({ accent: '#3B5BA5' })['--aha-button-elevate-primary-hover'], '0 4px 12px rgba(59,91,165,.32)');
  assert.equal(deckVars({ accent: 'var(--brand)' })['--aha-button-elevate-primary-hover'], '0 4px 12px color-mix(in srgb, var(--brand) 32%, transparent)');
});
