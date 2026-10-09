import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8');

test('every hover and active rule of a variant skips disabled buttons', () => {
  const rules = source.split('\n').filter((line) => /button:(hover|active)\b/.test(line) && line.includes(':host('));
  assert.ok(rules.length > 10);
  for (const rule of rules) assert.match(rule, /:not\(\[disabled\]\)/, rule.trim().slice(0, 80));
});
