import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const readSection = (slug) => JSON.parse(readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8'));
const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
const header = readSection('header');
const galleryLayouts = header.layouts.filter((layout) => layout.slug.startsWith('gallery-'));
const features = readSection('features');
const multiImageHeroes = ['hero-photo-stack', 'hero-bento-collage', 'hero-image-marquee', 'hero-slideshow', 'hero-floating-images'];
const ownCss = (css) => css.slice(css.indexOf('\n', css.indexOf('__visually-hidden{')) + 1);
const layouts = [
  ...header.layouts.filter((layout) => multiImageHeroes.includes(layout.slug)).map((layout) => ({ ...layout, css: ownCss(layout.css) })),
  ...galleryLayouts,
];

test('the five multi-image heroes and five Header gallery layouts ship, and the sticky stack is a Features layout', () => {
  assert.equal(layouts.length, 10);
  assert.deepEqual(galleryLayouts.map((layout) => layout.slug), ['gallery-bento', 'gallery-masonry', 'gallery-carousel', 'gallery-marquee-rows', 'gallery-tabs']);
  assert.ok(features.layouts.some((layout) => layout.slug === 'sticky-stack'));
  assert.equal(header.layouts.some((layout) => layout.slug.includes('sticky')), false);
});

test('each Header gallery layout is scoped to its own class and has White and Accent states', () => {
  for (const layout of galleryLayouts) {
    assert.equal(layout.class, `aha-header-section-${layout.slug}`);
    assert.deepEqual(layout.states.map((state) => state.modifier), ['', 'accent']);
    assert.doesNotMatch(layout.css + layout.html, /(?<!data-)aha-gallery/, layout.slug);
    assert.match(layout.html, new RegExp(`^<section class="${layout.class} `), layout.slug);
    assert.equal((layout.html.match(/<h1\b/g) ?? []).length, 1, layout.slug);
  }
});

test('the Features sticky stack is pure CSS: no script hook and no animation', () => {
  const stack = features.layouts.find((layout) => layout.slug === 'sticky-stack');
  assert.match(stack.css, /position:sticky/);
  assert.doesNotMatch(stack.html, /data-aha-/);
  assert.doesNotMatch(stack.css, /transition|animation/);
  assert.doesNotMatch(stack.css + stack.html, /aha-gallery/);
});

test('each multi-image hero has White, Accent and Vivid Pink states, the Vivid Pink one with the Splash', () => {
  for (const slug of multiImageHeroes) {
    const hero = header.layouts.find((layout) => layout.slug === slug);
    assert.deepEqual(hero.states.map((state) => state.modifier), ['', 'accent', 'brand'], slug);
    assert.match(hero.html, /splash-icon-pink\.svg/, slug);
    assert.match(hero.css, new RegExp(`\\.${hero.class}--brand>\\.${hero.class}__splash\\{display:block`), slug);
  }
});

test('the current slideshow dot changes fill as well as width, on White and on Vivid Pink', () => {
  for (const slug of ['hero-slideshow']) {
    const layout = header.layouts.find((candidate) => candidate.slug === slug);
    const dotTokens = (selector) => {
      const block = layout.css.match(new RegExp(`${selector}\\{(--${layout.class}-dot[^}]*)\\}`))[1];
      return Object.fromEntries(block.split(';').map((declaration) => declaration.split(':')));
    };
    for (const selector of [`\\.${layout.class}`, `\\.${layout.class}--brand`]) {
      const tokens = dotTokens(selector);
      assert.notEqual(tokens[`--${layout.class}-dot`], tokens[`--${layout.class}-dot-current`], `${slug} ${selector}`);
    }
    assert.match(layout.css, /__dot\[aria-current="true"\]::before\{width:var\(--aha-space-28\);background:/, slug);
  }
});

const lightThemeTokens = readFileSync(new URL('../lib/tokens.css', import.meta.url), 'utf8').match(/^:root\{[^}]*\}/m)[0];
const tokenValues = Object.fromEntries([...lightThemeTokens.matchAll(/(--aha-[a-z0-9-]+):\s*([^;}]+)/g)].map((match) => [match[1], match[2].trim()]));
const resolveToken = (value) => {
  const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);
  return reference ? resolveToken(tokenValues[reference[1]]) : value;
};
const relativeLuminance = (channels) => channels.map((channel) => {
  const linear = channel / 255;
  return linear <= 0.03928 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
}).reduce((sum, linear, index) => sum + linear * [0.2126, 0.7152, 0.0722][index], 0);
const parseColour = (colour) => {
  const functional = colour.match(/^rgba?\(([^)]*)\)$/);
  if (functional) {
    const [red, green, blue, alpha = 1] = functional[1].split(',').map(Number);
    return [red, green, blue, alpha];
  }
  const hex = colour.slice(1);
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).concat(hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1);
};
const contrastOnSurface = (tokenReference, surfaceHex) => {
  const surface = parseColour(surfaceHex).slice(0, 3);
  const [red, green, blue, alpha] = parseColour(resolveToken(tokenReference));
  const painted = [red, green, blue].map((channel, index) => channel * alpha + surface[index] * (1 - alpha));
  const [lighter, darker] = [relativeLuminance(painted), relativeLuminance(surface)].sort((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
};

test('every resting and current dot clears 3:1 against its surface, White and Vivid Pink (WCAG 1.4.11)', () => {
  const checks = [];
  for (const slug of ['hero-slideshow']) {
    const layout = header.layouts.find((candidate) => candidate.slug === slug);
    for (const [selector, surface] of [[`.${layout.class}{`, '#FFFFFF'], [`.${layout.class}--brand{`, '#E70E68']]) {
      const block = layout.css.slice(layout.css.indexOf(selector + `--${layout.class}-dot:`));
      for (const role of ['dot', 'dot-current']) checks.push([`${slug} ${selector} ${role}`, block.match(new RegExp(`--${layout.class}-${role}:(var\\([^)]*\\))`))[1], surface]);
    }
  }
  const carousel = galleryLayouts.find((layout) => layout.slug === 'gallery-carousel');
  for (const role of ['dot', 'dot-current']) checks.push([`gallery ${role}`, carousel.css.match(new RegExp(`--${carousel.class}-${role}:(var\\([^)]*\\))`))[1], '#FFFFFF']);
  for (const [label, tokenReference, surface] of checks) {
    assert.ok(contrastOnSurface(tokenReference, surface) >= 3, `${label} ${tokenReference} on ${surface} is ${contrastOnSurface(tokenReference, surface).toFixed(2)}:1`);
  }
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
  const carouselLayout = galleryLayouts.find((layout) => layout.slug === 'gallery-carousel');
  assert.ok(carouselLayout.css.includes(`:where([data-aha-motion="off"]) .${carouselLayout.class}__track{scroll-behavior:auto}`));
});

test('marquee: hovering or focusing the Play button does not hold the loop paused', () => {
  for (const layout of layouts.filter((item) => item.css.includes('@keyframes'))) {
    assert.doesNotMatch(layout.css, /__marquee:(?:hover|focus-within) /, layout.slug);
    assert.match(layout.css, /__marquee-(?:row|track):hover/, layout.slug);
  }
});

test('W6 and W9 allow the multi-image photo treatments and the photo marquee loops, and W1 lists no Gallery section', () => {
  const guideline = JSON.parse(readFileSync(new URL('../guidelines/website.json', import.meta.url), 'utf8'));
  const criteria = JSON.parse(readFileSync(new URL('../anti-slop/criteria.json', import.meta.url), 'utf8')).surfaces.website.criteria;
  const rule = (id) => guideline.rules.find((candidate) => candidate.ref.includes(id)).rule;
  const criterion = (id) => criteria.find((candidate) => candidate.id === id).test;
  assert.doesNotMatch(rule('W1'), /Gallery/);
  assert.doesNotMatch(criterion('W1'), /Gallery/i);
  assert.match(rule('W6'), /photo stack and floating images may tilt a photo/);
  assert.match(criterion('W6'), /cover-cropped photo cells of mixed size or ratio/);
  assert.match(rule('W9'), /Hero image marquee and Gallery marquee rows/);
  assert.match(criterion('W9'), /photo marquees \(the Header's Hero image marquee and Gallery marquee rows\)/);
});

test('Hero image marquee Fit media switch: fixed tile height, own ratio, no crop, and W6 allows it', () => {
  const hero = header.layouts.find((layout) => layout.slug === 'hero-image-marquee');
  const modifier = `${hero.class}--fit-media`;
  const choice = hero.options.flatMap((option) => option.choices).find((candidate) => candidate.value === 'fit-media');
  assert.equal(choice.modifier, true);
  assert.match(hero.css, new RegExp(`\\.${modifier} \\.${hero.class}__marquee\\{--${hero.class}-tile-height:calc\\(var\\(--aha-space-68\\) \\* 4\\)\\}`));
  assert.match(hero.css, new RegExp(`\\.${modifier} \\.${hero.class}__marquee-image\\{width:auto;height:var\\(--${hero.class}-tile-height\\);aspect-ratio:auto;object-fit:contain\\}`));
  assert.match(hero.css, new RegExp(`max-width:479px\\)\\{\\s*\\.${modifier} \\.${hero.class}__marquee\\{--${hero.class}-tile-height:calc\\(var\\(--aha-space-100\\) \\* 2\\)\\}`));
  assert.doesNotMatch(hero.html, new RegExp(modifier));
  const guideline = JSON.parse(readFileSync(new URL('../guidelines/website.json', import.meta.url), 'utf8'));
  const criteria = JSON.parse(readFileSync(new URL('../anti-slop/criteria.json', import.meta.url), 'utf8')).surfaces.website.criteria;
  const agentCriteria = JSON.parse(readFileSync(new URL('../agent/anti-slop/criteria.json', import.meta.url), 'utf8'));
  assert.match(guideline.rules.find((candidate) => candidate.ref.includes('W6')).rule, /Hero image marquee only: with its Fit media switch/);
  assert.match(criteria.find((candidate) => candidate.id === 'W6').test, /aha-header-section-hero-image-marquee--fit-media/);
  assert.deepEqual(agentCriteria, JSON.parse(readFileSync(new URL('../anti-slop/criteria.json', import.meta.url), 'utf8')));
});
