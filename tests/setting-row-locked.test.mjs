import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, measureAtViewports, resolveChrome, withPage } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-setting-row id="row" label="Custom branding" help="Your logo on every deck." locked plan="essential" feature-key="branding" upgrade-body="Add your logo.">
  <aha-switch slot="control"></aha-switch>
</aha-setting-row>
<aha-setting-row id="own" label="Own disabled" locked><aha-switch slot="control" disabled></aha-switch></aha-setting-row>
<aha-settings-list id="list"><aha-settings-item id="item" label="Slot form" locked><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('locked row shows the paywall where the help sat, hides help and disables the control; unlocking restores', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-locked-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const state = (host) => {
      const root = host.shadowRoot;
      const line = root.querySelector('.labelline');
      const lock = root.querySelector('.lock');
      const help = root.querySelector('.help');
      const control = host.querySelector('[slot=control]');
      return {
        lockInLine: lock.parentElement === line && getComputedStyle(lock).display !== 'none',
        lockAfterLabel: lock.previousElementSibling === help,
        helpDisplay: getComputedStyle(help).display,
        controlDisabled: control.hasAttribute('disabled'),
        ariaDisabled: host.getAttribute('aria-disabled'),
        labelColour: getComputedStyle(root.querySelector('.label')).color,
        paywallLabel: lock.getAttribute('feature-label'), plan: lock.getAttribute('required-plan'),
        key: lock.getAttribute('feature-key'), body: lock.getAttribute('body'),
        mark: !!lock.shadowRoot.querySelector('.anchor .mark'),
      };
    };
    const row = document.getElementById('row');
    const locked = state(row);
    const lateControl = document.createElement('aha-switch');
    lateControl.slot = 'control';
    row.append(lateControl);
    return new Promise((resolve) => setTimeout(() => {
      const lateDisabled = lateControl.hasAttribute('disabled');
      row.removeAttribute('locked');
      const unlocked = state(row);
      const own = document.getElementById('own');
      own.removeAttribute('locked');
      const ownKept = own.querySelector('aha-switch').hasAttribute('disabled');
      const item = document.getElementById('item');
      const itemLocked = state(item);
      item.removeAttribute('locked');
      resolve({ locked, lateDisabled, unlocked, lateAfter: lateControl.hasAttribute('disabled'), ownKept, itemLocked, itemUnlocked: state(item) });
    }, 50));
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch")' });

  const normal = 'rgb(26, 26, 26)';
  assert.deepEqual(result.locked, { lockInLine: true, lockAfterLabel: true, helpDisplay: 'none', controlDisabled: true, ariaDisabled: 'true', labelColour: normal,
    paywallLabel: 'Custom branding', plan: 'essential', key: 'branding', body: 'Add your logo.', mark: true });
  assert.equal(result.lateDisabled, true);
  assert.equal(result.unlocked.lockInLine, false);
  assert.notEqual(result.unlocked.helpDisplay, 'none');
  assert.equal(result.unlocked.controlDisabled, false);
  assert.equal(result.unlocked.ariaDisabled, null);
  assert.equal(result.lateAfter, false);
  assert.equal(result.ownKept, true);
  assert.equal(result.itemLocked.lockInLine, true);
  assert.equal(result.itemLocked.controlDisabled, true);
  assert.equal(result.itemLocked.labelColour, normal);
  assert.equal(result.itemUnlocked.controlDisabled, false);
});

const narrowPage = `<!doctype html><body style="margin:0;font-family:sans-serif">
<div style="position:absolute;top:8px;left:16px;right:16px"><aha-setting-row id="top" label="Branding" locked><aha-switch slot="control"></aha-switch></aha-setting-row></div>
<div style="position:absolute;bottom:8px;left:16px;right:16px"><aha-settings-list><aha-settings-item id="bottom" label="Theme" locked><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list></div>
<aha-paywall id="plain" style="position:absolute;top:200px;left:100px" feature-label="Plain"></aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('locked row popover stays inside a 320px viewport at the top and the bottom; a plain paywall keeps the centred look', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-narrow-')), 'page.html');
  writeFileSync(file, narrowPage);
  const out = await measureAtViewports(pathToFileURL(file).href, `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const measure = async (host) => {
      const lock = host.shadowRoot.querySelector('.lock');
      lock.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      lock.setAttribute('open', '');
      await wait(400);
      const box = lock.shadowRoot.querySelector('.pop').getBoundingClientRect();
      const anchor = lock.getBoundingClientRect();
      const arrow = lock.shadowRoot.querySelector('.arrow').getBoundingClientRect();
      const arrowCentre = arrow.left + arrow.width / 2;
      return { inside: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
        align: lock.getAttribute('align'), arrowUnderAnchor: anchor.left >= box.left - 1 && anchor.right <= box.right + 1,
        arrowOffset: Math.abs(arrowCentre - (anchor.left + anchor.width / 2)),
        arrowClearOfCorner: arrowCentre - box.left >= 18 && box.right - arrowCentre >= 18 };
    };
    const plain = document.getElementById('plain');
    return { top: await measure(document.getElementById('top')),
      bottom: await measure(document.getElementById('bottom')), plainAlign: plain.getAttribute('align') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")', viewports: [{ label: 'narrow', width: 320, height: 560 }] });
  const narrow = out.narrow;
  assert.equal(narrow.top.inside, true);
  assert.equal(narrow.bottom.inside, true);
  assert.equal(narrow.top.arrowUnderAnchor, true);
  assert.equal(narrow.bottom.arrowUnderAnchor, true);
  assert.ok(narrow.top.arrowOffset < 1 && narrow.bottom.arrowOffset < 1, JSON.stringify(narrow));
  assert.equal(narrow.top.arrowClearOfCorner, true);
  assert.equal(narrow.bottom.arrowClearOfCorner, true);
  assert.equal(narrow.top.align, 'start');
  assert.equal(narrow.plainAlign, null);
});

const clickPage = `<!doctype html><body style="margin:0;font-family:sans-serif;padding:60px 16px 16px">
<aha-setting-row id="row" label="Branding" locked><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-settings-list><aha-settings-item id="item" label="Theme" locked><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list>
<aha-setting-row id="free" label="Free"><aha-switch slot="control"></aha-switch></aha-setting-row>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('clicking the disabled control of a locked row opens its paywall popover and keeps the control disabled and unfocusable', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-click-')), 'page.html');
  writeFileSync(file, clickPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const clickControl = async (host) => {
      const control = host.querySelector('[slot=control]');
      const box = control.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      const lock = host.shadowRoot.querySelector('.lock');
      host.shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(50);
      const opened = lock.hasAttribute('open');
      host.shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(50);
      const closedAgain = !lock.hasAttribute('open');
      return { hitIsHost: hit === host, opened, closedAgain, checked: control.hasAttribute('checked'), disabled: control.hasAttribute('disabled'),
        tabIndex: control.shadowRoot.querySelector('[tabindex]')?.tabIndex };
    };
    const free = document.getElementById('free');
    free.shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(50);
    return { row: await clickControl(document.getElementById('row')), item: await clickControl(document.getElementById('item')),
      freeOpen: free.shadowRoot.querySelector('.lock').hasAttribute('open') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-paywall")' });
  for (const name of ['row', 'item']) {
    assert.deepEqual(result[name], { hitIsHost: true, opened: true, closedAgain: true, checked: false, disabled: true, tabIndex: -1 }, name);
  }
  assert.equal(result.freeOpen, false);
});

const panelPage = `<!doctype html><body style="margin:0;display:flex;height:100vh;font-family:sans-serif">
<main style="flex:1"></main>
<aside id="panel" style="width:300px;overflow-y:auto;padding:16px;box-sizing:border-box;border-left:1px solid #ddd;height:100vh">
<aha-setting-row id="row" label="Branding" locked plan="pro"><aha-switch slot="control"></aha-switch></aha-setting-row>
<div style="height:4000px"></div>
</aside>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('locked row popover inside an overflow:auto side panel is not clipped, and follows the crown while the panel scrolls', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-panel-')), 'page.html');
  writeFileSync(file, panelPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const host = document.getElementById('row');
    const lock = host.shadowRoot.querySelector('.lock');
    const control = host.querySelector('[slot=control]');
    lock.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    host.shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(400);
    const pop = lock.shadowRoot.querySelector('.pop');
    const rect = () => pop.getBoundingClientRect();
    const hitPopover = () => { const box = rect(); const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2); return hit === host; };
    const panelLeft = document.getElementById('panel').getBoundingClientRect().left;
    const before = rect();
    const anchorGap = () => Math.abs(rect().bottom - lock.getBoundingClientRect().top) + Math.abs(rect().top - lock.getBoundingClientRect().bottom);
    const beforeGap = Math.min(Math.abs(rect().top - lock.getBoundingClientRect().bottom), Math.abs(rect().bottom - lock.getBoundingClientRect().top));
    const openedHit = hitPopover();
    document.getElementById('panel').scrollTop = 6;
    await wait(100);
    const afterGap = Math.min(Math.abs(rect().top - lock.getBoundingClientRect().bottom), Math.abs(rect().bottom - lock.getBoundingClientRect().top));
    document.getElementById('panel').scrollTop = 400;
    await wait(300);
    return { inViewport: before.left >= 0 && before.right <= innerWidth && before.top >= 0 && before.bottom <= innerHeight,
      crossesPanelEdge: before.left < panelLeft, openedHit, beforeGap, afterGap, closedWhenAnchorScrolledAway: !lock.hasAttribute('open') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-paywall")' });
  assert.equal(result.inViewport, true, JSON.stringify(result));
  assert.equal(result.crossesPanelEdge, true, JSON.stringify(result));
  assert.equal(result.openedHit, true, 'popover centre must hit the popover, not the panel');
  assert.ok(result.beforeGap < 12 && result.afterGap < 12, JSON.stringify(result));
  assert.equal(result.closedWhenAnchorScrolledAway, true, JSON.stringify(result));
});

const twoRowsPage = `<!doctype html><body style="margin:0;font-family:sans-serif;padding:80px 40px 16px;width:700px">
<aha-setting-row id="a" label="Custom branding" locked><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-setting-row id="b" label="Brand theme" locked><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-paywall id="plain" feature-label="Plain"></aha-paywall>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('opening a paywall closes every other open one, whichever way it was opened', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-single-')), 'page.html');
  writeFileSync(file, twoRowsPage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const lockOf = (id) => document.getElementById(id).shadowRoot.querySelector('.lock');
    const clickControl = (id) => document.getElementById(id).shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    const plain = document.getElementById('plain');
    const openIds = () => [lockOf('a'), lockOf('b'), plain].map((el, index) => el.hasAttribute('open') ? index : null).filter((index) => index !== null);
    clickControl('a'); await wait(50);
    const afterA = openIds();
    clickControl('b'); await wait(50);
    const afterB = openIds();
    plain.setAttribute('open', ''); await wait(50);
    const afterPlain = openIds();
    plain.shadowRoot.querySelector('.mark').click(); await wait(50);
    clickControl('a'); await wait(50);
    return { afterA, afterB, afterPlain, afterReopen: openIds() };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-paywall")' });
  assert.deepEqual(result, { afterA: [0], afterB: [1], afterPlain: [2], afterReopen: [0] });
});

test('the first open of a locked row popover is a pure vertical lift, never a sideways slide', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'paywall-first-open-')), 'page.html');
  writeFileSync(file, twoRowsPage);
  const result = await withPage(pathToFileURL(file).href, async (command) => {
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    const run = await command('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `new Promise((resolve) => {
      const host = document.getElementById('a');
      const pop = host.shadowRoot.querySelector('.lock').shadowRoot.querySelector('.pop');
      const lefts = []; const tops = []; const start = performance.now();
      const tick = () => { const box = pop.getBoundingClientRect(); lefts.push(box.left); tops.push(box.top);
        if (performance.now() - start < 350) requestAnimationFrame(tick); else resolve({ lefts, tops }); };
      requestAnimationFrame(() => { host.shadowRoot.querySelector('.control').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true })); tick(); });
    })` });
    return run.result.value;
  }, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-paywall")' });
  const spreadX = Math.max(...result.lefts) - Math.min(...result.lefts);
  const spreadY = Math.max(...result.tops) - Math.min(...result.tops);
  assert.ok(spreadX < 0.5, `horizontal travel ${spreadX}px`);
  assert.ok(spreadY > 2, `expected a vertical lift, got ${spreadY}px`);
});
