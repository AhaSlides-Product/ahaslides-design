import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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

test('W1 puts the Logos strip straight after the hero, and the pass pages do', () => {
  for (const list of [criteria, agentCriteria]) {
    assert.match(list.find((criterion) => criterion.id === 'W1').test, /Logos strip always comes straight after the hero[^;]*hero's last child, with aha-logos--brand/);
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
  const balancing = cardsCss.slice(cardsCss.lastIndexOf('(min-width:992px){'));
  assert.ok(balancing.includes(':not(.aha-marketing-cards__grid--templates)'));
  assert.ok(!/\.aha-marketing-cards__grid--templates\{[^}]*grid-template-columns:repeat\(2/.test(cardsCss));
  const failing = evals.find((entry) => entry.expected.criteria.W10 === 'FAIL' && entry.files[0].path.includes('templates-two-columns'));
  assert.ok(failing, 'eval with templates in 2 columns');
  assert.match(readFileSync(new URL(`../anti-slop/evals/website/${failing.files[0].path}`, import.meta.url), 'utf8'), /grid--image-led/);
});

test('W15: every content card link opens in a new tab with noopener and hidden text, calls to action do not', () => {
  const linkClasses = ['aha-marketing-card__link', 'aha-testimonials__link'];
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

test('W15: section link-out buttons and off-site Footer links open in a new tab, AhaSlides links do not', () => {
  for (const [slug, label] of [['testimonials', 'Read customer stories'], ['faq', 'Read the docs']]) {
    const html = readJson(`marketing/${slug}.json`)[slug === 'faq' ? 'html' : 'layouts'];
    const markup = typeof html === 'string' ? html : html.map((layout) => layout.html).join('');
    assert.match(markup, new RegExp(`target="_blank" rel="noopener">${label}<span class="aha-[a-z]+__visually-hidden"> \\(opens in a new tab\\)`), label);
  }
  const footer = readJson('marketing/footer.json').html;
  for (const anchor of footer.match(/<a [^>]*>/g)) {
    const url = new URL(anchor.match(/href="([^"]+)"/)[1]);
    const leaves = url.protocol === 'https:' && (!/(^|\.)ahaslides\.com$/.test(url.hostname) || ['help.ahaslides.com', 'status.ahaslides.com'].includes(url.hostname));
    assert.equal(/target="_blank" rel="noopener"/.test(anchor), leaves, anchor);
  }
  assert.match(footer, /status\.ahaslides\.com\/" target="_blank" rel="noopener">System status<span class="aha-footer__visually-hidden">/);
});

test('W19: at most three testimonial cards and balanced quote lengths in every shipped layout', () => {
  const quoteLengths = (html) => [...html.matchAll(/<blockquote[^>]*><p>(.*?)<\/p>/g)].map((match) => match[1].length);
  for (const layout of readJson('marketing/testimonials.json').layouts) {
    const cards = (layout.html.match(/<(figure|article)[^>]*class="aha-testimonials__card/g) || []).length;
    assert.ok(cards <= 3, `${layout.slug}: ${cards} cards`);
    const lengths = quoteLengths(layout.html);
    if (lengths.length > 1) assert.ok(Math.max(...lengths) <= 1.5 * Math.min(...lengths), `${layout.slug}: ${lengths}`);
    assert.ok(lengths.every((length) => length <= 160 + 30), `${layout.slug}: ${lengths}`);
  }
});

test('the Cards grid balances by item count and the Features icon grid keeps straight columns', () => {
  for (const css of [cardsCss, featuresCss]) {
    assert.match(css, /:has\(>:first-child:last-child\)\{grid-template-columns:minmax\(0,36rem\)/);
    assert.match(css, /:has\(>:nth-child\(2\):last-child\),[^{]*:has\(>:nth-child\(4\):last-child\)\{grid-template-columns:repeat\(2,/);
  }
  assert.match(cardsCss, /:nth-child\(3n\+2\):last-child:nth-child\(n\+5\)\)>:last-child\{grid-column:4 \/ span 2\}/);
  assert.doesNotMatch(featuresCss, /\.aha-features__grid[^{]*\{[^}]*(repeat\(6,|grid-column:2\}|span 2)/);
});

test('the Steps row and the image-led grid keep their own layout', () => {
  assert.match(cardsCss, /\.aha-marketing-cards__grid:not\(\.aha-marketing-cards__grid--image-led\):not\(\.aha-marketing-cards__grid--row\):not\(\.aha-marketing-cards__grid--templates\):has/);
});

test('three icon cards fill three columns and four steps lay out 2 by 2, leaving no empty column (W11)', () => {
  const iconCards = features.layouts.find((layout) => layout.slug === 'icon-cards').css;
  const cards = '\\.aha-features--icon-cards \\.aha-features__cards';
  assert.match(iconCards, new RegExp(`${cards}:has\\(>:nth-child\\(3\\):last-child\\)\\{grid-template-columns:repeat\\(3,`));
  assert.match(iconCards, new RegExp(`${cards}:has\\(>:nth-child\\(2\\):last-child\\)\\{grid-template-columns:repeat\\(2,`));
  assert.match(iconCards, new RegExp(`${cards}:has\\(>:first-child:last-child\\)\\{grid-template-columns:minmax\\(0,36rem\\)`));
  assert.doesNotMatch(iconCards, new RegExp(`${cards}:has\\(>:nth-child\\(4\\):last-child\\)`), 'four icon cards stay one row of four');
  assert.match(cardsCss, /\.aha-marketing-cards__grid--row:has\(>:nth-child\(4\):last-child\)\{grid-template-columns:repeat\(2,/);
  assert.match(cardsCss, /\.aha-marketing-cards__grid--row:has\(>:nth-child\(3n\+2\):last-child:nth-child\(n\+5\)\)>:last-child\{grid-column:4 \/ span 2\}/);
});

test('the Numbers stats are left aligned by default and Divided drops the divider at a row start (W11)', () => {
  const style = readJson('marketing/numbers.json').layouts.find((layout) => layout.slug === 'centred').options.find((option) => option.label === 'Number style');
  assert.equal(style.choices.find((choice) => choice.default).value, 'left-aligned');
  assert.equal(style.choices.find((choice) => choice.modifier).value, 'divided');
  assert.match(numbersCss, /\.aha-numbers--divided \.aha-numbers__stats:has\(>:nth-child\(2\):last-child\)\{grid-template-columns:repeat\(2,/);
  assert.match(numbersCss, /\.aha-numbers--divided \.aha-numbers__stats:has\(>:nth-child\(5\)\)>:nth-child\(3n\+1\),\.aha-numbers--divided \.aha-numbers__stats:has\(>:nth-child\(4\):last-child\)>:nth-child\(3\)\{border-left:0\}/);
});

const layoutCss = (file, slug) => readJson(`marketing/${file}.json`).layouts.find((layout) => layout.slug === slug).css;
const esc = (selector) => selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containerBlocks = (css) => [...css.matchAll(/@container [\w-]+ \(([^{]+)\)\{\n((?: {2}[^\n]*\n?)*)\}/g)].map(([, query, body]) => ({ query, body }));
const cardsGrid = '.aha-marketing-cards__grid:not(.aha-marketing-cards__grid--image-led):not(.aha-marketing-cards__grid--row):not(.aha-marketing-cards__grid--templates)';
const cardsTablet = '.aha-marketing-cards__grid:not(.aha-marketing-cards__grid--image-led):not(.aha-marketing-cards__grid--templates)';
const pricingTablet = '.aha-pricing__grid--3,.aha-pricing__grid--2';
const itemGrids = [
  { name: 'Cards grid', css: cardsCss, grid: cardsGrid, bordered: true, heading: 'centred', tablet: cardsTablet },
  { name: 'Steps row', css: cardsCss, grid: '.aha-marketing-cards__grid--row', bordered: true, heading: 'centred', tablet: cardsTablet },
  { name: 'Features icon cards', css: layoutCss('features', 'icon-cards'), grid: '.aha-features--icon-cards .aha-features__cards', bordered: true, heading: 'centred' },
  { name: 'Features compact see-all', css: layoutCss('features', 'compact-see-all'), grid: '.aha-features--compact-see-all .aha-features__cards', bordered: true, heading: 'centred' },
  { name: 'Testimonials quote cards', css: testimonialsCss, grid: '.aha-testimonials__grid', bordered: true, heading: 'centred' },
  { name: 'Pricing plan grid', css: pricingCss, grid: '.aha-pricing__inner>.aha-pricing__grid', bordered: true, heading: 'centred', tablet: pricingTablet },
  { name: 'Features side header cards', css: layoutCss('features', 'icon-cards-side-header'), grid: '.aha-features--icon-cards-side-header .aha-features__side .aha-features__cards', bordered: true, heading: 'left' },
  { name: 'Pricing featured plans', css: pricingCss, grid: '.aha-pricing__plans .aha-pricing__grid', bordered: true, heading: 'left', tablet: pricingTablet },
  { name: 'Features icon grid', css: featuresCss, grid: '.aha-features__grid', bordered: false, heading: 'centred' },
  { name: 'Numbers centred', css: layoutCss('numbers', 'centred'), grid: '.aha-numbers--centred:not(.aha-numbers--divided) .aha-numbers__stats', bordered: false, heading: 'centred' },
  { name: 'Numbers divided', css: numbersCss, grid: '.aha-numbers--divided .aha-numbers__stats', bordered: false, heading: 'centred' },
  { name: 'Numbers split image', css: layoutCss('numbers', 'split-image'), grid: '.aha-numbers--split-image .aha-numbers__stats', bordered: false, heading: 'left' },
  { name: 'Numbers actions with icons', css: layoutCss('numbers', 'actions-icons'), grid: '.aha-numbers--actions-icons .aha-numbers__stats', bordered: false, heading: 'left' },
];

for (const { name, css, grid, bordered, heading, tablet } of itemGrids) {
  const centresShortRow = bordered && heading === 'centred';
  test(`${name}: ${centresShortRow ? 'centres the short last row from 992 px' : 'keeps the short last row under column 1'}, ${bordered ? 'one card per row at 768 to 991 px' : 'straight columns at tablet'} (W11)`, () => {
    const g = esc(grid);
    const own = css.split('\n').filter((line) => line.includes(grid)).join('\n');
    if (centresShortRow) {
      assert.match(css, new RegExp(`${g}:has\\(>:nth-child\\(3n\\+2\\):last-child:nth-child\\(n\\+5\\)\\)>:last-child\\{grid-column:4 / span 2\\}`));
      assert.match(css, new RegExp(`${g}:has\\(>:nth-child\\(3n\\+1\\):last-child:nth-child\\(n\\+7\\)\\)>:last-child\\{grid-column:2\\}`));
      for (const { query, body } of containerBlocks(css)) {
        if (body.includes(`${grid}:has`) && /grid-column|justify-content:center/.test(body)) assert.equal(query, 'min-width:992px', `${name} centres only from 992 px`);
      }
    } else {
      assert.doesNotMatch(own, /repeat\(6,|grid-column:2\}|span 2|:nth-child\(odd\):last-child/, `${name} never centres or shifts a short row`);
    }
    if (heading === 'left') assert.doesNotMatch(own, /justify-self:center|justify-content:center/, `${name} sits under a left heading`);
    if (bordered) {
      const stack = `${tablet ?? grid}{grid-template-columns:minmax(0,1fr)}`;
      assert.ok(containerBlocks(css).some(({ query, body }) => query === 'max-width:991px' && body.includes(stack)), `${name} stacks to one column at 991 px`);
    }
  });
}

test('the Pricing balancing reaches the plan grid under a centred heading, not the featured plans', () => {
  const layouts = readJson('marketing/pricing.json').layouts;
  for (const layout of layouts.filter((entry) => entry.slug.startsWith('simple-cards-'))) {
    assert.match(layout.html, /<div class="aha-pricing__inner">\s*<header[\s\S]*?<\/header>\s*<ul class="aha-pricing__grid/, layout.slug);
  }
  for (const layout of layouts.filter((entry) => entry.html.includes('aha-pricing__plans') && entry.html.includes('aha-pricing__grid'))) {
    assert.match(layout.html, /<div class="aha-pricing__plans">\s*<ul class="aha-pricing__grid/, layout.slug);
  }
});

test('Numbers centred keeps four stats as one row of four', () => {
  const css = layoutCss('numbers', 'centred');
  assert.match(css, /\.aha-numbers--centred \.aha-numbers__stats\{grid-template-columns:repeat\(4,/);
  assert.doesNotMatch(css, /:has\(>:nth-child\(4\):last-child\)/);
});

test('the Pricing plan card styles gallery and the phone trio are not count-balanced', () => {
  assert.doesNotMatch(pricingCss, /\.aha-pricing__styles:has/);
  assert.doesNotMatch(layoutCss('features', 'icons-phone-screenshot'), /__trio:has/);
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
  const marketing = ['cards', 'features', 'numbers', 'pricing', 'testimonials', 'faq', 'footer-banner', 'hero'];
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
  for (const slug of ['alternating-screenshots', 'icon-grid']) {
    assert.match(features.layouts.find((layout) => layout.slug === slug).html, /<div class="aha-features__cta"><aha-button variant="primary" size="xl" href="#sign-up">Sign up<\/aha-button><\/div>/, slug);
  }
  for (const slug of ['icon-list-photo', 'tabs-screenshots']) {
    const html = features.layouts.find((layout) => layout.slug === slug).html;
    assert.match(html, /<div class="aha-features__column">[\s\S]*<div class="aha-features__cta aha-features__cta--start"><aha-button variant="primary" size="xl" href="#sign-up">Sign up<\/aha-button><\/div>\n      <\/div>\n      <div class="aha-features__(visual|tabpanels)">/, slug);
    assert.doesNotMatch(html, /\n    <div class="aha-features__cta">/, slug);
  }
  assert.match(featuresCss, /\.aha-features__cta--start\{justify-content:flex-start\}/);
  assert.ok(featuresCss.indexOf('.aha-features__cta--start{') > featuresCss.indexOf('.aha-features__cta{display:flex'), 'start modifier must follow the base rule to win');
  assert.ok(testimonialsCss.indexOf('.aha-testimonials__cta--start{') > testimonialsCss.indexOf('.aha-testimonials__cta{display:flex'), 'start modifier must follow the base rule to win');
  assert.match(readJson('marketing/faq.json').html, /aha-faq__cta"><aha-button variant="secondary" size="xl" href="#docs" target="_blank" rel="noopener">Read the docs/);
  assert.match(featuresCss, /\.aha-features__cta\{display:flex;flex-wrap:wrap;justify-content:center/);
  assert.match(numbersCss, /\.aha-numbers__cta\{display:flex;flex-wrap:wrap;justify-content:center/);
  assert.match(testimonialsCss, /\.aha-testimonials__cta--start\{justify-content:flex-start\}/);
  for (const slug of ['faq', 'features', 'numbers', 'testimonials']) {
    assert.doesNotMatch(marketingFile(slug), /href=\\"#sign-up\\"[^>]*target=/, slug);
  }
  assert.doesNotMatch(sectionPage('fail-w18-missing-section-cta'), /aha-faq__cta/);
});

test('W4 and W18 agree: a section Sign-up call to action repeats the hero label in every fixture', () => {
  for (const entry of evals) {
    const page = readFileSync(new URL(`../anti-slop/evals/website/${entry.files[0].path}`, import.meta.url), 'utf8');
    const heroLabel = page.match(/<aha-button variant="secondary" size="xl" href="\/signup">([^<]+)</)?.[1];
    if (!heroLabel) continue;
    const sectionPrimaryLabels = [...page.matchAll(/<aha-button variant="primary" size="xl"[^>]*>([^<]+)</g)].map((match) => match[1]);
    for (const label of sectionPrimaryLabels) assert.equal(label, heroLabel, entry.files[0].path);
  }
});

test('W19: testimonial authors are left aligned and share a baseline through subgrid', () => {
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__person')['text-align'], 'left');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__person-text')['align-items'], 'flex-start');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__quote')['text-align'], 'left');
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__card--quote')['grid-template-rows'], 'subgrid');
});

test('W9: the motion script reveals with a stagger, fades photos in, counts numbers up and honours reduced motion', () => {
  const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
  assert.match(script, /STAGGER_MILLISECONDS = 80/);
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

test('W9: a framed photo only fades in, never scaled or moved, so no edge is cropped', () => {
  const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
  const selector = script.match(/const PICTURE_SELECTOR = '([^']+)'/)[1];
  assert.deepEqual(selector.split(', '), ['.aha-features__frame > img', '.aha-testimonials__frame > img', '.aha-numbers__frame > img']);
  const style = script.match(/const STYLE = `([\s\S]*?)`;/)[1];
  assert.match(style, /\.aha-motion-picture\{opacity:0;transition:opacity /);
  assert.doesNotMatch(script, /parallax|PICTURE_ENTER_SCALE|OVERSCAN|scale\(/i);
  assert.doesNotMatch(style.match(/\.aha-motion-picture[^\n]*/g).join('\n'), /transform|scale/);
  for (const [file, css] of [['features', featuresCss], ['testimonials', testimonialsCss], ['numbers', numbersCss]]) {
    const frameSelector = `.aha-${file}__frame`;
    const frame = declarations(css, frameSelector);
    assert.equal(frame.overflow, 'hidden', `${file} frame clips the image`);
    assert.equal(frame.transform, undefined, `${file} frame is not transformed`);
  }
  for (const layout of features.layouts) {
    const framed = layout.html.includes('aha-features__frame');
    assert.equal(framed, layout.slug === 'icon-list-photo', layout.slug);
    if (framed) assert.doesNotMatch(layout.html, /aha-features__photo--(fill|pink-frame)/);
  }
  assert.equal(declarations(testimonialsCss, '.aha-testimonials__photo').height, '100%');
  assert.equal(declarations(numbersCss, '.aha-numbers__image').height, '100%');
});

test('W9: the motion script imports as a no-op outside a browser and keeps the final number for screen readers and print', async () => {
  await import('../lib/marketing-motion.js');
  const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
  assert.match(script, /typeof document !== 'undefined'/);
  assert.match(script, /aha-motion-final/);
  assert.match(script, /@media print\{[^]*\.aha-motion-count\{display:none\}/);
});

test('W16: every fixture marked W16 PASS has no hand-rolled button and no class-based call to action', () => {
  const passing = evals.filter((entry) => JSON.stringify(entry).includes('"W16":"PASS"'));
  assert.ok(passing.length > 0);
  for (const entry of passing) {
    const path = entry.files[0].path;
    const page = readFileSync(new URL(`../anti-slop/evals/website/${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(page, /<a class="aha-[a-z-]+__button/, path);
    const lint = spawnSync(process.execPath, ['screen-lint.mjs', '--surface=website', new URL(`../anti-slop/evals/website/${path}`, import.meta.url).pathname], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
    assert.doesNotMatch(lint.stdout + lint.stderr, /hand-rolled-button/, path);
  }
});
