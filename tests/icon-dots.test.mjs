import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findStrokedDots, parseSubpaths } from '../icon-dots.mjs';

const svgRoot = fileURLToPath(new URL('../icons/svg', import.meta.url));

test('a stroked closed subpath smaller than its stroke width is flagged', () => {
  const hollowDot = '<svg viewBox="0 0 16 16"><path d="M5.375 6.41667C5.44 6.41667 5.5 6.47 5.5 6.54C5.5 6.61 5.44 6.67 5.375 6.67C5.31 6.67 5.25 6.61 5.25 6.54C5.25 6.47 5.31 6.41667 5.375 6.41667Z" fill="#4A4A4A" stroke="#4A4A4A" stroke-width="1.5"/></svg>';
  assert.equal(findStrokedDots(hollowDot).length, 1);
});

test('a dot that shares a path with a larger subpath is flagged by subpath index', () => {
  const mixed = '<svg viewBox="0 0 16 16"><path d="M1 1H9V9H1ZM5 5C5.1 5 5.2 5.1 5.2 5.2C5.2 5.3 5.1 5.4 5 5.4C4.9 5.4 4.8 5.3 4.8 5.2C4.8 5.1 4.9 5 5 5Z" stroke="#4A4A4A" stroke-width="1.5"/></svg>';
  assert.deepEqual(findStrokedDots(mixed).map(hit => hit.subpathIndex), [1]);
});

test('a filled circle without stroke and a stroked open line are not flagged', () => {
  assert.equal(findStrokedDots('<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="1" fill="#4A4A4A"/><path d="M8 8L8 8.1" stroke="#4A4A4A" stroke-width="1.5"/></svg>').length, 0);
});

test('relative commands accumulate from the current point', () => {
  const [sub] = parseSubpaths('M2 2l1 0l0 1z');
  assert.deepEqual([sub.minX, sub.maxX, sub.minY, sub.maxY, sub.closed], [2, 3, 2, 3, true]);
});

test('no source icon draws a dot as a stroked closed path smaller than its stroke width', () => {
  const offenders = readdirSync(svgRoot).flatMap(family => readdirSync(join(svgRoot, family))
    .filter(file => file.endsWith('.svg') && findStrokedDots(readFileSync(join(svgRoot, family, file), 'utf8')).length)
    .map(file => `${family}/${file}`));
  assert.deepEqual(offenders, []);
});
