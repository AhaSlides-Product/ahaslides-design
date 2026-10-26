import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const tokens = pathToFileURL(fileURLToPath(new URL('../lib/tokens.css', import.meta.url))).href;

const page = `<!doctype html><link rel="stylesheet" href="${tokens}"><body style="margin:0">
<aha-answer-result id="wrong" result="incorrect" label="Response">Tea</aha-answer-result>
<aha-answer-result id="right" result="correct" label="Response">Coffee</aha-answer-result>
<aha-answer-result id="key" label="Correct answer">Coffee</aha-answer-result>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('wrong, correct and key rows differ in edge, tint and mark but never in text', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'answer-result-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const token = (name) => { const probe = document.createElement('div'); probe.style.color = 'var(--aha-' + name + ')';
      document.body.appendChild(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; };
    const read = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const row = getComputedStyle(root.querySelector('.row'));
      const text = getComputedStyle(root.querySelector('.text'));
      const mark = root.querySelector('.mark');
      return { border: row.borderTopWidth, edge: row.borderTopColor, ring: row.boxShadow, fill: row.backgroundColor,
        mark: getComputedStyle(mark).display === 'none' ? 'none' : mark.getAttribute('aria-label'),
        ink: text.color, weight: text.fontWeight, height: root.querySelector('.row').getBoundingClientRect().height };
    };
    return { wrong: read('wrong'), right: read('right'), key: read('key'),
      wrongToken: token('answer-wrong'), rightToken: token('answer-correct'), wrongTint: token('answer-wrong-tint-5'),
      rightTint: token('answer-correct-tint-5'), ink: token('text-default'), border: token('border-default') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-answer-result")' });
  assert.equal(result.wrong.edge, result.wrongToken);
  assert.equal(result.wrong.border, '1px');
  assert.ok(result.wrong.ring.includes('inset') && result.wrong.ring.includes(result.wrongToken) && result.wrong.ring.endsWith('0px 0px 0px 1px inset'));
  assert.equal(result.wrong.fill, result.wrongTint);
  assert.equal(result.wrong.mark, 'Incorrect');
  assert.equal(result.right.edge, result.rightToken);
  assert.equal(result.right.border, '1px');
  assert.equal(result.right.ring, 'none');
  assert.equal(result.right.fill, result.rightTint);
  assert.equal(result.right.mark, 'Correct');
  assert.equal(result.key.edge, result.border);
  assert.equal(result.key.ring, 'none');
  assert.equal(result.key.fill, 'rgb(255, 255, 255)');
  assert.equal(result.key.mark, 'none');
  for (const row of [result.wrong, result.right, result.key]) {
    assert.equal(row.ink, result.ink);
    assert.equal(row.weight, '400');
  }
  assert.equal(result.wrong.height, result.right.height);
});
