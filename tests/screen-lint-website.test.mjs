import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';
import { MARKETING_MIN_WIDTHS } from '../lib/marketing-breakpoints.js';

const rulesOf = (source, surface = 'website') => lintHtml(source, { surface }).findings.map(f => f.rule);

test('the accepted breakpoints come from the shipped Marketing sections', () => {
  assert.deepEqual(MARKETING_MIN_WIDTHS, [768, 992]);
  const shipped = new Set();
  for (const file of readdirSync(new URL('../marketing/', import.meta.url)).filter(f => f.endsWith('.json')))
    for (const width of readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8').matchAll(/@(?:container|media)[^{]*?\(\s*min-width\s*:\s*([0-9.]+)px/g))
      shipped.add(parseFloat(width[1]));
  assert.deepEqual([...shipped].sort((a, b) => a - b), MARKETING_MIN_WIDTHS);
});

test('a shipped marketing breakpoint passes on website and still fails on product', () => {
  const source = '@container aha-features (min-width:992px){ .a{margin:0} }';
  assert.deepEqual(rulesOf(source), []);
  assert.deepEqual(rulesOf('@container aha-numbers (min-width:768px) and (max-width:991px){ .a{margin:0} }'), []);
  assert.deepEqual(rulesOf('@media (min-width:768px){ .a{margin:0} }'), []);
  assert.ok(rulesOf(source, 'product').includes('min-width-trap'));
});

test('an off-scale breakpoint and a fixed min-width fail on website', () => {
  assert.ok(rulesOf('@container aha-features (min-width:1000px){ .a{margin:0} }').includes('min-width-trap'));
  assert.ok(rulesOf('.a{min-width:768px}').includes('min-width-trap'));
  assert.ok(rulesOf('@media (min-width:768px){ .a{min-width:768px} }').includes('min-width-trap'));
});

test('the product rules still apply on website', () => {
  assert.ok(rulesOf('<div style="color:#ff0000">x</div>').includes('raw-hex'));
  assert.ok(rulesOf('<div style="border-radius:7px">x</div>').includes('radius-off-scale'));
});

test('a page has one h1', () => {
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h2>Next</h2>'), []);
  assert.ok(rulesOf('<h1>Title</h1>\n<h1>Again</h1>').includes('multiple-h1'));
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h1>Again</h1> <!-- ds-lint-allow: page (demo of two pages) -->'), []);
  assert.deepEqual(rulesOf('<h1>Title</h1>\n<h1>Again</h1>', 'product'), []);
});

test('every image carries alt', () => {
  assert.deepEqual(rulesOf('<img src="a.png" alt="Dashboard">'), []);
  assert.ok(rulesOf('<img src="a.png">').includes('img-no-alt'));
  assert.ok(rulesOf('<img src="a.png" data-alt="Dashboard">').includes('img-no-alt'));
  assert.deepEqual(rulesOf('<img src="a.png">', 'product'), []);
});

const band = (classes) => `<section class="${classes}"></section>`;
const page = (...bands) => `<main>\n${bands.join('\n')}\n</main>`;
const websiteRulesOf = (source) => rulesOf(source).filter((rule) => ['section-eyebrow', 'band-order', 'section-spacing-override', 'removed-layout'].includes(rule));
const fixture = (name) => readFileSync(new URL(`../anti-slop/evals/website/fixtures/${name}/Page.html`, import.meta.url), 'utf8');

test('a section eyebrow fails and a card category label does not', () => {
  assert.deepEqual(websiteRulesOf('<header><p class="aha-features__eyebrow">Features</p><h2>Title</h2></header>'), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf('<p class="aha-header-section-hero-split__eyebrow">Live polls</p>'), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf('<p class="page-eyebrow big">Label</p>'), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf('<p class="aha-marketing-card__eyebrow">Retros</p>'), []);
  assert.deepEqual(rulesOf('<p class="aha-features__eyebrow">Features</p>', 'product'), []);
  assert.deepEqual(websiteRulesOf('<p class="aha-features__eyebrow">x</p> <!-- ds-lint-allow: page (legacy page kept for a diff demo) -->'), []);
});

test('two coloured bands touching fail', () => {
  assert.deepEqual(websiteRulesOf(page(band('aha-features aha-features--accent'), band('aha-numbers aha-numbers--accent'))), ['band-order']);
  assert.deepEqual(websiteRulesOf(page(band('aha-features aha-features--accent'), band('aha-footer-banner'))), ['band-order']);
  assert.deepEqual(websiteRulesOf(page(band('aha-features aha-features--accent'), band('aha-faq'), band('aha-footer-banner'))), []);
});

test('three white content bands in a row fail, the Logos strip and hero do not count', () => {
  const white = (name) => band(`aha-${name}`);
  assert.deepEqual(websiteRulesOf(page(white('features'), white('numbers'), white('testimonials'))), ['band-order']);
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split'), band('aha-logos'), white('features'), white('testimonials'), band('aha-features aha-features--accent'), white('faq'))), []);
  assert.deepEqual(websiteRulesOf(page(white('features'), white('numbers'), band('aha-features aha-features--accent'), white('faq'), white('testimonials'))), []);
});

test('nested sections are not bands of their own', () => {
  assert.deepEqual(websiteRulesOf(page('<section class="aha-features"><section class="aha-features"></section><section class="aha-features"></section></section>')), []);
});

test('page CSS that overrides a section spacing fails; the section CSS pasted whole does not', () => {
  assert.deepEqual(websiteRulesOf('<style>.aha-features__inner{padding:var(--aha-space-40) var(--aha-space-16)}</style>'), ['section-spacing-override']);
  assert.deepEqual(websiteRulesOf('<style>@media (min-width:768px){ .aha-faq__cta{margin-top:var(--aha-space-24)} }</style>'), ['section-spacing-override']);
  assert.deepEqual(websiteRulesOf('<style>.aha-numbers__header{gap:var(--aha-space-8)}</style>'), ['section-spacing-override']);
  assert.deepEqual(websiteRulesOf('<style>main > section + section{margin-top:var(--aha-space-64)}</style>'), []);
  assert.deepEqual(websiteRulesOf('<style>.aha-features__title{color:var(--aha-text-default)}</style>'), []);
  assert.deepEqual(websiteRulesOf('<style>.aha-features{container:aha-features / inline-size}\n.aha-features__inner{padding:var(--aha-space-96) var(--aha-space-64)}</style>'), []);
});

test('a class of a removed layout fails', () => {
  assert.deepEqual(websiteRulesOf('<section class="aha-features aha-features--compact-accordion"></section>'), ['removed-layout']);
  assert.deepEqual(websiteRulesOf('<section class="aha-features aha-features--icon-cards-row-3"></section>'), ['removed-layout']);
  assert.deepEqual(websiteRulesOf('<section class="aha-features aha-features--icon-cards"></section>'), []);
});

test('no removed class is shipped by a current Marketing section', () => {
  const shipped = readdirSync(new URL('../marketing/', import.meta.url)).filter((f) => f.endsWith('.json'))
    .map((f) => readFileSync(new URL(`../marketing/${f}`, import.meta.url), 'utf8')).join('\n');
  const removed = JSON.parse(readFileSync(new URL('../marketing/data/removed-layouts.json', import.meta.url), 'utf8')).classes;
  assert.ok(removed.length > 50);
  assert.deepEqual(removed.filter((name) => new RegExp(`${name}(?![a-z0-9_-])`).test(shipped)), []);
});

test('no current Marketing section ships an eyebrow, the card category label apart', () => {
  for (const file of readdirSync(new URL('../marketing/', import.meta.url)).filter((f) => f.endsWith('.json'))) {
    const source = readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8');
    const hits = [...source.matchAll(/[a-z_-]*eyebrow[a-z_-]*/gi)].map((m) => m[0]).filter((name) => name !== 'aha-marketing-card__eyebrow');
    assert.deepEqual(hits, [], file);
  }
});

test('the eval fixtures: both pass pages are clean, the eyebrow fixture and the spacing fixture fail', () => {
  assert.deepEqual(websiteRulesOf(fixture('pass-landing-page')), []);
  assert.deepEqual(websiteRulesOf(fixture('pass-pricing-page')), []);
  assert.ok(websiteRulesOf(fixture('fail-w14-eyebrow')).includes('section-eyebrow'));
  assert.ok(websiteRulesOf(fixture('fail-w2-section-gaps')).includes('section-spacing-override'));
});

test('the band after the Logos strip must be white', () => {
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split'), band('aha-logos'), band('aha-features aha-features--accent'))), ['band-order']);
  assert.deepEqual(websiteRulesOf(page(band('aha-logos'), band('aha-features'), band('aha-features aha-features--accent'))), []);
});

test('eyebrow and removed-layout classes are found in single-quoted and unquoted class attributes', () => {
  assert.deepEqual(websiteRulesOf("<p class='aha-features__eyebrow'>Features</p>"), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf('<p class=aha-features__eyebrow>Features</p>'), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf("<section class='aha-features aha-features--compact-accordion'></section>"), ['removed-layout']);
  assert.deepEqual(websiteRulesOf('<section class=aha-features--compact-accordion></section>'), ['removed-layout']);
  assert.deepEqual(websiteRulesOf("<p class='aha-marketing-card__eyebrow'>Retros</p>"), []);
});

test('commented-out markup is ignored and a self-closing section opens no band', () => {
  assert.deepEqual(websiteRulesOf('<!-- <p class="aha-features__eyebrow">x</p> -->'), []);
  assert.deepEqual(websiteRulesOf(page('<section class="aha-features aha-features--accent"></section>', '<!-- <section class="aha-numbers aha-numbers--accent"> -->', '<section class="aha-faq"></section>')), []);
  assert.deepEqual(websiteRulesOf(page('<section class="aha-features"/>', '<section class="aha-numbers"/>', '<section class="aha-faq"/>', '<section class="aha-testimonials"></section>')), []);
  assert.deepEqual(websiteRulesOf(page('<section class="aha-features aha-features--accent"/>', '<section class="aha-numbers aha-numbers--accent"></section>')), []);
  assert.deepEqual(websiteRulesOf(page('<section class="aha-features aha-features--accent"></section>', '<!-- gap -->', '<section class="aha-numbers aha-numbers--accent"></section>')), ['band-order']);
});

test('unterminated comment openers in a long page are scanned in linear time', () => {
  const started = Date.now();
  assert.deepEqual(websiteRulesOf('<!--'.repeat(50000) + '<p class="aha-features__eyebrow">x</p>'), ['section-eyebrow']);
  assert.ok(Date.now() - started < 2000);
});
