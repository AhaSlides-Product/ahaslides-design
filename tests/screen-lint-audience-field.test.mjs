import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const RULE = 'audience-field-size';
const hits = (source, surface = 'audience', path = '') =>
  lintHtml(source, { surface, path }).findings.filter((f) => f.rule === RULE);

const FAILING = [
  '<aha-counted-input maxlength="30"></aha-counted-input>',
  '<aha-input placeholder="Your name"></aha-input>',
  '<aha-counted-textarea maxlength="200"></aha-counted-textarea>',
  '<aha-select options=\'[]\'></aha-select>',
  '<aha-autocomplete options=\'[]\'></aha-autocomplete>',
  '<aha-counted-input size="md"></aha-counted-input>',
  '<aha-counted-input size="small"></aha-counted-input>',
  `var field = el('aha-counted-input', { maxlength: '30' });`,
  `var field = el('aha-input', { size: 'sm' });`,
  `var pick = document.createElement('aha-select');\npick.setAttribute('size', 'sm');`,
];
const PASSING = [
  '<aha-counted-input size="lg" maxlength="30"></aha-counted-input>',
  '<aha-counted-textarea size="large"></aha-counted-textarea>',
  '<aha-select size="lg" options=\'[]\'></aha-select>',
  '<aha-autocomplete size="large"></aha-autocomplete>',
  '<aha-input\n  placeholder="Your name"\n  size="lg">\n</aha-input>',
  `var field = el('aha-counted-input', { size: 'lg', maxlength: '30' });`,
  `var field = el(doc, 'aha-input', {\n  placeholder: 'Name',\n  size: 'large',\n});`,
  `var field = document.createElement('aha-counted-input');\nfield.setAttribute('size', 'lg');`,
  `var area = document.createElement('aha-counted-textarea');\narea.size = 'lg';`,
  '<aha-audience-field label="Name"><aha-counted-input size="lg"></aha-counted-input></aha-audience-field>',
  '<aha-checkbox></aha-checkbox> <aha-button size="touch">Send</aha-button>',
  '// <aha-input> is not allowed here',
];

FAILING.forEach((source, index) => test(`audience reports ${RULE} as hard (failing snippet ${index + 1})`, () => {
  const found = hits(source);
  assert.ok(found.length > 0, source);
  assert.ok(found.every((f) => f.severity === 'hard'), source);
}));
PASSING.forEach((source, index) => test(`audience does not report ${RULE} (passing snippet ${index + 1})`, () =>
  assert.deepEqual(hits(source), [], source)));

test('a multi-line field is reported on the line that opens it', () => {
  assert.deepEqual(hits('<p>Name</p>\n<aha-input\n  placeholder="Name">\n</aha-input>').map((f) => f.line), [2]);
});

test('every unsized field on a page is reported once each', () => {
  assert.equal(hits('<aha-input></aha-input>\n<aha-select></aha-select>').length, 2);
});

test('the rule also fires on self-paced-view pages linted as canvas', () => {
  for (const path of ['self-paced-view.js', 'self-paced-view.html', 'src/self-paced-view.js'])
    assert.equal(hits('<aha-counted-input></aha-counted-input>', 'canvas', path).length, 1, path);
  assert.deepEqual(hits('<aha-counted-input size="lg"></aha-counted-input>', 'canvas', 'self-paced-view.js'), []);
});

test('an unrelated page is untouched, a settings page is never held to the audience size', () => {
  const source = '<aha-counted-input></aha-counted-input>';
  assert.deepEqual(hits(source, 'canvas', 'presenter.js'), []);
  assert.deepEqual(hits(source, 'product', 'self-paced-view.js').length, 1);
  assert.deepEqual(hits(source, 'product', 'report.js'), []);
  assert.deepEqual(hits(source, 'settings', 'self-paced-view.js'), []);
});

test('a developer request on the declaring line keeps another size', () => {
  const requested = '<aha-input></aha-input> <!-- ds-lint-allow: size (developer request: compact code box) -->';
  assert.deepEqual(hits(requested), []);
  assert.deepEqual(hits(requested.replace('size (', 'audience-field-size (')), []);
  const multiLine = '<aha-input\n  placeholder="x"> <!-- ds-lint-allow: size (developer request: tiny) -->\n</aha-input>';
  assert.deepEqual(hits(multiLine), []);
});

test('an allow marker without a developer request still fails and warns', () => {
  const source = '<aha-input></aha-input> <!-- ds-lint-allow: size (looks tidier) -->';
  assert.equal(hits(source).length, 1);
  assert.ok(lintHtml(source, { surface: 'audience' }).findings.some((f) => f.rule === 'ds-lint-allow-size-reason'));
});
