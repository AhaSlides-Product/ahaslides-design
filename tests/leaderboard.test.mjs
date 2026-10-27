import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

test('leaderboard: the canvas never shows the You tag or any own-row marking, and the empty state is centred in the element', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = [{ id: 'a', name: 'Linh', score: 1000 }, { id: 'b', name: 'Quynh', score: 300 }];
  writeFileSync(file, `<!doctype html><body>
<aha-leaderboard id="lb" me="b" style="display:block;width:400px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<aha-leaderboard id="stage" size="stage" me="b" style="display:block;width:400px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<aha-leaderboard id="empty" style="display:block;height:200px" entries="[]"></aha-leaderboard>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-leaderboard'); await new Promise((r) => setTimeout(r, 400)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const marked = (id) => { const root = document.getElementById(id).shadowRoot; return { rows: root.querySelectorAll('li.row[data-me]').length,
      tags: [...root.querySelectorAll('.tag')].filter((tag) => !tag.hidden && tag.getClientRects().length).length,
      shadow: [...root.querySelectorAll('.track')].map((track) => getComputedStyle(track).boxShadow).join('|') }; };
    const empty = document.getElementById('empty');
    const box = empty.shadowRoot.querySelector('li.empty').getBoundingClientRect();
    const host = empty.getBoundingClientRect();
    return { lb: marked('lb'), stage: marked('stage'), offset: Math.abs((box.top + box.height / 2) - (host.top + host.height / 2)) };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  for (const key of ['lb', 'stage']) {
    assert.equal(result[key].rows, 0, JSON.stringify(result));
    assert.equal(result[key].tags, 0, JSON.stringify(result));
    assert.ok(!result[key].shadow.split('|').some((shadow) => shadow !== 'none'), JSON.stringify(result));
  }
  assert.ok(result.offset < 2, JSON.stringify(result));
});

test('leaderboard: on the phone the own-row tag is neutral, drawn once per layer, with no outline and body default row text', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = [{ id: 'a', name: 'Linh', score: 1000, delta: 10 }, { id: 'b', name: 'Quynh', score: 300 }];
  writeFileSync(file, `<!doctype html><body style="--aha-deck-accent:rgb(231,14,104);--aha-deck-palette-2:rgb(0,0,255);--aha-deck-palette-2-ink:rgb(255,255,255)">
<aha-leaderboard id="lb" size="phone" me="b" style="display:block;width:360px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-leaderboard'); await new Promise((r) => setTimeout(r, 400)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const row = document.getElementById('lb').shadowRoot.querySelector('li.row[data-me]');
    const [base, over] = [...row.querySelectorAll('.tag')].map((tag) => getComputedStyle(tag));
    return { baseColor: base.color, overColor: over.color, baseFill: base.backgroundColor, overFill: over.backgroundColor, overVisibility: over.visibility,
      shadow: getComputedStyle(row.querySelector('.track')).boxShadow,
      name: getComputedStyle(row.querySelector('.name')).fontSize, score: getComputedStyle(row.querySelector('.score')).fontSize };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  assert.notEqual(result.baseColor, 'rgb(231, 14, 104)');
  assert.equal(result.overColor, 'rgb(255, 255, 255)');
  assert.equal(result.baseFill, 'rgba(0, 0, 0, 0)');
  assert.equal(result.overFill, 'rgba(0, 0, 0, 0)');
  assert.equal(result.overVisibility, 'visible');
  assert.equal(result.shadow, 'none');
  assert.equal(result.name, '14px');
  assert.equal(result.score, '14px');
});

test('leaderboard: every text element reaches WCAG AA 4.5:1 against its composited background, canvas and audience, on light, dark and coloured decks', { skip }, async () => {
  const probe = readFileSync(new URL('./leaderboard-contrast-probe.js', import.meta.url), 'utf8');
  const decks = [
    { name: 'light', bg: '#FFFFFF', ink: '#1A1A1A', palette: ['#E70E68', '#4DE8AB', '#F2643A', '#FFC933'] },
    { name: 'dark', bg: '#161616', ink: '#FFFFFF', palette: ['#E70E68', '#4DE8AB', '#F2643A', '#FFC933'] },
    { name: 'coloured', bg: '#1F46E8', ink: '#FFFFFF', palette: ['#FFE224', '#4DE8AB', '#FFFFFF', '#F2643A'] },
  ];
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = Array.from({ length: 6 }, (_, i) => ({ id: 'u' + i, name: 'Player ' + i, score: 1400 - i * 230, delta: i < 3 ? 100 : 0, avatar: 'A' }));
  writeFileSync(file, `<!doctype html><body style="margin:0">
<script type="module">
import '${lib}';
import { canvasDeckVars } from '${pathToFileURL(fileURLToPath(new URL('../lib/canvas-deck.js', import.meta.url))).href}';
import { deckVars } from '${pathToFileURL(fileURLToPath(new URL('../lib/audience-deck.js', import.meta.url))).href}';
await customElements.whenDefined('aha-leaderboard');
const decks = ${JSON.stringify(decks)};
window.panels = [];
for (const deck of decks) for (const surface of ['canvas', 'audience']) {
  const root = document.createElement('div');
  root.style.cssText = 'padding:16px;width:' + (surface === 'canvas' ? 520 : 360) + 'px;background:' + deck.bg;
  const vars = surface === 'canvas' ? canvasDeckVars({ accent: deck.palette[0], ink: deck.ink, background: deck.bg, palette: deck.palette }) : deckVars({ ink: deck.ink, accent: deck.palette[0], palette: deck.palette });
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  const host = document.createElement('div');
  host.style.height = surface === 'canvas' ? '360px' : '240px';
  const element = document.createElement('aha-leaderboard');
  element.setAttribute('size', surface === 'canvas' ? 'stage' : 'phone');
  element.setAttribute('me', 'u2');
  if (surface === 'canvas') element.setAttribute('heading', 'Leaderboard');
  element.setAttribute('entries', JSON.stringify(${JSON.stringify(entries)}));
  host.appendChild(element); root.appendChild(host); document.body.appendChild(root);
  window.panels.push({ name: deck.name, surface, root, element, bg: [...deck.bg.slice(1).match(/../g)].map((hex) => parseInt(hex, 16)) });
}
await new Promise((r) => setTimeout(r, 900));
window.ready = true;
</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => { ${probe}; return window.leaderboardContrast(window.panels); })()`, { readyExpr: '!!window.ready', timeout: 60000 });
  assert.ok(result.length > 40, 'measured ' + result.length);
  const failing = result.filter((entry) => entry.ratio < 4.5).map((entry) => entry.surface + ' ' + entry.deck + ' ' + entry.kind + ' ' + entry.ratio.toFixed(2));
  assert.deepEqual(failing, []);
});

test('leaderboard: rows take palette colours in rank order, rank circles are neutral, a zero score keeps a stub and the gain column aligns', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = [{ id: 'a', name: 'Maya', score: 92, delta: 92 }, { id: 'b', name: 'Priya', score: 88, delta: 88 }, { id: 'c', name: 'Leo', score: 0, delta: 0 }];
  writeFileSync(file, `<!doctype html><body style="--aha-deck-palette-1:rgb(255,0,0);--aha-deck-palette-2:rgb(0,0,255);--aha-deck-palette-1-ink:rgb(1,1,1);--aha-deck-palette-2-ink:rgb(2,2,2)">
<aha-leaderboard id="lb" heading="Leaderboard" style="display:block;width:600px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<aha-leaderboard id="plain" style="display:block;width:600px" entries='[{"id":"a","name":"A","score":5}]'></aha-leaderboard>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-leaderboard'); await new Promise((r) => setTimeout(r, 700)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = document.getElementById('lb').shadowRoot;
    const rows = [...root.querySelectorAll('li.row')].filter((row) => !row.hidden);
    const fill = (row) => getComputedStyle(row.querySelector('.fill')).backgroundColor;
    const plain = document.getElementById('plain').shadowRoot;
    return { fills: rows.map(fill), chips: rows.map((row) => getComputedStyle(row.querySelector('.chip')).backgroundColor),
      zero: rows[2].hasAttribute('data-zero'), zeroWidth: rows[2].querySelector('.fill').getBoundingClientRect().width,
      unit: rows[0].querySelector('.score-unit').textContent, deltas: rows.map((row) => row.querySelector('.delta-value').textContent),
      scoreRights: rows.map((row) => Math.round(row.querySelector('.score-main').getBoundingClientRect().right)),
      heading: root.querySelector('.heading').textContent, count: root.querySelector('.count').textContent, headerHidden: root.querySelector('.header').hidden,
      plainHeaderHidden: plain.querySelector('.header').hidden, plainDeltaHidden: plain.querySelector('.delta').hidden,
      trophyShown: !root.querySelector('aha-icon[name="system-trophy"]').hidden };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  assert.equal(result.fills[0], 'rgb(255, 0, 0)');
  assert.equal(result.fills[1], 'rgb(0, 0, 255)');
  assert.equal(new Set(result.chips).size, 1);
  assert.equal(result.zero, true);
  assert.ok(result.zeroWidth > 0 && result.zeroWidth <= 16, JSON.stringify(result));
  assert.equal(result.unit, 'p');
  assert.deepEqual(result.deltas, ['+92', '+88', '+0']);
  assert.equal(new Set(result.scoreRights).size, 1);
  assert.deepEqual([result.heading, result.count, result.headerHidden, result.plainHeaderHidden, result.plainDeltaHidden, result.trophyShown], ['Leaderboard', '3 players', false, true, true, false]);
});

test('leaderboard: on a white-ink deck the name on a bar uses the palette ink, not the deck ink', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'leaderboard-')), 'page.html');
  const entries = [{ id: 'a', name: 'Linh', score: 1000 }, { id: 'b', name: 'Minh', score: 500 }];
  writeFileSync(file, `<!doctype html><body style="color:rgb(255,255,255);--aha-deck-ink:rgb(255,255,255);--aha-deck-palette-1:rgb(255,64,129);--aha-deck-palette-1-ink:rgb(26,26,26);--aha-deck-palette-2:rgb(32,232,181);--aha-deck-palette-2-ink:rgb(26,26,26)">
<aha-leaderboard id="lb" style="display:block;width:600px" entries='${JSON.stringify(entries)}'></aha-leaderboard>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-leaderboard'); await new Promise((r) => setTimeout(r, 700)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const rows = [...document.getElementById('lb').shadowRoot.querySelectorAll('li.row')].filter((row) => !row.hidden);
    return rows.map((row) => ({ over: getComputedStyle(row.querySelector('.over')).color, base: getComputedStyle(row.querySelector('.base')).color }));
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  for (const row of result) {
    assert.equal(row.over, 'rgb(26, 26, 26)');
    assert.equal(row.base, 'rgb(255, 255, 255)');
  }
});
