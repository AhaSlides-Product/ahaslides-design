import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const libDir = new URL('../lib/', import.meta.url);
const fixtureUrl = pathToFileURL(fileURLToPath(new URL('./illustration-loading.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const importsOf = (file) => [...readFileSync(new URL(file, libDir), 'utf8')
  .matchAll(/\bimport\s*(?:\(\s*|[^'";]*?\s+from\s+)?'\.\/([\w.-]+\.js)'/g)].map((match) => match[1]);
const everythingABundlerPulls = (file, seen = new Set()) => {
  if (!seen.has(file)) { seen.add(file); importsOf(file).forEach((next) => everythingABundlerPulls(next, seen)); }
  return seen;
};

for (const entry of ['aha-empty.js', 'aha-data-table.js', 'antd-render-empty.js']) {
  test(`${entry} pulls in no catalogue, static or dynamic`, () => {
    const pulled = everythingABundlerPulls(entry);
    assert.ok(pulled.has('illustrations-empty.js'), `${entry} must still load its empty-state art`);
    assert.ok(!pulled.has('illustrations-registry.js'), `${entry} reaches the whole catalogue`);
  });
}

test('the small art modules survive tree-shaking', () => {
  const { sideEffects } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const file of ['./lib/illustrations-empty.js', './lib/aha-illustration.js']) assert.ok(sideEffects.includes(file), file);
});

const load = (order) => evaluateInPage(`${fixtureUrl}#${order}`,
  '(() => ({ errors: window.loadingErrors, snapshots: window.snapshots, sharedClass: window.sharedClass }))()',
  { readyExpr: '!!window.loadingReady', timeout: 45000 });

test('aha-empty alone draws its own art and leaves other names blank, never the error box', { skip }, async () => {
  const { errors, snapshots: [page] } = await load('aha-empty');
  assert.deepEqual(errors, []);
  assert.deepEqual(page, { builtIn: 'art', small: 'art', catalogue: 'blank', slotted: 'blank', typo: 'blank' });
});

test('the full set arriving later redraws what is already on the page, and only then flags a bad name', { skip }, async () => {
  const { errors, snapshots: [, page], sharedClass } = await load('aha-empty,illustrations');
  assert.deepEqual(errors, []);
  assert.deepEqual(page, { builtIn: 'art', small: 'art', catalogue: 'art', slotted: 'art', typo: 'error box' });
  assert.equal(sharedClass, true);
});

test('the full set loaded first behaves the same with aha-empty after it', { skip }, async () => {
  const { errors, snapshots: [, page], sharedClass } = await load('illustrations,aha-empty');
  assert.deepEqual(errors, []);
  assert.deepEqual(page, { builtIn: 'art', small: 'art', catalogue: 'art', slotted: 'art', typo: 'error box' });
  assert.equal(sharedClass, true);
});
