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

test('a shortcut prop fails in any form, the word inside another prop passes', () => {
  assert.ok(rulesOf('<AhaButton variant="text-link" size="inline" shortcut={key}>Show</AhaButton>').includes('inline-button'));
  assert.ok(rulesOf('<aha-button variant="text-link" size="inline" :shortcut="key">Show</aha-button>').includes('inline-button'));
  assert.ok(rulesOf('<AhaButton variant="text-link" size="inline" shortcut>Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton variant="text-link" size="inline" onClick={shortcut}>Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton variant="text-link" size="inline" onClick={() => { run({ shortcut }); }}>Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button variant="text-link" size="inline" data-shortcut="help">Show</aha-button>').includes('inline-button'));
});

test('a variant or size known only at runtime never fails, a fixed wrong variant does', () => {
  assert.ok(!rulesOf('<AhaButton variant={kind} size="inline">Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton variant={busy ? "text-link" : "link"} size="inline">Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button :variant="kind" size="inline">Show</aha-button>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton {...linkProps} size="inline">Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<aha-button v-bind="linkProps" size="inline">Show</aha-button>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton size={compact ? "inline" : "sm"}>Show</AhaButton>').includes('inline-button'));
  assert.ok(!rulesOf('<AhaButton variant={"text-link"} size={"inline"}>Show</AhaButton>').includes('inline-button'));
  assert.ok(rulesOf('<AhaButton variant={"link"} size={"inline"}>Show</AhaButton>').includes('inline-button'));
  assert.ok(rulesOf('<aha-button data-variant="text-link" size="inline">Show</aha-button>').includes('inline-button'));
});
