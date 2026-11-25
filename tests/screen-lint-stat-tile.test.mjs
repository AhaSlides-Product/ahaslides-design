import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const hits = (source, surface = 'product') =>
  lintHtml(source, { surface }).findings.filter((f) => f.rule === 'stat-tile-accent');

const tile = (look) => `<aha-stat-tile label="Users" value="10"${look ? ` look="${look}"` : ''}></aha-stat-tile>`;

test('a second accent Stat tile in one product file hard-fails, citing rules 3.7 and 6.8', () => {
  const found = hits([tile('accent'), tile('accent'), tile('accent')].join('\n'));
  assert.deepEqual(found.map((f) => [f.line, f.severity]), [[2, 'hard'], [3, 'hard']]);
  assert.match(found[0].message, /3\.7/);
  assert.match(found[0].message, /6\.8/);
});

test('plain tiles with one accent tile pass, however many plain ones there are', () => {
  assert.equal(hits([tile(), tile('plain'), tile('accent'), tile(), tile(), tile()].join('\n')).length, 0);
});

test('React and Vue spellings of look=accent count, a multi-line tag included', () => {
  assert.equal(hits('<AhaStatTile look="accent" label="A" />\n<AhaStatTile look={"accent"} label="B" />').length, 1);
  assert.equal(hits('<aha-stat-tile :look="\'accent\'" :label="a"></aha-stat-tile>\n<aha-stat-tile\n  look="accent"\n  label="B"></aha-stat-tile>').length, 1);
});

test('ds-lint-allow: stat-tile-accent with a reason opts a tile out; the other surfaces are not checked', () => {
  const allowed = `${tile('accent')}\n${tile('accent')} <!-- ds-lint-allow: stat-tile-accent (report page, rule 3.11) -->`;
  assert.equal(hits(allowed).length, 0);
  assert.equal(hits([tile('accent'), tile('accent')].join('\n'), 'settings').length, 0);
});

test('an accent tile inside an HTML comment does not count, single or multi-line', () => {
  assert.equal(hits(`<!-- ${tile('accent')} -->\n${tile('accent')}`).length, 0);
  assert.equal(hits(`<!--\n${tile('accent')}\n-->\n${tile('accent')}`).length, 0);
  assert.deepEqual(hits(`<!-- ${tile('accent')} -->\n${tile('accent')}\n${tile('accent')}`).map((f) => f.line), [3]);
});

const three = [tile('accent'), tile('accent'), tile('accent')].join('\n');
const metaReport = '<meta name="aha-surface" content="report">';

test('a page with the report surface meta may carry any number of accent tiles', () => {
  assert.equal(hits(`<head>${metaReport}</head>\n${three}`).length, 0);
});

test('the same page without the meta still fails the second and third accent tile', () => {
  assert.equal(hits(`<head></head>\n${three}`).length, 2);
});

test('the report meta inside an HTML comment does not exempt the page', () => {
  assert.equal(hits(`<!-- ${metaReport} -->\n${three}`).length, 2);
});

test('the report meta works with its attributes in either order', () => {
  assert.equal(hits(`<META CONTENT='report' NAME='aha-surface'>\n${three}`).length, 0);
});
