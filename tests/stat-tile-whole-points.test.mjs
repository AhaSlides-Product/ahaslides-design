import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.document = { documentElement: { lang: 'en' } };
const { AhaStatTile } = await import('../lib/aha-stat-tile.js');

const change = (attributes) => {
  const tile = Object.create(AhaStatTile.prototype);
  tile.getAttribute = (name) => (name in attributes ? attributes[name] : null);
  return tile.change();
};
const points = (value, previous) => change({ value: String(value), previous: String(previous), format: 'percent' });

test('a rise under one point reads <1 pt and keeps its direction', () => {
  assert.deepEqual(points(0.453, 0.45), { direction: 'rise', text: '<1 pt' });
});
test('a fall under one point reads <1 pt and keeps its direction', () => {
  assert.deepEqual(points(0.447, 0.45), { direction: 'fall', text: '<1 pt' });
});
test('1.4 points rounds to a singular 1 pt', () => {
  assert.equal(points(0.464, 0.45).text, '1 pt');
});
test('2.6 points rounds up to 3 pts', () => {
  assert.equal(points(0.476, 0.45).text, '3 pts');
});
test('an unchanged percent value has no change', () => {
  assert.deepEqual(points(0.45, 0.45), { direction: 'flat', text: 'No change' });
});
test('a fall of several points is whole and never negative or zero-padded', () => {
  const result = points(0.41, 0.46);
  assert.deepEqual(result, { direction: 'fall', text: '5 pts' });
  assert.doesNotMatch(result.text, /-|\./);
});
test('a custom points label is used as given', () => {
  assert.equal(change({ value: '0.5', previous: '0.4', format: 'percent', 'points-label': 'điểm' }).text, '10 điểm');
});
test('a small relative change reads <1%, never a decimal', () => {
  assert.equal(change({ value: '2400010', previous: '2400000' }).text, '10 (<1%)');
  assert.equal(change({ value: '1004', previous: '1000' }).text, '4 (<1%)');
  assert.equal(change({ value: '1460', previous: '1290' }).text, '170 (13%)');
});
