import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readSection = (slug) => JSON.parse(readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8'));
const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
const header = readSection('header');
const gallery = readSection('gallery');
const multiImageHeroes = ['hero-photo-stack', 'hero-bento-collage', 'hero-image-marquee', 'hero-slideshow', 'hero-floating-images'];
const ownCss = (css) => css.slice(css.indexOf('\n', css.indexOf('__visually-hidden{')) + 1);
const layouts = [
  ...header.layouts.filter((layout) => multiImageHeroes.includes(layout.slug)).map((layout) => ({ ...layout, css: ownCss(layout.css) })),
  ...gallery.layouts.map((layout) => ({ ...layout, css: gallery.baseCss + layout.css })),
];

test('the five multi-image heroes and six gallery layouts ship', () => {
  assert.equal(layouts.length, 11);
  assert.deepEqual(gallery.layouts.map((layout) => layout.slug), ['bento', 'masonry', 'carousel', 'stack', 'marquee', 'tabs']);
});

test('W9: every gallery transition and loop is token-timed and stops under reduced motion', () => {
  for (const layout of layouts) {
    if (/(?:transition|animation):/.test(layout.css)) assert.match(layout.css, /@media \(prefers-reduced-motion:reduce\)/, layout.slug);
    assert.doesNotMatch(layout.css, /(?:transition|animation):[^;}]*\b(?:[1-9]\d*(?:\.\d+)?|0?\.\d+)m?s\b/, layout.slug);
    if (layout.css.includes('@keyframes')) {
      assert.match(layout.css, /@media print\{[^]*animation:none/, layout.slug);
      assert.match(layout.css, /:where\(\[data-aha-motion="off"\]\) [^{]+\{animation:none\}/, layout.slug);
    }
  }
});

test('W9: no shipped layout autoplays; a loop always has a Pause button', () => {
  for (const layout of layouts) {
    assert.doesNotMatch(layout.html, /data-aha-autoplay/, layout.slug);
    if (layout.css.includes('@keyframes')) assert.match(layout.html, /<aha-button[^>]*data-aha-gallery-pause/, layout.slug);
  }
});

test('every data-aha-gallery kind in a layout is wired by the motion script', () => {
  for (const layout of layouts) {
    for (const [, kind] of layout.html.matchAll(/data-aha-gallery="([a-z]+)"/g)) {
      assert.match(script, new RegExp(`\\b${kind}: arm`), `${layout.slug} ${kind}`);
    }
  }
  assert.match(script, /SLIDESHOW_INTERVAL_MILLISECONDS = 5000/);
  assert.match(script, /hasAttribute\('data-aha-autoplay'\) \|\| !motionAllowed/);
});

test('W6 and W10: every picture is a real image with alt text and a size, and every dot is a 24 px tap target', () => {
  for (const layout of layouts) {
    for (const [tag] of layout.html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\salt="[^"]*"/, `${layout.slug} ${tag}`);
      assert.match(tag, /\swidth="\d+" height="\d+"/, `${layout.slug} ${tag}`);
    }
    if (layout.html.includes('data-aha-gallery-dot')) assert.match(layout.css, /__dot\{[^}]*min-width:var\(--aha-space-24\);height:var\(--aha-space-24\)/, layout.slug);
  }
});
