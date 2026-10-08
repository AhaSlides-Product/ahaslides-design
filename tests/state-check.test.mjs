import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveChrome } from '../cdp.mjs';
import { checkStates } from '../state-check.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const page = `<!doctype html><body style="margin:24px;background:#fff;font:14px sans-serif">
<style>
  button{ font:inherit; padding:8px 16px; border:1px solid #E3E3E3; border-radius:8px; background:#fff; color:#1A1A1A }
  .dark{ background:#1A1A1A; padding:16px }
  #vanishes{ background:transparent; color:#fff; border-color:#8A8A8A }
  #vanishes:hover{ color:#1A1A1A }
  #vanishes:focus-visible, #sound:focus-visible, #blue:focus-visible{ outline:2px solid #fff; outline-offset:2px }
  #sound:focus-visible, #blue:focus-visible{ outline-color:#E70E68 }
  #sound:hover{ background:#FEF3F7; border-color:#E70E68 }
  #blue:hover{ color:#4096FF; border-color:#4096FF }
  #faint:focus-visible{ outline:none; box-shadow:0 0 0 2px rgba(231,14,104,.3) }
  #silent:focus-visible{ outline:none }
</style>
<div class="dark"><button id="vanishes">See all plans</button></div>
<button id="sound">Save</button>
<button id="blue">Export</button>
<button id="faint">Faint ring</button>
<button id="silent">No ring</button>`;

test('state-check flags a hover that hides its label, an off-list hover colour and a weak or missing focus ring', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'state-check-')), 'page.html');
  writeFileSync(file, page);
  const { findings } = await checkStates(pathToFileURL(file).href);
  const about = (id) => findings.filter(f => f.who === `button#${id}`);
  assert.ok(about('vanishes').some(f => f.kind === 'contrast' && f.state === 'hover'), 'dark-on-dark hover label');
  assert.ok(!about('vanishes').some(f => f.state === 'rest'), 'the same label passes at rest');
  assert.ok(about('blue').some(f => f.kind === 'colour' && f.state === 'hover' && /#4096FF/.test(f.detail)), 'antd blue on hover');
  assert.ok(about('faint').some(f => f.kind === 'focus' && /needs 3:1/.test(f.detail)), 'a 30% ring is too faint');
  assert.ok(about('silent').some(f => f.kind === 'focus' && /draws no/.test(f.detail)), 'no focus indicator at all');
  assert.deepEqual(about('sound'), [], 'a compliant button has no finding');
});
