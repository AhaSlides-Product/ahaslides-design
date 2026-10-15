import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';
import { SETTINGS_ELEMENTS } from '../lib/settings-elements.js';

const findingsOf = (source, surface = 'settings') => lintHtml(source, { surface }).findings;
const rulesOf = (source, surface = 'settings') => findingsOf(source, surface).map(f => f.rule);

const FIXTURES = [
  {
    rule: 'raw-control',
    fail: [
      '<button class="add">Add</button>',
      '<input type="text" class="title">',
      '<select class="time"><option>10</option></select>',
      '<textarea rows="3"></textarea>',
      '<input',
      '<button',
      '<div role="switch" aria-checked="true"></div>',
      `var box = document.createElement('input');`,
      `var go = el('button', { class: 'go' }, [label]);`,
      `body.setAttribute('role', 'switch');`,
    ],
    pass: [
      '<aha-button variant="primary">Add</aha-button>',
      '<aha-input label="Title"></aha-input>',
      '<aha-switch label="Show results"></aha-switch>',
      '<aha-select label="Time limit"></aha-select>',
      `var inner = host.shadowRoot.querySelector('input');`,
      '<!-- <button>Old</button> -->',
      '// a raw <input> would fail',
      '<input type="file" hidden> <!-- ds-lint-allow: raw-control (hidden file picker behind aha-image-dropzone) -->',
      '<button class="grip">Drag</button> <!-- ds-lint-allow: control (a drag grip, the DS ships none) -->',
    ],
  },
  {
    rule: 'unregistered-element',
    fail: [
      '<aha-audience-submit>Send</aha-audience-submit>',
      '<aha-chart type="bar"></aha-chart>',
      '<aha-not-a-thing></aha-not-a-thing>',
      `var chip = el('aha-audience-chip', { label: 'A' });`,
    ],
    pass: [
      '<aha-setting-row label="Time limit"><aha-switch></aha-switch></aha-setting-row>',
      '<aha-icon name="gear"></aha-icon>',
      `var row = el('aha-option-row', { value: 'A' });`,
      '<aha-chart type="bar"></aha-chart> <!-- ds-lint-allow: unregistered-element (live preview in the panel) -->',
    ],
  },
  {
    rule: 'field-size',
    fail: [
      '<aha-number-with-unit size="large" unit="tries"></aha-number-with-unit>',
      '<aha-counted-input slot="control" size="lg" maxlength="60"></aha-counted-input>',
      '<aha-input size=large placeholder="e.g. Banana"></aha-input>',
      '<aha-select size="large"></aha-select>',
      '<aha-counted-textarea size="lg"></aha-counted-textarea>',
      `var word = el('aha-counted-input', { size: 'large', maxlength: 60 });`,
      `{ key: 'tries', label: 'Number of tries', control: { type: 'number-with-unit', size: 'lg' } },`,
      `{ key: 'word', control: { type: 'input', "size": "large" } },`,
    ],
    pass: [
      '<aha-number-with-unit unit="tries"></aha-number-with-unit>',
      '<aha-counted-input maxlength="60"></aha-counted-input>',
      '<aha-button size="small">Add</aha-button>',
      '<aha-button size="lg">Add</aha-button>',
      '<aha-segmented size="large"></aha-segmented>',
      `var go = el('aha-button', { size: 'lg' });`,
      '<!-- <aha-input size="large"> -->',
      '<aha-input size="large"> <!-- ds-lint-allow: field (preview of the audience field) -->',
    ],
  },
  {
    rule: 'input-maxlength',
    fail: [
      '<aha-input slot="control" maxlength="60" placeholder="e.g. Banana"></aha-input>',
      `var word = el('aha-input', { maxlength: 60 });`,
      `{ key: 'word', control: { type: 'input', maxlength: 60 } },`,
    ],
    pass: [
      '<aha-counted-input maxlength="60"></aha-counted-input>',
      `var word = el('aha-counted-input', { maxlength: 60 });`,
      '<aha-input placeholder="Title"></aha-input>',
    ],
  },
];

for (const { rule, fail, pass } of FIXTURES) {
  fail.forEach((source, index) => test(`settings reports ${rule} as hard (failing snippet ${index + 1})`, () => {
    const hits = findingsOf(source).filter(f => f.rule === rule);
    assert.ok(hits.length > 0, source);
    assert.ok(hits.every(f => f.severity === 'hard'), source);
  }));
  pass.forEach((source, index) => test(`settings does not report ${rule} (passing snippet ${index + 1})`, () =>
    assert.ok(!rulesOf(source).includes(rule), source)));
}

test('the allowed tag list is exactly what lib/settings.js and its imports register', () => {
  const entry = readFileSync(new URL('../lib/settings.js', import.meta.url), 'utf8');
  const entryTags = [...entry.matchAll(/import '\.\/(aha-[\w-]+)\.js'/g)].map(m => m[1]);
  assert.ok(entryTags.length > 10);
  for (const tag of entryTags) assert.ok(SETTINGS_ELEMENTS.includes(tag), tag);
  assert.ok(SETTINGS_ELEMENTS.includes('aha-icon'));
});

test('the settings rules never run on other surfaces', () => {
  const source = '<button>x</button><aha-audience-submit></aha-audience-submit>';
  for (const surface of ['product', 'canvas', 'audience'])
    assert.ok(!rulesOf(source, surface).some(rule => rule === 'raw-control' || rule === 'unregistered-element'), surface);
});

test('the product style checks still run on the settings surface', () => {
  assert.deepEqual(rulesOf('<div style="color: #ff0000"></div>'), ['raw-hex']);
  assert.deepEqual(rulesOf('<aha-setting-row label="Time limit"></aha-setting-row>'), []);
});

test('a bare ds-lint-allow suppresses nothing on the settings surface', () => {
  assert.deepEqual(rulesOf('<input> <!-- ds-lint-allow -->').sort(), ['ds-lint-allow-bare', 'raw-control']);
});

test('a field tag split across lines is still checked', () => {
  const source = '<aha-number-with-unit\n  unit="tries"\n  size="large"\n></aha-number-with-unit>\n<aha-input\n  maxlength="60">';
  assert.deepEqual(rulesOf(source).sort(), ['field-size', 'input-maxlength']);
  assert.deepEqual(findingsOf(source).map(f => f.line).sort(), [3, 6]);
});

test('a field held in a variable is checked when its size or cap is set later', () => {
  const source = [
    "const word = document.createElement('aha-input');",
    "word.setAttribute('maxlength', '60');",
    "const tries = el('aha-number-with-unit', { unit: 'tries' });",
    "tries.setAttribute('size', 'lg');",
    "const note = el('aha-counted-textarea');",
    "note.setAttribute('size', 'small');",
    "const add = el('aha-button');",
    "add.setAttribute('size', 'lg');",
  ].join('\n');
  assert.deepEqual(findingsOf(source).map(f => [f.rule, f.line]), [['input-maxlength', 2], ['field-size', 4], ['field-size', 6]]);
});

test('the field rules never run on other surfaces', () => {
  const source = '<aha-counted-input size="lg" maxlength="30"></aha-counted-input><aha-input maxlength="5">';
  for (const surface of ['product', 'canvas', 'audience'])
    assert.ok(!rulesOf(source, surface).some(rule => rule === 'field-size' || rule === 'input-maxlength'), surface);
});
