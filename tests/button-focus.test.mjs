import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-button.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-button id="text">Save</aha-button>
<aha-button id="icon" icon-only aria-label="Close"><span slot="icon">x</span></aha-button>
<aha-button id="link" href="#x">Docs</aha-button>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('host.focus() moves focus to the inner button or link, icon-only and link variants included', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'button-focus-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const out = {};
    for (const id of ['text', 'icon', 'link']) {
      const host = document.getElementById(id);
      host.focus();
      out[id] = document.activeElement === host && host.shadowRoot.activeElement && host.shadowRoot.activeElement.localName;
    }
    return out;
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-button")' });
  assert.deepEqual(result, { text: 'button', icon: 'button', link: 'a' });
});
