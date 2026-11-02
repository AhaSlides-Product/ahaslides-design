import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { MARKETING_UNSTYLED_HOOKS } from '../lib/marketing-unstyled-hooks.js';
import { collectUnstyledHooks } from '../lib/collect-unstyled-hooks.js';

const folder = new URL('../marketing/', import.meta.url);
const documents = readdirSync(folder).filter((file) => file.endsWith('.json')).map((file) => JSON.parse(readFileSync(new URL(file, folder), 'utf8')));

test('the generated unstyled-hook module matches the marketing snippets', () => {
  assert.deepEqual(MARKETING_UNSTYLED_HOOKS, collectUnstyledHooks(documents));
  assert.ok(MARKETING_UNSTYLED_HOOKS.length > 0);
});

test('a hook stays exempt only when no snippet or shared stylesheet styles it', () => {
  assert.ok(MARKETING_UNSTYLED_HOOKS.includes('aha-faq__list'));
  assert.ok(!MARKETING_UNSTYLED_HOOKS.includes('aha-marketing-card__text'));
});
