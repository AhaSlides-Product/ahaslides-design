import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-countdown.js', import.meta.url))).href;

async function run(attrs, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'countdown-points-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="width:360px"><aha-countdown ${attrs}></aha-countdown>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-countdown'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const el = document.querySelector('aha-countdown');
    const r = el.shadowRoot;
    const shown = (s) => { const n = r.querySelector(s); return !!n && getComputedStyle(n).display !== 'none'; };
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

test('without variant the countdown keeps its clock, its timer role and adds no end labels', { skip }, async () => {
  const result = await run(`total-ms="30000" ends-at="${Date.now() + 15000}" min="500" max="1000" progress="50"`,
    `return { clock: shown('.clock'), ends: r.querySelectorAll('.end').length, role: el.getAttribute('role'), now: el.getAttribute('aria-valuenow') };`);
  assert.deepEqual(result, { clock: true, ends: 0, role: 'timer', now: null });
});

test('variant="points" hides the clock, prints min left and max right through label-format, and reports the points left', { skip }, async () => {
  const result = await run('variant="points" min="500" max="1000" label-format="{n} pts" spoken-format="{n} points" progress="40" label="Points"', `
    const track = r.querySelector('.track').getBoundingClientRect();
    const min = r.querySelector('.min').getBoundingClientRect();
    const max = r.querySelector('.max').getBoundingClientRect();
    const fill = r.querySelector('.fill').getBoundingClientRect();
    return { clock: shown('.clock'), labels: [r.querySelector('.min').textContent, r.querySelector('.max').textContent],
      order: min.right <= track.left && track.right <= max.left, filled: Math.round(fill.width / track.width * 100),
      value: el.value, role: el.getAttribute('role'), aria: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext', 'aria-label'].map((a) => el.getAttribute(a)) };`);
  assert.deepEqual(result, { clock: false, labels: ['500 pts', '1,000 pts'], order: true, filled: 40, value: 700, role: 'progressbar',
    aria: ['500', '1000', '700', '700 points', 'Points'] });
});

test('variant="points" groups numbers by the closest lang and speaks the label-format when spoken-format is absent', { skip }, async () => {
  const result = await run('lang="de" variant="points" min="500" max="1000" label-format="{n} Pkt." progress="100"',
    `return { labels: [r.querySelector('.min').textContent, r.querySelector('.max').textContent], spoken: el.getAttribute('aria-valuetext') };`);
  assert.deepEqual(result, { labels: ['500 Pkt.', '1.000 Pkt.'], spoken: '1.000 Pkt.' });
});

test('variant="points" without progress drains from max toward min off ends-at, and removing the variant restores the timer', { skip }, async () => {
  const endsAt = Date.now() + 2500;
  const result = await run(`variant="points" min="500" max="1000" total-ms="10000" ends-at="${endsAt}"`, `
    const before = { value: el.value, text: el.getAttribute('aria-valuetext'), left: Math.max(0, ${endsAt} - Date.now()) };
    el.removeAttribute('variant');
    return { before, clock: shown('.clock'), ends: shown('.min') || shown('.max'), role: el.getAttribute('role'), now: el.getAttribute('aria-valuenow') };`);
  // Chrome start-up on a loaded runner eats into ends-at, so the expectation tracks the time actually left.
  const expected = 500 + 500 * result.before.left / 10000;
  assert.ok(Math.abs(result.before.value - expected) <= 15, `value ${result.before.value}, expected about ${Math.round(expected)}`);
  assert.equal(result.before.text, String(result.before.value));
  assert.deepEqual({ clock: result.clock, ends: result.ends, role: result.role, now: result.now }, { clock: true, ends: false, role: 'timer', now: null });
});

test('variant="points" keeps the accent fill below urgent-below-ms, while the timer still turns urgent', { skip }, async () => {
  const attrs = `accent="#E70E68" min="500" max="1000" total-ms="30000" ends-at="${Date.now() + 3000}" urgent-below-ms="5000"`;
  const read = `return { urgent: el.hasAttribute('data-urgent'), fill: getComputedStyle(r.querySelector('.fill')).backgroundColor };`;
  const points = await run(`variant="points" ${attrs}`, read);
  const timer = await run(attrs, read);
  assert.deepEqual({ points, timerUrgent: timer.urgent }, { points: { urgent: false, fill: 'rgb(231, 14, 104)' }, timerUrgent: true });
});
