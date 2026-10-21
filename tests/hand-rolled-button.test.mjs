import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';

const rulesOf = (source, surface = 'product') => lintHtml(source, { surface }).findings.map((finding) => finding.rule);
const flagged = (source, surface) => rulesOf(source, surface).includes('hand-rolled-button');
const style = (css) => `<style>\n${css}\n</style>`;

const GAMES_HEADER = style(`.aha-header__button{
  display:inline-flex;align-items:center;justify-content:center;
  height:var(--aha-control-height-button-lg);
  padding:0 var(--aha-space-20);
  border:1px solid var(--aha-border-strong);
  border-radius:var(--aha-radius-default);
  background:var(--aha-white);color:var(--aha-text-default);
}
.aha-header__button:hover{background:var(--aha-gray-10);border-color:var(--aha-gray-20)}
.aha-header__button--primary{background:var(--aha-button-primary-bg);color:var(--aha-button-primary-text)}`) +
  '\n<a class="aha-header__button" href="/login">Log in</a><a class="aha-header__button aha-header__button--primary" href="/signup">Sign up</a>';

const FAIL = {
  'the games header Log in / Sign up with a grey hover': GAMES_HEADER,
  'a grey hover added on its own': style('.aha-header__button:hover{background:var(--aha-gray-10)}'),
  'a btn class with a fill and a radius': style('.signup-btn{background:var(--aha-color-primary);border-radius:var(--aha-radius-default)}'),
  'a cta class with a fill and a height': style('.hero__cta{background:var(--aha-white);height:52px}'),
  'a raw button element painted as a button': style('button.join{background:var(--aha-gray-90);padding:0 12px}'),
  'a role=button div': style('[role="button"]{background:var(--aha-white);border:1px solid var(--aha-border-strong)}'),
  'a link drawn as a pill': style('.nav a.pill{background:var(--aha-color-primary);border-radius:999px}'),
  'aha-button re-coloured': style('aha-button{background:var(--aha-gray-10)}'),
  'aha-button given its own hover': style('aha-button:hover{opacity:.9}'),
  'aha-button resized': style('.toolbar aha-button{height:44px}'),
  'aha-button part re-hovered': style('aha-button::part(button):hover{background:var(--aha-gray-10)}'),
  'a .aha-button class restyled': style('.aha-button{box-shadow:none}'),
  'a --aha-button-* token redefined': style('.header{--aha-button-default-bg-hover:var(--aha-gray-10)}'),
  'a selector list that ends on a button class': style('.a,\n.b .x-btn{background:red;border-radius:4px}'),
};

const PASS = {
  'a plain text link': style('.footer a{color:var(--aha-text-link);text-decoration:underline}\n.footer a:hover{color:var(--aha-color-primary-hover)}'),
  'an icon-only button reset': style('.toggle-button{background:none;border:0;padding:0;cursor:pointer}\n.toggle-button:focus-visible{outline:2px solid var(--aha-focus)}'),
  'a transparent icon button with a radius': style('.close-btn{background:transparent;border-radius:var(--aha-radius-default)}'),
  'layout on aha-button': style('.aha-header__buttons aha-button{flex:1}\n.form aha-button{width:100%;margin-top:8px;align-self:stretch}'),
  'a buttons row container': style('.aha-header__buttons{display:flex;gap:16px;background:var(--aha-white);padding:8px}'),
  'a card that is not a button': style('.card{background:var(--aha-white);border-radius:var(--aha-radius-lg);padding:24px}'),
  'a link hover colour only': style('.menu a:hover{color:var(--aha-color-primary)}'),
  'the DS markup': '<aha-button variant="secondary" size="lg" href="/login">Log in</aha-button><aha-button variant="primary" size="lg" href="/signup">Sign up</aha-button>',
  'an opted-out control the DS does not ship': style('.seek-grip{background:var(--aha-white);border-radius:50%} /* ds-lint-allow: hand-rolled-button (seek-bar grip, no DS control) */'),
  'an opted-out token re-theme': style('.brand aha-button{--aha-button-primary-bg:var(--aha-white)} /* ds-lint-allow: hand-rolled-button (no on-brand variant yet) */'),
  'the DS token sheet vendored as-is': style(':root{--aha-button-primary-bg:var(--aha-color-primary);--aha-button-default-bg:var(--aha-white)}'),
};

for (const [name, source] of Object.entries(FAIL))
  test(`hand-rolled-button fails: ${name}`, () => assert.ok(flagged(source), rulesOf(source).join(', ')));

for (const [name, source] of Object.entries(PASS))
  test(`hand-rolled-button passes: ${name}`, () => assert.ok(!flagged(source), rulesOf(source).join(', ')));

test('hand-rolled-button runs on every surface', () => {
  for (const surface of ['product', 'canvas', 'audience', 'settings']) assert.ok(flagged(GAMES_HEADER, surface), surface);
});

test('hand-rolled-button reports the line the rule starts on', () => {
  const finding = lintHtml(style('.x{}\n.signup-btn{\n  background:red;\n  border-radius:4px;\n}'), { surface: 'product' }).findings.find((item) => item.rule === 'hand-rolled-button');
  assert.equal(finding.line, 3);
});

test('a bare ds-lint-allow does not silence hand-rolled-button', () => {
  assert.ok(flagged(style('.signup-btn{background:red;border-radius:4px} /* ds-lint-allow */')));
});

test('every marketing section draws its buttons with <aha-button>', () => {
  const directory = new URL('../marketing/', import.meta.url);
  for (const file of readdirSync(directory).filter((name) => name.endsWith('.json'))) {
    const section = JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
    const layouts = section.layouts || [section];
    for (const layout of layouts) {
      const source = style([section.baseCss, layout.css].filter(Boolean).join('\n')) + '\n' + (layout.html || '');
      const hits = lintHtml(source, { surface: 'product' }).findings.filter((finding) => finding.rule === 'hand-rolled-button');
      assert.deepEqual(hits.map((hit) => hit.message), [], `${file} ${layout.slug || ''}`);
    }
  }
});
