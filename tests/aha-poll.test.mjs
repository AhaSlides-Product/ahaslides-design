import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-poll.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = { readyExpr: 'window.pollFixtureReady === true' };

const voteFlow = String.raw`(async () => {
  const host = document.getElementById('single');
  const root = host.shadowRoot;
  const visible = (el) => !el.hidden && getComputedStyle(el).display !== 'none';
  const cast = root.querySelector('.cast');
  const out = {};
  out.labelElements = root.querySelector('aha-radio').children.length;
  out.labelText = root.querySelector('aha-radio').textContent;
  out.resultsBeforeVote = visible(root.querySelector('.results'));
  out.castDisabledBeforePick = cast.hasAttribute('disabled');

  const votes = [];
  host.addEventListener('vote', (e) => votes.push(e.detail.values));
  const radios = root.querySelectorAll('aha-radio');
  radios[1].click();
  await new Promise((r) => setTimeout(r, 0));
  cast.click();
  out.voted = votes;

  const bar = root.querySelectorAll('aha-progressbar')[1];
  host.setAttribute('counts', '{"a":1,"b":4}');
  host.setAttribute('value', '["b"]');
  host.setAttribute('voted', '');
  out.sameBar = root.querySelectorAll('aha-progressbar')[1] === bar;
  out.resultsAfterVote = visible(root.querySelector('.results'));
  out.castAfterVote = visible(cast);
  out.singlePct = [...root.querySelectorAll('.pct')].map((n) => n.textContent);
  out.barValue = bar.getAttribute('value');

  host.setAttribute('status', 'closed');
  out.closedCast = visible(cast);
  out.closedToggle = visible(root.querySelector('.toggle'));
  out.closedStatus = root.querySelector('.status-text').textContent;

  const multi = document.getElementById('multi').shadowRoot;
  out.multiPct = [...multi.querySelectorAll('.pct')].map((n) => n.textContent);
  out.multiRows = multi.querySelectorAll('aha-checkbox').length;
  return out;
})()`;

test('aha-poll casts the picked id, shows results after the vote with bars updated in place, and closes', { skip }, async () => {
  const r = await evaluateInPage(fixture, voteFlow, ready);
  assert.equal(r.labelElements, 0);
  assert.equal(r.labelText, '<img src=x onerror=alert(1)>');
  assert.equal(r.resultsBeforeVote, false);
  assert.equal(r.castDisabledBeforePick, true);
  assert.deepEqual(r.voted, [['b']]);
  assert.equal(r.sameBar, true);
  assert.equal(r.resultsAfterVote, true);
  assert.equal(r.castAfterVote, false);
  assert.deepEqual(r.singlePct, ['20%', '80%']);
  assert.equal(r.barValue, '80');
  assert.equal(r.closedCast, false);
  assert.equal(r.closedToggle, false);
  assert.equal(r.closedStatus, 'Poll closed');
  assert.deepEqual(r.multiPct, ['75%', '50%']);
  assert.equal(r.multiRows, 2);
});

const layerMeasure = String.raw`(() => {
  const text = (el) => { const s = getComputedStyle(el); return { color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight }; };
  const el = document.getElementById('multi').shadowRoot;
  const d = document.getElementById('discourse');
  const track = (node) => { const s = getComputedStyle(node); return { height: s.height, bg: s.backgroundColor }; };
  const elBar = el.querySelector('aha-progressbar').shadowRoot.querySelector('aha-progress').shadowRoot;
  const elTrack = elBar.querySelector('.track');
  const elFill = elBar.querySelector('.fill');
  const block = (node) => { const s = getComputedStyle(node); return { border: s.borderTopColor, radius: s.borderTopLeftRadius, padding: s.paddingTop }; };
  return {
    elInfo: text(el.querySelector('.info')), dInfo: text(d.querySelector('.info-label')),
    elPct: text(el.querySelector('.pct')), dPct: text(d.querySelector('.percentage')),
    elTrack: elTrack && track(elTrack), dTrack: track(d.querySelector('.bar-back')),
    elFill: elFill && getComputedStyle(elFill).backgroundColor, dFill: getComputedStyle(d.querySelector('.bar')).backgroundColor,
    elBlock: block(el.querySelector('.poll')), dBlock: block(d),
  };
})()`;

test('discourse-poll.css draws the plugin markup with the <aha-poll> values', { skip }, async () => {
  const r = await evaluateInPage(fixture, layerMeasure, ready);
  assert.deepEqual(r.dInfo, r.elInfo);
  assert.deepEqual(r.dPct, r.elPct);
  assert.deepEqual(r.dTrack, r.elTrack);
  assert.equal(r.dFill, r.elFill);
  assert.deepEqual(r.dBlock, r.elBlock);
  assert.equal(r.elInfo.color, 'rgb(97, 97, 97)');
  assert.equal(r.elInfo.fontSize, '14px');
});
