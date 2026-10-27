import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';
import { SLIDE_RULE_FIXTURES } from './fixtures/slide-control-lint.mjs';

const findingsOf = (source, surface) => lintHtml(source, { surface }).findings;
const rulesOf = (source, surface) => findingsOf(source, surface).map(f => f.rule);

for (const { rule, severity, surfaces, fail, pass } of SLIDE_RULE_FIXTURES)
  for (const surface of surfaces) {
    fail.forEach((source, index) => test(`${surface} reports ${rule} as ${severity} (failing snippet ${index + 1})`, () => {
      const hits = findingsOf(source, surface).filter(f => f.rule === rule);
      assert.ok(hits.length > 0, source);
      assert.ok(hits.every(f => f.severity === severity), source);
    }));
    pass.forEach((source, index) => test(`${surface} does not report ${rule} (passing snippet ${index + 1})`, () =>
      assert.ok(!rulesOf(source, surface).includes(rule), source)));
  }

test('the slide control rules never run on the product surface', () => {
  const slideRules = new Set(SLIDE_RULE_FIXTURES.map(f => f.rule));
  for (const { fail } of SLIDE_RULE_FIXTURES)
    for (const source of fail)
      assert.deepEqual(rulesOf(source, 'product').filter(rule => slideRules.has(rule)), [], source);
});

test('a multi-line button reports each finding on the line that carries it', () => {
  const source = '<aha-button variant="primary"\n  size="xl">\n  Next <kbd>N</kbd>\n</aha-button>';
  assert.deepEqual(findingsOf(source, 'canvas').map(f => [f.rule, f.line]), [['button-size-xl', 2], ['hand-made-key-chip', 3]]);
});

test('a key chip after the button has closed is a warning only', () => {
  const source = '<aha-button size="lg" shortcut="N">Next</aha-button>\n<p>Press <kbd>N</kbd></p>';
  assert.deepEqual(findingsOf(source, 'canvas').map(f => [f.rule, f.severity]), [['standalone-key-chip', 'warn']]);
});

test('a ::part block ends at its closing brace', () => {
  const source = 'aha-button::part(button){\n  color: inherit;\n}\n.title{ height:40px }';
  assert.deepEqual(rulesOf(source, 'canvas'), []);
});

test('the short group name silences the button rules', () => {
  const source = '<button class="grip">Drag</button> <!-- ds-lint-allow: button (a drag grip, the DS ships none) -->';
  assert.deepEqual(rulesOf(source, 'canvas'), []);
});

test('the audience surface keeps the deck colour rule and drops the canvas font floor', () => {
  assert.deepEqual(rulesOf('<div style="color: #fff"></div>', 'audience'), ['canvas-hardcoded-colour']);
  assert.deepEqual(rulesOf('<span style="font-size: 14px"></span>', 'audience'), []);
  assert.deepEqual(rulesOf('<span style="font-size: 14px"></span>', 'canvas'), ['canvas-tiny-font']);
  assert.deepEqual(rulesOf('<div style="font-family: Arial"></div>', 'audience'), ['canvas-hardcoded-font']);
});

test('the audience surface keeps the shared rules', () => {
  assert.deepEqual(rulesOf('<div style="border-radius: 10px"></div>', 'audience'), ['radius-off-scale']);
  assert.deepEqual(rulesOf('<aha-button icon-only variant="tertiary-deck" size="touch"></aha-button>', 'audience'), ['icon-only-no-name']);
});

test('a pill radius fails only on the canvas surface', () => {
  for (const source of ['<div style="border-radius: 999px"></div>', '<div style="border-radius: var(--aha-radius-pill, 999px)"></div>']) {
    assert.deepEqual(rulesOf(source, 'canvas'), ['radius-off-scale'], source);
    assert.deepEqual(rulesOf(source, 'audience'), [], source);
    assert.deepEqual(rulesOf(source, 'product'), [], source);
  }
  assert.deepEqual(rulesOf('<div style="border-radius: 50%"></div>', 'canvas'), []);
});

test('the DS audience controls pass the audience surface', () => {
  const source = [
    '<aha-answer-list group-label="Pick one" lock-key="slide-42"></aha-answer-list>',
    '<aha-button variant="secondary-deck" size="touch" block>Upload</aha-button>',
    '<aha-button variant="tertiary-deck" size="touch" icon-only aria-label="Remove"></aha-button>',
    '<aha-audience-submit></aha-audience-submit>',
  ].join('\n');
  assert.deepEqual(findingsOf(source, 'audience'), []);
});

test('the slide rule module touches no node built-ins', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../lib/screen-lint-slide.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|process\.|console\./);
});
