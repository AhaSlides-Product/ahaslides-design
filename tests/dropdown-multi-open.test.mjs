import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = JSON.stringify([{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Bravo' }]).replace(/"/g, '&quot;');

const page = (noPopover) => `<!doctype html><body style="margin:0">
<div id="list" style="width:300px;height:200px;overflow:auto">
  <div style="padding:8px"><aha-dropdown id="one" label="One" items="${items}"></aha-dropdown></div>
  <div style="padding:8px"><aha-dropdown id="two" label="Two" items="${items}"></aha-dropdown></div>
</div>
<script type="module">${noPopover ? 'delete HTMLElement.prototype.showPopover;' : ''}await import('${lib}'); window.ready = true;</script>`;

const scenarios = String.raw`(async () => {
  const settle = () => new Promise((done) => setTimeout(done, 300));
  const one = document.getElementById('one'), two = document.getElementById('two'), list = document.getElementById('list');
  const trigger = (host) => host.shadowRoot.querySelector('.trigger');
  const press = (el) => { for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) el.dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, cancelable: true })); };
  const out = { closedPanelDisplay: getComputedStyle(one.shadowRoot.querySelector('.panel')).display, closedScrollable: list.scrollWidth > list.clientWidth || list.scrollHeight > list.clientHeight };
  press(trigger(one));
  await settle();
  out.oneOpen = one.open;
  press(trigger(two));
  await settle();
  out.afterSecond = { one: one.open, two: two.open };
  press(trigger(two));
  await settle();
  out.afterToggle = { one: one.open, two: two.open };
  return out;
})()`;

const run = (noPopover) => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-multi-')), 'page.html');
  writeFileSync(file, page(noPopover));
  return evaluateInPage(pathToFileURL(file).href, scenarios, {
    readyExpr: '!!window.ready && !!document.getElementById("two").shadowRoot', timeout: 45000,
  });
};

for (const [name, noPopover] of [['popover', false], ['fallback', true]]) {
  test(`dropdown (${name}): a closed panel takes no space and opening another menu closes the first`, { skip }, async () => {
    const r = await run(noPopover);
    assert.equal(r.closedPanelDisplay, 'none');
    assert.equal(r.closedScrollable, false, 'closed panels do not stretch the scrolling list');
    assert.equal(r.oneOpen, true);
    assert.deepEqual(r.afterSecond, { one: false, two: true });
    assert.deepEqual(r.afterToggle, { one: false, two: false }, 'clicking its own trigger still toggles it');
  });
}
