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

const focusPage = `<!doctype html><body style="margin:0;font-family:sans-serif">
<button id="btn">Locked row</button><button id="dis" disabled>Disabled</button><button id="gone">Gone</button>
<aha-paywall id="mark" feature-label="Mark" body="Sentence." mark-label="Cần nâng cấp"></aha-paywall>
<aha-paywall id="slot" feature-label="Slot" body="Sentence."><span slot="body">Rich </span><button id="anchor">Gated</button></aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('close() and Escape return focus to the element that opened the popover, falling back to the real anchor; mark-label names the mark', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-focus-')), 'page.html');
  writeFileSync(file, focusPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const { toggleLockedPaywall } = await import('${lib}');
    const deep = () => { let el = document.activeElement; while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement; return el; };
    const idOf = (el) => (el && (el.id || el.className || el.localName));
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const mark = document.getElementById('mark');
    const slot = document.getElementById('slot');
    const out = {};
    out.markLabel = mark.shadowRoot.querySelector('button.mark').getAttribute('aria-label');
    mark.setAttribute('mark-label', 'Changed');
    out.markLabelLive = mark.shadowRoot.querySelector('button.mark').getAttribute('aria-label');
    const press = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const viaButton = (host, id) => { const b = document.getElementById(id); b.focus(); b.addEventListener('click', (e) => toggleLockedPaywall(host, e), { once: true }); b.click(); };

    viaButton(mark, 'btn'); out.openedByButton = mark.open;
    document.body.focus(); document.activeElement.blur?.();
    press(); out.escapeToButton = idOf(deep());

    viaButton(mark, 'btn'); document.getElementById('btn').blur();
    mark.close(); out.closeToButton = idOf(deep()); out.closed = !mark.open;
    mark.close(); out.closeWhenClosed = idOf(deep());

    const dis = document.getElementById('dis');
    mark.setAttribute('open', ''); mark._opener = dis; mark.close(); out.disabledOpener = idOf(deep());

    document.getElementById('gone').focus(); mark.setAttribute('open', '');
    document.getElementById('gone').remove(); mark.close(); out.removedOpener = idOf(deep());

    document.activeElement.blur?.(); mark.setAttribute('open', ''); press(); out.markAnchor = idOf(deep());

    deep().blur(); slot.setAttribute('open', ''); slot.close(); out.slottedAnchor = idOf(deep());

    const stop = (e) => { if (e.key === 'Escape') e.stopPropagation(); };
    const box = document.createElement('div'); document.body.append(box); box.append(slot);
    box.addEventListener('keydown', stop);
    const b2 = document.createElement('button'); b2.id = 'b2'; document.body.prepend(b2); b2.focus();
    slot.setAttribute('open', ''); b2.focus();
    slot.querySelector('#anchor').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    out.stoppedStillOpen = slot.open;
    slot.close(); out.stoppedThenClose = idOf(deep()); out.stoppedClosed = !slot.open;
    return out;
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });

  assert.equal(result.markLabel, 'Cần nâng cấp');
  assert.equal(result.markLabelLive, 'Changed');
  assert.equal(result.openedByButton, true);
  assert.equal(result.escapeToButton, 'btn', 'Escape returns focus to the button that opened the popover, not the mark');
  assert.equal(result.closeToButton, 'btn');
  assert.equal(result.closed, true);
  assert.equal(result.closeWhenClosed, 'btn', 'close() on a closed popover does nothing');
  assert.equal(result.disabledOpener, 'mark', 'a disabled opener refuses focus, so focus goes to the mark');
  assert.equal(result.removedOpener, 'mark', 'a removed opener falls back to the mark');
  assert.equal(result.markAnchor, 'mark');
  assert.equal(result.slottedAnchor, 'anchor', 'a slotted anchor, not the aria-hidden header mark, takes the fallback focus');
  assert.equal(result.stoppedStillOpen, true, 'a host that stops Escape keeps the popover open');
  assert.equal(result.stoppedClosed, true);
  assert.equal(result.stoppedThenClose, 'b2', 'close() restores focus to the opener after the host swallowed Escape');
});
