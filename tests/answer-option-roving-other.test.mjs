import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-answer-option.js', import.meta.url))).href;

async function run(markup, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'answer-option-roving-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>${markup}
<script type="module">import '${lib}'; await customElements.whenDefined('aha-answer-option');
for (const row of document.querySelectorAll('aha-answer-option')) row.addEventListener('pick', () => {
  if (row.getAttribute('selection-mode') === 'multiple') { row.toggleAttribute('selected'); return; }
  for (const other of row.parentNode.children) other.toggleAttribute('selected', other === row);
});
await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const rows = [...document.querySelectorAll('aha-answer-option')];
    const choice = (r) => r._choice();
    const stops = () => rows.map((r) => choice(r).tabIndex);
    const press = (r, key) => choice(r).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
    const focusedIndex = () => rows.indexOf(document.activeElement);
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

const FOUR = (attrs) => `<div>${['A', 'B', 'C', 'D'].map((l) => `<aha-answer-option ${attrs}>${l}</aha-answer-option>`).join('')}</div>`;

test('without roving every open row stays its own Tab stop', { skip }, async () => {
  assert.deepEqual(await run(FOUR(''), 'return stops();'), [0, 0, 0, 0]);
});

test('roving rows are one Tab stop that follows focus; Home and End jump and pick in single mode', { skip }, async () => {
  const result = await run(FOUR('roving'), `
    const first = stops();
    rows[0].focus(); press(rows[0], 'End');
    const end = { focused: focusedIndex(), stops: stops(), picked: rows.map((r) => r.hasAttribute('selected')) };
    press(rows[3], 'Home');
    const home = { focused: focusedIndex(), stops: stops() };
    press(rows[0], 'ArrowDown');
    return { first, end, home, down: { focused: focusedIndex(), stops: stops() } };`);
  assert.deepEqual(result, {
    first: [0, -1, -1, -1],
    end: { focused: 3, stops: [-1, -1, -1, 0], picked: [false, false, false, true] },
    home: { focused: 0, stops: [0, -1, -1, -1] },
    down: { focused: 1, stops: [-1, 0, -1, -1] },
  });
});

test('a roving group lands on the pick when nothing was focused, and skips locked rows', { skip }, async () => {
  const result = await run(`<div><aha-answer-option roving>A</aha-answer-option><aha-answer-option roving selected>B</aha-answer-option></div>
<div><aha-answer-option roving answered>C</aha-answer-option><aha-answer-option roving answered selected>D</aha-answer-option></div>`, 'return stops();');
  assert.deepEqual(result, [-1, 0, -1, -1]);
});

test('the other row shows its field once picked by click, focuses it, emits other-input and keeps clicks in the field from unpicking', { skip }, async () => {
  const result = await run(`<div><aha-answer-option selection-mode="multiple" other other-placeholder="Type it">Other (please specify)</aha-answer-option></div>`, `
    const row = rows[0];
    const input = row.shadowRoot.querySelector('.other-input');
    const before = getComputedStyle(input).display;
    const control = row.shadowRoot.querySelector('.control');
    const name = { role: control.getAttribute('role'), label: control.getAttribute('aria-label') };
    row.shadowRoot.querySelector('.row').click();
    const seen = [];
    row.addEventListener('other-input', (e) => seen.push(e.detail.value));
    input.value = 'Mint tea';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.click();
    return { before, name, after: getComputedStyle(input).display, focused: row.shadowRoot.activeElement === input,
      placeholder: input.placeholder, inputLabel: input.getAttribute('aria-label'), seen, stillPicked: row.hasAttribute('selected'), value: row.otherValue };`);
  assert.deepEqual(result, {
    before: 'none', name: { role: 'checkbox', label: 'Other (please specify)' }, after: 'block', focused: true,
    placeholder: 'Type it', inputLabel: 'Other (please specify)', seen: ['Mint tea'], stillPicked: true, value: 'Mint tea',
  });
});

test('arrowing onto the other row picks it without moving focus into the field', { skip }, async () => {
  const result = await run(`<div><aha-answer-option roving>Tea</aha-answer-option><aha-answer-option roving other>Other</aha-answer-option></div>`, `
    rows[0].focus(); press(rows[0], 'ArrowDown');
    const field = rows[1].shadowRoot.querySelector('.other-input');
    return { picked: rows[1].hasAttribute('selected'), fieldShown: getComputedStyle(field).display, onControl: rows[1].shadowRoot.activeElement === choice(rows[1]) };`);
  assert.deepEqual(result, { picked: true, fieldShown: 'block', onControl: true });
});
