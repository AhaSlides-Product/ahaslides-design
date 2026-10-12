import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchIcons, iconSearchDeclaration, checkIconSearchDeclaration } from '../icon-search.mjs';
import { DUPLICATE_THRESHOLD, readGlyphSources, rasteriseAll, rasteriseIcon, similarity, isVariantPair, nearDuplicatePairs, evaluateDuplicateGate, pairKey } from '../icon-similarity.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(readFileSync(join(root, 'icons', 'registry.json'), 'utf8')).icons;
const drawings = rasteriseAll(readGlyphSources(root));
const topNames = (query, count = 3) => searchIcons(registry, query, count).map(result => result.name);

test('icon search finds a glyph by meaning, not only by name', () => {
  assert.ok(topNames('help').includes('system-question'), topNames('help').join(', '));
  assert.equal(topNames('delete', 1)[0], 'system-trash');
  assert.equal(topNames('log out', 1)[0], 'system-sign-out');
  assert.equal(topNames('settings', 1)[0], 'system-gear');
});

test('icon search folds aliases into their glyph', () => {
  assert.ok(searchIcons(registry, 'medal').every(result => !registry[result.name].aliasOf));
});

test('a filled square covers the half of the grid it sits on', () => {
  const half = rasteriseIcon('<svg viewBox="0 0 16 16" fill="none"><path d="M0 0H8V16H0Z" fill="#4A4A4A"/></svg>');
  const left = half.filter((_, index) => index % 32 < 15).reduce((sum, value) => sum + value, 0);
  const right = half.filter((_, index) => index % 32 > 16).reduce((sum, value) => sum + value, 0);
  assert.ok(left > 400 && right < 1, `left ${left}, right ${right}`);
});

test('every glyph in the library can be drawn', () => {
  assert.deepEqual(Object.keys(drawings).filter(name => !drawings[name]), []);
});

test('system-question and system-question-circle are a near-duplicate pair', () => {
  assert.ok(similarity(drawings['system-question'], drawings['system-question-circle']) >= DUPLICATE_THRESHOLD);
});

test('distinct glyphs are not near-duplicates', () => {
  assert.ok(similarity(drawings['system-bell'], drawings['system-trash']) < 0.5);
  assert.ok(similarity(drawings['system-gear'], drawings['system-question']) < DUPLICATE_THRESHOLD);
});

test('outline and -filled variants are never paired', () => {
  assert.ok(isVariantPair('system-note', 'system-note-filled'));
  assert.ok(isVariantPair('system-crown-badge-fill', 'system-crown-badge-stroke'));
  assert.ok(!isVariantPair('system-question', 'system-question-circle'));
  const pairs = nearDuplicatePairs(drawings).map(entry => entry.pair);
  assert.ok(!pairs.includes(pairKey('system-note', 'system-note-filled')));
});

test('the duplicate gate fails a new pair, a stale entry and a growing baseline', () => {
  const pairs = [{ pair: pairKey('a', 'b'), first: 'a', second: 'b', score: 0.9 }];
  assert.equal(evaluateDuplicateGate({ pairs, baseline: [pairKey('a', 'b')] }).failures.length, 0);
  assert.match(evaluateDuplicateGate({ pairs, baseline: [] }).failures[0], /looks nearly identical/);
  assert.match(evaluateDuplicateGate({ pairs: [], baseline: [pairKey('a', 'b')] }).failures[0], /no longer near-identical/);
  assert.match(evaluateDuplicateGate({ pairs, baseline: [pairKey('a', 'b')], baseBaseline: [] }).failures[0], /may only shrink/);
});

test('the Icon search: line must name every close match of an added glyph', () => {
  const closeMatches = { 'system-help-ring': ['system-question', 'system-info'] };
  const added = ['system-help-ring'];
  assert.equal(checkIconSearchDeclaration({ body: 'no line', addedGlyphs: [], closeMatches: {} }).required, false);
  assert.match(checkIconSearchDeclaration({ body: 'Environment: product', addedGlyphs: added, closeMatches }).problems[0], /needs an "Icon search:" line/);
  assert.match(checkIconSearchDeclaration({ body: 'Icon search: help — system-question is a plain mark', addedGlyphs: added, closeMatches }).problems[0], /system-info/);
  const explained = 'Icon search: help, support.\n`question` reads as a quiz prompt; `system-info` means information.';
  assert.deepEqual(checkIconSearchDeclaration({ body: explained, addedGlyphs: added, closeMatches }).problems, []);
  assert.equal(iconSearchDeclaration('Icon search:\n\nlater text'), null);
});
