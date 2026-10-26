import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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

const runCarousel = ({ slides, perView, motionOff = false }) => {
  const slideWidth = 100;
  const listeners = (target) => { target.handlers = {}; target.addEventListener = (type, handler) => { target.handlers[type] = handler; }; return target; };
  const items = Array.from({ length: slides }, (_, position) => ({ offsetLeft: position * slideWidth }));
  const dots = Array.from({ length: slides }, () => listeners({ hidden: false, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }));
  const scrolls = [];
  const track = listeners({
    scrollLeft: 0, scrollWidth: slides * slideWidth, clientWidth: perView * slideWidth,
    scrollTo({ left, behavior }) { this.scrollLeft = Math.min(left, this.scrollWidth - this.clientWidth); scrolls.push(behavior); this.handlers.scroll(); },
  });
  const prev = listeners({});
  const next = listeners({});
  const gallery = {
    getAttribute: () => 'carousel', hasAttribute: () => false, setAttribute() {},
    closest: () => (motionOff ? {} : null),
    querySelector: (selector) => ({ '[data-aha-gallery-track]': track, '[data-aha-gallery-prev]': prev, '[data-aha-gallery-next]': next })[selector],
    querySelectorAll: (selector) => ({ '[data-aha-gallery-item]': items, '[data-aha-gallery-dot]': dots })[selector],
  };
  const context = {
    document: { readyState: 'complete', documentElement: { matches: () => false }, querySelectorAll: (selector) => (selector.includes('data-aha-gallery') ? [gallery] : []) },
    window: {}, matchMedia: () => ({ matches: false }), requestAnimationFrame: (callback) => callback(),
  };
  runInNewContext(script, context);
  const current = () => dots.findIndex((dot) => dot.attributes['aria-current'] === 'true');
  return { track, prev, next, dots, scrolls, current };
};

test('carousel: Prev and Next step through every reachable position and wrap, and unreachable dots are hidden', () => {
  const carousel = runCarousel({ slides: 6, perView: 3 });
  assert.deepEqual(carousel.dots.map((dot) => dot.hidden), [false, false, false, false, true, true]);
  const visited = [];
  for (let step = 0; step < 4; step += 1) { carousel.next.handlers.click(); visited.push(carousel.track.scrollLeft); }
  assert.deepEqual(visited, [100, 200, 300, 0]);
  carousel.prev.handlers.click();
  assert.equal(carousel.track.scrollLeft, 300);
  assert.equal(carousel.current(), 3);
  carousel.prev.handlers.click();
  assert.equal(carousel.track.scrollLeft, 200);
  carousel.dots[3].handlers.click();
  assert.equal(carousel.current(), 3);
});

test('carousel: with motion off the track jumps instead of smooth scrolling', () => {
  const carousel = runCarousel({ slides: 6, perView: 1, motionOff: true });
  carousel.next.handlers.click();
  assert.deepEqual(carousel.scrolls, ['instant']);
  const track = gallery.layouts.find((layout) => layout.slug === 'carousel').css;
  assert.match(gallery.baseCss + track, /:where\(\[data-aha-motion="off"\]\) \.aha-gallery__track\{scroll-behavior:auto\}/);
});

test('marquee: hovering or focusing the Play button does not hold the loop paused', () => {
  for (const layout of layouts.filter((item) => item.css.includes('@keyframes'))) {
    assert.doesNotMatch(layout.css, /__marquee:(?:hover|focus-within) /, layout.slug);
    assert.match(layout.css, /__marquee-(?:row|track):hover/, layout.slug);
  }
});
