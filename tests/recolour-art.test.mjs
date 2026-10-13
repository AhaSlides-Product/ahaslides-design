import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ART_SOURCES, ILLUSTRATION_TINTS, coloursInSvg, recolourSvg, toGreyscale, toIllustrationColour } from '../recolour-art.mjs';

const isGrey = (hex) => hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7);
const tintIndex = (hex) => ILLUSTRATION_TINTS.indexOf(toIllustrationColour(hex));

test('the illustration tints are Vivid Pink at 5 to 100% on white, then Darker Pink', () => {
  assert.deepEqual(ILLUSTRATION_TINTS, ['#FEF3F7', '#FDE7F0', '#FACFE1', '#F8B7D2', '#F493BB', '#F16EA4', '#EC3E86', '#E70E68', '#DB005B']);
});

test('a colour already on the list maps to itself, so a second run changes nothing', () => {
  for (const colour of [...ILLUSTRATION_TINTS, '#FFFFFF', '#1A1A1A', '#8A8A8A']) assert.equal(toIllustrationColour(colour), colour);
});

test('every hue lands on the pink ramp, a lighter colour on a paler tint', () => {
  const yellow = tintIndex('#FFE32C'), green = tintIndex('#33C173'), blue = tintIndex('#1847BC');
  assert.ok(yellow >= 0 && green >= 0 && blue >= 0);
  assert.ok(yellow < green && green < blue);
});

test('white stays white, a grey stays a grey, and nothing is darker than the ink', () => {
  assert.equal(toIllustrationColour('#FFFFFF'), '#FFFFFF');
  assert.equal(toIllustrationColour('#D9D9D9'), '#D9D9D9');
  assert.equal(toIllustrationColour('#000000'), '#1A1A1A');
  assert.equal(toIllustrationColour('#282E3E'), '#1A1A1A');
});

test('an override wins over the ramp, and alpha survives', () => {
  assert.equal(toIllustrationColour('#A76D36', { '#A76D36': '#F8B7D2' }), '#F8B7D2');
  assert.equal(toIllustrationColour('#8644D480'), toIllustrationColour('#8644D4') + '80');
});

test('greyscale sends every hue to a grey, never darker than the ink', () => {
  assert.ok(isGrey(toGreyscale('#FF0000')));
  assert.equal(toGreyscale('#000000'), '#1A1A1A');
});

test('recolourSvg reaches named colours, rgb(), filter tints, and leaves url(#id) and a shadow matrix alone', () => {
  const shadow = '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>';
  const svg = '<svg><defs><linearGradient id="a1b2c3"><stop stop-color="rgb(134, 68, 212)"/></linearGradient>'
    + `<filter>${shadow}<feColorMatrix type="matrix" values="0 0 0 0 0.2 0 0 0 0 0.5 0 0 0 0 0.9 0 0 0 1 0"/></filter></defs>`
    + '<path fill="red"/><path fill="black"/><path fill="url(#a1b2c3)"/></svg>';
  const illustrations = ART_SOURCES.find(source => source.label === 'illustrations');
  const out = recolourSvg(svg, illustrations.mapFor('sample.svg'));
  assert.match(out, /fill="url\(#a1b2c3\)"/);
  assert.match(out, /id="a1b2c3"/);
  assert.ok(out.includes(shadow));
  assert.doesNotMatch(out, /fill="red"|fill="black"|rgb\(/);
  for (const colour of coloursInSvg(out)) assert.ok(isGrey(colour.toUpperCase()) || ILLUSTRATION_TINTS.includes(colour.toUpperCase()), colour);
});
