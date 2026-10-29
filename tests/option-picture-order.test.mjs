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
