import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-quiz-rules.js', import.meta.url))).href;
const RULES = JSON.stringify([{ icon: 'system-timer', text: '20 seconds to answer' }, { icon: 'system-star', text: 'Answer faster' }]);

// Each case renders in a srcdoc iframe of its own width, so the element's view-width steps apply.
async function run(frames, body) {
  const doc = (attrs, dir) => `<!doctype html><html dir="${dir || 'ltr'}"><body style="margin:0"><main style="display:flex;flex-direction:column;height:600px;margin:0 16px">
<aha-quiz-rules heading="Question 2 of 7" rules='${RULES}' ${attrs}></aha-quiz-rules></main>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-quiz-rules'); await new Promise((r) => setTimeout(r, 300)); window.ready = true;</script>`;
  const iframes = frames.map(({ width, attrs, dir }) =>
    `<iframe style="width:${width}px;height:600px;border:0;display:block" srcdoc="${doc(attrs, dir).replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe>`).join('');
  const file = join(mkdtempSync(join(tmpdir(), 'quiz-rules-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="margin:0">${iframes}</body>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const frames = [...document.querySelectorAll('iframe')].map((f) => f.contentWindow);
    const pick = (w) => { const el = w.document.querySelector('aha-quiz-rules'); return { w, el, r: el.shadowRoot }; };
    ${body}
  })()`, { readyExpr: `[...document.querySelectorAll('iframe')].every((f) => f.contentWindow && f.contentWindow.ready)` });
}

test('the block steps at 480px and 960px: title 20/24/48, icons 24/32, Skip rules full width on a phone and as wide as the rule list (240 to 480) above', { skip }, async () => {
  const result = await run([{ width: 375 }, { width: 600 }, { width: 1000 }], `
    return frames.map((w) => {
      const { r } = pick(w);
      const box = (s) => r.querySelector(s).getBoundingClientRect();
      const block = box('.rules'), body = box('.body'), list = box('.list'), skip = box('.skip');
      return { title: w.getComputedStyle(r.querySelector('.heading')).fontSize, icon: r.querySelector('.rule aha-icon').getAttribute('size'),
        skipWidth: Math.round(skip.width), listWidth: Math.round(list.width), viewWidth: w.innerWidth - 32, bodyWidth: Math.round(body.width),
        centred: Math.abs((block.top + block.bottom) / 2 - 300) <= 1 };
    });`);
  const [phone, tablet, desktop] = result;
  assert.deepEqual([phone.title, tablet.title, desktop.title], ['20px', '24px', '48px']);
  assert.deepEqual([phone.icon, tablet.icon, desktop.icon], ['24', '24', '32']);
  assert.equal(phone.skipWidth, phone.viewWidth);
  for (const wide of [tablet, desktop]) {
    assert.equal(wide.skipWidth, wide.bodyWidth);
    assert.equal(wide.bodyWidth, Math.min(480, Math.max(240, wide.listWidth)));
  }
  assert.ok(result.every((r) => r.centred), 'the block is centred in the height the page gives it');
});

test('Skip rules counts down "(N)" from ends-at, never below 1, takes {n} formats and seconds, and a tap fires skip', { skip }, async () => {
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
  assert.match(result.labels[0], /^Skip rules \([34]\)$/);
  assert.deepEqual(result.labels.slice(1), ['Bỏ qua (1)', 'Passer (3)']);
  assert.equal(result.skips, 1);
  assert.equal(result.testid, 'audience-quiz-skip-rules');
});

test('right to left: the rule lines start on the right edge of the list and the Skip arrow mirrors', { skip }, async () => {
  const result = await run([{ width: 375, dir: 'rtl' }, { width: 375 }], `
    return frames.map((w) => {
      const { r } = pick(w);
      const list = r.querySelector('.list').getBoundingClientRect(), icon = r.querySelector('.rule aha-icon').getBoundingClientRect();
      return { iconAtStart: w.document.dir === 'rtl' ? Math.round(list.right - icon.right) : Math.round(icon.left - list.left),
        arrow: w.getComputedStyle(r.querySelector('.arrow')).transform };
    });`);
  assert.deepEqual(result.map((r) => r.iconAtStart), [0, 0]);
  assert.deepEqual(result.map((r) => r.arrow), ['matrix(-1, 0, 0, 1, 0, 0)', 'none']);
});
