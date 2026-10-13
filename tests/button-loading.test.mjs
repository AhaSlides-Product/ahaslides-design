import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8');
const style = source.slice(source.indexOf('const STYLE'), source.indexOf('const SPINNER'));

test('the spinner is sized by its own rule, not inside an invalid ::slotted(...) descendant selector', () => {
  assert.match(style, /(?:^|\n)\s*\.spin\{[^}]*width:16px;\s*height:16px/);
  for (const selectorList of style.match(/[^{}]+(?=\{)/g)) {
    assert.ok(!/::slotted\([^)]*\)\s+[\w.[]/.test(selectorList), `invalid selector: ${selectorList.trim()}`);
  }
});

test('the spinner draws in the label colour of the variant', () => {
  assert.match(source, /class="spin"[^>]*><circle[^>]*stroke="currentColor"/);
});
