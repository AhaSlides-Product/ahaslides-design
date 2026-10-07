import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-popover.js', import.meta.url))).href;

const page = `<!doctype html><body style="margin:0">
<div id="flip" style="height:30px;overflow:auto"><aha-popover flip placement="bottom-end"><button slot="trigger">t</button>Hi</aha-popover></div>
<div id="plain" style="height:30px;overflow:auto"><aha-popover placement="bottom"><button slot="trigger">t</button>Hi</aha-popover></div>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a closed popover adds no scrollable overflow, flip or not', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-closed-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const overflow = (id) => { const box = document.getElementById(id); return box.scrollHeight - box.clientHeight; };
    const display = (id) => getComputedStyle(document.querySelector('#' + id + ' aha-popover').shadowRoot.querySelector('.pop')).display;
    return { flip: overflow('flip'), plain: overflow('plain'), flipDisplay: display('flip'), plainDisplay: display('plain') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover")' });
  assert.deepEqual(result, { flip: 0, plain: 0, flipDisplay: 'none', plainDisplay: 'none' });
});
