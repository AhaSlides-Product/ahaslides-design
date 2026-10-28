import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./csat-opt-ins.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const root = (id) => document.getElementById(id).shadowRoot;
  const pop = (id) => root(id).querySelector('aha-popover');
  const out = {};
  const events = [];
  for (const id of ['plain', 'any', 'stacked']) document.getElementById(id).addEventListener('feedback', (e) => events.push([id, e.detail.rating, e.detail.feedback]));

  const plain = document.getElementById('plain');
  root('plain').querySelector('.up').click(); await wait(400);
  out.plainUpOpens = pop('plain').open;
  out.plainUpHasPopupAttr = root('plain').querySelector('.up').hasAttribute('aria-haspopup');
  out.plainConfirmEmpty = root('plain').querySelector('.confirm').textContent;
  out.plainConfirmHidden = getComputedStyle(root('plain').querySelector('.confirm')).display;
  out.plainSelectedColour = getComputedStyle(root('plain').querySelector('.up')).color;
  root('plain').querySelector('.down').click(); await wait(400);
  out.plainDownOpens = pop('plain').open;

  const any = document.getElementById('any');
  const anyRoot = root('any');
  out.anyRestStatus = anyRoot.querySelector('.confirm').getAttribute('role');
  out.anyRestText = anyRoot.querySelector('.confirm').textContent;
  anyRoot.querySelector('.up').click(); await wait(400);
  out.anyUpOpens = pop('any').open;
  out.anyUpExpanded = anyRoot.querySelector('.up').getAttribute('aria-expanded');
  out.anyUpHaspopup = anyRoot.querySelector('.up').getAttribute('aria-haspopup');
  out.anyConfirm = anyRoot.querySelector('.confirm').textContent;
  out.anySelectedColour = getComputedStyle(anyRoot.querySelector('.up')).color;
  anyRoot.querySelector('.fb-close').click(); await wait(400);
  out.anyClosedWithoutText = !pop('any').open;
  out.anyValueKept = any.getAttribute('value');
  anyRoot.querySelector('.fb-text').value = 'nice';
  anyRoot.querySelector('.fb-text').dispatchEvent(new Event('input'));
  pop('any').open = true; await wait(300);
  anyRoot.querySelector('.fb-submit').click(); await wait(400);
  out.anyEvent = events.find((e) => e[0] === 'any');
  out.anyDone = any.hasAttribute('data-feedback-done');
  out.anyConfirmAfterSend = anyRoot.querySelector('.confirm').textContent;
  anyRoot.querySelector('.up').click(); await wait(300);
  out.anyUnrateClears = anyRoot.querySelector('.confirm').textContent === '' && !any.hasAttribute('value');
  anyRoot.querySelector('.up').click(); await wait(400);
  out.anyReratedReopens = pop('any').open;
  anyRoot.querySelector('.down').click(); await wait(400);
  out.anySwitchToDownStaysOpen = pop('any').open && any.getAttribute('value') === 'down';

  const mixed = root('mixed');
  mixed.querySelector('.fb-open').click(); await wait(400);
  out.mixedButtonPlaceholder = mixed.querySelector('.fb-text').getAttribute('placeholder');
  mixed.querySelector('.up').click(); await wait(400);
  out.mixedUpPlaceholder = mixed.querySelector('.fb-text').getAttribute('placeholder');
  out.mixedUpOpens = pop('mixed').open;

  const stacked = root('stacked');
  document.getElementById('stacked').setAttribute('value', 'up'); await wait(100);
  const rating = stacked.querySelector('.rating').getBoundingClientRect();
  const confirm = stacked.querySelector('.confirm').getBoundingClientRect();
  const btns = stacked.querySelector('.btns').getBoundingClientRect();
  out.stackedUnderThumbs = confirm.top >= btns.bottom - 1;
  out.stackedStaysInside = confirm.right <= rating.right + 1;
  document.getElementById('stacked').removeAttribute('layout'); await wait(100);
  const rowConfirm = stacked.querySelector('.confirm').getBoundingClientRect();
  const rowBtns = stacked.querySelector('.btns').getBoundingClientRect();
  out.rowBesideThumbs = rowConfirm.left >= rowBtns.right - 1 && Math.abs(rowConfirm.top - rowBtns.top) < 14;
  return out;
})()`;

test('csat opt-ins: default unchanged, feedback-on="any" opens after a like, confirmation shows inline', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.csatFixtureReady', timeout: 60000 });
  assert.equal(r.plainUpOpens, false);
  assert.equal(r.plainUpHasPopupAttr, false);
  assert.equal(r.plainConfirmEmpty, '');
  assert.equal(r.plainConfirmHidden, 'none');
  assert.equal(r.plainSelectedColour, 'rgb(26, 26, 26)');
  assert.equal(r.plainDownOpens, true);
  assert.equal(r.anyRestStatus, 'status');
  assert.equal(r.anyRestText, '');
  assert.equal(r.anyUpOpens, true);
  assert.equal(r.anyUpExpanded, 'true');
  assert.equal(r.anyUpHaspopup, 'dialog');
  assert.equal(r.anyConfirm, 'Thanks, feedback received');
  assert.equal(r.anySelectedColour, 'rgb(231, 14, 104)');
  assert.equal(r.anyClosedWithoutText, true);
  assert.equal(r.anyValueKept, 'up');
  assert.deepEqual(r.anyEvent, ['any', 'up', 'nice']);
  assert.equal(r.anyDone, true);
  assert.equal(r.anyConfirmAfterSend, 'Thanks, feedback received');
  assert.equal(r.anyUnrateClears, true);
  assert.equal(r.anyReratedReopens, true);
  assert.equal(r.anySwitchToDownStaysOpen, true);
  assert.equal(r.mixedButtonPlaceholder, 'Share your thoughts');
  assert.equal(r.mixedUpPlaceholder, 'Tell us more');
  assert.equal(r.mixedUpOpens, true);
  assert.equal(r.stackedUnderThumbs, true);
  assert.equal(r.stackedStaysInside, true);
  assert.equal(r.rowBesideThumbs, true);
});

const anchorScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const root = document.getElementById('hint').shadowRoot;
  const popover = root.querySelector('aha-popover');
  const up = root.querySelector('.up').getBoundingClientRect();
  const feedbackButton = root.querySelector('.fb-open').getBoundingClientRect();
  const host = popover.getBoundingClientRect();
  const out = {
    anchorStartsAtUp: Math.abs(host.left - up.left) < 1,
    anchorEndsAtFeedbackButton: Math.abs(host.right - feedbackButton.right) < 1,
  };
  root.querySelector('.up').click(); await wait(400);
  out.opened = popover.open;
  out.hintShown = root.querySelector('.fb-text').getAttribute('info-message');
  out.tooltipHiddenWhileOpen = getComputedStyle(root.querySelector('.tip-up').shadowRoot.querySelector('.bubble')).visibility;
  root.querySelector('.fb-close').click(); await wait(400);
  out.closed = !popover.open;
  return out;
})()`;

test('csat: the popover anchors to the whole thumbs group and tooltips yield while it is open', { skip }, async () => {
  const r = await evaluateInPage(fixture, anchorScenarios, { readyExpr: '!!window.csatFixtureReady', timeout: 60000 });
  assert.equal(r.anchorStartsAtUp, true);
  assert.equal(r.anchorEndsAtFeedbackButton, true);
  assert.equal(r.opened, true);
  assert.equal(r.hintShown, 'What you write goes to the developer');
  assert.equal(r.tooltipHiddenWhileOpen, 'hidden');
  assert.equal(r.closed, true);
});
