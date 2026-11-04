import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function seed(md) {
  const dir = mkdtempSync(join(tmpdir(), 'seed-'));
  const judge = join(dir, 'SKILL.md');
  const store = join(dir, 'criteria.json');
  writeFileSync(judge, md);
  execFileSync('node', [join(root, 'sync-skills.mjs'), 'import', 'demo', '--judge', judge, '--store', store]);
  return JSON.parse(readFileSync(store, 'utf8')).surfaces.demo.criteria;
}

test('a criterion that opens with a scope line keeps its rule text', () => {
  const [c] = seed(`### C1. Home → PASS / FAIL

**Scope.** No message at all is N/A.

**Rule.** Two sub-tests:

- **(a) Survives.** Not only in a toast.
- **(b) Shape.** Title carries the outcome.

✅ **GOOD:** an inline Alert.

**Common failure modes (any one → FAIL):** a toast.
`);
  assert.match(c.test, /\*\*\(a\) Survives\.\*\*/);
  assert.match(c.test, /\*\*\(b\) Shape\.\*\*/);
  assert.doesNotMatch(c.test, /GOOD|Common failure/);
});

test('a plain rule is still the first two sentences', () => {
  const [c] = seed(`### C1. Plain → PASS / FAIL

One. Two. Three.

Second paragraph.
`);
  assert.equal(c.test, 'One. Two.');
});

test('the ux-writing C7 in the store carries both sub-tests', () => {
  const store = JSON.parse(readFileSync(join(root, 'anti-slop/criteria.json'), 'utf8'));
  const c7 = store.surfaces['ux-writing'].criteria.find((c) => c.id === 'C7');
  assert.match(c7.test, /\*\*\(a\) Survives\.\*\*/);
  assert.match(c7.test, /\*\*\(b\) Shape\*\*/);
});
