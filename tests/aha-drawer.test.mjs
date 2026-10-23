import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-drawer.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const settle = () => new Promise((done) => setTimeout(done, 450));
  const key = (name, init = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true, ...init }));
  const drawer = document.querySelector('#drawer');
  const opener = document.querySelector('#opener');
  const panel = drawer.shadowRoot.querySelector('.panel');
  const out = {};

  out.closedVisibility = getComputedStyle(drawer.shadowRoot.querySelector('.layer')).visibility;

  opener.focus();
  drawer.show();
  await frame(); await frame();
  await settle();
  out.openVisibility = getComputedStyle(drawer.shadowRoot.querySelector('.layer')).visibility;
  out.panelWidth = getComputedStyle(panel).width;
  out.role = panel.getAttribute('role');
  out.labelledby = panel.getAttribute('aria-labelledby');
  out.focusOnPanel = drawer.shadowRoot.activeElement === panel;
  out.pageScrollLocked = document.documentElement.style.overflow;

  drawer.setAttribute('heading', 'Renamed');
  drawer.setAttribute('size', 'large');
  out.panelNodeKept = drawer.shadowRoot.querySelector('.panel') === panel;
  out.headingText = drawer.shadowRoot.querySelector('.heading').textContent;
  out.largeWidth = getComputedStyle(panel).width;
  drawer.removeAttribute('size');

  const where = () => {
    const active = document.activeElement === drawer ? drawer.shadowRoot.activeElement : document.activeElement;
    if (active === panel) return 'panel';
    if (active === drawer.shadowRoot.querySelector('.body')) return 'body';
    if (drawer.shadowRoot.querySelector('.close').contains(active) || drawer.shadowRoot.querySelector('.close').shadowRoot?.contains(active)) return 'close';
    return active?.id || 'outside';
  };
  const press = (init) => { const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true, ...init }); document.dispatchEvent(event); return event.defaultPrevented; };
  const wrap = {};
  wrap.fromPanel = press() ? where() : 'native';
  drawer.shadowRoot.querySelector('.body').focus();
  wrap.fromBodyPrevented = press();
  document.querySelector('#footer-button').focus();
  press(); wrap.lastForward = where();
  press({ shiftKey: true }); wrap.firstBackward = where();
  out.wrap = wrap;

  let closeEvents = 0;
  let sources = [];
  drawer.addEventListener('close', (event) => { closeEvents++; sources.push(event.detail.source); if (closeEvents === 1) event.preventDefault(); });
  key('Escape');
  await frame();
  out.stillOpenAfterCancelledClose = drawer.hasAttribute('open');
  key('Escape');
  await frame();
  out.closedAfterEscape = !drawer.hasAttribute('open');
  out.closeSources = sources;
  out.scrollUnlocked = document.documentElement.style.overflow === '';
  await settle();
  out.hiddenAfterLeave = getComputedStyle(drawer.shadowRoot.querySelector('.layer')).visibility;
  out.focusReturned = document.activeElement === opener;

  drawer.show(); await frame(); await settle();
  drawer.shadowRoot.querySelector('.mask').click(); await frame();
  out.maskClosed = !drawer.hasAttribute('open');
  await settle();

  drawer.setAttribute('static', ''); drawer.show(); await frame();
  drawer.shadowRoot.querySelector('.mask').click(); await frame();
  out.staticIgnoresMask = drawer.hasAttribute('open');
  drawer.shadowRoot.querySelector('.close').click(); await frame();
  out.closeButtonClosed = !drawer.hasAttribute('open');
  return out;
})()`;

test('aha-drawer opens, traps focus, closes through a cancelable close and returns focus', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.drawerFixtureReady', timeout: 45000 });
  assert.equal(result.closedVisibility, 'hidden');
  assert.equal(result.openVisibility, 'visible');
  assert.equal(result.panelWidth, '378px');
  assert.equal(result.role, 'dialog');
  assert.equal(result.labelledby, 'title');
  assert.equal(result.focusOnPanel, true);
  assert.equal(result.pageScrollLocked, 'hidden');
  assert.equal(result.panelNodeKept, true);
  assert.equal(result.headingText, 'Renamed');
  assert.equal(result.largeWidth, '736px');
  assert.deepEqual(result.wrap, { fromPanel: 'close', fromBodyPrevented: false, lastForward: 'close', firstBackward: 'footer-button' });
  assert.equal(result.stillOpenAfterCancelledClose, true);
  assert.equal(result.closedAfterEscape, true);
  assert.deepEqual(result.closeSources, ['escape', 'escape', 'mask', 'close-button']);
  assert.equal(result.scrollUnlocked, true);
  assert.equal(result.hiddenAfterLeave, 'hidden');
  assert.equal(result.focusReturned, true);
  assert.equal(result.maskClosed, true);
  assert.equal(result.staticIgnoresMask, true);
  assert.equal(result.closeButtonClosed, true);
});

const stackFixture = pathToFileURL(fileURLToPath(new URL('./aha-drawer-stack.html', import.meta.url))).href;

const stackScenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const key = (name, init = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true, ...init }));
  const parent = document.querySelector('#parent');
  const child = document.querySelector('#child');
  const first = document.querySelector('#first');
  const modal = document.querySelector('#modal');
  const out = {};

  parent.show(); child.show(); await frame();
  key('Escape'); await frame();
  out.childClosedByEscape = !child.hasAttribute('open');
  out.parentStillOpen = parent.hasAttribute('open');
  child.show(); await frame();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
  document.dispatchEvent(tab);
  out.childTrapsTab = tab.defaultPrevented && child.contains(document.activeElement);
  child.close(); parent.close(); await frame();

  const root = document.documentElement;
  root.style.overflow = 'auto';
  first.show(); modal.show(); await frame();
  out.lockedWhileBothOpen = root.style.overflow;
  first.close(); await frame();
  out.stillLockedAfterDrawerCloses = root.style.overflow;
  modal.close(); await frame();
  out.restoredAfterBothClose = root.style.overflow;

  modal.show(); first.show(); await frame();
  modal.close(); await frame();
  out.stillLockedAfterModalClosesFirst = root.style.overflow;
  first.close(); await frame();
  out.restoredAfterOutOfOrderClose = root.style.overflow;
  return out;
})()`;

test('nested aha-drawer handles keys on top and the scroll lock is shared with aha-audience-modal', { skip }, async () => {
  const result = await evaluateInPage(stackFixture, stackScenarios, { readyExpr: '!!window.drawerFixtureReady', timeout: 45000 });
  assert.equal(result.childClosedByEscape, true);
  assert.equal(result.parentStillOpen, true);
  assert.equal(result.childTrapsTab, true);
  assert.equal(result.lockedWhileBothOpen, 'hidden');
  assert.equal(result.stillLockedAfterDrawerCloses, 'hidden');
  assert.equal(result.restoredAfterBothClose, 'auto');
  assert.equal(result.stillLockedAfterModalClosesFirst, 'hidden');
  assert.equal(result.restoredAfterOutOfOrderClose, 'auto');
});
