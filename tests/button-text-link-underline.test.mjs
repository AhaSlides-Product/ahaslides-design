import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8');
const ruleFor = (state) => source.match(new RegExp(`:host\\(\\[variant=text-link\\]:not\\(\\[disabled\\]\\)\\) button:${state}\\{([^}]*)\\}`))?.[1] ?? '';

test('text-link is underlined on hover and press', () => {
  assert.match(ruleFor('hover'), /text-decoration:underline/);
  assert.match(ruleFor('active'), /text-decoration:underline/);
});
