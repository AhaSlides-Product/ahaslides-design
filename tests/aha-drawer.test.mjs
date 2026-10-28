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

  first.show(); await frame();
  modal.show(); await frame(); await frame();
  const modalTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
  document.dispatchEvent(modalTab);
  const centre = () => document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  out.modalPaintsOverDrawer = centre() === modal;
  out.tabStaysInModal = document.activeElement === modal;
  key('Escape'); await frame();
  out.modalClosedFirst = !modal.hasAttribute('open');
  out.drawerOpenAfterFirstEscape = first.hasAttribute('open');
  key('Escape'); await frame();
  out.drawerClosedSecond = !first.hasAttribute('open');

  const earlyModal = document.querySelector('#early-modal');
  const lateDrawer = document.querySelector('#late-drawer');
  lateDrawer.show(); earlyModal.show(); await frame(); await frame();
  out.earlyModalOverLateDrawer = centre() === earlyModal;
  earlyModal.close(); await frame();
  earlyModal.show(); lateDrawer.close(); lateDrawer.show(); await frame(); await frame();
  out.lateDrawerOverEarlyModal = centre() === lateDrawer;
  lateDrawer.close(); earlyModal.close(); await frame();
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
  assert.equal(result.modalPaintsOverDrawer, true);
  assert.equal(result.tabStaysInModal, true);
  assert.equal(result.modalClosedFirst, true);
  assert.equal(result.drawerOpenAfterFirstEscape, true);
  assert.equal(result.drawerClosedSecond, true);
  assert.equal(result.earlyModalOverLateDrawer, true);
  assert.equal(result.lateDrawerOverEarlyModal, true);
});

const sheetScenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const settle = () => new Promise((done) => setTimeout(done, 450));
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const sheet = document.querySelector('#sheet');
  const side = document.querySelector('#drawer');
  const panel = sheet.shadowRoot.querySelector('.panel');
  const handle = sheet.shadowRoot.querySelector('.handle');
  const mask = sheet.shadowRoot.querySelector('.mask');
  const out = {};
  const key = (name, target = document, init = {}) => {
    const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const pointer = (type, target, y, pointerType = 'touch') => target.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType, isPrimary: true, clientX: 300, clientY: y, bubbles: true, composed: true }));
  const sources = [];
  sheet.addEventListener('close', (event) => sources.push(event.detail.source));
  const swipe = async (steps, target = handle, pointerType = 'touch') => {
    pointer('pointerdown', target, 100, pointerType);
    for (const [offset, delay] of steps) { await wait(delay); pointer('pointermove', target, 100 + offset, pointerType); }
    const during = panel.style.transform;
    pointer('pointerup', target, 100 + steps[steps.length - 1][0], pointerType);
    await frame();
    return during;
  };

  out.handleHiddenForSide = getComputedStyle(side.shadowRoot.querySelector('.handle')).display;
  out.subtitleHiddenWhenEmpty = getComputedStyle(side.shadowRoot.querySelector('.subtitle')).display;
  out.actionsHiddenWhenEmpty = getComputedStyle(side.shadowRoot.querySelector('.actions')).display;

  sheet.show(); await frame(); await settle();
  const rect = panel.getBoundingClientRect();
  const style = getComputedStyle(panel);
  out.top = rect.top; out.width = rect.width; out.viewport = innerWidth; out.bottom = rect.bottom; out.viewportHeight = innerHeight;
  out.radius = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius];
  const handleRect = handle.getBoundingClientRect();
  out.handle = [handleRect.width, handleRect.height, getComputedStyle(handle).display, handle.getAttribute('aria-hidden'), handle.getAttribute('part')];
  out.subtitleShown = getComputedStyle(sheet.shadowRoot.querySelector('.subtitle')).display;
  out.actionsShown = getComputedStyle(sheet.shadowRoot.querySelector('.actions')).display;
  out.subtitleOutsideHeading = !sheet.shadowRoot.querySelector('h2').contains(sheet.shadowRoot.querySelector('slot[name=subtitle]'));
  out.panelNodeKept = sheet.shadowRoot.querySelector('.panel') === panel;

  out.gapIsMask = sheet.shadowRoot.elementFromPoint(innerWidth / 2, 20) === mask;
  mask.click(); await frame();
  out.gapClosed = !sheet.hasAttribute('open');
  await settle();

  sheet.show(); await frame(); await settle();
  const height = panel.getBoundingClientRect().height;
  out.longSwipeDuring = await swipe([[200, 120], [height * 0.3, 120]]);
  out.longSwipeClosed = !sheet.hasAttribute('open');
  out.transformCleared = panel.style.transform === '';
  await settle();

  sheet.show(); await frame(); await settle();
  out.shortSwipeDuring = await swipe([[60, 200], [100, 200]], sheet.shadowRoot.querySelector('.header'));
  out.shortSwipeOpen = sheet.hasAttribute('open');
  out.shortSwipeSnapped = panel.style.transform === '' && panel.style.transition === '';

  await swipe([[40, 60], [80, 5]]);
  out.fastFlickClosed = !sheet.hasAttribute('open');
  await settle();

  sheet.show(); await frame(); await settle();
  await swipe([[300, 50], [500, 50]], handle, 'mouse');
  out.mouseDragOpen = sheet.hasAttribute('open');
  await swipe([[-80, 100]]);
  out.upwardDragOpen = sheet.hasAttribute('open');

  const veto = (event) => event.preventDefault();
  sheet.addEventListener('close', veto);
  await swipe([[height * 0.6, 100]]);
  out.cancelledStaysOpen = sheet.hasAttribute('open');
  out.cancelledSnapped = panel.style.transform === '';
  sheet.removeEventListener('close', veto);

  const more = sheet.querySelector('#more');
  more.setAttribute('aria-expanded', 'true');
  out.escapeInOpenPopupPrevented = key('Escape', more);
  await frame();
  out.stillOpenAfterPopupEscape = sheet.hasAttribute('open');
  more.setAttribute('aria-expanded', 'false');
  const menu = sheet.querySelector('#menu');
  menu.setAttribute('open', '');
  key('Escape', menu); await frame();
  out.stillOpenAfterMenuEscape = sheet.hasAttribute('open');
  menu.removeAttribute('open');

  const portal = document.createElement('div');
  portal.tabIndex = 0;
  document.body.append(portal);
  out.portalTabPrevented = key('Tab', portal);
  key('Escape', portal); await frame();
  out.stillOpenAfterPortalEscape = sheet.hasAttribute('open');
  portal.remove();

  out.escapeClosesSheet = key('Escape', sheet.querySelector('#sheet-next')) && !(await frame(), sheet.hasAttribute('open'));
  out.sources = sources;
  await settle();

  const phone = document.createElement('iframe');
  phone.style.cssText = 'position:fixed;left:0;top:0;width:375px;height:700px;border:0;z-index:5';
  phone.src = location.href;
  document.body.append(phone);
  while (!phone.contentWindow.drawerFixtureReady) await wait(50);
  const phoneSheet = phone.contentDocument.querySelector('#sheet');
  phoneSheet.show(); await wait(600);
  const phonePanel = phoneSheet.shadowRoot.querySelector('.panel');
  const phoneRect = phonePanel.getBoundingClientRect();
  const phoneStyle = phone.contentWindow.getComputedStyle(phonePanel);
  out.phone = [phoneRect.top, phoneRect.width, phoneStyle.borderTopLeftRadius, phone.contentWindow.getComputedStyle(phoneSheet.shadowRoot.querySelector('.handle')).display];
  return out;
})()`;

test('aha-drawer placement=bottom is a bottom sheet with a handle, swipe to close and popup-aware keys', { skip }, async () => {
  const result = await evaluateInPage(fixture, sheetScenarios, { readyExpr: '!!window.drawerFixtureReady', timeout: 60000 });
  assert.equal(result.handleHiddenForSide, 'none');
  assert.equal(result.subtitleHiddenWhenEmpty, 'none');
  assert.equal(result.actionsHiddenWhenEmpty, 'none');
  assert.equal(result.top, 48);
  assert.equal(result.width, result.viewport);
  assert.equal(result.bottom, result.viewportHeight);
  assert.deepEqual(result.radius, ['16px', '16px', '0px']);
  assert.deepEqual(result.handle, [40, 4, 'block', 'true', 'handle']);
  assert.equal(result.subtitleShown, 'block');
  assert.equal(result.actionsShown, 'flex');
  assert.equal(result.subtitleOutsideHeading, true);
  assert.equal(result.panelNodeKept, true);
  assert.equal(result.gapIsMask, true);
  assert.equal(result.gapClosed, true);
  assert.match(result.longSwipeDuring, /^translateY\(\d+(\.\d+)?px\)$/);
  assert.equal(result.longSwipeClosed, true);
  assert.equal(result.transformCleared, true);
  assert.match(result.shortSwipeDuring, /^translateY\(100px\)$/);
  assert.equal(result.shortSwipeOpen, true);
  assert.equal(result.shortSwipeSnapped, true);
  assert.equal(result.fastFlickClosed, true);
  assert.equal(result.mouseDragOpen, true);
  assert.equal(result.upwardDragOpen, true);
  assert.equal(result.cancelledStaysOpen, true);
  assert.equal(result.cancelledSnapped, true);
  assert.equal(result.escapeInOpenPopupPrevented, false);
  assert.equal(result.stillOpenAfterPopupEscape, true);
  assert.equal(result.stillOpenAfterMenuEscape, true);
  assert.equal(result.portalTabPrevented, false);
  assert.equal(result.stillOpenAfterPortalEscape, true);
  assert.equal(result.escapeClosesSheet, true);
  assert.deepEqual(result.sources, ['mask', 'swipe', 'swipe', 'swipe', 'escape']);
  assert.deepEqual(result.phone, [0, 375, '0px', 'block']);
});
