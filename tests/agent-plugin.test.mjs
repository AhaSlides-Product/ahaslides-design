import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hooks = join(dirname(fileURLToPath(import.meta.url)), '..', 'agent', 'hooks');
const suites = readdirSync(hooks).filter(f => /^test_.*\.py$/.test(f)).sort();

test('agent plugin ships hook test suites', () => assert.ok(suites.length >= 6, suites.join(', ')));

for (const suite of suites) {
  test(`agent hooks: ${suite}`, () => {
    execFileSync('python3', [join(hooks, suite)], { cwd: hooks, stdio: 'pipe', timeout: 120_000 });
  });
}

test('agent plugin tracks no Python bytecode', () => {
  const tracked = execFileSync('git', ['ls-files', 'agent'], { cwd: join(hooks, '..', '..'), encoding: 'utf8' });
  assert.deepEqual(tracked.split('\n').filter(f => /__pycache__|\.pyc$/.test(f)), []);
});
