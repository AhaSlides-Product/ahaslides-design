import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

const guideline = readJson('guidelines/website.json');
const criteria = readJson('anti-slop/criteria.json').surfaces.website.criteria;
const agentCriteria = readJson('agent/anti-slop/criteria.json').surfaces.website.criteria;
const evals = readJson('anti-slop/evals/website/evals.json').evals;
const cardsCss = readJson('marketing/cards.json').baseCss;
const numbersCss = readJson('marketing/numbers.json').baseCss;
const features = readJson('marketing/features.json');
const featuresCss = features.baseCss;
const testimonialsCss = readJson('marketing/testimonials.json').baseCss;
const pricingCss = readJson('marketing/pricing.json').baseCss;
const faqCss = readJson('marketing/faq.json').css;
const footerBannerCss = readJson('marketing/footer-banner.json').css;
const cardSnippetsCss = readJson('marketing/cards.json').snippets.map((snippet) => snippet.css ?? '').join('\n');
const alternatingRowCss = features.layouts.find((layout) => layout.slug === 'alternating-screenshots').css;

for (const id of ['W9', 'W11', 'W12', 'W13', 'W14', 'W15', 'W17', 'W18', 'W19']) {
  test(`${id} has a guideline rule, a criterion, a synced copy and a failing eval`, () => {
    assert.ok(guideline.rules.some((rule) => rule.ref.includes(id)), 'guideline rule');
    assert.ok(criteria.some((criterion) => criterion.id === id), 'criterion');
    assert.ok(agentCriteria.some((criterion) => criterion.id === id), 'plugin copy of the criterion');
    const failing = evals.find((entry) => entry.expected.criteria[id] === 'FAIL');
    assert.ok(failing, 'eval that fails it');
    assert.ok(existsSync(new URL(`../anti-slop/evals/website/${failing.files[0].path}`, import.meta.url)), 'fixture exists');
    for (const control of evals.filter((entry) => entry.label === 'good-control')) {
      assert.equal(control.expected.criteria[id], 'PASS');
    }
  });
}

test('W1 puts the Logos strip directly below the hero, and the pass pages do', () => {
  for (const list of [criteria, agentCriteria]) {
    assert.match(list.find((criterion) => criterion.id === 'W1').test, /Logos strip is always the band directly below the hero/);
  }
  const failing = evals.find((entry) => entry.expected.criteria.W1 === 'FAIL' && entry.files[0].path.includes('logos-mid-page'));
  assert.ok(failing, 'eval with Logos placed mid-page');
  const order = (path) => [...readFileSync(new URL(`../anti-slop/evals/website/${path}`, import.meta.url), 'utf8').matchAll(/^<section class="(aha-[a-z-]+)/gm)].map((match) => match[1]);
  for (const entry of evals.filter((item) => item.label === 'good-control')) {
    const sections = order(entry.files[0].path);
    if (sections.includes('aha-logos')) assert.equal(sections.indexOf('aha-logos'), 1);
  }
  assert.notEqual(order(failing.files[0].path).indexOf('aha-logos'), 1);
});

test('templates are a 3 by n grid on desktop and skip count balancing', () => {
  for (const list of [criteria, agentCriteria]) {
    assert.match(list.find((criterion) => criterion.id === 'W10').test, /Templates are the exception[^.]*always 3 columns at 992 px and wider/);
    assert.doesNotMatch(list.find((criterion) => criterion.id === 'W10').test, /\(themes, templates/);
  }
  const balancing = cardsCss.slice(cardsCss.indexOf('(min-width:992px){'), cardsCss.indexOf('(min-width:768px) and (max-width:991px)'));
  assert.ok(balancing.includes(':not(.aha-marketing-cards__grid--templates)'));
  assert.ok(!/\.aha-marketing-cards__grid--templates\{[^}]*grid-template-columns:repeat\(2/.test(cardsCss));
  const failing = evals.find((entry) => entry.expected.criteria.W10 === 'FAIL' && entry.files[0].path.includes('templates-two-columns'));
  assert.ok(failing, 'eval with templates in 2 columns');
  assert.match(readFileSync(new URL(`../anti-slop/evals/website/${failing.files[0].path}`, import.meta.url), 'utf8'), /grid--image-led/);
});

test('W15: every content card link opens in a new tab with noopener and hidden text, calls to action do not', () => {
  const linkClasses = ['aha-marketing-card__link', 'aha-testimonials__link', 'aha-features__more'];
  for (const slug of ['cards', 'testimonials', 'features']) {
    const raw = readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8');
    const links = linkClasses.flatMap((name) => [...raw.matchAll(new RegExp(`<a class=\\\\"${name}\\\\"[^>]*>`, 'g'))].map((match) => match[0]));
    for (const link of links) assert.match(link, /target=\\"_blank\\" rel=\\"noopener\\"/, link);
    assert.doesNotMatch(raw, /(aha-features__button|aha-header-button)[^>]*target=/);
  }
  assert.match(testimonialsCss, /aha-testimonials__visually-hidden/);
  assert.match(featuresCss, /aha-features__visually-hidden/);
  assert.match(cardsCss, /aha-marketing-card__visually-hidden/);
  const failing = evals.find((entry) => entry.expected.criteria.W15 === 'FAIL');
  const page = readFileSync(new URL(`../anti-slop/evals/website/${failing.files[0].path}`, import.meta.url), 'utf8');
  assert.match(page, /aha-marketing-card__link" href="#t">/);
  assert.doesNotMatch(page, /target="_blank"/);
});

test('the Cards grid and the Features icon grid balance by item count', () => {
  for (const css of [cardsCss, featuresCss]) {
    assert.match(css, /:has\(>:first-child:last-child\)\{grid-template-columns:minmax\(0,36rem\)/);
    assert.match(css, /:has\(>:nth-child\(2\):last-child\),[^{]*:has\(>:nth-child\(4\):last-child\)\{grid-template-columns:repeat\(2,/);
    assert.match(css, /:nth-child\(3n\+2\):last-child:nth-child\(n\+5\)\)>:last-child\{grid-column:4 \/ span 2\}/);
    assert.match(css, /:nth-child\(3n\+1\):last-child:nth-child\(n\+7\)\)>:last-child\{grid-column:2\}/);
  }
});

test('the Steps row and the image-led grid keep their own layout', () => {
  assert.match(cardsCss, /\.aha-marketing-cards__grid:not\(\.aha-marketing-cards__grid--image-led\):not\(\.aha-marketing-cards__grid--row\):has/);
});

test('the Numbers centred stats balance by item count', () => {
  assert.match(numbersCss, /\.aha-numbers--centred \.aha-numbers__stats:has\(>:nth-child\(2\):last-child\)\{grid-template-columns:repeat\(2,/);
  assert.match(numbersCss, /\.aha-numbers--centred \.aha-numbers__stats:has\(>:nth-child\(4\):last-child\)\{grid-template-columns:repeat\(2,/);
  assert.match(numbersCss, /:nth-child\(3n\+2\):last-child:nth-child\(n\+5\)\)>:last-child\{grid-column:4 \/ span 2\}/);
});

const topLevelCss = (css) => css.replace(/@[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

function declarations(css, selector) {
  const result = {};
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const match of topLevelCss(css).matchAll(new RegExp(`(?:^|[}\\n])[ \\t]*${escaped}\\{([^}]*)\\}`, 'g'))) {
    for (const part of match[1].split(';')) {
      const colon = part.indexOf(':');
      if (colon > 0) result[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
    }
  }
  return result;
}

const typeOf = (css, selector) => {
  const found = declarations(css, selector);
  assert.ok(Object.keys(found).length, `${selector} has a rule`);
  return { size: found['font-size'], weight: found['font-weight'], family: found['font-family'] };
};

const LEAD = 'clamp(var(--aha-size-l),1.4vw,var(--aha-size-xl))';
const SEMIBOLD = 'var(--aha-weight-semibold)';

test('W14: every item or card title resolves to one token, xl semibold', () => {
  const titles = [
    [cardsCss, '.aha-marketing-card__title'],
    [featuresCss, '.aha-features__item-title'],
    [numbersCss, '.aha-numbers__stat-title'],
    [testimonialsCss, '.aha-testimonials__card-title'],
    [pricingCss, '.aha-pricing__item-title'],
    [faqCss, '.aha-faq__heading'],
    [cardSnippetsCss, '.aha-marketing-card__plan'],
  ];
  for (const [css, selector] of titles) {
    assert.deepEqual(typeOf(css, selector), { size: 'var(--aha-size-xl)', weight: SEMIBOLD, family: undefined }, selector);
  }
  assert.doesNotMatch(cardsCss, /--image-led \.aha-marketing-card__title\{font-size/);
  assert.doesNotMatch(faqCss, /\.aha-faq__heading\{font-size/);
});

test('W14: every body text resolves to size-l', () => {
  const bodies = [
    [cardsCss, '.aha-marketing-card__text'],
    [featuresCss, '.aha-features__item-text'],
    [numbersCss, '.aha-numbers__stat-text'],
    [testimonialsCss, '.aha-testimonials__text'],
    [pricingCss, '.aha-pricing__item-text'],
    [faqCss, '.aha-faq__answer-text'],
  ];
  for (const [css, selector] of bodies) assert.equal(typeOf(css, selector).size, 'var(--aha-size-l)', selector);
});

test('W14: every section h2 shares one size, weight and line-height and the same steps down', () => {
  const headings = [
    [featuresCss, '.aha-features__title', 'aha-features'],
    [numbersCss, '.aha-numbers__title', 'aha-numbers'],
    [pricingCss, '.aha-pricing__title', 'aha-pricing'],
    [testimonialsCss, '.aha-testimonials__title', 'aha-testimonials'],
    [faqCss, '.aha-faq__title', 'aha-faq'],
    [footerBannerCss, '.aha-footer-banner__title', 'aha-footer-banner'],
  ];
  for (const [css, selector, container] of headings) {
    const found = declarations(css, selector);
    assert.equal(found['font-size'], 'var(--aha-size-h2)', selector);
    assert.equal(found['font-weight'], SEMIBOLD, selector);
    assert.equal(found['line-height'], 'var(--aha-line-height-heading)', selector);
    assert.match(css, new RegExp(`@container ${container} \\(max-width:991px\\)\\{[^@]*\\${selector}\\{font-size:var\\(--aha-size-h3\\)\\}`), `${selector} 32 px at 991`);
    assert.match(css, new RegExp(`@container ${container} \\(max-width:479px\\)\\{[^@]*\\${selector}\\{font-size:var\\(--aha-size-h4\\)\\}`), `${selector} 24 px at 479`);
  }
  assert.doesNotMatch(features.layouts.map((layout) => layout.css).join('\n'), /\.aha-features__side \.aha-features__title\{font-size/);
});

test('W14: section leads and quotes share the lead token, regular', () => {
  for (const [css, selector] of [
    [featuresCss, '.aha-features__lead'],
    [numbersCss, '.aha-numbers__lead'],
    [pricingCss, '.aha-pricing__lead'],
    [testimonialsCss, '.aha-testimonials__lead'],
    [footerBannerCss, '.aha-footer-banner__text'],
    [testimonialsCss, '.aha-testimonials__quote'],
    [cardSnippetsCss, '.aha-marketing-card__quote'],
  ]) assert.equal(typeOf(css, selector).size, LEAD, selector);
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__quote')['font-weight'], 'var(--aha-weight-regular)');
  assert.doesNotMatch(testimonialsCss, /\.aha-testimonials__quote--(large|card)\{/);
});

test('W14: the alternating row title is h4 semibold on the product face', () => {
  assert.deepEqual(typeOf(alternatingRowCss, '.aha-features--alternating-screenshots .aha-features__row-title'), { size: 'var(--aha-size-h4)', weight: SEMIBOLD, family: undefined });
});

test('W14: no Marketing section sets the display face; every heading inherits Plus Jakarta Sans', () => {
  const marketing = ['cards', 'features', 'numbers', 'pricing', 'testimonials', 'faq', 'footer-banner', 'header'];
  for (const slug of marketing) {
    assert.doesNotMatch(readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8'), /--aha-font-display/, slug);
  }
  assert.doesNotMatch(readFileSync(new URL('../anti-slop/evals/website/fixtures/sections.css', import.meta.url), 'utf8'), /--aha-font-display/);
});

const marketingFile = (slug) => readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8');
const sectionPage = (name) => readFileSync(new URL(`../anti-slop/evals/website/fixtures/${name}/Page.html`, import.meta.url), 'utf8');

test('W17: the FAQ title centres itself and symmetric headers carry the centre class', () => {
  assert.match(declarations(faqCss, '.aha-faq__title')['text-align'] ?? '', /^center$/);
  const centred = ['alternating-screenshots', 'icon-grid', 'icon-cards', 'tabs-screenshots'];
  for (const slug of centred) {
    assert.match(features.layouts.find((layout) => layout.slug === slug).html, /aha-features__header aha-features__header--center/, slug);
  }
  assert.match(sectionPage('fail-w17-heading-alignment'), /\.aha-faq__title\{justify-content:flex-start;text-align:left\}/);
});

test('W18: every content section ships one call to action, aligned with its heading', () => {
  for (const slug of ['alternating-screenshots', 'icon-grid', 'tabs-screenshots']) {
    assert.match(features.layouts.find((layout) => layout.slug === slug).html, /<div class="aha-features__cta"><a class="aha-features__button" href="#sign-up">Sign up<\/a><\/div>/, slug);
  }
  assert.match(readJson('marketing/faq.json').html, /aha-faq__cta"><a class="aha-faq__button aha-faq__button--ghost" href="#docs">Read the docs/);
  assert.match(featuresCss, /\.aha-features__cta\{display:flex;flex-wrap:wrap;justify-content:center/);
  assert.match(numbersCss, /\.aha-numbers__cta\{display:flex;flex-wrap:wrap;justify-content:center/);
  assert.match(testimonialsCss, /\.aha-testimonials__cta--start\{justify-content:flex-start\}/);
  for (const slug of ['faq', 'features', 'numbers', 'testimonials']) {
    assert.doesNotMatch(marketingFile(slug), /href=\\"#(sign-up|case-studies|docs)\\"[^>]*target=/, slug);
  }
  assert.doesNotMatch(sectionPage('fail-w18-missing-section-cta'), /aha-faq__cta/);
});

test('W19: testimonial authors are left aligned and share a baseline through subgrid', () => {
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__person')['text-align'], 'left');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__person-text')['align-items'], 'flex-start');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__quote')['text-align'], 'left');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__card--quote')['grid-template-rows'], 'subgrid');
});

test('W9: the motion script reveals with a stagger, drifts photos, counts numbers up and honours reduced motion', () => {
  const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
  assert.match(script, /STAGGER_MILLISECONDS = 80/);
  assert.match(script, /PARALLAX_RANGE_PIXELS = 48/);
  assert.match(script, /--aha-motion-viz-enter/);
  assert.match(script, /--aha-ease-out/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /data-aha-motion="off"/);
  assert.match(script, /aha-numbers__value/);
  const packageJson = readJson('package.json');
  assert.equal(packageJson.exports['./marketing-motion'], './lib/marketing-motion.js');
  assert.ok(packageJson.sideEffects.includes('./lib/marketing-motion.js'));
  for (const entry of evals.filter((item) => item.label === 'good-control')) {
    assert.match(sectionPage(entry.files[0].path.split('/')[1]), /lib\/marketing-motion\.js/);
  }
});

test('W9: the motion script imports as a no-op outside a browser and keeps the final number for screen readers and print', async () => {
  await import('../lib/marketing-motion.js');
  const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
  assert.match(script, /typeof document !== 'undefined'/);
  assert.match(script, /aha-motion-final/);
  assert.match(script, /@media print\{[^]*\.aha-motion-count\{display:none\}/);
});
