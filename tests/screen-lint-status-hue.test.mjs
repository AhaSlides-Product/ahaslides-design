import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const SURFACES = ['product', 'settings', 'website', 'canvas', 'audience'];
const hardRulesOf = (source, surface = 'product') =>
  lintHtml(source, { surface }).findings.filter((f) => f.severity === 'hard').map((f) => f.rule);

const CASES = {
  'status-hue-class': {
    fail: [
      '<div id="login-error-msg" class="text-sm text-red-100" v-if="textError">',
      '<p :class="{ \'text-green-50\': saved }">Saved</p>',
      '<span className="bg-yellow-10 border-l-amber-500">Check this</span>',
      '<small class="text-danger">Required</small>',
      '.error { @apply hover:text-red-500; }',
    ],
    pass: [
      '<div class="text-sm text-black-100">',
      '<div class="text-gray-100 bg-white border-pink-100">',
      '<span class="answer-correct bg-green-10">Paris</span>',
      '<aha-field-error>This password is not correct.</aha-field-error>',
      '<!-- the old text-red-100 error line -->',
      '.x { color: var(--aha-text-negative); }',
    ],
  },
  'foreign-icon-library': {
    fail: [
      '<font-awesome-icon :icon="[\'fas\', \'exclamation-triangle\']" />',
      '<FontAwesomeIcon icon={faCheck} />',
      "const { faCheck } = require('@fortawesome/free-solid-svg-icons')",
      '<i class="fas fa-exclamation-triangle"></i>',
      '<i class="zmdi zmdi-close"></i>',
      '<span class="material-icons">close</span>',
      '<i class="ti-close"></i>',
    ],
    pass: [
      '<aha-icon name="system-warning" size="16"></aha-icon>',
      '<div class="multi-select fast-path">',
      '<p>We replaced Font Awesome with the DS icons.</p>',
    ],
  },
  'brand-logo-colour': {
    fail: [
      '<aha-antd-button variant="secondary" icon-maintain-color icon-name="gg">',
      '<img src="https://design.ahaslides.io/logo/original/google.svg" alt="">',
    ],
    pass: [
      '<img src="https://design.ahaslides.io/logo/google.svg" alt="">',
      '<img class="brand-logo-original" src="https://design.ahaslides.io/logo/original/google.svg" alt="">',
      '<img src="/logo/original/zoom.svg" alt="Zoom"> <!-- ds-lint-allow: brand-logo (Marketplace listing, logos are the content) -->',
    ],
  },
};

for (const [rule, { fail, pass }] of Object.entries(CASES))
  for (const surface of SURFACES) {
    fail.forEach((source, index) => test(`${surface} reports ${rule} as hard (failing snippet ${index + 1})`, () =>
      assert.ok(hardRulesOf(source, surface).includes(rule), source)));
    pass.forEach((source, index) => test(`${surface} does not report ${rule} (passing snippet ${index + 1})`, () =>
      assert.ok(!lintHtml(source, { surface }).findings.some((f) => f.rule === rule), source)));
  }

test('the login error line reports both rules on the lines that carry them', () => {
  const source = '<div id="login-error-msg" class="text-sm text-red-100" v-if="textError">\n  <font-awesome-icon :icon="[\'fas\', \'exclamation-triangle\']" />\n</div>';
  const findings = lintHtml(source, { surface: 'product' }).findings;
  assert.equal(findings.find((f) => f.rule === 'status-hue-class').line, 1);
  assert.equal(findings.find((f) => f.rule === 'foreign-icon-library').line, 2);
  assert.match(findings.find((f) => f.rule === 'status-hue-class').message, /<aha-field-error>/);
});

test('ds-lint-allow names the group or the rule to silence a line', () => {
  assert.ok(!hardRulesOf('<b class="text-red-100"></b> <!-- ds-lint-allow: status-hue (legacy screen, migrating) -->').includes('status-hue-class'));
  assert.ok(!hardRulesOf('<i class="fa fa-x"></i> <!-- ds-lint-allow: icon (legacy screen, migrating) -->').includes('foreign-icon-library'));
});
