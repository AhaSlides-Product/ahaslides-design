import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = JSON.stringify([{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Bravo' }, { key: 'c', label: 'Charlie' }]).replace(/"/g, '&quot;');

const page = (noPopover) => `<!doctype html><body style="margin:0;min-height:1200px">
<div id="card" style="position:absolute;top:80px;left:40px;width:260px;height:56px;overflow:hidden;background:#FFFFFF">
  <aha-dropdown id="dd" label="Actions" items="${items}"></aha-dropdown>
</div>
<div style="position:fixed;top:0;right:0;width:160px;height:56px;overflow:hidden;display:flex;justify-content:flex-end">
  <aha-dropdown id="edge" label="Edge" placement="bottomLeft" items="${items}"></aha-dropdown>
</div>
<div style="position:fixed;bottom:20px;left:40px">
  <aha-dropdown id="low" label="Low" items="${items}"></aha-dropdown>
</div>
<script type="module">${noPopover ? 'delete HTMLElement.prototype.showPopover;' : ''}await import('${lib}'); window.ready = true;</script>`;

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const settle = () => new Promise((done) => setTimeout(done, 300));
  const deepHit = (x, y) => {
    let hit = document.elementFromPoint(x, y);
    while (hit && hit.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return hit;
  };
  const report = (host) => {
    const panel = host.shadowRoot.querySelector('.panel');
    const r = panel.getBoundingClientRect();
    const points = [[r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]];
    return {
      topLayer: panel.matches(':popover-open'),
      rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom },
      visiblePoints: points.filter(([x, y]) => panel.contains(deepHit(x, y)) || deepHit(x, y) === panel).length,
    };
  };
  const dd = document.getElementById('dd');
  const log = [];
  for (const type of ['open', 'close', 'select']) dd.addEventListener(type, (e) => log.push(type + (e.composed ? '' : ':not-composed')));
  const trigger = dd.shadowRoot.querySelector('.trigger');
  const out = {};

  trigger.click();
  await settle();
  out.opened = { ...report(dd), attr: dd.hasAttribute('open'), cardBottom: document.getElementById('card').getBoundingClientRect().bottom,
    anchorBottom: dd.shadowRoot.querySelector('.dd').getBoundingClientRect().bottom };
  document.body.click();
  await settle();
  out.afterOutside = { open: dd.open, topLayer: report(dd).topLayer };

  trigger.focus();
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
  await frame();
  dd.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }));
  await settle();
  out.afterEscape = dd.open;

  trigger.click();
  await frame();
  dd.shadowRoot.querySelector('.item[data-key="b"]').click();
  await settle();
  out.afterSelect = dd.open;

  const eventsBeforeProgrammatic = log.length;
  dd.open = true;
  await frame();
  out.programmatic = { ...report(dd), events: log.length - eventsBeforeProgrammatic };
  dd.open = false;
  await settle();
  out.programmaticClosed = { open: dd.shadowRoot.querySelector('.dd').classList.contains('open'), events: log.length - eventsBeforeProgrammatic };
  dd.open = '';
  await frame();
  out.emptyString = { open: dd.open, topLayer: report(dd).topLayer };
  dd.open = 'false';
  await settle();
  out.falseString = dd.open;
  out.log = log;

  const edge = document.getElementById('edge');
  edge.open = true;
  await frame();
  out.edge = { ...report(edge), viewport: document.documentElement.clientWidth };
  edge.open = false;

  const low = document.getElementById('low');
  window.scrollTo(0, 0);
  await frame();
  low.open = true;
  await frame();
  out.low = { ...report(low), triggerTop: low.getBoundingClientRect().top, flippedClass: low.shadowRoot.querySelector('.dd').classList.contains('topLeft') };
  return out;
})()`;

const run = (noPopover) => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-top-layer-')), 'page.html');
  writeFileSync(file, page(noPopover));
  return evaluateInPage(pathToFileURL(file).href, scenarios, {
    readyExpr: '!!window.ready && !!document.getElementById("dd").shadowRoot', timeout: 45000,
  });
};

test('dropdown panel escapes an overflow:hidden card in the top layer and reports open/close', { skip }, async () => {
  const r = await run(false);
  assert.equal(r.opened.topLayer, true);
  assert.equal(r.opened.attr, true, 'open reflects to the attribute');
  assert.ok(r.opened.rect.bottom > r.opened.cardBottom + 40, 'panel extends past the clipping card');
  assert.equal(r.opened.visiblePoints, 4, 'panel is hit-testable at every corner');
  assert.equal(Math.round(r.opened.rect.top - r.opened.anchorBottom), 6, 'keeps the 6px gap of the in-flow panel');
  assert.deepEqual(r.afterOutside, { open: false, topLayer: false });
  assert.equal(r.afterEscape, false);
  assert.equal(r.afterSelect, false);
  assert.deepEqual(r.log, ['open', 'close', 'open', 'close', 'open', 'close', 'select']);
  assert.equal(r.programmatic.topLayer, true, 'setting open shows the panel');
  assert.equal(r.programmatic.events, 0, 'setting open fires no event');
  assert.deepEqual(r.programmaticClosed, { open: false, events: 0 });
  assert.deepEqual(r.emptyString, { open: true, topLayer: true }, "open = '' (React 19's value for a bare open) opens the panel");
  assert.equal(r.falseString, false, "open = 'false' closes it");
  assert.ok(r.edge.rect.right <= r.edge.viewport - 8, 'panel stays 8px inside the right viewport edge');
  assert.equal(r.edge.visiblePoints, 4);
  assert.ok(r.low.rect.bottom <= r.low.triggerTop, 'opens above when there is no room below');
  assert.equal(r.low.flippedClass, true);
});

test('without the Popover API the fixed panel still escapes an overflow ancestor', { skip }, async () => {
  const r = await run(true);
  assert.equal(r.opened.topLayer, false);
  assert.equal(r.opened.visiblePoints, 4);
  assert.deepEqual(r.log, ['open', 'close', 'open', 'close', 'open', 'close', 'select']);
});
