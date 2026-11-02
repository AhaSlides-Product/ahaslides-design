import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-popover.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-popover id="bare"><button slot="trigger">t</button>Hi</aha-popover>
<aha-popover id="titled" title="Help"><button slot="trigger">t</button>Hi</aha-popover>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a popover with no title gives its panel no accessible name; a title names it', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-label-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const label = (id) => document.getElementById(id).shadowRoot.querySelector('.pop').getAttribute('aria-label');
    document.getElementById('titled').removeAttribute('title');
    return { bare: label('bare'), removed: label('titled') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover")' });
  assert.deepEqual(result, { bare: null, removed: null });
});
