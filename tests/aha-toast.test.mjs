import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-toast.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const toastScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const out = {};
  const first = toast.success('Slide saved', { duration: 0.6 });
  const toaster = document.querySelector('aha-toaster');
  out.toasterInBody = toaster.parentElement === document.body;
  const box = toaster.getBoundingClientRect();
  out.corner = [Math.round(innerWidth - box.right), Math.round(innerHeight - box.bottom), getComputedStyle(toaster).position];
  out.region = [toaster.getAttribute('role'), toaster.getAttribute('aria-label')];
  const item = toaster.querySelector('aha-toast');
  out.itemRole = item.getAttribute('role');
  out.timedHasClose = !item.shadowRoot.querySelector('.close').hidden;
  out.glyph = item.shadowRoot.querySelector('.icon > aha-icon').getAttribute('name');
  const surface = getComputedStyle(item.shadowRoot.querySelector('.surface'));
  out.look = [surface.backgroundColor, surface.borderTopLeftRadius, surface.paddingTop, surface.paddingLeft, surface.color, surface.fontSize];
  await wait(120);
  out.polite = toaster.shadowRoot.querySelector('.polite').textContent;
  out.focusUntouched = document.activeElement === document.body;
  let closedViaPromise = false;
  first.closed.then(() => { closedViaPromise = true; });
  await wait(1200);
  out.autoRemoved = !item.isConnected && closedViaPromise;

  const hovered = toast.info('Copied', { duration: 0.4 });
  const hoveredItem = toaster.querySelector('aha-toast');
  toaster.dispatchEvent(new PointerEvent('pointerenter'));
  await wait(900);
  out.pausedWhileHovered = hoveredItem.isConnected;
  toaster.dispatchEvent(new PointerEvent('pointerleave'));
  await wait(1000);
  out.resumedAfterLeave = !hoveredItem.isConnected;

  toaster.dispatchEvent(new PointerEvent('pointerenter'));
  toast.info('Copied', { duration: 0 }).close();
  await wait(700);
  toast.info('Link copied', { duration: 0.4 });
  const afterEmpty = toaster.querySelector('aha-toast');
  await wait(900);
  out.timerRunsAfterHoveredStackEmptied = !afterEmpty.isConnected;

  const saving = toast.loading('Saving…', { key: 'save', duration: 0 });
  const savingItem = toaster.querySelector('aha-toast');
  out.loadingSpin = !savingItem.shadowRoot.querySelector('aha-spin').hidden;
  out.stickyHasClose = !savingItem.shadowRoot.querySelector('.close').hidden;
  toast.error('Save failed', { key: 'save', duration: 0 });
  await wait(120);
  out.updatedInPlace = toaster.querySelectorAll('aha-toast').length === 1 && savingItem.textContent === 'Save failed';
  out.assertive = toaster.shadowRoot.querySelector('.assertive').textContent;
  toast.error('Save failed', { key: 'save', duration: 0 });
  out.unchangedUpdateSilent = toaster.shadowRoot.querySelector('.assertive').textContent;

  const opener = document.querySelector('#opener');
  opener.focus();
  const close = savingItem.shadowRoot.querySelector('.close');
  close.focus();
  savingItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }));
  await wait(700);
  out.escapeClosed = !savingItem.isConnected;
  out.focusReturned = document.activeElement === opener;

  const sources = [];
  toaster.addEventListener('close', (event) => sources.push(event.detail.source));
  for (let n = 1; n <= 6; n++) toast.info('Toast ' + n, { duration: 0 });
  await wait(700);
  out.capped = [...toaster.querySelectorAll('aha-toast')].map((node) => node.textContent);
  out.overflowSource = sources[0];
  toast.closeAll();
  await wait(700);
  out.allClosed = toaster.querySelectorAll('aha-toast').length;
  return out;
})()`;

test('toast() opens antd-free toasts in the bottom-right toaster, announces them, pauses, updates by key and dismisses', { skip }, async () => {
  const result = await evaluateInPage(fixture, toastScenarios, { readyExpr: '!!window.toastFixtureReady', timeout: 45000 });
  assert.equal(result.toasterInBody, true);
  assert.deepEqual(result.corner, [24, 24, 'fixed']);
  assert.deepEqual(result.region, ['region', 'Notifications']);
  assert.equal(result.itemRole, null);
  assert.equal(result.timedHasClose, false);
  assert.equal(result.glyph, 'system-check-circle');
  assert.deepEqual(result.look, ['rgb(255, 255, 255)', '8px', '9px', '12px', 'rgb(26, 26, 26)', '14px']);
  assert.equal(result.polite, 'Slide saved');
  assert.equal(result.focusUntouched, true);
  assert.equal(result.autoRemoved, true);
  assert.equal(result.pausedWhileHovered, true);
  assert.equal(result.resumedAfterLeave, true);
  assert.equal(result.timerRunsAfterHoveredStackEmptied, true);
  assert.equal(result.loadingSpin, true);
  assert.equal(result.stickyHasClose, true);
  assert.equal(result.updatedInPlace, true);
  assert.equal(result.assertive, 'Save failed');
  assert.equal(result.unchangedUpdateSilent, 'Save failed');
  assert.equal(result.escapeClosed, true);
  assert.equal(result.focusReturned, true);
  assert.deepEqual(result.capped, ['Toast 2', 'Toast 3', 'Toast 4', 'Toast 5', 'Toast 6']);
  assert.equal(result.overflowSource, 'overflow');
  assert.equal(result.allClosed, 0);
});

const notifyScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const out = {};
  let undone = 0;
  let closedCallback = 0;
  notify.success({ title: 'Slide deleted', description: 'You can find it in Trash.', duration: 0,
    action: { label: 'Undo', onClick: () => { undone++; } }, onClose: () => { closedCallback++; } });
  const toaster = document.querySelector('aha-toaster');
  const card = toaster.querySelector('aha-notification');
  const root = card.shadowRoot;
  const surface = getComputedStyle(root.querySelector('.surface'));
  const title = getComputedStyle(root.querySelector('.title'));
  const description = getComputedStyle(root.querySelector('.description'));
  out.look = [surface.width, surface.paddingTop, surface.paddingLeft, surface.borderTopLeftRadius, title.fontSize, title.fontWeight, title.color, description.color];
  out.glyph = root.querySelector('.icon > aha-icon').getAttribute('name');
  out.title = root.querySelector('.title').textContent;
  out.hasClose = !root.querySelector('.close').hidden;
  out.actionShown = !root.querySelector('.actions').hidden;
  await wait(120);
  out.polite = toaster.shadowRoot.querySelector('.polite').textContent;
  card.querySelector('[slot="action"]').click();
  await wait(700);
  out.actionClosed = [undone, !card.isConnected, closedCallback];

  notify({ title: 'Export ready', description: 'Your CSV is good to go.', duration: 0 });
  const plain = toaster.querySelector('aha-notification');
  out.plainIcon = plain.shadowRoot.querySelector('.icon').hidden;
  out.plainActions = plain.shadowRoot.querySelector('.actions').hidden;
  plain.shadowRoot.querySelector('.close').click();
  await wait(700);
  out.closeButtonClosed = !plain.isConnected;
  return out;
})()`;

test('notify() opens antd-free notification cards in the same toaster with title, description, action and the shared close', { skip }, async () => {
  const result = await evaluateInPage(fixture, notifyScenarios, { readyExpr: '!!window.toastFixtureReady', timeout: 45000 });
  assert.deepEqual(result.look, ['384px', '20px', '24px', '8px', '16px', '600', 'rgb(26, 26, 26)', 'rgb(74, 74, 74)']);
  assert.equal(result.glyph, 'system-check-circle');
  assert.equal(result.title, 'Slide deleted');
  assert.equal(result.hasClose, true);
  assert.equal(result.actionShown, true);
  assert.equal(result.polite, 'Slide deleted. You can find it in Trash.');
  assert.deepEqual(result.actionClosed, [1, true, 1]);
  assert.equal(result.plainIcon, true);
  assert.equal(result.plainActions, true);
  assert.equal(result.closeButtonClosed, true);
});
