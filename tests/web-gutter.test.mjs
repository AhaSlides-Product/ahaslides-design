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
addSection('comparison', withLayouts('comparison'), '.aha-comparison__inner');
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
for (const layout of readSection('hero').layouts) addSection(layout.slug, [layout.css], `.${layout.class}__inner`);

test('every Marketing section other than the edge to edge Logos marquee is checked against the gutter', () => {
  const checked = new Set(['features', 'numbers', 'pricing', 'testimonials', 'cards', 'faq', 'footer-banner', 'footer', 'navigation', 'hero', 'comparison']);
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
  const reading = sections.filter((section) => ['features', 'numbers', 'pricing', 'testimonials', 'comparison', 'faq', 'footer banner'].includes(section.name));
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
const closingCalls = [];
const closeCalls = (slug) => withLayouts(slug).map((css) => ({ css }));
for (const slug of ['features', 'numbers']) {
  for (const { css } of closeCalls(slug)) {
    buttonSpacing.push([css, `.aha-${slug}__actions`, 'margin-top', 32, 24]);
    closingCalls.push([css, `.aha-${slug}__cta`]);
  }
}
for (const { css } of closeCalls('testimonials')) closingCalls.push([css, '.aha-testimonials__cta']);
for (const { css } of closeCalls('comparison')) closingCalls.push([css, '.aha-comparison__cta']);
closingCalls.push([readSection('faq').css, '.aha-faq__cta']);
buttonSpacing.push([footerBanner, '.aha-footer-banner__text', 'margin-bottom', 32, 24]);
for (const layout of readSection('hero').layouts) {
  const { class: name, slug, css } = layout;
  if (slug === 'hero-split-form') continue;
  if (slug.startsWith('gallery-')) closingCalls.push([css, `.${name}__cta`]);
  else if (slug.startsWith('hero-')) {
    buttonSpacing.push([css, `.${name}__actions`, 'margin-top', 32, 24]);
    buttonSpacing.push([css, `.${name}__form`, 'margin-top', 32, 24]);
  } else {
    buttonSpacing.push([css, `.${name}__body`, 'gap', 32, 24]);
    buttonSpacing.push([css, `.${name}--space-between .${name}__body`, 'gap', 32, 24]);
  }
}

test('a button sits 32 px under its own text, 24 px at 479 px and below', () => {
  assert.ok(buttonSpacing.length > 20);
  for (const [css, selector, property, wide, narrow] of buttonSpacing) {
    const desktop = valueAt(css, selector, property, 1440);
    const tablet = valueAt(css, selector, property, 600);
    if (!selector.includes('--space-between')) assert.equal(desktop, wide, `${selector} ${property} at 1440`);
    assert.equal(tablet, wide, `${selector} ${property} at 600`);
    assert.equal(valueAt(css, selector, property, 375), narrow, `${selector} ${property} at 375`);
  }
});

const SECTION_LEVEL = /^var\(--aha-section-space-(block|header|group|item)\)$/;

test('a closing call to action sits one Group under its list at every width, with no override of its own', () => {
  assert.ok(closingCalls.length > 10);
  for (const [css, selector] of closingCalls) {
    for (const width of [1440, 900, 600, 375]) assert.equal(valueAt(css, selector, 'margin-top', width), 'var(--aha-section-space-group)', `${selector} margin-top at ${width}`);
  }
});

test('every section pads its top and bottom by the Section level at every width, never a raw space step', () => {
  for (const section of sections.filter((entry) => !entry.gutterFrom && !['navigation bar', 'footer band', 'footer copyright', 'cards'].includes(entry.name))) {
    for (const width of [1440, 900, 600, 375]) {
      const { result } = computed(section.rules, section.selector, width, 64);
      const top = result['padding-top'] ?? result['padding-block'] ?? (result.padding ?? '').split(/\s+(?![^(]*\))/)[0];
      assert.match(top, SECTION_LEVEL, `${section.name} ${section.selector} padding-top at ${width}`);
    }
  }
});

test('two neighbouring sections on one surface show one Section space: the token layer drops the second one\'s top padding', () => {
  const tokens = readFileSync(new URL('../lib/tokens.css', import.meta.url), 'utf8');
  const adjacency = tokens.split('\n').filter((line) => line.startsWith(':is(') && line.endsWith('>[class*="__inner"]{padding-top:0}'));
  const direct = adjacency.filter((line) => !line.includes(')+script+:is('));
  assert.equal(direct.length, 3, 'one rule each for White, Accent and Vivid Pink');
  assert.deepEqual(adjacency.filter((line) => line.includes(')+script+:is(')), direct.map((line) => line.replace(')+:is(', ')+script+:is(')), 'a snippet\'s trailing init script between two sections still collapses the gap');
  const [white, accent, brand] = direct.map((line) => line.slice(0, line.indexOf('>[class')).split(')+:is('));
  for (const root of ['aha-numbers', 'aha-features', 'aha-testimonials', 'aha-faq', 'aha-footer-banner', 'aha-pricing', 'aha-comparison', 'aha-logos', 'aha-header-section-hero-split']) {
    assert.match(white[0], new RegExp(`\\.${root}[:,).]`), `${root} counts as the section before`);
  }
  for (const root of ['aha-numbers', 'aha-features', 'aha-testimonials', 'aha-faq', 'aha-footer-banner', 'aha-pricing', 'aha-comparison', 'aha-header-section-hero-split']) {
    assert.match(white[1], new RegExp(`\\.${root}[:,)]`), `${root} drops its top padding after a White section`);
  }
  assert.doesNotMatch(white[1], /\.aha-logos[:,)]/, 'Logos joins the section above through its own rule');
  assert.match(white[0], /\.aha-numbers:not\(\.aha-numbers--accent,\.aha-numbers--brand\)/, 'a Vivid Pink Numbers layout is not White');
  assert.match(brand[0], /\.aha-numbers--brand/);
  assert.match(white[0], /\.aha-header-section-page-header:not\([^)]*\)\.aha-header-section-page-header--no-tabs/, 'a Page header ending on its tab rule keeps the next section\'s top padding');
  assert.match(accent[1], /\.aha-features--accent/);
  assert.match(brand[1], /\.aha-header-section-hero-split--brand/);
  assert.doesNotMatch(white[1], /\.aha-footer[:,)]/, 'the Footer keeps its top padding below its divider');
  assert.doesNotMatch(white[0] + white[1], /\.aha-header[:,)]/, 'the Navigation is not a section');
  const logos = tokens.split('\n').filter((line) => line.startsWith(':is(') && line.includes(')+:is(') && line.endsWith('>:first-child{margin-top:calc(var(--aha-section-space-group) - var(--aha-section-space-block));padding-top:0}'));
  assert.equal(logos.length, 3, 'Logos pulls up to one Group after a section on its own surface: White, Accent or Vivid Pink');
  const [whiteLogos, accentLogos, brandLogos] = logos.map((line) => line.split(')+:is(')[1]);
  assert.match(whiteLogos, /^\.aha-logos:not\(\.aha-logos--accent,\.aha-logos--brand\)\)/);
  assert.match(accentLogos, /^\.aha-logos--accent\)/);
  assert.match(brandLogos, /^\.aha-logos--brand\)/);
  assert.match(logos[2].split(')+:is(')[0], /\.aha-header-section-page-header--brand\.aha-header-section-page-header--no-tabs/, 'a Vivid Pink Page header with no tabs takes the Vivid Pink Logos as its last group');
  const logosAfterScript = tokens.split('\n').filter((line) => line.includes(')+script+:is(.aha-logos') && line.endsWith('>:first-child{margin-top:calc(var(--aha-section-space-group) - var(--aha-section-space-block));padding-top:0}'));
  assert.deepEqual(logosAfterScript, logos.map((line) => line.replace(')+:is(', ')+script+:is(')), 'a snippet\'s trailing init script between the section and Logos still pulls Logos up');
});

test('DSN-992: a Vivid Pink Logos strip nested in any Vivid Pink hero drops its fill and pulls up one Group, except under page-header tabs', () => {
  const tokens = readFileSync(new URL('../lib/tokens.css', import.meta.url), 'utf8');
  const fill = tokens.split('\n').find((line) => line.endsWith('>.aha-logos--brand{background:none;box-shadow:none}'));
  const pullUp = tokens.split('\n').find((line) => line.endsWith('>.aha-logos--brand>:first-child{margin-top:calc(var(--aha-section-space-group) - var(--aha-section-space-block));padding-top:0}') && !line.includes('+'));
  assert.ok(fill && pullUp);
  const heroes = readdirSync(new URL('../marketing/', import.meta.url))
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => [...readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8').matchAll(/\.(aha-header-section-[a-z0-9-]+)--brand\b/g)].map((match) => match[1]));
  for (const root of new Set(heroes)) {
    assert.ok(fill.includes(`.${root}--brand`), root);
    assert.ok(pullUp.includes(`.${root}--brand`), root);
  }
  assert.ok(pullUp.includes('.aha-header-section-page-header--brand.aha-header-section-page-header--no-tabs'));
  assert.ok(!/\.aha-header-section-page-header--brand[,)]/.test(pullUp));
});
