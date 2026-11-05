import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-profile-header.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const host = document.getElementById('page');
  const root = host.shadowRoot;
  const avatar = root.querySelector('aha-avatar');
  const out = {};
  await frame();
  const dds = [...root.querySelectorAll('.detail dd')];
  out.values = dds.map((d) => d.textContent);
  out.injected = root.querySelectorAll('.details img, .details b').length;
  out.link = dds[0].querySelector('a') && dds[0].querySelector('a').getAttribute('href');
  out.wideSize = avatar.getAttribute('size');

  document.getElementById('wide').style.width = '360px';
  await frame();
  out.narrowSize = avatar.getAttribute('size');
  out.narrowName = getComputedStyle(root.querySelector('.name')).fontSize;

  host.setAttribute('details', '[{"label":"Joined","value":"Jul 30"}]');
  host.setAttribute('heading-level', '1');
  out.sameAvatar = root.querySelector('aha-avatar') === avatar;
  out.rows = root.querySelectorAll('.detail').length;
  out.level = root.querySelector('.name').getAttribute('aria-level');
  host.setAttribute('variant', 'card');
  document.getElementById('wide').style.width = '800px';
  await frame();
  out.cardSize = avatar.getAttribute('size');
  return out;
})()`;

test('aha-profile-header shows host details as text and sizes the avatar to its width', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.profileHeaderFixtureReady === true' });
  assert.deepEqual(r.values, ['<img src=x onerror=alert(1)>', '<b>Leader</b>']);
  assert.equal(r.injected, 0);
  assert.equal(r.link, '/u/x');
  assert.equal(r.wideSize, '144');
  assert.equal(r.narrowSize, '96');
  assert.equal(r.narrowName, '24px');
  assert.equal(r.sameAvatar, true);
  assert.equal(r.rows, 1);
  assert.equal(r.level, '1');
  assert.equal(r.cardSize, '96');
});
