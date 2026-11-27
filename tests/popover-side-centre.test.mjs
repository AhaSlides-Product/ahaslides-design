import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-popover.js', import.meta.url))).href;

const trigger = '<button slot="trigger" style="height:160px;width:120px">Card</button>';
const body = '<div>Short panel body.</div>';
const page = `<!doctype html><body style="margin:0;font-family:sans-serif;height:1200px">
<aha-popover id="right-flip" style="position:absolute;top:300px;left:100px" placement="right" flip arrow open>${trigger}${body}</aha-popover>
<aha-popover id="left-css" style="position:absolute;top:300px;left:700px" placement="left" arrow open>${trigger}${body}</aha-popover>
<aha-popover id="right-start-flip" style="position:absolute;top:600px;left:100px" placement="right-start" flip arrow open>${trigger}${body}</aha-popover>
<aha-popover id="left-end-css" style="position:absolute;top:600px;left:700px" placement="left-end" arrow open>${trigger}${body}</aha-popover>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('cardinal left/right centre the panel and its arrow on the trigger, with flip and without; -start/-end stay edge-aligned', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-side-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `new Promise((resolve) => setTimeout(() => {
    const state = (id) => {
      const host = document.getElementById(id);
      const anchor = host.getBoundingClientRect();
      const pop = host.shadowRoot.querySelector('.pop').getBoundingClientRect();
      const arrow = host.shadowRoot.querySelector('.arrow').getBoundingClientRect();
      const mid = anchor.top + anchor.height / 2;
      return {
        panelCentre: Math.round(pop.top + pop.height / 2 - mid),
        arrowCentre: Math.round(arrow.top + arrow.height / 2 - mid),
        topEdge: Math.round(pop.top - anchor.top),
        bottomEdge: Math.round(pop.bottom - anchor.bottom),
      };
    };
    resolve(Object.fromEntries(['right-flip', 'left-css', 'right-start-flip', 'left-end-css'].map((id) => [id, state(id)])));
  }, 500))`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover")' });

  for (const id of ['right-flip', 'left-css']) {
    assert.ok(Math.abs(result[id].panelCentre) <= 1, `${id}: panel centred on the trigger (offset ${result[id].panelCentre})`);
    assert.ok(Math.abs(result[id].arrowCentre) <= 2, `${id}: arrow centred on the trigger (offset ${result[id].arrowCentre})`);
  }
  assert.equal(result['right-start-flip'].topEdge, 0, 'right-start keeps the panel top on the trigger top');
  assert.equal(result['left-end-css'].bottomEdge, 0, 'left-end keeps the panel bottom on the trigger bottom');
});
