import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const recipe = readJson('brand/colour-rules.json').splash.cssRecipe;
const renamed = (selector) => recipe.map(line => line.replace('.splash', selector)).join('\n');
const featuresCss = readJson('marketing/data/shared-css.json')['aha-features'];
const featureLayouts = () => ['header', 'cards'].flatMap(slug => readJson(`marketing/${slug}.json`).layouts.filter(layout => layout.sharedCss === 'aha-features'));

test('the Vivid Pink frame in the feature sections uses the Background library Splash recipe verbatim', () => {
  assert.ok(featuresCss.includes(renamed('.aha-features__splash')));
});

test('the Vivid Pink frame in Cards uses the Background library Splash recipe verbatim', () => {
  assert.ok(readJson('marketing/cards.json').baseCss.includes(renamed('.aha-marketing-card__splash')));
});

test('cards inside a section are transparent and keep no padding or cap of their own', () => {
  const cards = readJson('marketing/cards.json').baseCss;
  assert.match(cards, /\.aha-marketing-cards\{[^}]*background:transparent/);
  assert.ok(featuresCss.includes('.aha-features .aha-marketing-cards__grid{max-width:none;padding:0}'));
});

test('the image-led grid collapses to one column on the viewport, not the container', () => {
  const css = readJson('marketing/cards.json').baseCss;
  assert.match(css, /@media \(max-width:767px\)\{\s*\.aha-marketing-cards__grid--image-led\{grid-template-columns:minmax\(0,1fr\)/);
});

test('the feature card in the image-led grid is stretched, not centred, once it stacks on a phone', () => {
  assert.match(readJson('marketing/cards.json').baseCss, /nth-last-child\(odd\) \.aha-marketing-card\{display:flex;align-items:stretch\}/);
});

const imageMarkup = () => [
  ...featureLayouts().map(layout => [layout.slug, layout.html]),
  ...readJson('marketing/cards.json').snippets.map(snippet => [snippet.slug, snippet.html]),
];

test('a portrait placeholder is always inside a Vivid Pink frame, never a fill slot', () => {
  for (const [slug, html] of imageMarkup()) {
    for (const part of html.split(/<!-- next -->|<li class="aha-features__row">/)) {
      if (!part.includes('image-placeholder-tall.svg')) continue;
      assert.ok(part.includes('pink-frame'), `${slug}: portrait image not framed`);
      assert.ok(!part.includes('--fill'), `${slug}: portrait image fills its slot`);
    }
  }
});

test('the portrait examples exist in the feature sections and Cards', () => {
  assert.ok(featureLayouts().some(layout => layout.slug === 'alternating-portrait-screenshots'));
  assert.ok(readJson('marketing/cards.json').snippets.some(snippet => snippet.slug === 'portrait-row'));
});
