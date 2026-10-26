import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8');

test('aria state attributes are observed and forwarded to the inner button', () => {
  for (const name of ['aria-expanded', 'aria-controls', 'aria-pressed', 'aria-haspopup']) {
    assert.match(source, new RegExp(`observedAttributes\\(\\) \\{[^}]*'${name}'`), name);
    assert.match(source, new RegExp(`FORWARDED_STATE = \\[[^\\]]*'${name}'`), name);
  }
  assert.match(source, /_forwardState\(\) \{/);
});
