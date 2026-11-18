import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-quiz-rules.js', import.meta.url))).href;
const RULES = JSON.stringify([{ text: 'Answer faster to get more points' }]);
const ICON_RULES = JSON.stringify([{ icon: 'system-timer', text: '20 seconds to answer' }, { icon: 'system-star', text: 'Answer faster' }]);

// Each case renders in a srcdoc iframe of its own width, so the element's view-width steps apply.
async function run(frames, body) {
  const doc = (attrs, dir, pre, rules = RULES) => `<!doctype html><html dir="${dir || 'ltr'}"><body style="margin:0"><main style="display:flex;flex-direction:column;height:600px;margin:0 16px">
<aha-quiz-rules heading="Question 2 of 7" rules='${rules}' ${attrs}></aha-quiz-rules></main>
${pre ? `<script>${pre}</script>` : ''}
<script type="module">import '${lib}'; await customElements.whenDefined('aha-quiz-rules'); await new Promise((r) => setTimeout(r, 300)); window.ready = true;</script>`;
  const iframes = frames.map(({ width, attrs, dir, pre, rules }) =>
    `<iframe style="width:${width}px;height:600px;border:0;display:block" srcdoc="${doc(attrs, dir, pre, rules).replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe>`).join('');
  const file = join(mkdtempSync(join(tmpdir(), 'quiz-rules-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="margin:0">${iframes}</body>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const frames = [...document.querySelectorAll('iframe')].map((f) => f.contentWindow);
    const pick = (w) => { const el = w.document.querySelector('aha-quiz-rules'); return { w, el, r: el.shadowRoot }; };
    ${body}
  })()`, { readyExpr: `[...document.querySelectorAll('iframe')].every((f) => f.contentWindow && f.contentWindow.ready)` });
}

test('one step at 960px: title 24/32, rule text 16/20 regular, Play now as wide as the rule line at every width, one centred icon-less line', { skip }, async () => {
  const result = await run([{ width: 375 }, { width: 768 }, { width: 1440 }], `
    return frames.map((w) => {
      const { r } = pick(w);
      const box = (s) => r.querySelector(s).getBoundingClientRect();
      const block = box('.rules'), body = box('.body'), list = box('.list'), skip = box('.skip'), rule = r.querySelector('.rule');
      const rs = w.getComputedStyle(rule);
      return { title: w.getComputedStyle(r.querySelector('.heading')).fontSize, ruleSize: rs.fontSize, ruleWeight: rs.fontWeight, ruleAlign: rs.textAlign,
        icons: r.querySelectorAll('.rule aha-icon').length, skipWidth: Math.round(skip.width), listWidth: Math.round(list.width),
        viewWidth: w.innerWidth - 32, bodyWidth: Math.round(body.width), skipCentred: Math.abs((skip.left + skip.right) / 2 - w.innerWidth / 2) <= 1,
        centred: Math.abs((block.top + block.bottom) / 2 - 300) <= 1 };
    });`);
  const [phone, tablet, desktop] = result;
  assert.deepEqual(result.map((r) => r.title), ['24px', '24px', '32px']);
  assert.deepEqual(result.map((r) => r.ruleSize), ['16px', '16px', '20px']);
  assert.ok(result.every((r) => r.ruleWeight === '400' && r.ruleAlign === 'center' && r.icons === 0), 'regular weight, centred, no icon');
  for (const r of [phone, tablet, desktop]) {
    assert.equal(r.skipWidth, r.bodyWidth);
    assert.equal(r.bodyWidth, Math.min(r.viewWidth, 480, Math.max(240, r.listWidth)));
    assert.ok(r.skipCentred);
  }
  assert.ok(phone.skipWidth < phone.viewWidth, 'Play now is not full width on a phone');
  assert.ok(result.every((r) => r.centred), 'the block is centred in the height the page gives it');
});

test('a rule line that still carries an icon draws it at 24px at every width, lines left-aligned together', { skip }, async () => {
  const result = await run([{ width: 375, rules: ICON_RULES }, { width: 1440, rules: ICON_RULES }], `
    return frames.map((w) => { const { r } = pick(w); return { sizes: [...r.querySelectorAll('.rule aha-icon')].map((i) => i.getAttribute('size')), plain: r.querySelector('.list').classList.contains('plain') }; });`);
  assert.deepEqual(result.map((r) => r.sizes), [['24', '24'], ['24', '24']]);
  assert.deepEqual(result.map((r) => r.plain), [false, false]);
});

test('Play now counts down "(N)" from ends-at, never below 1, takes {n} formats and seconds, and a tap fires skip', { skip }, async () => {
  const result = await run([
    { width: 375, attrs: `ends-at="${Date.now() + 4200}"` },
    { width: 375, attrs: `ends-at="${Date.now() - 5000}" skip-label="Bỏ qua ({n})"` },
    { width: 375, attrs: 'seconds="3" skip-label="Passer" lang="fr" skip-testid="audience-quiz-skip-rules"' },
  ], `
    const label = (w) => pick(w).r.querySelector('.skip-label').textContent;
    const first = pick(frames[0]);
    let skips = 0;
    first.el.addEventListener('skip', () => { skips += 1; });
    first.r.querySelector('.skip').shadowRoot.querySelector('button').click();
    return { labels: frames.map(label), skips, testid: pick(frames[2]).r.querySelector('.skip').getAttribute('data-testid') };`);
  assert.match(result.labels[0], /^Play now \([345]\)$/);
  assert.deepEqual(result.labels.slice(1), ['Bỏ qua (1)', 'Passer (3)']);
  assert.equal(result.skips, 1);
  assert.equal(result.testid, 'audience-quiz-skip-rules');
});

test('right to left: icon rule lines start on the right edge of the list and the Play now arrow mirrors', { skip }, async () => {
  const result = await run([{ width: 375, dir: 'rtl', rules: ICON_RULES }, { width: 375, rules: ICON_RULES }], `
    return frames.map((w) => {
      const { r } = pick(w);
      const list = r.querySelector('.list').getBoundingClientRect(), icon = r.querySelector('.rule aha-icon').getBoundingClientRect();
      return { iconAtStart: w.document.dir === 'rtl' ? Math.round(list.right - icon.right) : Math.round(icon.left - list.left),
        arrow: w.getComputedStyle(r.querySelector('.arrow')).transform };
    });`);
  assert.deepEqual(result.map((r) => r.iconAtStart), [0, 0]);
  assert.deepEqual(result.map((r) => r.arrow), ['matrix(-1, 0, 0, 1, 0, 0)', 'none']);
});

test('a rules property set before the element upgrades still gives way to a later rules property', { skip }, async () => {
  const result = await run([{ width: 375, pre: `document.querySelector('aha-quiz-rules').rules = [{ icon: 'system-star', text: 'Before upgrade' }];` }], `
    const { el, r } = pick(frames[0]);
    const before = [...r.querySelectorAll('.rule')].map((row) => row.textContent);
    el.rules = [{ icon: 'system-timer', text: 'One' }, { icon: 'system-star', text: 'Two' }];
    return { before, after: [...r.querySelectorAll('.rule')].map((row) => row.textContent) };`);
  assert.deepEqual(result.before, ['Before upgrade']);
  assert.deepEqual(result.after, ['One', 'Two']);
});

test('a blank or non-numeric ends-at falls back to seconds, and a non-finite seconds shows no count', { skip }, async () => {
  const result = await run([
    { width: 375, attrs: 'ends-at="abc" seconds="5"' },
    { width: 375, attrs: 'ends-at="" seconds="4"' },
    { width: 375, attrs: 'ends-at="2026-01-01T00:00:00Z"' },
    { width: 375, attrs: 'seconds="1e999"' },
  ], `return frames.map((w) => pick(w).r.querySelector('.skip-label').textContent);`);
  assert.deepEqual(result, ['Play now (5)', 'Play now (4)', 'Play now', 'Play now']);
});
