import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-setting-row id="row" label="Custom branding" help="Your logo on every deck." locked plan="essential" feature-key="branding" upgrade-body="Add your logo.">
  <aha-switch slot="control"></aha-switch>
</aha-setting-row>
<aha-setting-row id="own" label="Own disabled" locked><aha-switch slot="control" disabled></aha-switch></aha-setting-row>
<aha-settings-list id="list"><aha-settings-item id="item" label="Slot form" locked><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('locked row shows the paywall where the help sat, hides help and disables the control; unlocking restores', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-locked-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const state = (host) => {
      const root = host.shadowRoot;
      const line = root.querySelector('.labelline');
      const lock = root.querySelector('.lock');
      const help = root.querySelector('.help');
      const control = host.querySelector('[slot=control]');
      return {
        lockInLine: lock.parentElement === line && getComputedStyle(lock).display !== 'none',
        lockAfterLabel: lock.previousElementSibling === help,
        helpDisplay: getComputedStyle(help).display,
        controlDisabled: control.hasAttribute('disabled'),
        ariaDisabled: host.getAttribute('aria-disabled'),
        labelColour: getComputedStyle(root.querySelector('.label')).color,
        paywallLabel: lock.getAttribute('feature-label'), plan: lock.getAttribute('required-plan'),
        key: lock.getAttribute('feature-key'), body: lock.getAttribute('body'),
        mark: !!lock.shadowRoot.querySelector('.anchor .mark'),
      };
    };
    const row = document.getElementById('row');
    const locked = state(row);
    const lateControl = document.createElement('aha-switch');
    lateControl.slot = 'control';
    row.append(lateControl);
    return new Promise((resolve) => setTimeout(() => {
      const lateDisabled = lateControl.hasAttribute('disabled');
      row.removeAttribute('locked');
      const unlocked = state(row);
      const own = document.getElementById('own');
      own.removeAttribute('locked');
      const ownKept = own.querySelector('aha-switch').hasAttribute('disabled');
      const item = document.getElementById('item');
      const itemLocked = state(item);
      item.removeAttribute('locked');
      resolve({ locked, lateDisabled, unlocked, lateAfter: lateControl.hasAttribute('disabled'), ownKept, itemLocked, itemUnlocked: state(item) });
    }, 50));
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch")' });

  const normal = 'rgb(26, 26, 26)';
  assert.deepEqual(result.locked, { lockInLine: true, lockAfterLabel: true, helpDisplay: 'none', controlDisabled: true, ariaDisabled: 'true', labelColour: normal,
    paywallLabel: 'Custom branding', plan: 'essential', key: 'branding', body: 'Add your logo.', mark: true });
  assert.equal(result.lateDisabled, true);
  assert.equal(result.unlocked.lockInLine, false);
  assert.notEqual(result.unlocked.helpDisplay, 'none');
  assert.equal(result.unlocked.controlDisabled, false);
  assert.equal(result.unlocked.ariaDisabled, null);
  assert.equal(result.lateAfter, false);
  assert.equal(result.ownKept, true);
  assert.equal(result.itemLocked.lockInLine, true);
  assert.equal(result.itemLocked.controlDisabled, true);
  assert.equal(result.itemLocked.labelColour, normal);
  assert.equal(result.itemUnlocked.controlDisabled, false);
});
