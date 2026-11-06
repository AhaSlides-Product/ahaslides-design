import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, measureAtViewports, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = JSON.stringify([
  { key: 'png', label: 'Image' },
  { key: 'pdf', label: 'PDF', locked: true, plan: 'essential', featureKey: 'export_pdf', upgradeBody: 'Export the whole deck.' },
  { key: 'xlsx', label: 'Excel' },
]).replace(/"/g, '&quot;');

const page = (style) => `<!doctype html><body style="margin:0">
<div style="${style}"><aha-dropdown id="dd" label="Export" value="png" items="${items}"></aha-dropdown></div>
<script type="module">import '${lib}'; window.ready = true;</script>`;

const pageUrl = (style) => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-locked-')), 'page.html');
  writeFileSync(file, page(style));
  return pathToFileURL(file).href;
};

test('a locked row opens its paywall instead of selecting; keyboard reaches the paywall and Escape unwinds paywall then menu', { skip }, async () => {
  const result = await evaluateInPage(pageUrl('padding:40px'), `(async () => {
    const host = document.getElementById('dd');
    const root = host.shadowRoot;
    const trigger = root.querySelector('.trigger');
    const row = root.querySelector('.item[data-key="pdf"]');
    const lock = root.querySelector('.lock');
    const selected = [];
    const upgrades = [];
    host.addEventListener('select', (e) => selected.push(e.detail.key));
    host.addEventListener('paywall-upgrade', (e) => { e.preventDefault(); upgrades.push(e.detail); });
    const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
    const key = (target, k, shiftKey = false) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, composed: true, cancelable: true }));
    const menuOpen = () => root.querySelector('.dd').classList.contains('open');
    const focusedKey = () => root.activeElement && root.activeElement.getAttribute('data-key');
    const lockFocus = () => root.activeElement === lock && lock.shadowRoot.activeElement && lock.shadowRoot.activeElement.className;
    const rowBox = () => row.getBoundingClientRect();
    const popBox = () => lock.shadowRoot.querySelector('.pop').getBoundingClientRect();

    trigger.click();
    row.click();
    await tick();
    const clicked = { paywall: lock.open, menu: menuOpen(), expanded: row.getAttribute('aria-expanded'), focus: focusedKey(),
      placement: lock.getAttribute('placement'), besideRow: popBox().left >= root.querySelector('.panel').getBoundingClientRect().right && popBox().top < rowBox().bottom && popBox().bottom > rowBox().top };
    key(row, 'Escape');
    await tick();
    const firstEscape = { paywall: lock.open, menu: menuOpen(), focus: focusedKey(), expanded: row.getAttribute('aria-expanded') };
    key(row, 'Enter');
    key(row, 'Tab');
    const tabbedInto = lockFocus();
    key(lock.shadowRoot.querySelector('.upgrade'), 'Escape');
    const escapeInside = { paywall: lock.open, menu: menuOpen(), focus: focusedKey() };
    key(row, 'Escape');
    const secondEscape = { menu: menuOpen(), focusOnTrigger: root.activeElement === trigger };

    trigger.click();
    key(row, ' ');
    lock.shadowRoot.querySelector('.upgrade').click();
    const afterUpgrade = { paywall: lock.open, menu: menuOpen() };

    trigger.click();
    key(row, 'Enter');
    key(row, 'Tab');
    key(lock.shadowRoot.querySelector('.upgrade'), 'Tab');
    const tabPastUpgrade = { paywall: lock.open, menu: menuOpen(), focus: focusedKey() };

    return { clicked, firstEscape, tabbedInto, escapeInside, secondEscape, afterUpgrade, tabPastUpgrade, upgrades, selected,
      role: row.getAttribute('role'), plan: lock.getAttribute('required-plan'), feature: lock.getAttribute('feature-key'),
      title: lock.getAttribute('feature-label'), body: lock.getAttribute('body'),
      description: root.getElementById(row.getAttribute('aria-describedby')).textContent };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")' });

  assert.deepEqual(result.clicked, { paywall: true, menu: true, expanded: 'true', focus: 'pdf', placement: 'right', besideRow: true });
  assert.deepEqual(result.firstEscape, { paywall: false, menu: true, focus: 'pdf', expanded: 'false' });
  assert.equal(result.tabbedInto, 'upgrade');
  assert.deepEqual(result.escapeInside, { paywall: false, menu: true, focus: 'pdf' });
  assert.deepEqual(result.secondEscape, { menu: false, focusOnTrigger: true });
  assert.deepEqual(result.afterUpgrade, { paywall: false, menu: false });
  assert.deepEqual(result.tabPastUpgrade, { paywall: false, menu: true, focus: 'xlsx' }, 'with See all plans hidden, Tab from Upgrade leaves the paywall for the next row');
  assert.deepEqual(result.upgrades, [{ feature: 'export_pdf', plan: 'essential' }]);
  assert.deepEqual(result.selected, []);
  assert.equal(result.role, 'menuitem');
  assert.deepEqual({ plan: result.plan, feature: result.feature, title: result.title, body: result.body, description: result.description },
    { plan: 'essential', feature: 'export_pdf', title: 'PDF', body: 'Export the whole deck.', description: 'Requires the Essential plan.' });
});

test('with no room beside the row the paywall falls back to above or below it, inside the viewport', { skip }, async () => {
  const { phone } = await measureAtViewports(pageUrl('padding:16px'), `(() => {
    const root = document.getElementById('dd').shadowRoot;
    root.querySelector('.trigger').click();
    root.querySelector('.item[data-key="pdf"]').click();
    const lock = root.querySelector('.lock');
    const pop = lock.shadowRoot.querySelector('.pop').getBoundingClientRect();
    return { open: lock.open, placement: lock.getAttribute('placement'), inside: pop.left >= 0 && pop.right <= document.documentElement.clientWidth };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-paywall")', viewports: [{ label: 'phone', width: 375, height: 700 }] });
  assert.deepEqual(phone, { open: true, placement: 'bottom', inside: true });
});
