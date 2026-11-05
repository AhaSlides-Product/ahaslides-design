import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-topic-row.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(() => {
  const host = document.getElementById('row');
  const root = host.shadowRoot;
  const excerpt = root.querySelector('.aha-topic-row__excerpt');
  const out = {};
  out.excerptText = excerpt.textContent;
  out.excerptElements = excerpt.children.length;

  const row = root.querySelector('.aha-topic-row');
  host.setAttribute('likes', '7');
  host.setAttribute('read', '');
  host.setAttribute('excerpt', '<i>second</i>');
  out.sameRow = root.querySelector('.aha-topic-row') === row;
  out.likes = root.querySelector('[data-stat="likes"]').textContent.trim();
  out.titleWeight = getComputedStyle(root.querySelector('.aha-topic-row__title')).fontWeight;
  out.secondExcerptElements = root.querySelector('.aha-topic-row__excerpt').children.length;
  host.removeAttribute('replies');
  out.repliesHidden = root.querySelector('[data-stat="replies"]').hidden;
  return out;
})()`;

test('aha-topic-row shows host excerpts as text and updates in place', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.topicRowFixtureReady === true' });
  assert.equal(r.excerptText, 'Rate it <b>now</b> [poll name=rating]<img src=x onerror=alert(1)>');
  assert.equal(r.excerptElements, 0);
  assert.equal(r.secondExcerptElements, 0);
  assert.equal(r.sameRow, true);
  assert.equal(r.likes, '7 likes');
  assert.equal(r.titleWeight, '400');
  assert.equal(r.repliesHidden, true);
});
