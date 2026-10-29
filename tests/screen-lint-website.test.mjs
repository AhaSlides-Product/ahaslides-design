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
const websiteRulesOf = (source) => rulesOf(source).filter((rule) => ['section-eyebrow', 'band-order', 'section-spacing-override', 'removed-layout', 'hero-not-brand', 'tabs-description-long', 'steps-as-tabs', 'autoplay-video-extra', 'autoplay-video-attributes', 'autoplay-video-motion', 'grey-quote-or-frame', 'square-image-unframed'].includes(rule));
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
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split aha-header-section-hero-split--brand'), band('aha-logos'), white('features'), white('testimonials'), band('aha-features aha-features--accent'), white('faq'))), []);
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
  assert.deepEqual(websiteRulesOf(fixture('pass-hero-video')), []);
  assert.deepEqual(websiteRulesOf(fixture('fail-w9-second-autoplay-video')), ['autoplay-video-extra']);
  assert.deepEqual(websiteRulesOf(fixture('fail-w9-no-reduced-motion')), ['autoplay-video-motion']);
  assert.ok(websiteRulesOf(fixture('fail-w14-eyebrow')).includes('section-eyebrow'));
  assert.ok(websiteRulesOf(fixture('fail-w2-section-gaps')).includes('section-spacing-override'));
});

test('the band after the Logos strip must be white', () => {
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split aha-header-section-hero-split--brand'), band('aha-logos'), band('aha-features aha-features--accent'))), ['band-order']);
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

test('every whole-document check finishes fast on adversarial input', () => {
  const inputs = [
    '<a class=""'.repeat(30000),
    '<a ' + ' class=""'.repeat(30000),
    "<a class='".repeat(30000),
    '<section z'.repeat(30000),
    '<section'.repeat(30000),
    '<style>' + 'a{'.repeat(50000),
    '<style>' + '.aha-features{'.repeat(30000),
    '<style>' + ' '.repeat(100000),
    '<style>'.repeat(20000),
    '</style  '.repeat(30000),
    '<!--'.repeat(30000),
    '/*'.repeat(30000),
    '!'.repeat(100000),
    'z'.repeat(100000),
  ];
  for (const input of inputs) {
    const started = Date.now();
    websiteRulesOf(input);
    websiteRulesOf(`<style>${input}</style>`);
    assert.ok(Date.now() - started < 2000, input.slice(0, 20));
  }
});

test('tags with attributes spread over lines, extra attributes and upper-case names are read', () => {
  assert.deepEqual(websiteRulesOf('<P\n  id="a"\n  CLASS = "aha-features__eyebrow"\n>x</P>'), ['section-eyebrow']);
  assert.deepEqual(websiteRulesOf('<section data-x="a>b" class="aha-features aha-features--accent"></section><section class="aha-numbers aha-numbers--accent"></section>'), ['band-order']);
});

test('a landing hero left in the White state fails, the Vivid Pink hero and a Page header pass', () => {
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split'), band('aha-features'))), ['hero-not-brand']);
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-stacked aha-header-section-hero-stacked--accent'))), ['hero-not-brand']);
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split aha-header-section-hero-split--brand'), band('aha-features'))), []);
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-page'), band('aha-features'))), []);
  assert.deepEqual(websiteRulesOf(page(band('aha-header-section-hero-split') + ' <!-- ds-lint-allow: page (requester asked for white) -->')), []);
});

const tabsSection = (heading, ...tabs) => `<section class="aha-features aha-features--tabs-screenshots"><h2>${heading}</h2>${tabs.map(([title, text]) => `<button class="aha-features__tab"><span class="aha-features__item-title">${title}</span>\n<span class="aha-features__item-text">${text}</span></button>`).join('\n')}</section>`;

test('Features Tabs hold parallel choices with short descriptions', () => {
  assert.deepEqual(websiteRulesOf(tabsSection('One deck, every question', ['Polls', 'Ask and see answers live.'], ['Word clouds', 'One word from everyone.'])), []);
  const long = 'Create your first presentation in minutes by choosing a template and adding your questions.';
  assert.deepEqual(websiteRulesOf(tabsSection('One deck, every question', ['Polls', long])), ['tabs-description-long']);
  assert.deepEqual(websiteRulesOf(tabsSection('How it works', ['Polls', 'Short.'])), ['steps-as-tabs']);
  assert.deepEqual(websiteRulesOf(tabsSection('Get going', ['1. Create', 'Short.'], ['2. Share', 'Short.'])), ['steps-as-tabs']);
});

test('a steps section is caught by its eyebrow or tablist label even with unnumbered titles', () => {
  const shape = (eyebrow, label) => `<section class="aha-features aha-features--tabs-screenshots"><header><p class="aha-features__eyebrow">${eyebrow}</p><h2>Set up a vote in seconds</h2></header><div class="aha-features__tablist" role="tablist" aria-label="${label}"><button class="aha-features__tab"><span class="aha-features__item-title">Write your question</span><span class="aha-features__item-text">Short.</span></button><button class="aha-features__tab"><span class="aha-features__item-title">Present</span><span class="aha-features__item-text">Short.</span></button></div></section>`;
  assert.ok(rulesOf(shape('How it works', 'Formats')).includes('steps-as-tabs'));
  assert.ok(rulesOf(shape('Formats', 'Set-up steps')).includes('steps-as-tabs'));
  assert.ok(!rulesOf(shape('Formats', 'Question formats')).includes('steps-as-tabs'));
});

test('a parallel Tabs heading containing "how to" is not steps, inline markup does not cut text short', () => {
  const tabs = (heading, text) => `<section class="aha-features aha-features--tabs-screenshots"><h2>${heading}</h2><button class="aha-features__tab"><span class="aha-features__item-title">Polls</span><span class="aha-features__item-text">${text}</span></button></section>`;
  assert.ok(!rulesOf(tabs('Know how to pick the right format', 'Short.')).includes('steps-as-tabs'));
  assert.ok(rulesOf(tabs('How to run a vote', 'Short.')).includes('steps-as-tabs'));
  assert.ok(rulesOf(tabs('<span>How</span> it works', 'Short.')).includes('steps-as-tabs'));
  const long = `<strong>Ask</strong> a question and ${'see the answers arrive from every phone '.repeat(3)}`;
  assert.ok(rulesOf(tabs('One deck', long)).includes('tabs-description-long'));
});

const videoRulesOf = (source) => rulesOf(source).filter((rule) => rule.startsWith('autoplay-video'));
const heroWithVideo = (attributes, tail = '') => `<section class="aha-header-section-hero-split aha-header-section-hero-split--brand"><video ${attributes}></video></section>\n<section class="aha-logos"></section>${tail}`;
const heroVideo = 'autoplay muted loop playsinline poster="p.jpg"';
const stopScript = '<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.543.0/lib/marketing-motion.js"></script>';

test('W9: one hero video with autoplay, muted, loop, playsinline, poster and a reduced-motion stop passes', () => {
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, stopScript)), []);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<style>@media (prefers-reduced-motion:reduce){video{display:none}}</style>')), []);
  assert.deepEqual(videoRulesOf(heroWithVideo('controls playsinline poster="p.jpg"')), []);
});

test('W9: a second autoplaying video, or one outside the hero, fails', () => {
  assert.ok(videoRulesOf(heroWithVideo(heroVideo, `<video ${heroVideo}></video>${stopScript}`)).includes('autoplay-video-extra'));
  assert.ok(videoRulesOf(heroWithVideo('controls', `<section class="aha-features"><video ${heroVideo}></video></section>${stopScript}`)).includes('autoplay-video-extra'));
});

test('W9: an autoplaying video without muted, loop, playsinline or poster fails', () => {
  for (const missing of ['muted', 'loop', 'playsinline', 'poster="p.jpg"'])
    assert.ok(videoRulesOf(heroWithVideo(heroVideo.replace(missing, ''), stopScript)).includes('autoplay-video-attributes'), missing);
});

test('W9: an autoplaying video with no reduced-motion stop fails and ds-lint-allow page silences it', () => {
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo)), ['autoplay-video-motion']);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo).replace('</video>', '</video><!-- ds-lint-allow: page (demo) -->')), []);
});

const greyRulesOf = (source) => rulesOf(source).filter((rule) => rule === 'grey-quote-or-frame');

test('DSN-975: light grey on a blockquote, rail or image frame fails', () => {
  assert.deepEqual(greyRulesOf('<style>.page blockquote{border-left:4px solid #F6F6F6}</style>'), ['grey-quote-or-frame']);
  assert.deepEqual(greyRulesOf('<style>.quote-rail{background:#f7f7f7}</style>'), ['grey-quote-or-frame']);
  assert.deepEqual(greyRulesOf('<style>.shot-frame{background-color:#F7F7F7}</style>'), ['grey-quote-or-frame']);
  assert.deepEqual(greyRulesOf('<blockquote style="background:#F6F6F6">x</blockquote>'), ['grey-quote-or-frame']);
  assert.deepEqual(greyRulesOf('<div class="photo-frame" style="border-left:2px solid #f7f7f7"></div>'), ['grey-quote-or-frame']);
});

test('DSN-975: other grey uses and other properties do not trip it', () => {
  assert.deepEqual(greyRulesOf('<style>.card{background:#F6F6F6}</style>'), []);
  assert.deepEqual(greyRulesOf('<style>blockquote{color:#F6F6F6;border-left:4px solid var(--aha-vivid-pink-100)}</style>'), []);
});

const squareRulesOf = (source) => rulesOf(source).filter((rule) => rule === 'square-image-unframed');
const featuresWith = (inner) => `<section class="aha-features aha-features--alternating-screenshots">${inner}</section>`;

test('DSN-975: a square image outside the pink frame fails, inside it passes', () => {
  assert.deepEqual(squareRulesOf(featuresWith('<img class="aha-features__visual" src="a.png" alt="x" width="800" height="800">')), ['square-image-unframed']);
  assert.deepEqual(squareRulesOf(featuresWith('<img class="aha-features__visual" src="a.png" alt="x" style="aspect-ratio:1/1">')), ['square-image-unframed']);
  assert.deepEqual(squareRulesOf(featuresWith('<div class="aha-features__photo aha-features__photo--pink-frame"><img src="a.png" alt="x" width="800" height="800"></div>')), []);
});

test('DSN-975: landscape images, small square logos and avatars, and square images outside Features and Cards pass', () => {
  assert.deepEqual(squareRulesOf(featuresWith('<img src="a.png" alt="x" width="800" height="600">')), []);
  assert.deepEqual(squareRulesOf(featuresWith('<img class="aha-features__logo" src="a.png" alt="x" width="48" height="48">')), []);
  assert.deepEqual(squareRulesOf('<section class="aha-header-section-hero-bento"><img src="a.png" alt="x" width="400" height="400"></section>'), []);
});

test('W9: a reduced-motion rule that does not target the video, or an older motion script, is no stop', () => {
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<style>@media(prefers-reduced-motion:reduce){.button{transition:none}}</style>')), ['autoplay-video-motion']);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.341.0/lib/marketing-motion.js"></script>')), ['autoplay-video-motion']);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.600.1/lib/marketing-motion.js"></script>')), []);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<script>if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.querySelector("video").pause();</script>')), []);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<style>@media (prefers-reduced-motion:reduce){.a{transition:none}.hero video{display:none}}</style>')), []);
});

test('W9: the hero is found by its class and its closing tag, not by position', () => {
  const clip = `<video ${heroVideo}></video>`;
  assert.ok(videoRulesOf(`<section class="aha-header-section-hero-split"></section>${clip}${stopScript}`).includes('autoplay-video-extra'));
  assert.ok(videoRulesOf(`<section class="aha-features">${clip}</section><section class="aha-header-section-hero-split"></section>${stopScript}`).includes('autoplay-video-extra'));
  assert.ok(videoRulesOf(`<section class="aha-features">${clip}</section>${stopScript}`).includes('autoplay-video-extra'));
  assert.deepEqual(videoRulesOf(`<section class="aha-features"></section><section class="aha-header-section-hero-split"><div>${clip}</div></section>${stopScript}`), []);
});

test('W9: a no-preference reduced-motion block is no stop', () => {
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<style>@media (prefers-reduced-motion: no-preference){video{opacity:1}}</style>')), ['autoplay-video-motion']);
  assert.deepEqual(videoRulesOf(heroWithVideo(heroVideo, '<script>if (matchMedia("(prefers-reduced-motion: no-preference)").matches) v.pause();</script>')), ['autoplay-video-motion']);
});
