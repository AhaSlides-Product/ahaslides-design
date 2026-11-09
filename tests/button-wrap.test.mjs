import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8').split('\n').map((line) => line.trim());
const rule = (selector) => rules.find((line) => line.startsWith(selector));

test('wrap lets the label break and the button grow, from each size\'s own height', () => {
  const base = rule(':host([wrap]:not([icon-only]):not([size=inline])) button{');
  assert.match(base, /height:auto/);
  assert.match(base, /white-space:normal/);
  assert.match(base, /overflow-wrap:break-word/);
  for (const [size, height] of [['sm', 28], ['md', 36], ['lg', 40], ['xl', 52], ['touch', 48]]) {
    assert.match(rule(`:host([wrap][size=${size}]:not([icon-only])) button{`), new RegExp(`min-height:${height}px`), size);
  }
});

test('wrap leaves the non-wrap size rules untouched', () => {
  assert.match(rule(':host([size=lg]) button{'), /^:host\(\[size=lg\]\) button\{ height:40px; padding:0 20px;/);
  assert.match(rule(':host([size=touch]) button{'), /height:48px/);
});
