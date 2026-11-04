import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const rulesOf = (source) => lintHtml(source, { surface: 'product' }).findings.map((f) => f.rule);

test('size inline without variant text-link fails, including the React default', () => {
  assert.ok(rulesOf('<aha-button size="inline">Show</aha-button>').includes('inline-button'));
  assert.ok(rulesOf('<aha-button variant="link" size="inline">Show</aha-button>').includes('inline-button'));
  assert.ok(rulesOf('<AhaButton size="inline" onClick={() => go()}>Show</AhaButton>').includes('inline-button'));
});

test('a shortcut on an inline button fails', () => {
  assert.ok(rulesOf('<aha-button variant="text-link" size="inline" shortcut="Mod+K">Show</aha-button>').includes('inline-button'));
});

test('the approved form, other sizes and an allow comment pass', () => {
  assert.ok(!rulesOf('<aha-button variant="text-link" size="inline">Show</aha-button>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button variant="text-link" size="inline" aria-label="shortcut help">Show</aha-button>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button size="sm" shortcut="Mod+K">Save</aha-button>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button size="inline">Show</aha-button> <!-- ds-lint-allow: inline-button (legacy) -->').includes('inline-button'));
});
