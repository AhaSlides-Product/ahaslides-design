import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';
import { websiteCompositionFindings, CARD_DESCRIPTION_MAX_WORDS } from '../lib/screen-lint-website-composition.js';

const rulesOf = (source) => websiteCompositionFindings(source).map((finding) => finding.rule);
const shippedMotion = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, '');
const fixtureRoot = new URL('../anti-slop/evals/website/fixtures/', import.meta.url);

test('a page rule that spaces a band with its own value fails section-gap; a Section step passes', () => {
  assert.ok(rulesOf('<style>.band{padding-top:120px}</style><section class="aha-features band"></section>').includes('section-gap'));
  assert.ok(rulesOf('<style>main > section + section{margin-top:64px}</style><main><section class="aha-features"></section><section class="aha-numbers"></section></main>').includes('section-gap'));
  assert.ok(rulesOf('<section class="aha-features" style="padding-bottom:40px"></section>').includes('section-gap'));
  assert.deepEqual(rulesOf('<style>.band{padding-top:var(--aha-section-space-block);margin:0}</style><section class="aha-features band"></section>'), []);
});

test('two same-surface bands each in their own wrapper fail section-gap; direct siblings pass', () => {
  assert.ok(rulesOf('<div><section class="aha-features"></section></div><div><section class="aha-numbers"></section></div>').includes('section-gap'));
  assert.ok(rulesOf('<section class="aha-features"></section><hr><section class="aha-numbers"></section>').includes('section-gap'));
  assert.deepEqual(rulesOf('<main><section class="aha-features"></section><section class="aha-numbers"></section></main>'), []);
});

test('an inline motion script that differs from the shipped file fails; the shipped body passes', () => {
  assert.ok(rulesOf(`<script type="module">${shippedMotion}\nvar own = 1;</script>`).includes('motion-script-copy'));
  assert.deepEqual(rulesOf(`<script type="module">${shippedMotion}</script>`), []);
  assert.deepEqual(rulesOf('<script src="https://cdn.example/other.js"></script>'), []);
});

test('numbered steps must be the Steps row with the DS number ring', () => {
  assert.ok(rulesOf('<div class="my-steps"><div>1</div></div>').includes('step-numbers'));
  assert.ok(rulesOf('<div class="aha-marketing-cards__grid"><div class="aha-marketing-card aha-marketing-card--step"><p>x</p></div></div>').includes('step-numbers'));
  assert.ok(rulesOf('<div class="aha-marketing-cards__grid"><div class="aha-marketing-card--step"><span class="aha-marketing-card__number">1</span></div></div>').includes('step-numbers'));
  assert.deepEqual(rulesOf('<div class="aha-marketing-cards__grid aha-marketing-cards__grid--row"><div class="aha-marketing-card aha-marketing-card--step"><span class="aha-marketing-card__number">1</span></div></div>'), []);
});

test('a DS class whose section CSS the page only pasted in part fails', () => {
  const partial = '<style>.aha-features{padding:0} .aha-features__cta{display:flex}</style><div class="aha-features"><div class="aha-features__cta aha-features__cta--start"></div><div class="aha-features__column"></div></div>';
  assert.ok(rulesOf(partial).includes('ds-class-without-css'));
  const whole = '<style>.aha-features{padding:0} .aha-features__cta{display:flex} .aha-features__cta--start{x:y} .aha-features__column{a:b}</style><div class="aha-features"><div class="aha-features__cta aha-features__cta--start"></div><div class="aha-features__column"></div></div>';
  assert.deepEqual(rulesOf(whole), []);
});

test('body and headings must resolve to Plus Jakarta Sans', () => {
  assert.ok(rulesOf('<style>body{font-family:Inter,sans-serif}</style>').includes('page-font'));
  assert.ok(rulesOf('<style>h2{font-family:"Helvetica Neue"}</style>').includes('page-font'));
  assert.ok(rulesOf('<style>:root{--page-font:Arial} body{font-family:var(--page-font)}</style>').includes('page-font'));
  assert.deepEqual(rulesOf('<style>body{font-family:var(--aha-font-product)} h1,h2{font-family:"Plus Jakarta Sans",sans-serif}</style>'), []);
});

test(`a card description over ${CARD_DESCRIPTION_MAX_WORDS} words fails`, () => {
  const words = (count) => Array.from({ length: count }, (_, index) => `word${index}`).join(' ');
  assert.ok(rulesOf(`<p class="aha-marketing-card__text">${words(26)}</p>`).includes('card-description-long'));
  assert.deepEqual(rulesOf(`<p class="aha-marketing-card__text">${words(25)}</p>`), []);
});

test('every pass fixture is clean of the composition rules and the wordy-cards fixture fails', () => {
  const composition = new Set(['section-gap', 'motion-script-copy', 'step-numbers', 'ds-class-without-css', 'page-font', 'card-description-long']);
  for (const name of readdirSync(fixtureRoot).filter((entry) => entry.startsWith('pass-'))) {
    const source = readFileSync(new URL(`${name}/Page.html`, fixtureRoot), 'utf8');
    const hits = lintHtml(source, { surface: 'website' }).findings.filter((finding) => composition.has(finding.rule));
    assert.deepEqual(hits, [], name);
  }
  const wordy = readFileSync(new URL('fail-w10-wordy-cards/Page.html', fixtureRoot), 'utf8');
  assert.ok(lintHtml(wordy, { surface: 'website' }).findings.some((finding) => finding.rule === 'card-description-long'));
});

test('ds-lint-allow opts a composition finding out on its line', () => {
  const flagged = (source) => lintHtml(source, { surface: 'website' }).findings.some((finding) => finding.rule === 'page-font');
  assert.ok(flagged('<style>body{font-family:Inter}</style>'));
  assert.ok(!flagged('<style>body{font-family:Inter} /* ds-lint-allow: page-font (legacy embed) */</style>'));
});

test('every shipped marketing snippet, html with its own css, has no ds-class-without-css finding', () => {
  const snippets = [];
  const visit = (node, label, baseCss = '') => {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, label, baseCss));
    if (!node || typeof node !== 'object') return;
    const shared = `${baseCss}\n${typeof node.baseCss === 'string' ? node.baseCss : ''}`;
    if (typeof node.html === 'string') snippets.push([label, { html: node.html, css: `${shared}\n${node.css ?? ''}` }]);
    Object.values(node).forEach((value) => visit(value, label, shared));
  };
  for (const file of readdirSync(new URL('../marketing/', import.meta.url)).filter((entry) => entry.endsWith('.json')))
    visit(JSON.parse(readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8')), file);
  assert.ok(snippets.length > 10);
  for (const [label, node] of snippets)
    assert.deepEqual(rulesOf(`<style>${node.css}</style>${node.html}`).filter((rule) => rule === 'ds-class-without-css'), [], label);
});

test('a Step card in an ordinary grid fails even when another Steps row exists on the page', () => {
  const ring = '<span class="aha-marketing-card__number">1</span>';
  const page = `<div class="aha-marketing-cards__grid aha-marketing-cards__grid--row"><div class="aha-marketing-card--step">${ring}</div></div><div class="aha-marketing-cards__grid"><div class="aha-marketing-card--step">${ring}</div></div>`;
  assert.equal(websiteCompositionFindings(page).filter((finding) => finding.rule === 'step-numbers').length, 1);
});
