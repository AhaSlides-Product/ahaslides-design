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

test('a hard-wrapped fail-on-any lead-in keeps its sub-rules and stops before rationale', () => {
  const [c] = seed(`### C1. Restraint → PASS / FAIL

Three choices read as machine-made. **Any one
→ FAIL.**

**a. Wash.** No pastel wash.

**b. Corners.** No big radius.

**Why it slips past C1.** Rationale.

**c. Late.** Never reached.
`);
  assert.match(c.test, /\*\*a\. Wash\.\*\*.*\*\*b\. Corners\.\*\*/);
  assert.doesNotMatch(c.test, /Why it slips|Late/);
});

for (const stop of ['# Heading', '> A quote', '**Worked FAIL example — real.** Rationale.', '**FAIL if:**']) {
  test(`a multi-part rule stops at: ${stop}`, () => {
    const [c] = seed(`### C1. Stops → PASS / FAIL

**Scope.** Scope line.

**Rule.** The rule.

${stop}

**After.** Never reached.
`);
    assert.equal(c.test, '**Scope.** Scope line. **Rule.** The rule.');
  });
}

test('a multi-part rule stops at the cap on a whole paragraph', () => {
  const part = 'word '.repeat(600).trim();
  const [c] = seed(`### C1. Cap → PASS / FAIL

**Scope.** Scope line.

${part} one.

${part} two.
`);
  assert.ok(c.test.length <= 5000, `${c.test.length}`);
  assert.match(c.test, /one\.$/);
});

test('every restored multi-part criterion in the store carries its sub-rules', () => {
  const store = JSON.parse(readFileSync(join(root, 'anti-slop/criteria.json'), 'utf8')).surfaces;
  const text = (surface, id) => store[surface].criteria.find(c => c.id === id).test;
  assert.match(text('canvas', 'C9'), /\*\*e\. Meaningful visual polish clipped by the iframe edge\.\*\*/);
  assert.match(text('audience', 'C10'), /\*\*c\. Extra-bold weight\.\*\*/);
  assert.match(text('audience', 'C5'), /\*\*Mobile readability/);
  assert.doesNotMatch(text('audience', 'C5'), /touch target/i);
  assert.match(text('audience', 'C14'), /\*\*b\. The overall reveal VERDICT\.\*\*/);
  assert.match(text('audience', 'C22'), /\*\*c\. No FIXED void\.\*\*/);
  assert.match(text('audience', 'C25'), /\*\*c\. Renders within the reported iframe box/);
  assert.match(text('audience', 'C29'), /\*\*d\. Muted FIELD ink, not deck ink\.\*\*/);
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
