import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/aha-button.js', import.meta.url), 'utf8');
const style = source.slice(source.indexOf('const STYLE'), source.indexOf('const SPINNER'));
const declarationOf = (property) => style.match(new RegExp(`(?<![-\\w])${property}:([^;}]+)`))?.[1].trim();

const transitionedProperties = declarationOf('transition-property').split(',').map((name) => name.trim());
const stateRules = style.split('\n').filter((line) => /button:(hover|active|focus-visible)\b/.test(line));
const changedByStates = new Set(
  stateRules.flatMap((rule) => [...rule.slice(rule.indexOf('{') + 1).matchAll(/(?:^|[;\s{])([a-z-]+):/g)].map((match) => match[1])),
);

test('the label, fill, border and shadow share one transition with a single duration and easing', () => {
  assert.equal(style.match(/(?<![-\w])transition:(?!none)/g), null, 'use transition-property so every property shares one timing');
  assert.match(declarationOf('transition-duration'), /^var\(--aha-motion-mid,\.2s\)$/);
  assert.match(declarationOf('transition-timing-function'), /^var\(--aha-ease-in-out,/);
});

test('every property a state rule changes is in the transition list', () => {
  const animatable = ['background', 'border-color', 'box-shadow', 'color', 'text-decoration-color', 'text-decoration', 'opacity'];
  for (const property of changedByStates) {
    if (!animatable.includes(property)) continue;
    const covered = transitionedProperties.includes(property) || (property === 'text-decoration' && transitionedProperties.includes('text-decoration-color'));
    assert.ok(covered, `${property} changes on a state but is not transitioned`);
  }
  for (const required of ['background', 'border-color', 'box-shadow', 'color']) assert.ok(changedByStates.has(required));
});
