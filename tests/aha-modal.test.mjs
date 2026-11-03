import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-modal.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const settle = () => new Promise((done) => setTimeout(done, 450));
  const key = (name, init = {}) => { const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true, ...init }); let target = document.activeElement || document; while (target.shadowRoot && target.shadowRoot.activeElement) target = target.shadowRoot.activeElement; target.dispatchEvent(event); return event.defaultPrevented; };
  const modal = document.querySelector('#modal');
  const opener = document.querySelector('#opener');
  const root = modal.shadowRoot;
  const panel = root.querySelector('.panel');
  const ok = root.querySelector('.ok');
  const cancel = root.querySelector('.cancel');
  const events = [];
  for (const type of ['ok', 'cancel', 'close', 'closed']) modal.addEventListener(type, (event) => events.push(type + ':' + ((event.detail && event.detail.source) || '')));
  const out = {};

  opener.focus();
  modal.show(); await frame(); await frame(); await settle();
  out.visible = getComputedStyle(root.querySelector('.layer')).visibility;
  out.width = getComputedStyle(panel).width;
  out.focusOnPanel = root.activeElement === panel;
  out.scrollLocked = document.documentElement.style.overflow;
  out.labels = [ok.textContent, cancel.textContent, ok.getAttribute('variant'), cancel.getAttribute('variant')];

  const where = () => { const a = root.activeElement; if (a === panel) return 'panel'; for (const [name, el] of [['close', root.querySelector('.close')], ['cancel', cancel], ['ok', ok]]) if (a === el) return name; return document.activeElement.id || 'outside'; };
  key('Tab'); out.tabFromPanel = where();
  ok.focus(); key('Tab'); out.tabWrapsForward = where();
  key('Tab', { shiftKey: true }); out.tabWrapsBackward = where();

  modal.setAttribute('ok-danger', '');
  modal.setAttribute('size', 'complexity');
  out.dangerVariants = [ok.getAttribute('variant'), cancel.getAttribute('variant')];
  out.complexityWidth = getComputedStyle(panel).width;
  root.querySelector('.mask').click(); await frame();
  out.dangerIgnoresMask = modal.open;
  modal.removeAttribute('ok-danger');
  modal.removeAttribute('size');

  modal.setAttribute('confirm-loading', '');
  out.loadingAttrs = [ok.hasAttribute('loading'), cancel.hasAttribute('disabled')];
  key('Escape'); ok.click(); root.querySelector('.mask').click(); await frame();
  out.loadingKeepsOpen = modal.open;
  modal.removeAttribute('confirm-loading');

  modal.setAttribute('keyboard', 'false');
  key('Escape'); await frame();
  out.keyboardFalseKeepsOpen = modal.open;
  modal.removeAttribute('keyboard');
  modal.setAttribute('mask-closable', 'false');
  root.querySelector('.mask').click(); await frame();
  out.maskClosableFalseKeepsOpen = modal.open;
  modal.removeAttribute('mask-closable');
  modal.setAttribute('ok-disabled', '');
  ok.click(); await frame();
  out.okDisabledKeepsOpen = modal.open;
  modal.removeAttribute('ok-disabled');

  out.eventsBefore = events.length;
  const keepOpen = (event) => event.preventDefault();
  modal.addEventListener('ok', keepOpen, { once: true });
  ok.click(); await frame();
  out.cancelledOkKeepsOpen = modal.open;
  modal.addEventListener('cancel', keepOpen, { once: true });
  key('Escape'); await frame();
  out.cancelledEscapeKeepsOpen = modal.open;
  key('Escape'); await frame(); await settle();
  out.escapeClosed = !modal.open;
  out.focusReturned = document.activeElement === opener;
  out.scrollUnlocked = document.documentElement.style.overflow === '';
  modal.show(); await frame(); ok.click(); await frame();
  modal.show(); await frame(); root.querySelector('.mask').click(); await frame();
  modal.show(); await frame(); cancel.click(); await frame();
  modal.show(); await frame(); root.querySelector('.close').click(); await frame();
  out.events = events;

  const custom = document.querySelector('#custom');
  custom.show(); await frame(); await settle();
  out.defaultsHidden = custom.shadowRoot.querySelector('.ok').getClientRects().length === 0;
  document.querySelector('#send').focus(); key('Tab');
  out.customTabWraps = custom.shadowRoot.activeElement === custom.shadowRoot.querySelector('.close');
  custom.close(); await frame(); await settle();

  const nest = document.querySelector('#nest');
  nest.show(); await frame(); await settle();
  document.querySelector('#last-visible').focus(); key('Tab');
  out.hiddenNestedSkipped = nest.shadowRoot.activeElement === nest.shadowRoot.querySelector('.close');
  document.querySelector('#hint').focus(); await frame();
  out.hoverPopoverOpen = document.querySelector('#nest aha-popover').open;
  key('Escape'); await frame(); await settle();
  out.escapePastFocusPopover = nest.open;
  nest.close(); await frame(); await settle();

  const plain = document.querySelector('#plain');
  plain.show(); await frame(); await settle();
  out.nestedInRichWidth = getComputedStyle(plain.shadowRoot.querySelector('.panel')).width;
  plain.close(); await frame(); await settle();

  const built = document.createElement('aha-modal');
  out.createdUpgraded = built instanceof customElements.get('aha-modal');
  let builtClosed = 0;
  built.addEventListener('closed', () => { builtClosed += 1; });
  built.setAttribute('heading', 'Built');
  built.setAttribute('open', 'false');
  document.body.append(built); await frame();
  out.falseStaysClosed = [built.open, document.documentElement.style.overflow, builtClosed];
  built.setAttribute('open', 'true'); await frame();
  out.trueOpens = [built.open, document.documentElement.style.overflow];
  built.setAttribute('open', 'false'); await frame();
  out.falseCloses = [built.open, document.documentElement.style.overflow, builtClosed];
  built.setAttribute('ok-danger', 'false');
  out.falseFlagOff = built.shadowRoot.querySelector('.ok').getAttribute('variant');
  return out;
})()`;

test('aha-modal maps the antd props, traps focus, and closes only through uncancelled ok / cancel / close', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.modalFixtureReady', timeout: 45000 });
  assert.equal(r.visible, 'visible');
  assert.equal(r.width, '504px');
  assert.equal(r.focusOnPanel, true);
  assert.equal(r.scrollLocked, 'hidden');
  assert.deepEqual(r.labels, ['Move', 'Not now', 'primary', 'secondary']);
  assert.deepEqual([r.tabFromPanel, r.tabWrapsForward, r.tabWrapsBackward], ['close', 'close', 'ok']);
  assert.deepEqual(r.dangerVariants, ['secondary', 'primary']);
  assert.equal(r.complexityWidth, '720px');
  assert.equal(r.dangerIgnoresMask, true);
  assert.deepEqual(r.loadingAttrs, [true, true]);
  assert.equal(r.loadingKeepsOpen, true);
  assert.equal(r.keyboardFalseKeepsOpen, true);
  assert.equal(r.maskClosableFalseKeepsOpen, true);
  assert.equal(r.okDisabledKeepsOpen, true);
  assert.equal(r.eventsBefore, 0);
  assert.equal(r.cancelledOkKeepsOpen, true);
  assert.equal(r.cancelledEscapeKeepsOpen, true);
  assert.equal(r.escapeClosed, true);
  assert.equal(r.focusReturned, true);
  assert.equal(r.scrollUnlocked, true);
  assert.deepEqual(r.events, [
    'ok:', 'cancel:escape',
    'cancel:escape', 'close:escape', 'closed:escape',
    'ok:', 'close:ok', 'closed:ok',
    'cancel:mask', 'close:mask', 'closed:mask',
    'cancel:cancel-button', 'close:cancel-button', 'closed:cancel-button',
    'cancel:close-button', 'close:close-button', 'closed:close-button',
  ]);
  assert.equal(r.defaultsHidden, true);
  assert.equal(r.customTabWraps, true);
  assert.equal(r.hiddenNestedSkipped, true);
  assert.deepEqual([r.hoverPopoverOpen, r.escapePastFocusPopover], [true, false]);
  assert.equal(r.nestedInRichWidth, '504px');
  assert.equal(r.createdUpgraded, true);
  assert.deepEqual(r.falseStaysClosed, [false, '', 0]);
  assert.deepEqual(r.trueOpens, [true, 'hidden']);
  assert.deepEqual(r.falseCloses, [false, '', 1]);
  assert.equal(r.falseFlagOff, 'primary');
});
