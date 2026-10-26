import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body style="width:360px">
<aha-setting-row id="plain" label="Live captions"><aha-badge slot="badge" kind="new"></aha-badge><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-setting-row id="help" label="Translation" help="Subtitles."><aha-badge slot="badge" kind="beta"></aha-badge><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-setting-row id="locked" label="Summaries" locked><aha-badge slot="badge" kind="new"></aha-badge><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-setting-row id="stack" label="Layout" layout="stack"><aha-badge slot="badge" kind="beta"></aha-badge><aha-input slot="control"></aha-input></aha-setting-row>
<aha-setting-row id="long" label="A very long setting label that has to wrap inside the narrow label column" help="Tip."><aha-badge slot="badge" kind="new"></aha-badge><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-settings-list><aha-settings-item id="item" label="Item form" description="Tip."><aha-badge slot="badge" kind="new"></aha-badge><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a badge sits in the label line after the help or crown, never in the control area', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-badge-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const measure = (id) => {
      const host = document.getElementById(id);
      const root = host.shadowRoot;
      const badge = host.querySelector('[slot=badge]');
      const slot = root.querySelector('slot[name=badge]');
      const line = root.querySelector('.labelline');
      const before = id === 'locked' ? root.querySelector('.lock') : root.querySelector('.help');
      const box = badge.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();
      const control = root.querySelector('.control').getBoundingClientRect();
      const anchor = (id === 'plain' || id === 'stack') ? root.querySelector('.label') : before;
      return {
        inLine: slot.parentElement === line && badge.assignedSlot === slot,
        right: box.left >= anchor.getBoundingClientRect().right - 1,
        withinLine: box.right <= lineBox.right + 1 && box.top >= lineBox.top - 1 && box.bottom <= lineBox.bottom + 1,
        clearOfControl: box.right <= control.left + 1 || box.bottom <= control.top + 1,
        wideEnough: box.width > 0,
      };
    };
    return Object.fromEntries(['plain', 'help', 'locked', 'stack', 'long', 'item'].map((id) => [id, measure(id)]));
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-badge")' });
  for (const [id, state] of Object.entries(result)) {
    assert.equal(state.inLine, true, id);
    assert.equal(state.right, true, id);
    assert.equal(state.withinLine, true, id);
    assert.equal(state.clearOfControl, true, id);
    assert.equal(state.wideEnough, true, id);
  }
});
