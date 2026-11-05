import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./category-chip.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const measure = String.raw`(() => {
  const box = (el) => {
    const s = getComputedStyle(el);
    return { height: s.height, padding: s.padding, bg: s.backgroundColor, border: s.borderTopColor, color: s.color,
      fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight, gap: s.columnGap };
  };
  const chip = (id) => document.getElementById(id).shadowRoot.querySelector('.chip');
  const square = getComputedStyle(document.querySelector('#discourse .badge-category'), '::before').display;
  return { elSm: box(chip('el-sm')), elMd: box(chip('el-md')), cssSm: box(document.getElementById('css-sm')),
    cssMd: box(document.getElementById('css-md')), discourse: box(document.getElementById('discourse')), square,
    elMdIcon: chip('el-md').querySelector('aha-icon').getAttribute('size') };
})()`;

test('category chip: the host CSS layer and the Discourse mapping draw the same box as <aha-tag color="category">', { skip }, async () => {
  const r = await evaluateInPage(fixture, measure, { readyExpr: 'window.tagFixtureReady === true' });
  assert.deepEqual(r.cssSm, r.elSm);
  assert.deepEqual(r.cssMd, r.elMd);
  assert.deepEqual(r.discourse, r.elMd);
  assert.equal(r.elSm.bg, 'rgba(0, 0, 0, 0)');
  assert.equal(r.elSm.height, '20px');
  assert.equal(r.elMd.height, '24px');
  assert.equal(r.elMdIcon, '16');
  assert.equal(r.square, 'none');
});
