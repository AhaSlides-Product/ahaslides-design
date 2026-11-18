import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;
const OPTIONS = JSON.stringify([{ id: 'm', label: 'Mercury', correct: true }, { id: 'v', label: 'Venus' }]);

async function run(markup, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'accessible-names-')), 'page.html');
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><body>${markup}
<script type="module">import '${lib}'; await Promise.all(['aha-rank-list', 'aha-answer-list', 'aha-quiz-rules', 'aha-option-row'].map((t) => customElements.whenDefined(t))); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => { ${body} })()`, { readyExpr: '!!window.ready' });
}

test('rank-list: move buttons, the announcement and the fallback name take translated strings; defaults stay English', { skip }, async () => {
  const result = await run(`<aha-rank-list id="d" options='${OPTIONS}'></aha-rank-list>
    <aha-rank-list id="t" move-up-label="Lên: {name}" move-down-label="Xuống: {name}" moved-label="{name} → {position}/{total}" image-option-label="Ảnh"
      options='[{"id":"a","label":"Sao Kim"},{"id":"b","image":"x.png"}]'></aha-rank-list>`, `
    const names = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.move')].map((b) => b.getAttribute('aria-label'));
    const t = document.getElementById('t');
    t.shadowRoot.querySelectorAll('.move')[1].click();
    return { d: names('d'), t: names('t'), live: t.shadowRoot.querySelector('.live').textContent };`);
  assert.deepEqual(result.d, ['Move Mercury up', 'Move Mercury down', 'Move Venus up', 'Move Venus down']);
  assert.deepEqual(result.t, ['Lên: Ảnh', 'Xuống: Ảnh', 'Lên: Sao Kim', 'Xuống: Sao Kim']);
  assert.equal(result.live, 'Sao Kim → 2/2');
});

test('answer-list: a revealed row is a list item named with its verdict and position; an open one stays a radio', { skip }, async () => {
  const result = await run(`<aha-answer-list id="open" options='${OPTIONS}'></aha-answer-list>
    <aha-answer-list id="done" revealed position-label="vị trí {n}" correct-label="Đúng" incorrect-label="Sai" options='${OPTIONS}'></aha-answer-list>`, `
    const rows = (id) => [...document.getElementById(id).shadowRoot.querySelector('.list').children].map((r) => r.shadowRoot.querySelector('.row'));
    const info = (id) => ({ list: document.getElementById(id).shadowRoot.querySelector('.list').getAttribute('role'), rows: rows(id).map((r) => [r.getAttribute('role'), r.getAttribute('aria-label'), r.getAttribute('aria-checked')]) });
    return { open: info('open'), done: info('done') };`);
  assert.equal(result.open.list, 'radiogroup');
  assert.equal(result.open.rows[0][0], 'radio');
  assert.equal(result.done.list, 'list');
  assert.deepEqual(result.done.rows, [['listitem', 'Mercury, Đúng, vị trí 1', null], ['listitem', 'Venus, Sai, vị trí 2', null]]);
});

test('quiz-rules: Play now keeps one name while the count ticks, and heading-level sets the title level', { skip }, async () => {
  const result = await run(`<aha-quiz-rules id="q" heading="Get ready" heading-level="1" seconds="5" skip-label="Play now"></aha-quiz-rules>
    <aha-quiz-rules id="n" heading="Get ready" skip-label="Chơi ngay ({n})" seconds="3"></aha-quiz-rules>`, `
    const q = document.getElementById('q'); const n = document.getElementById('n');
    const h = q.shadowRoot.querySelector('.heading');
    const before = q.shadowRoot.querySelector('.skip').getAttribute('aria-label');
    q.setAttribute('seconds', '4');
    return { before, after: q.shadowRoot.querySelector('.skip').getAttribute('aria-label'), text: q.shadowRoot.querySelector('.skip-label').textContent,
      role: h.getAttribute('role'), level: h.getAttribute('aria-level'), localised: n.shadowRoot.querySelector('.skip').getAttribute('aria-label'),
      plain: n.shadowRoot.querySelector('.heading').getAttribute('aria-level') };`);
  assert.deepEqual(result, { before: 'Play now', after: 'Play now', text: 'Play now (4)', role: 'heading', level: '1', localised: 'Chơi ngay', plain: null });
});

test('option-row: drag handle and Delete name their row; strings take {label}; an empty row keeps the bare name', { skip }, async () => {
  const result = await run(`<aha-option-row id="a" orderable reorderable value="Venus"></aha-option-row>
    <aha-option-row id="b" orderable value="Sao Kim" deletelabel="Xoá {label}" reorderlabel="Kéo {label}"></aha-option-row>
    <aha-option-row id="c" orderable></aha-option-row>
    <aha-option-row id="e" orderable value="USD $&amp; $$"></aha-option-row>`, `
    const names = (id) => { const r = document.getElementById(id).shadowRoot; return [r.querySelector('.handle').getAttribute('aria-label'), r.querySelector('.delete-button').getAttribute('aria-label')]; };
    return { a: names('a'), b: names('b'), c: names('c'), e: names('e') };`);
  assert.deepEqual(result.a, ['Drag Venus to reorder, or use the arrow keys', 'Delete Venus']);
  assert.deepEqual(result.b, ['Kéo Sao Kim', 'Xoá Sao Kim']);
  assert.deepEqual(result.c, ['Drag to reorder', 'Delete']);
  assert.equal(result.e[1], 'Delete USD $& $$');
});
