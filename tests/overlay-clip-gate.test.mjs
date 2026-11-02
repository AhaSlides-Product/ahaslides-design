import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveChrome } from '../cdp.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const measure = (fixture) => spawnSync(process.execPath, ['screen-lint.mjs', '--surface=product', '--measure', `tests/fixtures/overlay-clip/${fixture}`], { cwd: root, encoding: 'utf8', timeout: 240000 });

test('screen-lint --measure fails a hand-positioned bubble that its scrolling panel cuts off', { skip }, () => {
  const run = measure('fixed-side-bubble.html');
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stdout, /FAIL \[overlay-clip\] 360px: <span> "Editors can change slides.*" cut off by section\.panel \(top \d+px\)/);
});

test('screen-lint --measure passes an aha-tooltip at the top edge of an aha-drawer body', { skip }, () => {
  const run = measure('tooltip-in-drawer.html');
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /1 overlay\(s\) opened, none clipped/);
});
