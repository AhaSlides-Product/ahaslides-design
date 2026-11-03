import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}.js`, import.meta.url))).href;

const page = `<!doctype html><body>
<aha-popover id="pop" open="false"><button slot="trigger">t</button>Hi</aha-popover>
<aha-dropdown id="dd" open="false" label="Actions" items='[{"key":"a","label":"A"}]'></aha-dropdown>
<script type="module">import '${lib('aha-popover')}'; import '${lib('aha-dropdown')}'; window.ready = true;</script>`;

test('open="false" is closed on aha-popover and aha-dropdown, at parse and when set later', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'open-false-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const read = (id) => { const el = document.getElementById(id); return { open: el.open, attr: el.hasAttribute('open') }; };
    const parsed = { pop: read('pop'), dd: read('dd') };
    for (const id of ['pop', 'dd']) document.getElementById(id).setAttribute('open', '');
    const opened = { pop: read('pop'), dd: read('dd') };
    for (const id of ['pop', 'dd']) document.getElementById(id).setAttribute('open', 'false');
    const reclosed = { pop: read('pop'), dd: read('dd'), panel: document.getElementById('dd').shadowRoot.querySelector('.dd').classList.contains('open') };
    return { parsed, opened, reclosed };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover") && !!customElements.get("aha-dropdown")' });
  const closed = { open: false, attr: false };
  assert.deepEqual(result.parsed, { pop: closed, dd: closed });
  assert.deepEqual(result.opened, { pop: { open: true, attr: true }, dd: { open: true, attr: true } });
  assert.deepEqual(result.reclosed, { pop: closed, dd: closed, panel: false });
});
