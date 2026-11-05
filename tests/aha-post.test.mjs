import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-post.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(() => {
  const host = document.getElementById('post');
  const root = host.shadowRoot;
  const like = root.querySelector('[data-action="like"]');
  const out = {};
  const seen = [];
  document.addEventListener('aha-post-action', (e) => seen.push(e.detail.action));

  out.quoteEdge = getComputedStyle(host.querySelector('blockquote')).borderInlineStartWidth;
  out.restPressed = like.getAttribute('aria-pressed');
  out.restGlyph = like.querySelector('aha-icon').getAttribute('name');

  like.shadowRoot.querySelector('button').click();
  root.querySelector('[data-action="more"]').shadowRoot.querySelector('button').click();
  out.actions = seen.slice();
  out.likedAfterClick = host.hasAttribute('liked');

  const article = root.querySelector('.aha-post');
  host.setAttribute('liked', '');
  host.setAttribute('likes', '2');
  out.sameNode = root.querySelector('.aha-post') === article;
  out.likedPressed = like.getAttribute('aria-pressed');
  out.likedGlyph = like.querySelector('aha-icon').getAttribute('name');
  out.likedLabel = like.getAttribute('aria-label');

  host.setAttribute('actions', 'like reply');
  out.shareHidden = root.querySelector('[data-action="share"]').hidden;
  out.moreHidden = root.querySelector('[data-action="more"]').hidden;
  return out;
})()`;

test('aha-post reports actions, leaves the like state to the host and styles its light-DOM body', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.postFixtureReady === true' });
  assert.equal(r.quoteEdge, '4px');
  assert.equal(r.restPressed, 'false');
  assert.equal(r.restGlyph, 'system-heart-straight');
  assert.deepEqual(r.actions, ['like', 'more']);
  assert.equal(r.likedAfterClick, false);
  assert.equal(r.sameNode, true);
  assert.equal(r.likedPressed, 'true');
  assert.equal(r.likedGlyph, 'system-heart-straight-filled');
  assert.equal(r.likedLabel, 'Like, 2 likes');
  assert.equal(r.shareHidden, true);
  assert.equal(r.moreHidden, true);
});
