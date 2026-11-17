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

test('a large size written as a backtick, Vue-bound or JSX literal passes', () => {
  for (const source of [
    'el(\'aha-input\', { size: `lg` })',
    `<aha-input :size="'lg'"></aha-input>`,
    '<aha-input size={"lg"} />',
    `<aha-input size={'large'} />`,
  ]) assert.deepEqual(hits(source), [], source);
  assert.equal(hits(`<aha-input :size="'sm'"></aha-input>`).length, 1);
});

test('a size that is not a literal is skipped, never a hard failure', () => {
  for (const source of [
    `const SIZE = 'lg';\nel('aha-input', { size: SIZE });`,
    '<aha-input size="${size}"></aha-input>',
    '<aha-input :size="fieldSize"></aha-input>',
    '<aha-input size={size} />',
    `el('aha-input', { ...props });`,
    `el('aha-input', props);`,
    `const f = Object.assign(document.createElement('aha-input'), { size: 'lg' });`,
  ]) assert.deepEqual(hits(source), [], source);
});

test('a developer request on the setAttribute line keeps another size', () => {
  const source = `const f = document.createElement('aha-input');\nf.setAttribute('size', 'sm'); // ds-lint-allow: size (developer request: compact)`;
  assert.deepEqual(hits(source), []);
  const found = hits(source.replace(/ \/\/ ds-lint-allow.*/, ''));
  assert.equal(found.length, 1);
  assert.match(found[0].message, /setAttribute/);
});

test('fields inside block and HTML comments are not linted', () => {
  assert.deepEqual(hits('/*\n  <aha-input></aha-input>\n*/'), []);
  assert.deepEqual(hits('<!--\n  <aha-input></aha-input>\n-->'), []);
  assert.equal(hits('/* note */ <aha-input></aha-input>').length, 1);
});

test('a setter is only searched from its own declaration to the next one of the same name', () => {
  const lateSetter = `const f = document.createElement('aha-input');\nconst f2 = 1;\nf = document.createElement('aha-select');\nf.size = 'lg';`;
  assert.equal(hits(lateSetter).length, 1);
  const other = `const f = document.createElement('aha-input');\nconst g = document.createElement('aha-select');\ng.size = 'lg';`;
  assert.equal(hits(other).length, 1);
});

test('size is read only from the props argument of el(), not from its children', () => {
  assert.equal(hits(`el('aha-input', {}, [el('aha-button', { size: 'lg' })])`).length, 1);
  assert.deepEqual(hits(`el('aha-input', { size: 'lg' }, [el('aha-button', { size: 'sm' })])`), []);
  assert.deepEqual(hits(`el('aha-input', {\n  // don't shrink it\n  size: 'lg',\n});`), []);
});

test('a size read from another attribute value or a longer value does not count as large', () => {
  for (const source of [
    '<aha-input placeholder="Preferred size=lg"></aha-input>',
    '<aha-input size="lg other"></aha-input>',
    `<aha-input :placeholder="'size=lg'"></aha-input>`,
    '<aha-input title={"size=lg"} />',
    `el('aha-input', { placeholder: 'size: "lg"' })`,
    `el('aha-input', { placeholder: "size: 'lg'" })`,
  ]) assert.equal(hits(source).length, 1, source);
  assert.deepEqual(hits('<aha-input placeholder="Pick a size" size="lg"></aha-input>'), []);
  assert.deepEqual(hits(`el('aha-input', { placeholder: 'size: lg', size: 'lg' })`), []);
});

test('the explicit rule id needs the developer request as the size alias does', () => {
  const marker = (reason) => `<aha-input></aha-input> <!-- ds-lint-allow: audience-field-size (${reason}) -->`;
  assert.equal(hits(marker('looks tidier')).length, 1);
  assert.deepEqual(hits(marker('developer request: compact code box')), []);
});

test('comment stripping stays linear on pathological input', () => {
  const started = Date.now();
  hits('/*'.repeat(30000) + 'a/*'.repeat(30000));
  hits('<!--'.repeat(30000));
  assert.ok(Date.now() - started < 2000);
});

test('naming audience-button-size explicitly still silences it without a reason, as before', () => {
  const source = '<aha-button size="sm">Skip</aha-button> <!-- ds-lint-allow: audience-button-size (compact) -->';
  assert.deepEqual(lintHtml(source, { surface: 'audience' }).findings.filter((f) => f.rule === 'audience-button-size'), []);
});
