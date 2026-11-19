import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = (f) => pathToFileURL(fileURLToPath(new URL(`../lib/${f}`, import.meta.url))).href;

const page = `<!doctype html><body style="margin:0;width:400px">
<aha-segmented id="block" block options="Sequential|Fan|Radial"></aha-segmented>
<aha-setting-row layout="stack" label="Style"><aha-segmented id="stacked" slot="control" options="Sequential|Fan|Radial"></aha-segmented></aha-setting-row>
<script type="module">import '${lib('aha-segmented.js')}'; import '${lib('aha-setting-row.js')}'; window.ready = true;</script>`;

test('a block segmented gives every option the same width, and one in a stacked row fills the row', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'segmented-block-')), 'page.html');
  writeFileSync(file, page);
  const r = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const widths = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.seg')].map((b) => b.getBoundingClientRect().width);
    const track = document.getElementById('stacked').shadowRoot.querySelector('.track').getBoundingClientRect().width;
    const row = document.querySelector('aha-setting-row').getBoundingClientRect().width;
    return { block: widths('block'), track, row };
  })()`, { readyExpr: '!!window.ready' });
  assert.equal(new Set(r.block.map((w) => w.toFixed(1))).size, 1, `unequal widths ${r.block}`);
  assert.ok(Math.abs(r.track - r.row) < 1, `track ${r.track} vs row ${r.row}`);
});
