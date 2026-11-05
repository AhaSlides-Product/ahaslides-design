import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-search-result.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const row = document.querySelector('#row');
  const root = row.shadowRoot;
  const title = root.querySelector('.aha-search-result__title');
  const blurb = root.querySelector('.aha-search-result__blurb');
  const out = {
    injectedElements: root.querySelectorAll('img, b').length,
    injectedRan: !!window.injected,
    titleMarks: [...title.querySelectorAll('mark')].map((m) => m.textContent),
    blurbText: blurb.textContent,
    blurbMarks: [...blurb.querySelectorAll('mark')].map((m) => m.textContent),
  };
  row.setAttribute('query', 'tips');
  out.titleNodeKept = root.querySelector('.aha-search-result__title') === title;
  out.marksAfterUpdate = [...title.querySelectorAll('mark')].map((m) => m.textContent);
  return out;
})()`;

test('<aha-search-result> sets title and blurb as text, marks the query and strips URLs', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenario, { readyExpr: '!!window.searchResultFixtureReady' });
  assert.equal(result.injectedElements, 0);
  assert.equal(result.injectedRan, false);
  assert.deepEqual(result.titleMarks, ['Word', 'C++']);
  assert.equal(result.blurbText, 'See and for the word list <b>bold</b>');
  assert.deepEqual(result.blurbMarks, ['word']);
  assert.equal(result.titleNodeKept, true);
  assert.deepEqual(result.marksAfterUpdate, ['tips']);
});
