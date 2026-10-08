import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const libDir = new URL('../lib/', import.meta.url);
const surfaces = ['audience', 'settings', 'canvas'];
const fixtureUrl = pathToFileURL(fileURLToPath(new URL('./surface-entry.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const source = (file) => readFileSync(new URL(file, libDir), 'utf8');
const importedModules = (file) => [...source(file).matchAll(/\bimport\s+(?:[^'";]*?\s+from\s+)?'\.\/([\w.-]+\.js)'/g)].map((match) => match[1]);
const closure = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  seen.add(file);
  importedModules(file).forEach((next) => closure(next, seen));
  return seen;
};
const elementModules = readdirSync(libDir).filter((file) => file.endsWith('.js') && /customElements\.define\(/.test(source(file)));
const tagOf = (file) => (file === 'icons.js' ? 'aha-icon' : file === 'illustrations.js' ? 'aha-illustration' : file.replace(/\.js$/, ''));

test('every element module is registered by at least one surface entry', () => {
  const covered = new Set(surfaces.flatMap((surface) => [...closure(`${surface}.js`)]));
  assert.deepEqual(elementModules.filter((file) => !covered.has(file)), []);
});

test('all.js still registers every element module', () => {
  const imported = new Set(importedModules('all.js'));
  assert.deepEqual(elementModules.filter((file) => !imported.has(file)), []);
});

test('audience.js re-exports applyDeck', () => {
  assert.match(source('audience.js'), /export \{ applyDeck \} from '\.\/audience-deck\.js';/);
});

for (const surface of surfaces) {
  test(`${surface}.js loads in a no-build page and registers its elements`, { skip }, async () => {
    const expectedTags = [...closure(`${surface}.js`)].filter((file) => elementModules.includes(file)).map(tagOf);
    const result = await evaluateInPage(`${fixtureUrl}#${surface}`, `(() => ({
      errors: window.surfaceEntryErrors,
      missing: ${JSON.stringify(expectedTags)}.filter((tag) => !customElements.get(tag)),
      exports: Object.keys(window.surfaceEntryModule || {}),
    }))()`, { readyExpr: '!!window.surfaceEntryReady', timeout: 45000 });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.missing, []);
    if (surface === 'audience') assert.ok(result.exports.includes('applyDeck'));
  });
}
