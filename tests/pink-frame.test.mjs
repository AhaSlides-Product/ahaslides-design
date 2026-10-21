import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const recipe = readJson('brand/colour-rules.json').splash.cssRecipe;
const renamed = (selector) => recipe.map(line => line.replace('.splash', selector)).join('\n');

test('the Vivid Pink frame in Features uses the Background library Splash recipe verbatim', () => {
  assert.ok(readJson('marketing/features.json').baseCss.includes(renamed('.aha-features__splash')));
});

test('the Vivid Pink frame in Cards uses the Background library Splash recipe verbatim', () => {
  assert.ok(readJson('marketing/cards.json').baseCss.includes(renamed('.aha-marketing-card__splash')));
});

test('cards inside a section are transparent and keep no padding or cap of their own', () => {
  const cards = readJson('marketing/cards.json').baseCss;
  const features = readJson('marketing/features.json').baseCss;
  assert.match(cards, /\.aha-marketing-cards\{[^}]*background:transparent/);
  assert.ok(features.includes('.aha-features .aha-marketing-cards__grid{max-width:none;padding:0}'));
});

test('the image-led grid collapses to one column on the viewport, not the container', () => {
  const css = readJson('marketing/cards.json').baseCss;
  assert.match(css, /@media \(max-width:767px\)\{\s*\.aha-marketing-cards__grid--image-led\{grid-template-columns:minmax\(0,1fr\)/);
});
