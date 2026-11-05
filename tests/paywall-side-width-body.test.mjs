import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-paywall.js', import.meta.url))).href;
const button = pathToFileURL(fileURLToPath(new URL('../lib/aha-button.js', import.meta.url))).href;
const drawerLib = pathToFileURL(fileURLToPath(new URL('../lib/aha-drawer.js', import.meta.url))).href;

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
        outerWidth: Math.round(pop.width),
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

  assert.deepEqual(result.plain, { ...result.plain, width: 300, outerWidth: 300, above: true, textBody: true, richBody: false, markAnchor: true });
  assert.equal(result.right.width, 360);
  assert.equal(result.right.outerWidth, 360, 'the width attribute is the outer width, padding included');
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
<main id="main" tabindex="-1"><div id="row"><span id="rowlabel">Locked row</span></div></main>
<aha-button id="ab" variant="primary">Button opener</aha-button>
<aha-paywall id="hover" trigger="hover" feature-label="Hover" body="Sentence."></aha-paywall>
<script type="module">import '${lib}'; import '${button}'; window.ready = true;</script>`;

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

    mark.shadowRoot.querySelector('button.mark').focus(); mark.setAttribute('open', ''); deep().blur(); press(); out.markAnchor = idOf(deep());

    deep().blur(); slot._opener = dis; slot.setAttribute('open', ''); slot.close(); out.slottedAnchor = idOf(deep());

    deep().blur(); mark.setAttribute('open', ''); mark.close(); out.noOpenerNoFocus = idOf(deep());

    const box = document.createElement('div'); document.body.append(box); box.append(slot);
    let hostSaw = 0;
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hostSaw++; e.stopPropagation(); } });
    const b2 = document.createElement('button'); b2.id = 'b2'; document.body.prepend(b2); b2.focus();
    slot.setAttribute('open', '');
    slot.querySelector('#anchor').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    out.stoppedClosed = !slot.open; out.hostSaw = hostSaw; out.stoppedFocus = idOf(deep());

    const main = document.getElementById('main');
    const row = document.getElementById('row');
    row.addEventListener('click', (e) => toggleLockedPaywall(mark, e));
    deep().blur(); document.getElementById('rowlabel').click();
    out.rowOpened = mark.open; mark.close(); out.rowFocus = idOf(deep()); out.mainFocused = document.activeElement === main;

    const ab = document.getElementById('ab');
    ab.addEventListener('click', (e) => toggleLockedPaywall(mark, e));
    ab.focus(); ab.click(); deep().blur(); mark.close(); out.buttonHost = document.activeElement === ab;

    const late = document.createElement('aha-paywall'); late.setAttribute('feature-label', 'Late'); late.setAttribute('open', '');
    const lateBtn = document.createElement('button'); lateBtn.id = 'late'; document.body.append(lateBtn); lateBtn.focus();
    document.body.append(late); lateBtn.blur(); late.close(); out.connectedOpen = idOf(deep());

    const hover = document.getElementById('hover');
    deep().blur(); hover.dispatchEvent(new MouseEvent('mouseenter')); out.hoverOpened = hover.open; hover.close(); out.hoverFocus = idOf(deep());

    mark.setAttribute('mark-label', ''); out.emptyLabel = mark.shadowRoot.querySelector('button.mark').getAttribute('aria-label');
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
  assert.equal(result.noOpenerNoFocus, 'body', 'close() with no opener and focus outside the popover pulls no focus');
  assert.equal(result.stoppedClosed, true, 'Escape closes the popover even when the host stops Escape on its panel');
  assert.equal(result.hostSaw, 0, 'the host handler never sees the Escape that closed the popover');
  assert.equal(result.stoppedFocus, 'b2');
  assert.equal(result.rowOpened, true);
  assert.equal(result.rowFocus, 'mark', 'a focusable ancestor of a locked row is not the opener');
  assert.equal(result.mainFocused, false);
  assert.equal(result.buttonHost, true, 'an aha-button host keeps focus as the opener');
  assert.equal(result.connectedOpen, 'late', 'an element connected already open records its opener');
  assert.equal(result.hoverOpened, true);
  assert.equal(result.hoverFocus, 'body', 'close() on a hover-opened popover leaves focus alone');
  assert.equal(result.emptyLabel, 'Upgrade required. See details', 'an empty mark-label keeps the default name');
});

const drawerPage = `<!doctype html><body style="margin:0;height:100px;overflow:hidden">
<aha-drawer id="d" heading="Drawer"><div style="height:150px"></div><aha-paywall id="dp" feature-label="Drawer" body="Sentence."><button>Gated</button></aha-paywall></aha-drawer>
<script type="module">import '${lib}'; import '${drawerLib}'; window.ready = true;</script>`;

const htmlScrollPage = `<!doctype html><html style="overflow-y:scroll"><body style="margin:0;height:200px;overflow:hidden">
<div style="position:fixed;top:400px;left:100px;width:300px;height:200px"><aha-paywall id="fp" feature-label="Fixed" body="Sentence."><button>Gated</button></aha-paywall></div>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('See all plans is hidden by default and appears only with show-plans, toggled on the same node, leaving Upgrade alone at the row start', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-plans-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="margin:0">
<aha-paywall id="off" style="position:absolute;top:300px;left:100px" feature-label="Off" body="Sentence." open></aha-paywall>
<aha-paywall id="on" show-plans plans-label="All tiers" style="position:absolute;top:300px;left:500px" feature-label="On" body="Sentence." open></aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `new Promise((resolve) => setTimeout(() => {
    const state = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const plans = root.querySelector('.plans'), upgrade = root.querySelector('.upgrade');
      const row = root.querySelector('.actions').getBoundingClientRect();
      return { node: plans, hidden: plans.getBoundingClientRect().width === 0, label: plans.textContent,
        upgradeStart: Math.round(upgrade.getBoundingClientRect().left - row.left), upgradeLeft: upgrade.getBoundingClientRect().left,
        plansLeft: plans.getBoundingClientRect().left };
    };
    const off = state('off'), on = state('on');
    const offHost = document.getElementById('off');
    offHost.setAttribute('show-plans', '');
    const toggledOn = state('off');
    offHost.removeAttribute('show-plans');
    const toggledOff = state('off');
    resolve({ off: { ...off, node: 0 }, on: { ...on, node: 0 }, sameNode: off.node === toggledOn.node && off.node === toggledOff.node,
      toggledOn: { ...toggledOn, node: 0 }, toggledOffHidden: toggledOff.hidden });
  }, 400))`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });
  assert.equal(result.off.hidden, true, 'no show-plans: See all plans takes no room');
  assert.equal(result.off.upgradeStart, 0, 'Upgrade starts the row alone');
  assert.equal(result.on.hidden, false);
  assert.equal(result.on.label, 'All tiers');
  assert.ok(result.on.plansLeft > result.on.upgradeLeft, 'See all plans sits beside Upgrade');
  assert.equal(result.toggledOn.hidden, false, 'adding show-plans reveals it');
  assert.equal(result.toggledOffHidden, true, 'removing show-plans hides it again');
  assert.equal(result.sameNode, true, 'toggled in place, no shadow rebuild');
});

test('fitPaywall keeps the popover inside a 280px-tall iframe: beside the anchor with room, scrolling without it, and normal placement stays', async (t) => {
  if (skip) return t.skip(skip);
  const frame = (top, left) => `<!doctype html><body style='margin:0'><aha-paywall id=p show-plans style='position:absolute;top:${top}px;left:${left}px' feature-label='Report' body='Unlock this report and every chart in it with a longer sentence.'></aha-paywall><script type=module>import {fitPaywall} from '${lib}'; window.fit = fitPaywall; window.ready = true<\/script>`;
  const frames = [['side', 110, 300, 700], ['scroll', 130, 150, 320], ['normal', 20, 300, 700]];
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-fit-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="margin:0">${frames.map(([id, top, left, width]) =>
    `<iframe id="${id}" style="display:block;border:0;width:${width}px;height:280px" srcdoc="${frame(top, left).replace(/"/g, '&quot;')}"></iframe>`).join('')}`);
  const result = await evaluateInPage(pathToFileURL(file).href, `new Promise((resolve) => setTimeout(async () => {
    const out = {};
    for (const iframe of document.querySelectorAll('iframe')) {
      const win = iframe.contentWindow, doc = iframe.contentDocument, host = doc.getElementById('p');
      const root = host.shadowRoot, pop = root.querySelector('.pop'), mark = root.querySelector('.anchor .mark');
      mark.focus();
      win.fit(host);
      host.togglePopover({ source: mark });
      await new Promise((done) => setTimeout(done, 350));
      const box = pop.getBoundingClientRect();
      const viewport = doc.documentElement.clientHeight;
      const reach = root.querySelector('.plans');
      reach.shadowRoot.querySelector('button').focus();
      await new Promise((done) => setTimeout(done, 50));
      const shown = reach.getBoundingClientRect();
      const inside = pop.getBoundingClientRect();
      const arrow = root.querySelector('.arrow').getBoundingClientRect();
      const anchorBox = host.getBoundingClientRect();
      out[iframe.id] = {
        placement: host.getAttribute('placement'),
        overflow: Math.max(0, -box.top) + Math.max(0, box.bottom - viewport),
        plansReached: shown.top >= inside.top - 1 && shown.bottom <= inside.bottom + 1 && shown.bottom <= viewport,
        scrolls: host.hasAttribute('data-scroll'),
        arrowOffset: Math.abs((arrow.top + arrow.height / 2) - (anchorBox.top + anchorBox.height / 2)),
      };
      doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
      await new Promise((done) => setTimeout(done, 50));
      out[iframe.id].closed = !host.open;
      out[iframe.id].focusBack = root.activeElement === mark;
    }
    resolve(out);
  }, 800))`, { timeout: 20000, readyExpr: 'document.querySelectorAll("iframe").length === 3' });
  assert.equal(result.side.placement, 'right');
  assert.equal(result.side.overflow, 0);
  assert.equal(result.side.scrolls, false);
  assert.ok(result.side.arrowOffset < 2, `arrow on the anchor: ${result.side.arrowOffset}`);
  assert.equal(result.scroll.overflow, 0);
  assert.equal(result.scroll.scrolls, true);
  assert.equal(result.normal.placement, 'bottom');
  assert.equal(result.normal.scrolls, false);
  for (const name of ['side', 'scroll', 'normal']) {
    assert.ok(result[name].plansReached, `${name}: See all plans reachable`);
    assert.ok(result[name].closed, `${name}: Escape closes`);
    assert.ok(result[name].focusBack, `${name}: focus returns to the crown`);
  }
});

test('an open popover stays open inside an aha-drawer under a short locked body, and inside a fixed panel under a scrolling html', { skip }, async () => {
  const run = async (html, expr) => {
    const file = join(mkdtempSync(join(tmpdir(), 'paywall-drawer-')), 'page.html');
    writeFileSync(file, html);
    return evaluateInPage(pathToFileURL(file).href, expr, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall") && !!customElements.get("aha-drawer")' + '' });
  };
  const probe = (id, prelude) => `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    ${prelude}
    const p = document.getElementById('${id}');
    p.setAttribute('open', ''); await wait(150);
    window.dispatchEvent(new Event('resize')); await wait(100);
    return p.open;
  })()`;
  assert.equal(await run(drawerPage, probe('dp', `document.getElementById('d').setAttribute('open', ''); await wait(400);`)), true, 'aha-drawer lock sets html overflow hidden; the popover inside stays open');
  const flat = join(mkdtempSync(join(tmpdir(), 'paywall-fixed-')), 'page.html');
  writeFileSync(flat, htmlScrollPage);
  assert.equal(await evaluateInPage(pathToFileURL(flat).href, probe('fp', ''), { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' }), true, 'a fixed panel is not clipped by the body');
});

const clipPage = `<!doctype html><body style="margin:0;height:0;overflow:hidden;font-family:sans-serif">
<div style="position:fixed;top:100px;left:100px;width:300px;height:200px;background:#eee"><aha-paywall id="drawer" feature-label="Drawer" body="Sentence."><button>Gated</button></aha-paywall></div>
<div id="scroller" style="position:fixed;top:400px;left:100px;width:300px;height:100px;overflow:auto"><div style="height:300px"><aha-paywall id="inner" feature-label="Inner" body="Sentence."><button>Gated</button></aha-paywall></div></div>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('an open popover stays open under a scroll-locked body of height 0, and still closes when its anchor scrolls out of a real scroll container', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-clip-')), 'page.html');
  writeFileSync(file, clipPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const drawer = document.getElementById('drawer');
    const inner = document.getElementById('inner');
    drawer.setAttribute('open', '');
    await wait(100);
    window.dispatchEvent(new Event('resize')); await wait(50);
    const out = { drawerOpen: drawer.open };
    inner.setAttribute('open', ''); await wait(100);
    out.innerOpenBefore = inner.open;
    document.getElementById('scroller').scrollTop = 250; await wait(100);
    out.innerOpenAfterScroll = inner.open;
    return out;
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });

  assert.equal(result.drawerOpen, true, 'the body overflow of a scroll-locked page does not clip the anchor');
  assert.equal(result.innerOpenBefore, true);
  assert.equal(result.innerOpenAfterScroll, false, 'a real scroll container still clips the anchor');
});
