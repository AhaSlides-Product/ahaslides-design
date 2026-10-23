import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement ??= class {};
const { readableInkOn } = await import('../lib/aha-chart.js');

const DARK = 'var(--aha-viz-ink, #1A1A1A)';
const LIGHT = 'var(--aha-viz-ink-inverse, #FFFFFF)';

test('Vivid Pink reads white, not dark ink', () => {
  assert.equal(readableInkOn('#E70E68'), LIGHT);
});

test('a fill just above the pure-black crossover still takes the higher-contrast ink', () => {
  assert.equal(readableInkOn('#EA5181'), DARK);
});

test('yellow reads dark', () => {
  assert.equal(readableInkOn('#FFD600'), DARK);
});

test('indigo reads white', () => {
  assert.equal(readableInkOn('#3F51B5'), LIGHT);
});

test('an unparseable fill falls back to the inverse ink', () => {
  assert.equal(readableInkOn('not-a-colour'), LIGHT);
});
