import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIB = new URL('../lib/', import.meta.url).pathname;
const LITERAL_URL = /new URL\(\s*(['"])[^'"`\n]+\1\s*,\s*import\.meta\.url\s*\)/g;

function* sourceFiles(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (name.endsWith('.js')) yield path;
  }
}

test('every import.meta.url in lib is the base of new URL with a string literal', () => {
  const offenders = [];
  for (const path of sourceFiles(LIB)) {
    const stripped = readFileSync(path, 'utf8').replace(LITERAL_URL, '');
    if (stripped.includes('import.meta.url')) offenders.push(path.slice(LIB.length));
  }
  assert.deepEqual(offenders, [], 'bundlers only rewrite new URL("<literal>", import.meta.url); write the path inline');
});
