import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_COLOURS, coloursInSvg, recolourSvg, toAllowedColour } from '../recolour-art.mjs';

const isGrey = (hex) => hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7);

test('a colour already on the list maps to itself, so a second run changes nothing', () => {
  for (const colour of [...ALLOWED_COLOURS, '#FFFFFF', '#000000', '#8A8A8A']) assert.equal(toAllowedColour(colour), colour);
});

test('the old brand family moves onto the pink ramp by lightness', () => {
  assert.equal(toAllowedColour('#8644D4'), '#E70E68');
  assert.equal(toAllowedColour('#FF4081'), '#E70E68');
  assert.equal(toAllowedColour('#FFBACA'), '#F8B7D2');
  assert.equal(toAllowedColour('#F9F5FF'), '#FEF3F7');
  assert.equal(toAllowedColour('#B31B57'), '#DB005B');
});

test('every other hue becomes a grey, lighter hues staying lighter', () => {
  const yellow = toAllowedColour('#FFE32C'), blue = toAllowedColour('#1847BC');
  assert.ok(isGrey(yellow) && isGrey(blue));
  assert.ok(parseInt(yellow.slice(1, 3), 16) > parseInt(blue.slice(1, 3), 16));
});

test('greyscale sends even a brand-family colour to grey, and alpha survives', () => {
  assert.ok(isGrey(toAllowedColour('#FF0000', { greyscale: true })));
  assert.equal(toAllowedColour('#8644D480'), '#E70E6880');
});

test('recolourSvg reaches named colours, rgb(), filter tints, and leaves url(#id) alone', () => {
  const svg = '<svg><defs><linearGradient id="a1b2c3"><stop stop-color="rgb(134, 68, 212)"/></linearGradient>'
    + '<filter><feColorMatrix type="matrix" values="0 0 0 0 0.2 0 0 0 0 0.5 0 0 0 0 0.9 0 0 0 1 0"/></filter></defs>'
    + '<path fill="red"/><path fill="url(#a1b2c3)"/></svg>';
  const out = recolourSvg(svg, (colour) => toAllowedColour(colour));
  assert.match(out, /fill="url\(#a1b2c3\)"/);
  assert.match(out, /id="a1b2c3"/);
  assert.doesNotMatch(out, /fill="red"|rgb\(/);
  for (const colour of coloursInSvg(out)) assert.ok(isGrey(toAllowedColour(colour)) || ALLOWED_COLOURS.includes(colour.toUpperCase()), colour);
});
