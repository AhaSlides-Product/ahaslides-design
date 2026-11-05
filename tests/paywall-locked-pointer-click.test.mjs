import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveChrome, withPage } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;
const items = JSON.stringify([{ key: 'png', label: 'Image' }, { key: 'pdf', label: 'PDF', locked: true, plan: 'essential', featureKey: 'export_pdf' }]).replace(/"/g, '&quot;');

const page = `<!doctype html><body style="margin:0;padding:80px 200px">
<aha-setting-row id="row" label="Custom branding" locked plan="essential" feature-key="branding"><aha-switch slot="control"></aha-switch></aha-setting-row>
<aha-settings-list><aha-settings-item id="item" label="Slot form" locked plan="pro"><aha-switch slot="control"></aha-switch></aha-settings-item></aha-settings-list>
<div><aha-radio id="radio" name="m" value="a" locked plan="pro">Radio</aha-radio></div>
<div><aha-checkbox id="checkbox" locked plan="pro">Checkbox</aha-checkbox></div>
<!-- a locked dropdown on the page is what makes the browser drop a click after a mid-press rewrite; the canary test below fails if that stops -->
<aha-dropdown id="dd" label="Export" value="png" items="${items}"></aha-dropdown>
<script type="module">import '${lib}'; window.open = () => null; window.ready = true;</script>`;

const lockIn = {
  row: `document.getElementById('row').shadowRoot.querySelector('.lock')`,
  item: `document.getElementById('item').shadowRoot.querySelector('.lock')`,
  radio: `document.getElementById('radio').shadowRoot.querySelector('.lock')`,
  checkbox: `document.getElementById('checkbox').shadowRoot.querySelector('.lock')`,
  dropdown: `document.getElementById('dd').shadowRoot.querySelector('.lock')`,
};

const evaluate = async (command, expression) => {
  const r = await command('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const realClick = async (command, expression) => {
  const at = await evaluate(command, `const b = (${expression}).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };`);
  const base = { x: at.x, y: at.y, button: 'left', clickCount: 1 };
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
  await command('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' });
  await command('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' });
  await evaluate(command, `await new Promise((r) => setTimeout(r, 120));`);
};

// The resize lands on a later frame; a press measured before it can miss a popover the resize then moves.
const narrowViewport = async (command) => {
  await command('Emulation.setDeviceMetricsOverride', { width: 420, height: 800, deviceScaleFactor: 1, mobile: false });
  await evaluate(command, `while (document.documentElement.clientWidth !== 420) await new Promise(requestAnimationFrame); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));`);
};

const file = join(mkdtempSync(join(tmpdir(), 'paywall-pointer-')), 'page.html');
writeFileSync(file, page);
const url = pathToFileURL(file).href;

for (const where of Object.keys(lockIn)) {
  for (const [button, selector, event] of [['Upgrade', '.upgrade', 'paywall-upgrade'], ['See all plans', '.plans', 'paywall-plans']]) {
    test(`a real mouse click on ${button} in a locked ${where} fires ${event} and leaves the button text node alone`, { skip }, async () => {
      const result = await withPage(url, async (command) => {
        if (where === 'dropdown') await realClick(command, `document.getElementById('dd').shadowRoot.querySelector('.trigger')`);
        await realClick(command, lockIn[where]);
        const opened = await evaluate(command, `const lock = ${lockIn[where]}; const cta = lock.shadowRoot.querySelector('${selector}'); window.__node = cta.firstChild; window.__fired = []; lock.addEventListener('${event}', (e) => { e.preventDefault(); window.__fired.push(e.type); }); return lock.open;`);
        await realClick(command, `${lockIn[where]}.shadowRoot.querySelector('${selector}')`);
        const after = await evaluate(command, `const cta = ${lockIn[where]}.shadowRoot.querySelector('${selector}'); return { fired: window.__fired, sameNode: cta.firstChild === window.__node && window.__node.isConnected };`);
        return { opened, ...after };
      }, { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-dropdown")' });
      assert.equal(result.opened, true, 'the crown click opens the paywall');
      assert.deepEqual(result.fired, [event]);
      assert.equal(result.sameNode, true, `${button} text node must survive the press`);
    });
  }
}

const ready = { readyExpr: '!!window.ready && !!customElements.get("aha-switch") && !!customElements.get("aha-dropdown")' };
const upgradeIn = (id) => `document.getElementById('${id}').shadowRoot.querySelector('.lock').shadowRoot.querySelector('.upgrade')`;
const listenUpgrade = (id) => `const lock = ${lockIn[id]}; window.__fired = []; lock.addEventListener('paywall-upgrade', (e) => { e.preventDefault(); window.__fired.push(e.type); });`;

test('harness check, not a wanted behaviour: this page drops a click when Upgrade is rewritten mid-press', { skip }, async () => {
  const fired = await withPage(url, async (command) => {
    await realClick(command, lockIn.row);
    await evaluate(command, `${listenUpgrade('row')} const cta = ${upgradeIn('row')}; cta.addEventListener('pointerdown', () => { cta.textContent = cta.textContent; });`);
    await realClick(command, upgradeIn('row'));
    return evaluate(command, `return window.__fired;`);
  }, ready);
  assert.deepEqual(fired, [], 'the canary expects the browser to drop the click; if it keeps it, the other cases here prove nothing');
});

test('a row attribute re-written with the same value on pointerdown over Upgrade still fires paywall-upgrade', { skip }, async () => {
  const fired = await withPage(url, async (command) => {
    await realClick(command, lockIn.row);
    await evaluate(command, `${listenUpgrade('row')} ${upgradeIn('row')}.addEventListener('pointerdown', () => { const row = document.getElementById('row'); row.setAttribute('label', row.getAttribute('label')); });`);
    await realClick(command, upgradeIn('row'));
    return evaluate(command, `return window.__fired;`);
  }, ready);
  assert.deepEqual(fired, ['paywall-upgrade']);
});

test('a stale open popover in a narrowed viewport still fires paywall-upgrade on a real press', { skip }, async () => {
  const fired = await withPage(url, async (command) => {
    await realClick(command, lockIn.row);
    await narrowViewport(command);
    await evaluate(command, `${listenUpgrade('row')}`);
    await realClick(command, upgradeIn('row'));
    return evaluate(command, `return window.__fired;`);
  }, ready);
  assert.deepEqual(fired, ['paywall-upgrade']);
});

test('Tab from a locked radio to Upgrade after the viewport narrowed brings the popover back inside it', { skip }, async () => {
  const box = await withPage(url, async (command) => {
    await realClick(command, lockIn.radio);
    await narrowViewport(command);
    await evaluate(command, `document.getElementById('radio').focus();`);
    for (let i = 0; i < 6; i++) {
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      const onUpgrade = await evaluate(command, `const lock = ${lockIn.radio}; return lock.shadowRoot.activeElement === lock.shadowRoot.querySelector('.upgrade');`);
      if (onUpgrade) break;
    }
    return evaluate(command, `const lock = ${lockIn.radio}; const r = lock.shadowRoot.querySelector('.pop').getBoundingClientRect(); return { focused: lock.shadowRoot.activeElement === lock.shadowRoot.querySelector('.upgrade'), left: r.left, right: r.right, width: innerWidth };`);
  }, ready);
  assert.equal(box.focused, true, 'Tab reached Upgrade');
  assert.ok(box.left >= 0 && box.right <= box.width, `popover inside the viewport, got ${box.left}..${box.right} of ${box.width}`);
});

test('a real click on the popover text in a locked row keeps the popover open', { skip }, async () => {
  const open = await withPage(url, async (command) => {
    await realClick(command, lockIn.row);
    await realClick(command, `${lockIn.row}.shadowRoot.querySelector('.pbody')`);
    return evaluate(command, `return ${lockIn.row}.open;`);
  }, ready);
  assert.equal(open, true);
});
