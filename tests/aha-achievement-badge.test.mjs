import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-achievement-badge.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(() => {
  const host = document.getElementById('card');
  const root = host.shadowRoot;
  const q = (s) => root.querySelector(s);
  const out = {};
  out.titleText = q('.aha-achievement-badge__title').textContent;
  out.markupNodes = q('.aha-achievement-badge__title').children.length + q('.aha-achievement-badge__description').children.length;
  out.tier = q('aha-tag').textContent;
  out.iconColor = getComputedStyle(q('.aha-achievement-badge__icon')).color;

  const card = q('.aha-achievement-badge');
  host.setAttribute('tier', 'platinum');
  out.unknownTierHidden = q('aha-tag').hidden;
  host.setAttribute('tier', 'Bronze');
  out.bronze = q('aha-tag').textContent;
  host.setAttribute('grant-count', '1204');
  out.count = q('.aha-achievement-badge__count').textContent;
  host.removeAttribute('granted');
  host.removeAttribute('grant-count');
  out.metaHidden = q('.aha-achievement-badge__meta').hidden;
  out.sameCard = q('.aha-achievement-badge') === card;
  return out;
})()`;

test('aha-achievement-badge renders host text as text, tiers as labels, and updates in place', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.achievementBadgeFixtureReady === true' });
  assert.equal(r.titleText, 'Leader <img src=x onerror=alert(1)>');
  assert.equal(r.markupNodes, 0);
  assert.equal(r.tier, 'Gold');
  assert.equal(r.iconColor, 'rgb(26, 26, 26)');
  assert.equal(r.unknownTierHidden, true);
  assert.equal(r.bronze, 'Bronze');
  assert.equal(r.count, '1,204 granted');
  assert.equal(r.metaHidden, true);
  assert.equal(r.sameCard, true);
});
