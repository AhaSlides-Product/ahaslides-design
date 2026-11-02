import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./image-resize-frame-hit-zone.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const probe = String.raw`(() => {
  const root = document.getElementById('frame').shadowRoot;
  const out = {};
  for (const handle of root.querySelectorAll('.handle')) {
    const box = handle.getBoundingClientRect();
    const sx = handle.dataset.corner.includes('w') ? -1 : 1;
    const sy = handle.dataset.corner.includes('n') ? -1 : 1;
    const at = (distance) => root.elementFromPoint(box.left + box.width / 2 + sx * distance, box.top + box.height / 2 + sy * distance);
    out[handle.dataset.corner] = { size: box.width, near: at(8) === handle, far: at(20) === handle };
  }
  return out;
})()`;

test('each resize handle stays drawn at 12px but takes a tap 8px off-centre, and no further than its 24px zone', { skip }, async () => {
  const result = await evaluateInPage(fixture, probe, { readyExpr: '!!window.hitZoneFixtureReady', timeout: 45000 });
  assert.deepEqual(Object.keys(result).sort(), ['ne', 'nw', 'se', 'sw']);
  for (const [corner, handle] of Object.entries(result)) {
    assert.equal(handle.size, 12, corner);
    assert.equal(handle.near, true, `${corner} tap 8px off-centre`);
    assert.equal(handle.far, false, `${corner} tap 20px off-centre`);
  }
});
