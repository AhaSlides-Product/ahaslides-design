import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const RULES = ['ds-not-loaded', 'custom-property-hex', 'off-ds-font'];
const hits = (source, surface = 'product') =>
  lintHtml(source, { surface }).findings.filter((f) => RULES.includes(f.rule)).map((f) => [f.rule, f.line, f.severity]);

const CDN = 'https://assets-cdn-public.ahaslides.com/ahaslides-design/latest/lib';
const page = ({ head = '', css = '', body = '<main><p>Weekly sign-ups</p></main>' } = {}) =>
  `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">${head}\n<style>\n${css}\n</style>\n</head>\n<body>${body}</body>\n</html>`;

const HAND_ROLLED = page({ css: [
  ':root { --ink:#1d1d1f; --accent:#257de0; }',
  '@media (prefers-color-scheme: dark) { :root { --ink:#f1f2f4; } }',
  'body { font:15px/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; color:var(--ink); }',
  'h1 { font-family: Inter, sans-serif; }',
].join('\n') });

test('a hand-rolled report page fails all three: no DS load, a private hex palette, a system font stack', () => {
  assert.deepEqual(hits(HAND_ROLLED), [
    ['ds-not-loaded', 3, 'hard'],
    ['off-ds-font', 8, 'hard'],
    ['off-ds-font', 9, 'hard'],
    ['custom-property-hex', 6, 'hard'],
    ['custom-property-hex', 7, 'hard'],
  ]);
  const [notLoaded] = lintHtml(HAND_ROLLED, { surface: 'product' }).findings.filter((f) => f.rule === 'ds-not-loaded');
  assert.match(notLoaded.message, /report-images\/report-images\.md/);
  assert.match(notLoaded.message, /assets-cdn-public\.ahaslides\.com\/ahaslides-design\/latest\/lib\/tokens\.css/);
  assert.match(notLoaded.message, /latest\/lib\/all\.js/);
});

test('the same page on the DS head, aliasing tokens and the DS font, passes', () => {
  const onDs = page({
    head: `\n<link rel="stylesheet" href="${CDN}/tokens.css">\n<script type="module" src="${CDN}/all.js"></script>`,
    css: ':root { --ink: var(--aha-text-default); --accent: var(--aha-color-primary, #e1306c); }\nbody { font: 15px/1.5 var(--aha-font-product); }\ncode { font-family: Menlo, monospace; }\n@font-face { font-family: "Noto Sans"; src: url(noto.woff2); }\nh1 { font-family: "Plus Jakarta Sans", "Noto Sans", sans-serif; }',
  });
  assert.deepEqual(hits(onDs), []);
});

test('jsDelivr, the npm package, a repo-relative lib path and inlined tokens each count as loading the DS', () => {
  const css = 'p { color: var(--ink); }';
  for (const head of [
    '<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.1146.0/lib/all.js"></script>',
    '<script type="module">import "https://esm.sh/@ahaslides-product/design/aha-button";</script>',
    '<link rel="stylesheet" href="../lib/tokens.css">',
  ]) assert.deepEqual(hits(page({ head, css })), [], head);
  assert.deepEqual(hits(page({ css: ':root { --aha-text: #1a1a1a; }\np { color: var(--aha-text-default); }' })), []);
});

test('a snippet or component file is not a standalone page, so none of the three rules applies', () => {
  assert.deepEqual(hits('<style>:root { --ink: #1d1d1f; } p { font-family: Arial, sans-serif; }</style>\n<p>Hi</p>'), []);
});

test('an app shell or bundler entry gets the DS from its bundle, and an email cannot load it', () => {
  assert.deepEqual(hits(page({ css: '#app { opacity: 0 }', body: '<div id="app"></div>' })), []);
  assert.deepEqual(hits(page({ head: '\n<script type="module" src="/src/main.ts"></script>', css: 'body { margin: 0 }' })), []);
  const email = page({ css: ':root { --brand: #e1306c; }', body: '<table role="presentation"><tr><td>Hi</td></tr></table>' });
  assert.deepEqual(hits(email), []);
});

test('each rule honours its ds-lint-allow marker, and the hex and font groups cover the new rules', () => {
  const allowed = HAND_ROLLED
    .replace('<head>', '<head> <!-- ds-lint-allow: ds-not-loaded (offline export) -->')
    .replace('--accent:#257de0; }', '--accent:#257de0; } /* ds-lint-allow: hex (client brand) */')
    .replace('sans-serif; color', 'sans-serif; color /* ds-lint-allow: font (system print) */');
  assert.deepEqual(hits(allowed), [['off-ds-font', 9, 'hard'], ['custom-property-hex', 7, 'hard']]);
});

test('on a slide surface only the DS-load rule runs: the deck owns colour and font there', () => {
  assert.deepEqual(hits(HAND_ROLLED, 'canvas'), [['ds-not-loaded', 3, 'hard']]);
});
