import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-paywall.js', import.meta.url))).href;

const page = `<!doctype html><body style="margin:0;font-family:sans-serif">
<aha-paywall id="plain" style="position:absolute;top:600px;left:500px" feature-label="Plain" body="Plain sentence." open></aha-paywall>
<aha-paywall id="right" style="position:absolute;top:300px;left:100px" feature-label="Right" placement="right" width="360" open>
  <button>Gated</button>
</aha-paywall>
<aha-paywall id="left" style="position:absolute;top:900px;left:800px" feature-label="Left" placement="left" width="20rem" body="Hidden sentence." open>
  <p slot="body">Rich body with <a href="#">a link</a>.</p>
</aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('paywall placement left/right sits beside the anchor, width sets the popover width, slot="body" replaces the text body', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-side-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `new Promise((resolve) => setTimeout(() => {
    const state = (id) => {
      const host = document.getElementById(id);
      const root = host.shadowRoot;
      const anchor = host.getBoundingClientRect();
      const pop = root.querySelector('.pop').getBoundingClientRect();
      const visible = (sel) => getComputedStyle(root.querySelector(sel)).display !== 'none';
      return {
        width: parseFloat(getComputedStyle(root.querySelector('.pop')).width),
        gapRight: Math.round(pop.left - anchor.right),
        gapLeft: Math.round(anchor.left - pop.right),
        centreOffset: Math.round((pop.top + pop.height / 2) - (anchor.top + anchor.height / 2)),
        above: pop.bottom <= anchor.top,
        textBody: visible('.pbody'),
        richBody: visible('.prich'),
        markAnchor: !!root.querySelector('.anchor .mark'),
      };
    };
    resolve({ plain: state('plain'), right: state('right'), left: state('left') });
  }, 400))`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });

  assert.deepEqual(result.plain, { ...result.plain, width: 300, above: true, textBody: true, richBody: false, markAnchor: true });
  assert.equal(result.right.width, 360);
  assert.equal(result.right.gapRight, 8);
  assert.ok(Math.abs(result.right.centreOffset) <= 1, `right popover centred on the anchor (offset ${result.right.centreOffset})`);
  assert.equal(result.right.markAnchor, false);
  assert.equal(result.left.width, 320);
  assert.equal(result.left.gapLeft, 8);
  assert.ok(Math.abs(result.left.centreOffset) <= 1, `left popover centred on the anchor (offset ${result.left.centreOffset})`);
  assert.equal(result.left.textBody, false);
  assert.equal(result.left.richBody, true);
  assert.equal(result.left.markAnchor, true, 'a body-slot child alone keeps the crown mark as the anchor');
});
