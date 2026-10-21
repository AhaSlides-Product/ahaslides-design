import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lintHtml } from '../lib/screen-lint.js';
import { buttonStyleFindingsByLine } from '../lib/screen-lint-button.js';
import { BUTTON_STYLE_RULE_FIXTURES } from './fixtures/button-style-lint.mjs';

const findingsOf = (source, surface = 'product') => lintHtml(source, { surface }).findings;
const rulesOf = (source, surface) => findingsOf(source, surface).map(f => f.rule);

for (const { rule, severity, surfaces, fail, pass } of BUTTON_STYLE_RULE_FIXTURES)
  for (const surface of surfaces) {
    fail.forEach((source, index) => test(`${surface} reports ${rule} as ${severity} (failing snippet ${index + 1})`, () => {
      const hits = findingsOf(source, surface).filter(f => f.rule === rule);
      assert.ok(hits.length > 0, source);
      assert.ok(hits.every(f => f.severity === severity), source);
    }));
    pass.forEach((source, index) => test(`${surface} does not report ${rule} (passing snippet ${index + 1})`, () =>
      assert.ok(!rulesOf(source, surface).includes(rule), source)));
  }

test('a vendored header that hand-draws Log in / Sign up and greys their hover fails on each rule line', () => {
  const source = [
    '<style>',
    '.aha-header__buttons{display:flex;gap:8px}',
    '.aha-header__button{height:40px;border:1px solid var(--aha-border);background:var(--aha-white);color:var(--aha-text)}',
    '.aha-header__button:hover{background:var(--aha-gray-10);border-color:var(--aha-gray-30)}',
    '.aha-header__button--primary{background:var(--aha-color-primary);color:var(--aha-text-inverse)}',
    '</style>',
    '<div class="aha-header__buttons"><a class="aha-header__button" href="/login">Log in</a><a class="aha-header__button aha-header__button--primary" href="/signup">Sign up</a></div>',
  ].join('\n');
  assert.deepEqual(findingsOf(source).map(f => [f.rule, f.line, f.severity]), [
    ['hand-rolled-button', 3, 'hard'],
    ['hand-rolled-button', 4, 'hard'],
    ['hand-rolled-button', 5, 'hard'],
  ]);
});

test('the same header on <aha-button>, themed through tokens, passes', () => {
  const source = [
    '<style>',
    '.aha-header__buttons{display:flex;gap:8px}',
    '.aha-header--brand aha-button{--aha-button-primary-bg:var(--aha-white);--aha-button-primary-text:var(--aha-color-primary)}',
    '</style>',
    '<div class="aha-header__buttons"><aha-button variant="secondary" size="lg" href="/login">Log in</aha-button><aha-button variant="primary" size="lg" href="/signup">Sign up</aha-button></div>',
  ].join('\n');
  assert.deepEqual(findingsOf(source), []);
});

test('the button-style group name silences both rules', () => {
  const source = '.x__button{background:var(--aha-white)} aha-button{color:var(--aha-text)} /* ds-lint-allow: button-style (a demo) */';
  assert.deepEqual(rulesOf(source, 'product'), []);
});

test('the button-style rule module touches no node built-ins', async () => {
  const source = await readFile(new URL('../lib/screen-lint-button.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|process\.|console\./);
});

for (const [name, source] of [
  ['100 KB of markup with no braces', '<p>' + 'a'.repeat(100_000) + '</p>'],
  ['an unterminated /* comment', '/*' + 'a/*'.repeat(40_000)],
  ['an unterminated <!-- comment', '<!--'.repeat(30_000)],
]) test(`the button-style rules lint ${name} in linear time`, () => {
  const started = performance.now();
  assert.equal(buttonStyleFindingsByLine(source).size, 0);
  assert.ok(performance.now() - started < 1000, `took ${Math.round(performance.now() - started)} ms`);
});
