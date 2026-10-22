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

test('the feature card in the image-led grid is stretched, not centred, once it stacks on a phone', () => {
  assert.match(readJson('marketing/cards.json').baseCss, /nth-last-child\(odd\) \.aha-marketing-card\{display:flex;align-items:stretch\}/);
});

const imageMarkup = () => [
  ...readJson('marketing/features.json').layouts.map(layout => [layout.slug, layout.html]),
  ...readJson('marketing/cards.json').snippets.map(snippet => [snippet.slug, snippet.html]),
];

test('a portrait screenshot placeholder is always inside a Vivid Pink frame, never a fill slot', () => {
  for (const [slug, html] of imageMarkup()) {
    for (const part of html.split(/<!-- next -->|<li class="aha-features__row">/)) {
      if (!part.includes('image-placeholder-tall.svg') || part.includes('alt="Photo placeholder')) continue;
      assert.ok(part.includes('pink-frame'), `${slug}: portrait image not framed`);
      assert.ok(!part.includes('--fill'), `${slug}: portrait image fills its slot`);
    }
  }
});

test('the portrait examples exist in Features and Cards', () => {
  assert.ok(readJson('marketing/features.json').layouts.some(layout => layout.slug === 'alternating-portrait-screenshots'));
  assert.ok(readJson('marketing/cards.json').snippets.some(snippet => snippet.slug === 'portrait-row'));
});

test('a photo placeholder always fills its slot and never takes the Vivid Pink frame', () => {
  for (const [slug, html] of imageMarkup()) {
    for (const part of html.split(/<!-- next -->|<li class="aha-features__row">/)) {
      if (!part.includes('alt="Photo placeholder')) continue;
      assert.ok(part.includes('--fill'), `${slug}: photo does not fill its slot`);
      assert.ok(!part.includes('pink-frame'), `${slug}: photo is inside the Vivid Pink frame`);
    }
  }
});

test('a fill slot with a ratio modifier keeps that ratio and crops to it, and without one keeps its own ratio', () => {
  const features = readJson('marketing/features.json').baseCss;
  const cards = readJson('marketing/cards.json').baseCss;
  assert.ok(features.includes('.aha-features__photo--fill img{height:auto;object-fit:fill}'));
  assert.match(features, /\.aha-features__photo--fill:is\(\.aha-features__photo--4x3,\.aha-features__photo--3x4\) img\{height:100%;object-fit:cover\}/);
  assert.ok(cards.includes('.aha-marketing-card__media--fill img{height:auto;object-fit:fill}'));
  assert.match(cards, /\.aha-marketing-card__media--fill:is\(\.aha-marketing-card__media--16x9,\.aha-marketing-card__media--3x2\) img\{height:100%;object-fit:cover\}/);
});

test('the photo examples exist in Features and Cards', () => {
  assert.ok(readJson('marketing/features.json').layouts.some(layout => layout.slug === 'alternating-photos'));
  assert.ok(readJson('marketing/cards.json').snippets.some(snippet => snippet.slug === 'photo-row'));
});
