import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => JSON.parse(readFileSync(new URL(`../marketing/${path}`, import.meta.url), 'utf8'));
const buttonTags = (html) => html.match(/<aha-button\b[^>]*>/g) || [];

test('every button in a Hero layout with a Vivid Pink state carries the brand surface hook', () => {
  const branded = read('hero.json').layouts.filter((layout) => (layout.states || []).some((state) => state.modifier === 'brand'));
  assert.ok(branded.length >= 9);
  for (const layout of branded) {
    for (const tag of buttonTags(layout.html)) assert.match(tag, /\sdata-surface-brand="brand"/, `${layout.slug}: ${tag}`);
  }
});

test('Hero layouts without a Vivid Pink state set no brand surface', () => {
  for (const layout of read('hero.json').layouts.filter((candidate) => !(candidate.states || []).some((state) => state.modifier === 'brand'))) {
    assert.doesNotMatch(layout.html, /data-surface-brand/, layout.slug);
  }
});

test('the Footer banner button sits on Vivid Pink with surface="brand"', () => {
  const tags = buttonTags(read('footer-banner.json').html);
  assert.ok(tags.length > 0);
  for (const tag of tags) assert.match(tag, /\ssurface="brand"/);
});
