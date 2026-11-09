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
  out.plainSelectedColour = getComputedStyle(root('plain').querySelector('.up').shadowRoot.querySelector('button')).color;
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
  out.anySelectedColour = getComputedStyle(anyRoot.querySelector('.up').shadowRoot.querySelector('button')).color;
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
  out.stackedGap = getComputedStyle(stacked.querySelector('.confirm')).marginTop;
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
  assert.equal(r.plainSelectedColour, 'rgb(219, 0, 91)');
  assert.equal(r.plainDownOpens, true);
  assert.equal(r.anyRestStatus, 'status');
  assert.equal(r.anyRestText, '');
  assert.equal(r.anyUpOpens, true);
  assert.equal(r.anyUpExpanded, 'true');
  assert.equal(r.anyUpHaspopup, 'dialog');
  assert.equal(r.anyConfirm, 'Thanks, feedback received');
  assert.equal(r.anySelectedColour, 'rgb(219, 0, 91)');
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
  assert.equal(r.stackedGap, '8px');
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

const inlineScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const host = document.getElementById('inline');
  const root = host.shadowRoot;
  const panel = root.querySelector('.fb-inline');
  const down = root.querySelector('.down');
  const feedbackButton = root.querySelector('.fb-open');
  const events = [];
  host.addEventListener('feedback', (e) => events.push([e.detail.rating, e.detail.feedback]));
  const field = () => root.querySelector('.fb-text').shadowRoot.querySelector('.field');
  const out = {
    popoverDisplay: getComputedStyle(root.querySelector('aha-popover')).display,
    closedHeight: panel.getBoundingClientRect().height,
    closedInert: panel.inert,
    downHaspopup: down.getAttribute('aria-haspopup'),
    downPressedAtRest: down.shadowRoot.querySelector('button').getAttribute('aria-pressed'),
    reducedMotionDuration: getComputedStyle(panel).transitionDuration,
  };
  down.click(); await wait(300);
  const btns = root.querySelector('.btns').getBoundingClientRect();
  const opened = panel.getBoundingClientRect();
  out.open = { value: host.getAttribute('value'), role: panel.getAttribute('role'), label: panel.getAttribute('aria-label'),
    expanded: down.getAttribute('aria-expanded'), innerExpanded: down.shadowRoot.querySelector('button').getAttribute('aria-expanded'),
    pressed: down.shadowRoot.querySelector('button').getAttribute('aria-pressed'), popoverOpen: root.querySelector('aha-popover').open,
    inert: panel.inert, belowButtons: opened.top >= btns.bottom - 1, insideHost: opened.right <= host.getBoundingClientRect().right + 1,
    tall: opened.height > 60, textareaFocused: root.querySelector('.fb-text').shadowRoot.activeElement === field() };
  field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true })); await wait(300);
  out.escape = { collapsed: !host.hasAttribute('data-feedback-open') && panel.getBoundingClientRect().height === 0,
    expanded: down.getAttribute('aria-expanded'), focusOnOpener: root.activeElement === down, value: host.getAttribute('value') };
  feedbackButton.click(); await wait(300);
  out.feedbackButton = { open: host.hasAttribute('data-feedback-open'), expanded: feedbackButton.getAttribute('aria-expanded'), downExpanded: down.getAttribute('aria-expanded') };
  out.inlineCloseHidden = getComputedStyle(root.querySelector('.fb-close')).display;
  field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true })); await wait(300);
  out.closedByEscape = !host.hasAttribute('data-feedback-open');
  down.click(); await wait(100);
  down.click(); await wait(300);
  root.querySelector('.fb-text').value = 'too slow';
  root.querySelector('.fb-text').dispatchEvent(new Event('input'));
  root.querySelector('.fb-submit').click(); await wait(300);
  out.sent = { events, collapsed: !host.hasAttribute('data-feedback-open'), confirm: root.querySelector('.confirm').textContent };
  root.querySelector('.up').click(); await wait(100);
  root.querySelector('.down').click(); await wait(300);
  out.reopensAfterRerate = host.hasAttribute('data-feedback-open');
  host.removeAttribute('feedback-display'); await wait(100);
  out.backToPopover = { collapsed: !host.hasAttribute('data-feedback-open'), haspopup: down.getAttribute('aria-haspopup'),
    bodyInPopover: root.querySelector('.fb-body').parentNode === root.querySelector('aha-popover') };
  return out;
})()`;

test('csat feedback-display="inline": the feedback body opens in flow, not in a second popover', { skip }, async () => {
  const r = await evaluateInPage(fixture, inlineScenarios, { readyExpr: '!!window.csatFixtureReady', timeout: 60000 });
  assert.equal(r.popoverDisplay, 'none');
  assert.equal(r.closedHeight, 0);
  assert.equal(r.closedInert, true);
  assert.equal(r.downHaspopup, null);
  assert.equal(r.downPressedAtRest, 'false');
  assert.equal(r.reducedMotionDuration.split(',').every((d) => d.trim() === '0s'), true);
  assert.deepEqual(r.open, { value: 'down', role: 'group', label: 'Tell us more', expanded: 'true', innerExpanded: 'true', pressed: 'true',
    popoverOpen: false, inert: false, belowButtons: true, insideHost: true, tall: true, textareaFocused: true });
  assert.deepEqual(r.escape, { collapsed: true, expanded: 'false', focusOnOpener: true, value: 'down' });
  assert.deepEqual(r.feedbackButton, { open: true, expanded: 'true', downExpanded: 'false' });
  assert.equal(r.inlineCloseHidden, 'none');
  assert.equal(r.closedByEscape, true);
  assert.deepEqual(r.sent, { events: [['down', 'too slow']], collapsed: true, confirm: 'Thanks, feedback received' });
  assert.equal(r.reopensAfterRerate, true);
  assert.deepEqual(r.backToPopover, { collapsed: true, haspopup: 'dialog', bodyInPopover: true });
});

const ratedScenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const box = document.getElementById('narrow');
  const host = document.getElementById('rated');
  const root = host.shadowRoot;
  const text = () => root.querySelector('.confirm-text').textContent;
  const inBox = (el) => el.getBoundingClientRect().right <= box.getBoundingClientRect().right - 8 + 0.5;
  const out = {};
  root.querySelector('.down').click(); await wait(300);
  out.fits = { scroll: box.scrollWidth <= box.clientWidth, field: inBox(root.querySelector('.fb-text')), send: inBox(root.querySelector('.fb-submit')) };
  out.dislike = text();
  const confirm = getComputedStyle(root.querySelector('.confirm'));
  out.style = { size: confirm.fontSize, weight: confirm.fontWeight, colour: confirm.color, icon: root.querySelector('.confirm aha-icon') };
  out.closeDisplay = getComputedStyle(root.querySelector('.fb-close')).display;
  root.querySelector('.fb-text').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true })); await wait(300);
  out.closedByEscape = !root.host.hasAttribute('data-feedback-open');
  root.querySelector('.up').click(); await wait(300);
  out.like = text();
  root.querySelector('.up').click(); await wait(300);
  out.unratedHidden = root.querySelector('.confirm').hidden;
  root.querySelector('.fb-open').click(); await wait(300);
  root.querySelector('.fb-text').value = 'idea';
  root.querySelector('.fb-text').dispatchEvent(new Event('input'));
  root.querySelector('.fb-submit').click(); await wait(300);
  out.fallbackAfterButtonSend = text();
  out.sentBefore = text();
  root.host.setAttribute('confirmation-sent', 'Thanks! Our developers have received your feedback.');
  root.querySelector('.down').click(); await wait(300);
  out.beforeSend = text();
  root.querySelector('.fb-text').value = 'more';
  root.querySelector('.fb-text').dispatchEvent(new Event('input'));
  root.querySelector('.fb-submit').click(); await wait(300);
  out.afterSend = text();
  root.querySelector('.up').click(); await wait(300);
  out.afterRerate = text();
  const only = document.getElementById('likeonly').shadowRoot;
  only.querySelector('.down').click(); await wait(300);
  out.likeOnlyDown = only.querySelector('.confirm').hidden;
  only.querySelector('.up').click(); await wait(300);
  out.likeOnlyUp = only.querySelector('.confirm-text').textContent;
  return out;
})()`;

test('csat confirmation-like / -dislike name the rating, and the inline field fits a narrow container', { skip }, async () => {
  const r = await evaluateInPage(fixture, ratedScenarios, { readyExpr: '!!window.csatFixtureReady', timeout: 60000 });
  assert.deepEqual(r.fits, { scroll: true, field: true, send: true });
  assert.equal(r.closeDisplay, 'none');
  assert.equal(r.closedByEscape, true);
  assert.equal(r.dislike, "You didn't like this. Thanks for being honest.");
  assert.deepEqual(r.style, { size: '14px', weight: '400', colour: 'rgb(26, 26, 26)', icon: null });
  assert.equal(r.like, 'You liked this. Thanks for letting us know!');
  assert.equal(r.unratedHidden, true);
  assert.equal(r.fallbackAfterButtonSend, 'Thanks, feedback received');
  assert.equal(r.beforeSend, "You didn't like this. Thanks for being honest.");
  assert.equal(r.afterSend, 'Thanks! Our developers have received your feedback.');
  assert.equal(r.afterRerate, 'You liked this. Thanks for letting us know!');
  assert.equal(r.likeOnlyDown, true);
  assert.equal(r.likeOnlyUp, 'You liked this');
});
