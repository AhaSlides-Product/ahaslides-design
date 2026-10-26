import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement ??= class {};
const { canvasDeckVars, applyCanvasDeck } = await import('../lib/canvas-deck.js');
const { readableTextInk, parseColour } = await import('../lib/deck.js');
const canvasEntry = await import('../lib/canvas.js').catch(() => null);

const PRESENTER_DEFAULT_PALETTE = ['#4EAAF1', '#FFAF09', '#28C270', '#FF5DA1', '#7669BF', '#124345'];

function channel(value) {
  const unit = value / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}
function contrastRatio(a, b) {
  const lum = (hex) => { const [r, g, bl] = parseColour(hex); return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl); };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every presenter default palette colour gets an ink that meets AA', () => {
  const vars = canvasDeckVars({ palette: PRESENTER_DEFAULT_PALETTE });
  PRESENTER_DEFAULT_PALETTE.forEach((fill, index) => {
    assert.equal(vars[`--aha-deck-palette-${index + 1}`], fill);
    assert.ok(contrastRatio(fill, vars[`--aha-deck-palette-${index + 1}-ink`]) >= 4.5, fill);
  });
});

test('amber and green get the DS text ink, not white', () => {
  const vars = canvasDeckVars({ palette: ['#FFAF09', '#4CAF50'] });
  assert.equal(vars['--aha-deck-palette-1-ink'], '#1A1A1A');
  assert.equal(vars['--aha-deck-palette-2-ink'], '#1A1A1A');
});

test('no palette writes no palette variable', () => {
  assert.equal(Object.keys(canvasDeckVars({ accent: '#E70E68' })).some((name) => name.includes('palette')), false);
});

test('applyCanvasDeck clears palette variables a later call omits', () => {
  const style = new Map();
  const target = { style: { setProperty: (n, v) => style.set(n, v), removeProperty: (n) => style.delete(n) } };
  applyCanvasDeck(target, { palette: ['#FFAF09', '#4CAF50'] });
  assert.equal(style.get('--aha-deck-palette-2'), '#4CAF50');
  applyCanvasDeck(target, { palette: ['#FFAF09'] });
  assert.equal(style.has('--aha-deck-palette-2'), false);
  assert.equal(style.has('--aha-deck-palette-2-ink'), false);
});

test('readableTextInk is exported from the canvas entry', () => {
  if (canvasEntry) assert.equal(canvasEntry.readableTextInk('#FFAF09'), '#1A1A1A');
  assert.equal(readableTextInk('#FFAF09'), '#1A1A1A');
});
