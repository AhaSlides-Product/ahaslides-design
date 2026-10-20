import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const rulesOf = (source, surface = 'product') => lintHtml(source, { surface }).findings.map(f => f.rule);

const productHits = {
  'gradient-fill': '<div style="background: linear-gradient(red, blue)"></div>',
  'radius-off-scale': '<div style="border-radius: 10px"></div>',
  'min-width-trap': '<div style="min-width: 480px"></div>',
  'overflow-x-scroll': '<div style="overflow-x: auto"></div>',
  'chart-lib-import': "import { Chart } from 'chart.js';",
  'unknown-icon': '<aha-icon name="not-a-real-icon"></aha-icon>',
  'icon-only-no-name': '<aha-button icon-only></aha-button>',
  'raw-hex': '<div style="color: #ff0000"></div>',
  'off-scale-weight': '<div style="font-weight: 700"></div>',
  'box-in-box': '<div class="card" style="border: 1px solid"><div class="card" style="border: 1px solid"></div></div>',
  'multi-primary': '<aha-button variant="primary"></aha-button>\n<aha-button variant="primary"></aha-button>',
};
const canvasHits = {
  'canvas-hardcoded-colour': '<div style="color: #fff"></div>',
  'canvas-viewport-font': '<div style="font-size: 4vw"></div>',
  'canvas-tiny-font': '<div style="font-size: 12px"></div>',
  'canvas-hardcoded-font': '<div style="font-family: Arial"></div>',
};

for (const [rule, source] of Object.entries(productHits))
  test(`product surface reports ${rule}`, () => assert.ok(rulesOf(source).includes(rule)));
for (const [rule, source] of Object.entries(canvasHits))
  test(`canvas surface reports ${rule}`, () => assert.ok(rulesOf(source, 'canvas').includes(rule)));

test('a clean screen has no findings', () => {
  const clean = '<aha-button variant="primary">Save</aha-button>\n<div style="color: var(--aha-color-text); border-radius: 8px; font-weight: 600"></div>';
  assert.deepEqual(lintHtml(clean, { surface: 'product' }).findings, []);
});

test('findings carry rule, 1-based line, message and severity', () => {
  const [finding] = lintHtml('<p>ok</p>\n<div style="color: #abc"></div>', { surface: 'product' }).findings;
  assert.equal(finding.rule, 'raw-hex');
  assert.equal(finding.line, 2);
  assert.equal(finding.severity, 'hard');
  assert.match(finding.message, /#abc/);
});

test('overflow-x is a warning, not a hard finding', () => {
  const [finding] = lintHtml(productHits['overflow-x-scroll'], { surface: 'product' }).findings;
  assert.equal(finding.severity, 'warn');
});

test('the named rule is suppressed with a reason', () => {
  const source = '<div style="color: #abc"></div> <!-- ds-lint-allow: hex (brand logo) -->';
  assert.deepEqual(rulesOf(source), []);
});

test('several rules can be named on one marker', () => {
  const source = '<div style="color: #abc; border-radius: 10px"></div> <!-- ds-lint-allow: raw-hex,radius (legacy badge) -->';
  assert.deepEqual(rulesOf(source), []);
});

test('the wrong rule does not suppress', () => {
  const source = '<div style="color: #abc"></div> <!-- ds-lint-allow: radius (not this one) -->';
  assert.deepEqual(rulesOf(source), ['raw-hex']);
});

test('the marker only covers its own line', () => {
  const source = '<!-- ds-lint-allow: hex (above) -->\n<div style="color: #abc"></div>';
  assert.deepEqual(rulesOf(source), ['raw-hex']);
});

test('a bare marker suppresses nothing and warns', () => {
  const source = '<div style="color: #abc"></div> <!-- ds-lint-allow -->';
  const { findings } = lintHtml(source, { surface: 'product' });
  assert.deepEqual(findings.map(f => f.rule).sort(), ['ds-lint-allow-bare', 'raw-hex']);
  assert.equal(findings.find(f => f.rule === 'ds-lint-allow-bare').severity, 'warn');
});

test('a marker with rules but no reason is treated as bare', () => {
  const source = '<div style="color: #abc"></div> <!-- ds-lint-allow: hex -->';
  assert.deepEqual(rulesOf(source).sort(), ['ds-lint-allow-bare', 'raw-hex']);
});

test('iconNames overrides the bundled icon list', () => {
  const source = '<aha-icon name="custom-glyph"></aha-icon>';
  assert.equal(lintHtml(source, { surface: 'product', iconNames: ['custom-glyph'] }).findings.length, 0);
  assert.equal(lintHtml(source, { surface: 'product' }).findings[0].rule, 'unknown-icon');
});

test('an unknown surface throws', () => {
  assert.throws(() => lintHtml('', { surface: 'nope' }), /surface/);
});

test('the core module touches no node built-ins', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../lib/screen-lint.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|process\.|console\./);
});

test('naming one rule id does not silence its group sibling', () => {
  const source = '<div style="min-width: 480px; overflow-x: auto"></div> <!-- ds-lint-allow: min-width-trap (fixed rail) -->';
  assert.deepEqual(rulesOf(source), ['overflow-x-scroll']);
});

test('a short group name still covers every rule in the group', () => {
  const source = '<div style="min-width: 480px; overflow-x: auto"></div> <!-- ds-lint-allow: responsive (data table) -->';
  assert.deepEqual(rulesOf(source), []);
});

test('the documented import path resolves through the package exports map', async () => {
  const { readFile } = await import('node:fs/promises');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const { lintHtml: viaPackage } = await import(new URL('../' + pkg.exports['./screen-lint'], import.meta.url));
  assert.equal(viaPackage, lintHtml);
  const { lintHtml: viaName } = await import('@ahaslides-product/design/screen-lint');
  assert.equal(viaName, lintHtml);
});

test('a logo file inside a header is a hand-set lockup warning', () => {
  const source = '<header class="site">\n  <a href="/"><img src="/logo/thesplash.svg" alt=""><span>Docs</span></a>\n</header>';
  const findings = lintHtml(source, { surface: 'product' }).findings;
  assert.deepEqual(findings.map(f => [f.rule, f.line, f.severity]), [['hand-set-lockup', 2, 'warn']]);
});

test('a logo file inside a nav is a hand-set lockup warning', () => {
  const source = '<nav aria-label="Main">\n  <img src="https://design.ahaslides.io/logo/ahaslides-logo-white.svg" alt="AhaSlides">\n</nav>';
  assert.deepEqual(rulesOf(source), ['hand-set-lockup']);
});

test('a logo file on a brand-classed element outside a header is a hand-set lockup warning', () => {
  assert.deepEqual(rulesOf('<img className="topbar-logo" src={"/brand/thesplash.svg"} />'), ['hand-set-lockup']);
});

test('the product lockup in a header passes', () => {
  const source = '<header>\n  <a href="/"><aha-product-lockup product="Docs"></aha-product-lockup></a>\n</header>';
  assert.deepEqual(lintHtml(source, { surface: 'product' }).findings, []);
});

test('a logo file outside any header or brand slot is not a lockup', () => {
  const source = '<header><aha-product-lockup product="Docs"></aha-product-lockup></header>\n<footer><img src="/logo/thesplash.svg" alt="AhaSlides"></footer>\n<link rel="icon" href="/logo/thesplash.svg">';
  assert.deepEqual(rulesOf(source), []);
});

test('a React <Header /> or a <nav-item> does not open a header region', () => {
  const source = '<Header />\n<nav-item>Docs</nav-item>\n<footer><img src="/logo/thesplash.svg" alt="AhaSlides"></footer>';
  assert.deepEqual(rulesOf(source), []);
});

test('a class that only contains logo, such as footer-logo, is not a brand slot', () => {
  assert.deepEqual(rulesOf('<footer><img src="/logo/thesplash.svg" class="footer-logo" alt="AhaSlides"></footer>'), []);
});

test('the hand-set lockup rule is suppressed with a reason', () => {
  const source = '<header><img src="/logo/thesplash.svg" alt=""></header> <!-- ds-lint-allow: lockup (logo gallery tile) -->';
  assert.deepEqual(rulesOf(source), []);
});

test('a gradient whose stops are all one colour is a flat layer, not a gradient', () => {
  for (const source of [
    '<div style="background: linear-gradient(var(--_c), var(--_c)), var(--aha-bg-container, #FFFFFF)"></div>',
    '<div style="background: linear-gradient(to right, rgba(231, 14, 104, .05) 0%, rgba(231, 14, 104, .05) 100%)"></div>',
    '<div style="background-image: radial-gradient(circle at center, var(--tint), var(--tint))"></div>',
  ]) assert.ok(!rulesOf(source).includes('gradient-fill'), source);
});

test('a gradient that changes colour still fails, even beside a flat layer', () => {
  for (const source of [
    '<div style="background: linear-gradient(var(--a), var(--b))"></div>',
    '<div style="background: linear-gradient(90deg, red 0%, red 50%, blue 100%)"></div>',
    '<div style="background: linear-gradient(var(--c), var(--c)), radial-gradient(white, black)"></div>',
    '<div style="background: conic-gradient(from 90deg, #fff, #000)"></div>',
  ]) assert.ok(rulesOf(source).includes('gradient-fill'), source);
});

test('lib/aha-chart.js passes screen-lint with no allow marker', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../lib/aha-chart.js', import.meta.url), 'utf8');
  assert.ok(!/ds-lint-allow:[^(]*gradient/.test(source));
  assert.deepEqual(lintHtml(source, { surface: 'product' }).findings.filter(f => f.severity === 'hard'), []);
});

const shimmerCss = (stops, animated = true) => `<style>
  .sk-bar{ height:14px;
    background:linear-gradient(90deg, ${stops});
    background-size:400% 100%;${animated ? ' animation:sk-sweep 1.4s linear infinite' : ''} }
  @keyframes sk-sweep{ 0%{ background-position:100% 0 } 100%{ background-position:0 0 } }
</style>`;
const skeletonStops = 'var(--aha-bg-hover,#F7F7F7) 25%, var(--aha-split,#F1F1F1) 37%, var(--aha-bg-hover,#F7F7F7) 63%';

test('the animated grey skeleton shimmer passes the gradient rule', () => {
  assert.ok(!rulesOf(shimmerCss(skeletonStops)).includes('gradient-fill'));
  assert.ok(!rulesOf(shimmerCss('#F7F7F7 25%, #F1F1F1 37%, #F7F7F7 63%')).includes('gradient-fill'));
});

test('a static grey gradient and a coloured shimmer still fail the gradient rule', () => {
  assert.ok(rulesOf(shimmerCss(skeletonStops, false)).includes('gradient-fill'));
  assert.ok(rulesOf(shimmerCss('#F7F7F7 25%, #FFC0D9 37%, #F7F7F7 63%')).includes('gradient-fill'));
  assert.ok(rulesOf(shimmerCss('var(--aha-bg-hover,#F7F7F7), var(--aha-bg-accent,#FDE7F0)')).includes('gradient-fill'));
});

test('the DS skeleton components pass screen-lint with no gradient allow marker', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const name of ['aha-card', 'aha-statistic', 'aha-skeleton', 'aha-image', 'aha-list']) {
    const source = await readFile(new URL(`../lib/${name}.js`, import.meta.url), 'utf8');
    assert.ok(!/ds-lint-allow:[^(]*gradient/.test(source), name);
    assert.ok(!lintHtml(source, { surface: 'product' }).findings.some(f => f.rule === 'gradient-fill'), name);
  }
});

const answerRulesOf = (source, surface = 'product') =>
  rulesOf(source, surface).filter(rule => rule.startsWith('answer-colour'));

test('a green Save button background fails the answer-colour context rule', () => {
  const source = '<aha-button class="save" style="background: var(--aha-answer-correct)">Save</aha-button>';
  assert.deepEqual(answerRulesOf(source), ['answer-colour-context']);
});

test('green text fails both answer-colour rules', () => {
  const source = '<span class="answer-label" style="color: var(--aha-answer-correct)">Paris</span>';
  assert.deepEqual(answerRulesOf(source), ['answer-colour-text']);
});

test('green text on a non-answer element fails text and context', () => {
  const source = '<span class="status" style="color: var(--aha-answer-correct)">Saved</span>';
  assert.deepEqual(answerRulesOf(source).sort(), ['answer-colour-context', 'answer-colour-text']);
});

test('a red error border fails the answer-colour context rule', () => {
  const source = '<input class="email-field" style="border: 1px solid var(--aha-answer-wrong)">';
  assert.deepEqual(answerRulesOf(source), ['answer-colour-context']);
});

test('answer tokens as text colour are caught in a style object and a Tailwind value', () => {
  assert.deepEqual(answerRulesOf("const answerStyle = { color: 'var(--aha-answer-wrong)' };"), ['answer-colour-text']);
  assert.deepEqual(answerRulesOf('<p class="answer text-[var(--aha-answer-wrong)]">x</p>'), ['answer-colour-text']);
});

test('border-color and background-color are not text colours', () => {
  const source = '<div class="correct-row" style="border-color: var(--aha-answer-correct); background-color: var(--aha-answer-correct-tint-5)"></div>';
  assert.deepEqual(answerRulesOf(source), []);
});

test('the option row and badge uses of the answer tokens pass', () => {
  const optionRow = ':host([correct]) .row{ border-color:var(--aha-answer-correct);\n  background:var(--aha-answer-correct-tint-5) }';
  const badge = ':host([kind="incorrect"]) .chip{ --_cbg:var(--aha-answer-wrong-tint-5); --_cic:var(--aha-answer-wrong) }';
  const resultColumn = '.result-column.correct {\n  background: var(--aha-answer-correct);\n}';
  for (const source of [optionRow, badge, resultColumn]) assert.deepEqual(answerRulesOf(source), []);
});

test('the selector on an earlier line gives the context', () => {
  assert.deepEqual(answerRulesOf('.save-button {\n  background: var(--aha-answer-correct);\n}'), ['answer-colour-context']);
  assert.deepEqual(answerRulesOf('.verdict-badge {\n  background: var(--aha-answer-correct-tint-5);\n}'), []);
});

test('the answer-colour rules are suppressed with a reason and not by another rule', () => {
  const source = '<div class="save" style="background: var(--aha-answer-correct)"></div> <!-- ds-lint-allow: answer-colour (quiz save confirms a correct answer) -->';
  assert.deepEqual(answerRulesOf(source), []);
  assert.deepEqual(answerRulesOf(source.replace('answer-colour', 'raw-hex')), ['answer-colour-context']);
});

test('a comment that mentions an answer token is ignored', () => {
  assert.deepEqual(answerRulesOf('/* colour: var(--aha-answer-correct) is the tick */'), []);
});
