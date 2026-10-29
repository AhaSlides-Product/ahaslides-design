import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./option-picture-order.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 50));
  const left = (element, selector) => element.shadowRoot.querySelector(selector).getBoundingClientRect().left;
  const picture = (host, id) => host.shadowRoot.querySelector(id ? '[data-option-id="' + id + '"] .picture' : '.picture');
  const answer = document.getElementById('answer');
  const expandable = document.getElementById('answer-expandable');
  const rank = document.getElementById('rank');
  const rankRow = (id) => rank.shadowRoot.querySelector('[data-option-id="' + id + '"]');
  const rankLeft = (id, selector) => rankRow(id).querySelector(selector).getBoundingClientRect().left;
  return {
    answerPictureAfterLabel: left(answer, '.picture') > left(answer, '.label'),
    expandablePictureAfterLabel: left(expandable, '.picture') > left(expandable, '.label'),
    rankPictureAfterLabel: rankLeft('a', '.picture') > rankLeft('a', '.label'),
    rankPictureBeforeControls: rankLeft('a', '.picture') < rankLeft('a', '.controls'),
    rankBadgeFirst: rankLeft('a', '.badge') < rankLeft('a', '.label'),
    rankImageOnlyHasNoLabel: !rankRow('b').querySelector('.label'),
    answerDomOrder: [...answer.shadowRoot.querySelector('.content').children].map((el) => el.className.split(' ')[0]),
  };
})()`;

test('an option row with text and a picture puts the picture after the text, and DOM order matches', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.optionPictureOrderReady', timeout: 45000 });
  assert.deepEqual(result, {
    answerPictureAfterLabel: true,
    expandablePictureAfterLabel: true,
    rankPictureAfterLabel: true,
    rankPictureBeforeControls: true,
    rankBadgeFirst: true,
    rankImageOnlyHasNoLabel: true,
    answerDomOrder: ['control', 'verdict', 'body', 'picture', 'count'],
  });
});

const insets = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 50));
  const gaps = (row, picture, next) => {
    const outer = row.getBoundingClientRect();
    const inner = picture.getBoundingClientRect();
    return {
      top: inner.top - outer.top,
      right: next ? next.getBoundingClientRect().left - inner.right : outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
    };
  };
  const answerGaps = (id) => {
    const host = document.getElementById(id);
    return gaps(host.shadowRoot.querySelector('.row'), host.shadowRoot.querySelector('.picture'));
  };
  const rank = document.getElementById('rank');
  const rankGaps = (id) => {
    const row = rank.shadowRoot.querySelector('[data-option-id="' + id + '"]');
    return gaps(row, row.querySelector('.picture'), row.querySelector('.controls'));
  };
  return { answer: answerGaps('answer'), answerLong: answerGaps('answer-long'), rank: rankGaps('a'), rankLong: rankGaps('c') };
})()`;

test('a picture beside text has the same gap above it, to its right and below it; a tall row centres it with the same gap to its right', { skip }, async () => {
  const result = await evaluateInPage(fixture, insets, { readyExpr: '!!window.optionPictureOrderReady', timeout: 45000 });
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.51, actual + ' vs ' + expected);
  for (const key of ['answer', 'rank']) {
    const gap = result[key];
    close(gap.right, gap.top);
    close(gap.bottom, gap.top);
  }
  for (const key of ['answerLong', 'rankLong']) {
    const gap = result[key];
    close(gap.top, gap.bottom);
    assert.ok(gap.top > 0);
  }
  close(result.answerLong.right, result.answer.right);
  close(result.rankLong.right, result.rank.right);
});
