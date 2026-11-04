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
  <span slot="body">Rich body with </span><a id="body-link" slot="body" href="#">a link</a>
</aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('paywall placement left/right sits beside the anchor, width sets the popover width, slot="body" replaces the text body; an open popover follows placement, width and content-size changes', { skip }, async () => {
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
    const before = { plain: state('plain'), right: state('right'), left: state('left') };
    before.linkColour = getComputedStyle(document.getElementById('body-link')).color;
    const live = document.getElementById('left');
    live.setAttribute('placement', 'right');
    live.setAttribute('width', '280');
    live.querySelector('[slot=body]').append(' A second clause makes the body wrap onto more lines than before.');
    setTimeout(() => resolve({ ...before, switched: state('left') }), 300);
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
  assert.equal(result.linkColour, 'rgb(255, 255, 255)', 'a link slotted into the body takes the white body text');
  assert.equal(result.switched.width, 280, 'width changes on an open popover');
  assert.equal(result.switched.gapRight, 8, 'an open popover moves when placement changes');
  assert.ok(Math.abs(result.switched.centreOffset) <= 1, `an open side popover stays centred when its content grows (offset ${result.switched.centreOffset})`);
});

const unlockPage = `<!doctype html><body>
<aha-paywall id="plain" feature-label="Plain" body="Sentence." required-plan="essential"></aha-paywall>
<aha-paywall id="tr" feature-label="Tr" body="Câu." unlock-label="Mở khoá với gói {plan}!" plan-label="Pro"></aha-paywall>
<aha-paywall id="html" feature-label="Html" body="B." unlock-label="Go <b>now</b> with {plan}" plan-label="<i>Pro</i>"></aha-paywall>
<aha-paywall id="nolabel" feature-label="Nl" body="B." unlock-label="Nâng cấp ngay."></aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('unlock-label swaps the unlock line with {plan} in bold, plan-label renames the plan, and attribute values render as text never HTML', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-unlock-')), 'page.html');
  writeFileSync(file, unlockPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const line = (id) => document.getElementById(id).shadowRoot.querySelector('.punlock');
    const read = (id) => ({ text: line(id).textContent, bold: [...line(id).querySelectorAll('b')].map((b) => b.textContent), markup: line(id).querySelectorAll('i').length });
    const out = { plain: read('plain'), tr: read('tr'), html: read('html'), nolabel: read('nolabel') };
    document.getElementById('tr').setAttribute('unlock-label', 'Đổi {plan} rồi.');
    out.live = read('tr');
    return out;
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });

  assert.deepEqual(result.plain, { text: 'Unlock with the Essential plan.', bold: ['Essential plan'], markup: 0 });
  assert.deepEqual(result.tr, { text: 'Mở khoá với gói Pro!', bold: ['Pro'], markup: 0 });
  assert.deepEqual(result.html, { text: 'Go <b>now</b> with <i>Pro</i>', bold: ['<i>Pro</i>'], markup: 0 });
  assert.deepEqual(result.nolabel, { text: 'Nâng cấp ngay.', bold: [''], markup: 0 });
  assert.deepEqual(result.live, { text: 'Đổi Pro rồi.', bold: ['Pro'], markup: 0 });
});
