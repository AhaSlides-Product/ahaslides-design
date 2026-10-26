import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-select.js', import.meta.url), 'utf8');

test('Escape on the open trigger closes and stops propagation, closed Escape is ignored', () => {
  assert.match(source, /e\.key === 'Escape' && this\.open\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); this\._close\(true\)/);
});

test('Escape in the list stops propagation', () => {
  assert.match(source, /case 'Escape': e\.preventDefault\(\); e\.stopPropagation\(\); this\._close\(true\)/);
});
