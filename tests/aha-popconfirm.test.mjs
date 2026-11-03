import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-popconfirm.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const settle = () => new Promise((done) => setTimeout(done, 300));
  const deep = () => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a; };
  const key = (name) => { const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true }); (deep() || document.body).dispatchEvent(event); return event.defaultPrevented; };
  const pc = document.querySelector('#pc');
  const trigger = document.querySelector('#trigger');
  const root = pc.shadowRoot;
  const ok = root.querySelector('.ok');
  const cancel = root.querySelector('.cancel');
  const panel = () => root.querySelector('.pop').shadowRoot.querySelector('.pop');
  const inside = (button) => { const a = deep(); for (let n = a; n; n = n.parentNode || n.host) if (n === button) return true; return false; };
  const events = [];
  for (const type of ['open', 'confirm', 'cancel', 'close', 'closed']) pc.addEventListener(type, (event) => events.push(type + ':' + ((event.detail && event.detail.source) || '')));
  const out = {};

  out.closedHidden = getComputedStyle(panel()).display;
  trigger.focus(); trigger.click(); await frame(); await settle();
  out.opened = [pc.open, getComputedStyle(panel()).display, trigger.getAttribute('aria-expanded'), trigger.getAttribute('aria-haspopup')];
  out.focusOnOk = inside(ok);
  out.labels = [ok.textContent, cancel.textContent, ok.getAttribute('variant'), cancel.getAttribute('variant'), ok.getAttribute('data-testid'), cancel.getAttribute('data-testid')];
  out.name = panel().getAttribute('aria-label');
  out.placement = root.querySelector('.pop').getAttribute('placement');

  const keepOpen = (event) => event.preventDefault();
  pc.addEventListener('confirm', keepOpen, { once: true });
  ok.click(); await frame();
  out.cancelledConfirmKeepsOpen = pc.open;
  pc.setAttribute('confirm-loading', '');
  out.loadingAttrs = [ok.hasAttribute('loading'), cancel.hasAttribute('disabled')];
  key('Escape'); document.querySelector('#elsewhere').click(); cancel.click(); await frame();
  out.loadingKeepsOpen = pc.open;
  pc.removeAttribute('confirm-loading');
  pc.addEventListener('cancel', keepOpen, { once: true });
  key('Escape'); await frame();
  out.cancelledEscapeKeepsOpen = pc.open;
  key('Escape'); await frame(); await settle();
  out.escapeClosed = [pc.open, trigger.getAttribute('aria-expanded')];
  out.focusBackOnTrigger = document.activeElement === trigger;

  trigger.click(); await frame(); ok.click(); await frame();
  trigger.click(); await frame(); cancel.click(); await frame();
  trigger.click(); await frame(); trigger.click(); await frame();
  trigger.click(); await frame(); await settle();
  document.querySelector('#elsewhere').focus(); document.querySelector('#elsewhere').click(); await frame();
  out.outsideLeavesFocus = document.activeElement.id;
  pc.addEventListener('open', keepOpen, { once: true });
  trigger.click(); await frame();
  out.cancelledOpenStaysShut = pc.open;
  out.events = events.slice();

  pc.setAttribute('ok-danger', '');
  out.dangerVariants = [ok.getAttribute('variant'), cancel.getAttribute('variant')];
  trigger.click(); await frame(); await settle();
  out.dangerFocusOnCancel = inside(cancel);
  pc.close(); await frame();
  pc.setAttribute('ok-danger', 'false');
  out.falseFlagOff = [pc.hasAttribute('ok-danger'), ok.getAttribute('variant')];

  const off = document.querySelector('#off');
  document.querySelector('#off-trigger').click(); await frame();
  out.disabledStaysShut = off.open;
  document.querySelector('#dead-trigger').click(); await frame();
  out.disabledTriggerStaysShut = document.querySelector('#dead').open;

  const second = document.querySelector('#second');
  pc.show(); await frame(); second.show(); await frame();
  key('Escape'); await frame();
  out.escapeTakesLatest = [pc.open, second.open];
  pc.close(); await frame(); await settle();

  const modal = document.querySelector('#modal');
  const nested = document.querySelector('#nested');
  const heardByModal = [];
  for (const type of ['open', 'cancel', 'close', 'closed']) modal.addEventListener(type, () => heardByModal.push(type));
  modal.show(); await frame(); await settle();
  document.querySelector('#nested-trigger').click(); await frame(); await settle();
  key('Escape'); await frame(); await settle();
  out.escapeInModal = [nested.open, modal.open];
  out.heardByModal = heardByModal.slice();
  modal.close(); await frame(); await settle();

  const built = document.createElement('aha-popconfirm');
  out.createdUpgraded = built instanceof customElements.get('aha-popconfirm');
  built.setAttribute('open', 'false');
  document.body.append(built); await frame();
  out.falseStaysClosed = built.open;
  return out;
})()`;

test('aha-popconfirm maps the antd props, moves focus in and back, and closes only through uncancelled confirm / cancel / close', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.popconfirmFixtureReady', timeout: 45000 });
  assert.equal(r.closedHidden, 'none');
  assert.deepEqual(r.opened, [true, 'block', 'true', 'dialog']);
  assert.equal(r.focusOnOk, true);
  assert.deepEqual(r.labels, ['Delete', 'Keep', 'primary', 'secondary', 'del-ok', 'del-cancel']);
  assert.equal(r.name, 'Delete this slide?');
  assert.equal(r.placement, 'top');
  assert.equal(r.cancelledConfirmKeepsOpen, true);
  assert.deepEqual(r.loadingAttrs, [true, true]);
  assert.equal(r.loadingKeepsOpen, true);
  assert.equal(r.cancelledEscapeKeepsOpen, true);
  assert.deepEqual(r.escapeClosed, [false, 'false']);
  assert.equal(r.focusBackOnTrigger, true);
  assert.equal(r.outsideLeavesFocus, 'elsewhere');
  assert.equal(r.cancelledOpenStaysShut, false);
  assert.deepEqual(r.events, [
    'open:trigger', 'confirm:', 'cancel:escape',
    'cancel:escape', 'close:escape', 'closed:escape',
    'open:trigger', 'confirm:', 'close:confirm', 'closed:confirm',
    'open:trigger', 'cancel:cancel-button', 'close:cancel-button', 'closed:cancel-button',
    'open:trigger', 'cancel:trigger', 'close:trigger', 'closed:trigger',
    'open:trigger', 'cancel:outside', 'close:outside', 'closed:outside',
    'open:trigger',
  ]);
  assert.deepEqual(r.dangerVariants, ['secondary', 'primary']);
  assert.equal(r.dangerFocusOnCancel, true);
  assert.deepEqual(r.falseFlagOff, [false, 'primary']);
  assert.equal(r.disabledStaysShut, false);
  assert.equal(r.disabledTriggerStaysShut, false);
  assert.deepEqual(r.escapeTakesLatest, [true, false]);
  assert.deepEqual(r.escapeInModal, [false, true]);
  assert.deepEqual(r.heardByModal, []);
  assert.equal(r.createdUpgraded, true);
  assert.equal(r.falseStaysClosed, false);
});
