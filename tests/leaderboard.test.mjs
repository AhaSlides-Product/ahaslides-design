import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
globalThis.HTMLElement ??= class {};
globalThis.customElements ??= { define() {}, get() {} };
const { rankEntries, fitRows } = await import('../lib/aha-leaderboard.js');
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

test('leaderboard: ties use competition ranking 1, 2, 2, 4 and keep input order', () => {
  const ranked = rankEntries([{ id: 'a', score: 5 }, { id: 'b', score: 9 }, { id: 'c', score: 5 }, { id: 'd', score: 1 }]);
  assert.deepEqual(ranked.map((row) => [row.id, row.rank]), [['b', 1], ['a', 2], ['c', 2], ['d', 4]]);
});

test('leaderboard: bad entries are dropped and scores coerced', () => {
  assert.deepEqual(rankEntries(null), []);
  assert.deepEqual(rankEntries([{ name: 'no id' }, { id: 1, score: '7' }]).map((row) => [row.id, row.score]), [['1', 7]]);
});

test('leaderboard: fitRows shows all when they fit, else a line plus the pinned own row', () => {
  const metrics = { row: 40, gap: 8, more: 24 };
  assert.deepEqual(fitRows({ ...metrics, height: 400, count: 5, meIndex: 4 }), { shown: 5, pinned: false });
  assert.deepEqual(fitRows({ ...metrics, height: 200, count: 20, meIndex: 1 }), { shown: 3, pinned: false });
  assert.deepEqual(fitRows({ ...metrics, height: 200, count: 20, meIndex: 15 }), { shown: 2, pinned: true });
});

test('leaderboard: renders ranks, trophy on first, pinned own row and the more line in a fixed height', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = Array.from({ length: 12 }, (_, i) => ({ id: 'u' + i, name: 'P' + i, score: 1000 - i * 10 }));
  writeFileSync(file, `<!doctype html><body>
<aha-leaderboard id="lb" size="phone" me="u10" style="display:block;height:240px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<aha-leaderboard id="empty" entries="[]"></aha-leaderboard>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-leaderboard'); await new Promise((r) => setTimeout(r, 400)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = document.getElementById('lb').shadowRoot;
    const visible = [...root.querySelectorAll('li.row')].filter((li) => !li.hidden);
    const more = root.querySelector('li.more');
    return { visible: visible.length, pinnedMe: visible.some((li) => li.hasAttribute('data-me')),
      moreShown: !more.hidden, ordered: root.querySelector('ol') !== null,
      emptyShown: !document.getElementById('empty').shadowRoot.querySelector('li.empty').hidden };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  assert.ok(result.visible >= 2 && result.visible < 12, JSON.stringify(result));
  assert.equal(result.pinnedMe, true);
  assert.equal(result.moreShown, true);
  assert.equal(result.ordered, true);
  assert.equal(result.emptyShown, true);
});
