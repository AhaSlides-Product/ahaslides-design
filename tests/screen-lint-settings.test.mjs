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
