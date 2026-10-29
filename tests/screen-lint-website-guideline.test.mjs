import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { lintHtml } from '../lib/screen-lint.js';

const hits = (source, rule) => lintHtml(source, { surface: 'website' }).findings.filter((f) => f.rule === rule);
const page = (body, head = '') => `<!doctype html><html><head><title>t</title>${head}</head><body>${body}</body></html>`;
const NAVIGATION = '<header class="aha-header"><div class="aha-header__brand"><aha-product-lockup></aha-product-lockup></div></header>';
const fixture = (name) => readFileSync(new URL(`../anti-slop/evals/website/fixtures/${name}/Page.html`, import.meta.url), 'utf8');

test('W3: a section container capped at 1280px passes, an uncapped one fails', () => {
  const sectionCss = (inner) => `<style>.aha-features__inner{${inner}}</style>`;
  assert.equal(hits(sectionCss('max-width:1280px'), 'content-width-uncapped').length, 0);
  assert.equal(hits(sectionCss('max-width:none'), 'content-width-uncapped').length, 1);
  assert.equal(hits(sectionCss('max-width:1600px'), 'content-width-uncapped').length, 1);
  assert.equal(hits('<style>.aha-features__lead{max-width:44ch}</style>', 'content-width-uncapped').length, 0);
  assert.equal(hits('<style>.aha-features__lead{max-width:none}</style>', 'content-width-uncapped').length, 1);
  assert.equal(hits('<style>.aha-features__header{max-width:900px}</style>', 'content-width-uncapped').length, 1);
  assert.ok(hits(fixture('fail-w3-full-width'), 'content-width-uncapped').length > 0);
  assert.equal(hits(fixture('pass-landing-page'), 'content-width-uncapped').length, 0);
});

test('W3: only the subject of a selector is judged', () => {
  assert.equal(hits('<style>.aha-features__inner img{width:1440px;max-width:100%}</style>', 'content-width-uncapped').length, 0);
  assert.equal(hits('<style>.x, .aha-features__inner{max-width:none}</style>', 'content-width-uncapped').length, 1);
  assert.equal(hits('<style>.a > .aha-features__inner{max-width:none}</style>', 'content-width-uncapped').length, 1);
});

test('every shipped Marketing layout snippet passes the guideline rules', () => {
  const rules = new Set(['content-width-uncapped', 'missing-h1', 'multiple-h1', 'multiple-primary-buttons', 'img-empty-alt', 'brand-not-lockup', 'missing-navigation', 'motion-library', 'motion-own-script', 'motion-own-animation', 'card-link-same-tab', 'new-tab-on-sign-up']);
  const snippets = [];
  const collect = (value) => { if (typeof value === 'string') { if (/<(section|header|footer|aha-)/.test(value)) snippets.push(value); } else if (value && typeof value === 'object') Object.values(value).forEach(collect); };
  for (const file of readdirSync(new URL('../marketing/', import.meta.url)).filter((name) => name.endsWith('.json'))) collect(JSON.parse(readFileSync(new URL(`../marketing/${file}`, import.meta.url), 'utf8')));
  assert.ok(snippets.length > 50);
  for (const snippet of snippets) assert.deepEqual(lintHtml(snippet, { surface: 'website' }).findings.filter((f) => rules.has(f.rule)), []);
});

test('W3: a shipped section style block is not judged', () => {
  const shipped = '<style>.aha-features{container: aha-features / inline-size}.aha-features__inner{max-width:none}</style>';
  assert.equal(hits(shipped, 'content-width-uncapped').length, 0);
});

test('W4: exactly one h1 on a page', () => {
  const section = (inner) => `<section class="aha-features">${inner}</section>`;
  assert.equal(hits(page(NAVIGATION + section('<h1>Title</h1>')), 'missing-h1').length, 0);
  assert.equal(hits(page(NAVIGATION + section('<h2>Title</h2>')), 'missing-h1').length, 1);
  assert.equal(hits(page(NAVIGATION + section('<h1>A</h1><h1>B</h1>')), 'multiple-h1').length, 1);
  assert.equal(hits(fixture('pass-landing-page'), 'missing-h1').length, 0);
});

test('W4: at most one primary button per section', () => {
  const button = (variant) => `<aha-button variant="${variant}" href="#">Go</aha-button>`;
  const section = (...buttons) => `<section class="aha-features">${buttons.join('')}</section>`;
  assert.equal(hits(section(button('primary'), button('secondary')), 'multiple-primary-buttons').length, 0);
  assert.equal(hits(section(button('primary'), button('primary')), 'multiple-primary-buttons').length, 1);
  assert.equal(hits(`${section(button('primary'))}${section(button('primary'))}`, 'multiple-primary-buttons').length, 0);
  assert.equal(hits(fixture('pass-pricing-page'), 'multiple-primary-buttons').length, 0);
  assert.ok(hits(fixture('fail-w4-hierarchy'), 'multiple-primary-buttons').length > 0);
});

test('W6: an image with an empty alt must be decorative', () => {
  assert.equal(hits('<img src="a.png" alt="A quiz on a phone">', 'img-empty-alt').length, 0);
  assert.equal(hits('<div aria-hidden="true"><img src="a.png" alt=""></div>', 'img-empty-alt').length, 0);
  assert.equal(hits('<a href="#"><img src="a.png" alt="">Slack</a>', 'img-empty-alt').length, 0);
  assert.equal(hits('<img src="a.png" alt="">', 'img-empty-alt').length, 1);
  assert.equal(hits('<img src="a.png">', 'img-no-alt').length, 1);
});

test('W7: the site header brand is the product lockup and the page has a Navigation', () => {
  const brand = (inner) => `<header class="aha-header"><div class="aha-header__brand">${inner}</div></header>`;
  assert.equal(hits(brand('<aha-product-lockup></aha-product-lockup>'), 'brand-not-lockup').length, 0);
  assert.equal(hits(brand('<img src="logo.svg" alt="AhaSlides"><span>AhaSlides</span>'), 'brand-not-lockup').length, 1);
  const body = '<section class="aha-features"><h1>T</h1></section>';
  assert.equal(hits(page(NAVIGATION + body), 'missing-navigation').length, 0);
  assert.equal(hits(page(body), 'missing-navigation').length, 1);
  assert.ok(hits(fixture('fail-w7-hand-set-brand'), 'brand-not-lockup').length > 0);
  assert.equal(hits(fixture('pass-landing-page'), 'brand-not-lockup').length, 0);
});

test('W9: motion comes from lib/marketing-motion.js only', () => {
  assert.equal(hits('<script src="lib/marketing-motion.js"></script>', 'motion-library').length, 0);
  assert.equal(hits('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>', 'motion-library').length, 1);
  assert.equal(hits('<script>new IntersectionObserver(() => {})</script>', 'motion-own-script').length, 1);
  assert.equal(hits('<script>document.title = "x"</script>', 'motion-own-script').length, 0);
  assert.equal(hits('<style>.a{animation:spin 2s linear infinite}@keyframes spin{to{opacity:0}}</style>', 'motion-own-animation').length > 0, true);
  assert.equal(hits('<style>.a{transition:opacity var(--aha-duration-fast) var(--aha-ease-standard)}</style>', 'motion-own-animation').length, 0);
  assert.ok(hits(fixture('fail-w9-motion'), 'motion-own-animation').length > 0);
  assert.equal(hits(fixture('pass-landing-page'), 'motion-own-animation').length, 0);
});

test('W9: a shipped section script is not judged, and a script end tag with spaces still closes it', () => {
  assert.equal(hits('<script>document.querySelectorAll("[data-aha-scroller]");new IntersectionObserver(() => {})</script>', 'motion-own-script').length, 0);
  assert.equal(hits('<script>window.scrollY</script\t\n bar>', 'motion-own-script').length, 1);
});

test('multi-line tags with single-quoted attributes are read', () => {
  assert.equal(hits("<img\n  src='a.png'\n  alt=''>", 'img-empty-alt').length, 1);
  assert.equal(hits("<section class='aha-features'>\n<aha-button\n href='#'\n variant='primary'>A</aha-button><aha-button variant='primary' href='#'>B</aha-button></section>", 'multiple-primary-buttons').length, 1);
});

test('W15: content card links open in a new tab with noopener and hidden text', () => {
  const link = (attributes, text = '') => `<article class="aha-marketing-card"><a class="aha-marketing-card__link" href="https://ahaslides.com/t" ${attributes}>Quiz${text}</a></article>`;
  const cue = '<span class="aha-marketing-card__visually-hidden"> (opens in a new tab)</span>';
  assert.equal(hits(link('target="_blank" rel="noopener"', cue), 'card-link-same-tab').length, 0);
  assert.equal(hits(link(''), 'card-link-same-tab').length, 1);
  assert.equal(hits(link('target="_blank" rel="noopener"'), 'card-link-same-tab').length, 1);
  assert.equal(hits(link('target="_blank"', cue), 'card-link-same-tab').length, 1);
  assert.ok(hits(fixture('fail-w15-cards-same-tab'), 'card-link-same-tab').length > 0);
  assert.ok(hits(fixture('fail-w15-linkout-same-tab'), 'card-link-same-tab').length > 0);
  assert.equal(hits(fixture('pass-landing-page'), 'card-link-same-tab').length, 0);
});

test('W15: Sign up in the Navigation stays in the same tab', () => {
  const header = (attributes) => `<header class="aha-header"><aha-button variant="primary" href="#" ${attributes}>Sign up</aha-button></header>`;
  assert.equal(hits(header(''), 'new-tab-on-sign-up').length, 0);
  assert.equal(hits(header('target="_blank"'), 'new-tab-on-sign-up').length, 1);
});

test('the new rules honour ds-lint-allow', () => {
  const source = '<!-- ds-lint-allow: img-empty-alt (logo wall) --><img src="a.png" alt="">';
  assert.equal(hits(source, 'img-empty-alt').length, 0);
});

const CHROME = process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN);
test('W8: --measure fails a page that scrolls sideways and passes one that fits', { skip: !CHROME && 'needs CHROME_BIN' }, () => {
  const measure = (name) => spawnSync(process.execPath, ['screen-lint.mjs', '--surface=website', '--measure', `anti-slop/evals/website/fixtures/${name}/Page.html`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).stdout;
  assert.match(measure('fail-w8-overflow'), /FAIL \[overflow\] horizontal scroll at 375px/);
  assert.match(measure('pass-landing-page'), /fits every viewport/);
});
