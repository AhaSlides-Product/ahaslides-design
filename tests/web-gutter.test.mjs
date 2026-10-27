import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const readSection = (slug) => JSON.parse(readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8'));

function parseRules(css) {
  const text = css.replace(/\/\*[^]*?\*\//g, '');
  const rules = [];
  const walk = (source, condition) => {
    let index = 0;
    while (index < source.length) {
      const open = source.indexOf('{', index);
      if (open < 0) break;
      const prelude = source.slice(index, open).trim();
      let depth = 1;
      let close = open + 1;
      while (depth > 0 && close < source.length) {
        if (source[close] === '{') depth += 1;
        else if (source[close] === '}') depth -= 1;
        close += 1;
      }
      const body = source.slice(open + 1, close - 1);
      if (prelude.startsWith('@container')) walk(body, [...condition, prelude]);
      else if (prelude.startsWith('@')) { /* @media, @keyframes: viewport based or not a layout rule */ }
      else rules.push({ condition, selectors: prelude.split(',').map((selector) => selector.trim()), declarations: body.split(';').map((entry) => entry.trim()).filter(Boolean).map((entry) => [entry.slice(0, entry.indexOf(':')).trim(), entry.slice(entry.indexOf(':') + 1).trim()]) });
      index = close;
    }
  };
  walk(text, []);
  return rules;
}

function matchesWidth(conditions, width) {
  return conditions.every((condition) => {
    const clauses = [...condition.matchAll(/\(\s*(min|max)-width\s*:\s*(\d+)px\s*\)/g)];
    return clauses.every(([, kind, pixels]) => (kind === 'min' ? width >= Number(pixels) : width <= Number(pixels)));
  });
}

const spaceValue = (token, gutter) => {
  const gutterMatch = token.match(/^var\(--aha-web-gutter\)$/);
  if (gutterMatch) return gutter;
  const spaceMatch = token.match(/^var\(--aha-space-(\d+)\)$/);
  return spaceMatch ? Number(spaceMatch[1]) : token;
};

function computed(rules, selector, width, inheritedGutter) {
  const result = {};
  let gutter = inheritedGutter;
  for (const rule of rules) {
    if (!rule.selectors.includes(selector) || !matchesWidth(rule.condition, width)) continue;
    for (const [property, value] of rule.declarations) {
      if (property === '--aha-web-gutter') gutter = spaceValue(value, gutter);
      else result[property] = value;
    }
  }
  return { result, gutter };
}

function sidePadding(rules, selector, width, inheritedGutter) {
  const { result, gutter } = computed(rules, selector, width, inheritedGutter);
  const sides = { left: undefined, right: undefined };
  for (const rule of rules) {
    if (!rule.selectors.includes(selector) || !matchesWidth(rule.condition, width)) continue;
    for (const [property, value] of rule.declarations) {
      const parts = value.split(/\s+(?![^(]*\))/);
      if (property === 'padding') {
        sides.right = parts[1] ?? parts[0];
        sides.left = parts[3] ?? parts[1] ?? parts[0];
      } else if (property === 'padding-inline') sides.left = sides.right = parts[0];
      else if (property === 'padding-left') sides.left = value;
      else if (property === 'padding-right') sides.right = value;
    }
  }
  void result;
  return { left: spaceValue(sides.left ?? '', gutter), right: spaceValue(sides.right ?? '', gutter), gutter };
}

const expectedGutter = (width) => (width <= 479 ? 16 : width <= 767 ? 24 : 64);
const MOBILE_WIDTHS = [375, 600];

const sections = [];
const addSection = (name, cssList, selector, options = {}) => {
  for (const css of cssList) sections.push({ name, rules: parseRules(css), selector, ...options });
};

const withLayouts = (slug) => {
  const section = readSection(slug);
  return section.layouts.map((layout) => (section.baseCss ?? '') + (layout.css ?? ''));
};

for (const slug of ['features', 'numbers', 'pricing']) addSection(slug, withLayouts(slug), `.aha-${slug}__inner`);
addSection('testimonials', withLayouts('testimonials'), '.aha-testimonials__inner');
addSection('slider', withLayouts('slider'), '.aha-slider__inner');
addSection('cards', [readSection('cards').baseCss], '.aha-marketing-cards__grid');
addSection('faq', [readSection('faq').css], '.aha-faq__inner');
const footerBanner = readSection('footer-banner').css;
addSection('footer banner', [footerBanner], '.aha-footer-banner__inner');
addSection('footer banner card', [footerBanner], '.aha-footer-banner__card', { gutterFrom: '.aha-footer-banner__inner' });
const footer = readSection('footer').css;
for (const part of ['inner', 'band', 'copyright']) addSection(`footer ${part}`, [footer], `.aha-footer__${part}`, { ownGutter: true });
const navigation = readSection('navigation').layouts[0].css;
addSection('navigation bar', [navigation], '.aha-header__nav');
addSection('navigation menu', [navigation], '.aha-header__menu', { gutterFrom: '.aha-header__nav' });
for (const layout of readSection('header').layouts) addSection(layout.slug, [layout.css], `.${layout.class}__inner`);

test('every Marketing section other than the edge to edge Logos marquee is checked against the gutter', () => {
  const checked = new Set(['features', 'numbers', 'pricing', 'testimonials', 'cards', 'faq', 'footer-banner', 'footer', 'navigation', 'header', 'slider']);
  const slugs = readdirSync(new URL('../marketing/', import.meta.url)).filter((file) => file.endsWith('.json')).map((file) => file.replace('.json', ''));
  assert.deepEqual(slugs.filter((slug) => !checked.has(slug)), ['logos']);
});

for (const width of MOBILE_WIDTHS) {
  test(`at ${width} px container width every section's side padding is the gutter of ${expectedGutter(width)} px`, () => {
    assert.ok(sections.length >= 40, 'the section list is not empty');
    for (const section of sections) {
      let inherited = 64;
      if (section.gutterFrom) inherited = computed(section.rules, section.gutterFrom, width, 64).gutter;
      const padding = sidePadding(section.rules, section.selector, width, inherited);
      const label = `${section.name} ${section.selector}`;
      assert.equal(padding.left, expectedGutter(width), `${label} left`);
      assert.equal(padding.right, expectedGutter(width), `${label} right`);
      if (!section.gutterFrom && !section.ownGutter) assert.equal(padding.gutter, expectedGutter(width), `${label} --aha-web-gutter`);
    }
  });
}

test('the gutter is 64 px on desktop for the sections that read it there', () => {
  const reading = sections.filter((section) => ['features', 'numbers', 'pricing', 'testimonials', 'faq', 'footer banner'].includes(section.name));
  assert.ok(reading.length > 0);
  for (const section of reading) assert.equal(sidePadding(section.rules, section.selector, 1440, 64).left, 64, section.selector);
});

const valueAt = (css, selector, property, width) => {
  let value;
  for (const rule of parseRules(css)) {
    if (!rule.selectors.includes(selector) || !matchesWidth(rule.condition, width)) continue;
    for (const [name, declared] of rule.declarations) if (name === property) value = spaceValue(declared, 0);
  }
  return value;
};

const buttonSpacing = [];
const closeCalls = (slug) => withLayouts(slug).map((css) => ({ css }));
for (const slug of ['features', 'numbers']) {
  for (const { css } of closeCalls(slug)) {
    buttonSpacing.push([css, `.aha-${slug}__actions`, 'margin-top', 32, 24]);
    buttonSpacing.push([css, `.aha-${slug}__cta`, 'margin-top', 48, 32]);
  }
}
for (const { css } of closeCalls('testimonials')) buttonSpacing.push([css, '.aha-testimonials__cta', 'margin-top', 48, 32]);
buttonSpacing.push([readSection('faq').css, '.aha-faq__cta', 'margin-top', 48, 32]);
buttonSpacing.push([footerBanner, '.aha-footer-banner__text', 'margin-bottom', 32, 24]);
for (const layout of readSection('header').layouts) {
  const { class: name, slug, css } = layout;
  if (slug === 'hero-split-form') continue;
  if (slug.startsWith('hero-')) {
    buttonSpacing.push([css, `.${name}__actions`, 'margin-top', 32, 24]);
    buttonSpacing.push([css, `.${name}__form`, 'margin-top', 32, 24]);
  } else {
    buttonSpacing.push([css, `.${name}__body`, 'gap', 32, 24]);
    buttonSpacing.push([css, `.${name}--space-between .${name}__body`, 'gap', 32, 24]);
  }
}

test('a button sits 32 px under its own text and a closing call to action 48 px under its list, 24 and 32 px at 479 px and below', () => {
  assert.ok(buttonSpacing.length > 40);
  for (const [css, selector, property, wide, narrow] of buttonSpacing) {
    const desktop = valueAt(css, selector, property, 1440);
    const tablet = valueAt(css, selector, property, 600);
    if (!selector.includes('--space-between')) assert.equal(desktop, wide, `${selector} ${property} at 1440`);
    assert.equal(tablet, wide, `${selector} ${property} at 600`);
    assert.equal(valueAt(css, selector, property, 375), narrow, `${selector} ${property} at 375`);
  }
});
