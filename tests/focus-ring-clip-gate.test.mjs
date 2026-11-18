import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveChrome } from '../cdp.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const measure = (fixture) => spawnSync(process.execPath, ['screen-lint.mjs', '--surface=product', '--measure', `tests/fixtures/focus-ring-clip/${fixture}`], { cwd: root, encoding: 'utf8', timeout: 240000 });

test('screen-lint --measure fails a search field whose ring an unpadded scroll panel cuts off', { skip }, () => {
  const run = measure('search-in-scroll-panel.html');
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stdout, /FAIL \[focus-ring-clip\] 360px: focus ring of <aha-input> input#field\.field cut off by section\.panel \(top 2px, left 2px\)/);
});

test('screen-lint --measure passes a search field at the top edge of an aha-modal body', { skip }, () => {
  const run = measure('search-in-modal.html');
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /1 control\(s\) focused, no focus ring clipped/);
});

test('screen-lint --measure fails a checkbox whose inner box ring an unpadded scroll panel cuts off', { skip }, () => {
  const run = measure('checkbox-in-scroll-panel.html');
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stdout, /FAIL \[focus-ring-clip\] 360px: focus ring of aha-checkbox cut off by section\.panel \(top 2px, left 4px\)/);
});

test('screen-lint --measure passes an absolutely positioned control whose containing block is outside the overflow parent', { skip }, () => {
  const run = measure('absolute-escapes-overflow.html');
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /1 control\(s\) focused, no focus ring clipped/);
});
