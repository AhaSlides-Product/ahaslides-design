import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';
import { MARKETING_MIN_WIDTHS } from '../lib/marketing-breakpoints.js';

const rulesOf = (source, surface = 'website') => lintHtml(source, { surface }).findings.map(f => f.rule);

test('the accepted breakpoints come from the shipped Marketing sections', () => {
  assert.deepEqual(MARKETING_MIN_WIDTHS, [768, 992]);
  const shipped = new Set();
  for (const file of readdirSync(new URL('../marketing/', import.meta.url)).filter(f => f.endsWith('.json')))
    for (const width of readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8').matchAll(/@(?:container|media)[^{]*?\(\s*min-width\s*:\s*([0-9.]+)px/g))
      shipped.add(parseFloat(width[1]));
  assert.deepEqual([...shipped].sort((a, b) => a - b), MARKETING_MIN_WIDTHS);
});

test('a shipped marketing breakpoint passes on website and still fails on product', () => {
  const source = '@container aha-features (min-width:992px){ .a{margin:0} }';
  assert.deepEqual(rulesOf(source), []);
  assert.deepEqual(rulesOf('@container aha-numbers (min-width:768px) and (max-width:991px){ .a{margin:0} }'), []);
  assert.deepEqual(rulesOf('@media (min-width:768px){ .a{margin:0} }'), []);
  assert.ok(rulesOf(source, 'product').includes('min-width-trap'));
});

test('an off-scale breakpoint and a fixed min-width fail on website', () => {
  assert.ok(rulesOf('@container aha-features (min-width:1000px){ .a{margin:0} }').includes('min-width-trap'));
  assert.ok(rulesOf('.a{min-width:768px}').includes('min-width-trap'));
  assert.ok(rulesOf('@media (min-width:768px){ .a{min-width:768px} }').includes('min-width-trap'));
});

test('the product rules still apply on website', () => {
  assert.ok(rulesOf('<div style="color:#ff0000">x</div>').includes('raw-hex'));
  assert.ok(rulesOf('<div style="border-radius:7px">x</div>').includes('radius-off-scale'));
});

test('a page has one h1', () => {
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h2>Next</h2>'), []);
  assert.ok(rulesOf('<h1>Title</h1>\n<h1>Again</h1>').includes('multiple-h1'));
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h1>Again</h1> <!-- ds-lint-allow: page (demo of two pages) -->'), []);
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h1>Again</h1>', 'product'), []);
});

test('every image carries alt', () => {
  assert.deepEqual(rulesOf('<img src="a.png" alt="Dashboard">'), []);
  assert.ok(rulesOf('<img src="a.png">').includes('img-no-alt'));
  assert.ok(rulesOf('<img src="a.png" data-alt="Dashboard">').includes('img-no-alt'));
  assert.deepEqual(rulesOf('<img src="a.png">', 'product'), []);
});
