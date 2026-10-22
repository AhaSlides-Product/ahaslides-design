import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';
import { COPY_RULE_FIXTURES } from './fixtures/copy-lint.mjs';

const SURFACES = ['product', 'settings', 'canvas', 'audience'];
const findingsOf = (source, surface, path) => lintHtml(source, { surface, path }).findings;

for (const { rule, fail, pass } of COPY_RULE_FIXTURES)
  for (const surface of SURFACES) {
    fail.forEach((source, index) => test(`${surface} reports ${rule} as hard (failing snippet ${index + 1})`, () => {
      const hits = findingsOf(source, surface).filter(f => f.rule === rule);
      assert.ok(hits.length > 0, source);
      assert.ok(hits.every(f => f.severity === 'hard'), source);
    }));
    pass.forEach((source, index) => test(`${surface} does not report ${rule} (passing snippet ${index + 1})`, () =>
      assert.ok(!findingsOf(source, surface).some(f => f.rule === rule), source)));
  }

test('a finding names the UXW reference and gives the fix', () => {
  const messages = Object.fromEntries(['<p>a \u2014 b</p>', '<p>Oops</p>', '<p>Word Cloud</p>']
    .flatMap(source => findingsOf(source, 'product').map(f => [f.rule, f.message])));
  assert.match(messages['no-dash-punctuation'], /UXW-8.*full stop/);
  assert.match(messages['vague-error-copy'], /UXW-2.*next step/);
  assert.match(messages['title-case-slide-name'], /UXW-1.*"Word cloud"/);
});

test('a finding sits on the line that carries the text', () => {
  const hit = findingsOf('<p>fine</p>\n<p>\n  bad \u2014 text\n</p>', 'product').find(f => f.rule === 'no-dash-punctuation');
  assert.equal(hit.line, 3);
});

test('a script file is scanned for UI text keys only', () => {
  const source = `const label = 'a \u2014 b';\nconst field = { label: 'a \u2014 b' };`;
  const lines = findingsOf(source, 'settings', 'panel.js').filter(f => f.rule === 'no-dash-punctuation').map(f => f.line);
  assert.deepEqual(lines, [2]);
});

test('a name-only allow marker silences just that rule', () => {
  const source = '<p>Oops \u2014 no</p> <!-- ds-lint-allow: vague-error-copy (quoted) -->';
  assert.deepEqual(findingsOf(source, 'product').map(f => f.rule), ['no-dash-punctuation']);
});

test('a trailing line comment in a script is not UI copy, a // inside a string is kept', () => {
  const source = `<script>\nrun(); // label: "Oops"\nconst field = { label: "Oops // really" };\nconst url = 'https://x.test'; el.title = "Oops";\n</script>`;
  const lines = findingsOf(source, 'product').filter(f => f.rule === 'vague-error-copy').map(f => f.line);
  assert.deepEqual(lines, [3, 4]);
});

test('a regex literal ending in // or holding a quote does not hide later copy on its line', () => {
  const source = `<script>\nconst slash = /a\\//; el.title = "Oops";\nconst quoted = /["']/g; el.title = "Oops";\nconst ratio = total / count; el.title = "Oops"; // label: "Oops"\n</script>`;
  const lines = findingsOf(source, 'product').filter(f => f.rule === 'vague-error-copy').map(f => f.line);
  assert.deepEqual(lines, [2, 3, 4]);
});
