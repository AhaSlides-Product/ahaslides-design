import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const browserFiles = readdirSync(new URL('../lib/', import.meta.url))
  .filter((name) => name.endsWith('.js') && !name.startsWith('screen-lint'));

test('browser-shipped lib files use no regex lookbehind (Safari below 16.4 cannot parse it)', () => {
  for (const name of browserFiles) {
    const source = readFileSync(new URL(`../lib/${name}`, import.meta.url), 'utf8');
    assert.ok(!/\(\?<[=!]/.test(source), `${name} contains a regex lookbehind`);
  }
});

test('browser-shipped lib files declare no static class field (Safari below 14.1 cannot parse it)', () => {
  for (const name of browserFiles) {
    const source = readFileSync(new URL(`../lib/${name}`, import.meta.url), 'utf8');
    assert.ok(!/^\s*static\s+#?[\w$]+\s*(=|;)/m.test(source), `${name} contains a static class field`);
  }
});
