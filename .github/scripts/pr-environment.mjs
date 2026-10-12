// Usage: PR_BODY="…" node .github/scripts/pr-environment.mjs <base-ref>
// Fails a pull request that changes an item folder (environments.json → declarationPaths) without an
// "Environment:" line in its body, or whose line does not match the environments of the changed items.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvironmentTable, fileSystemReader, gitReader, collectItems, newOrChangedItemIds, checkPullRequestDeclaration } from '../../environments.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const baseRef = process.argv[2];
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
git('fetch', '--quiet', '--depth=1', 'origin', baseRef);
const base = git('rev-parse', 'FETCH_HEAD');

const table = loadEnvironmentTable(root);
const items = collectItems(table, fileSystemReader(root));
const changedIds = newOrChangedItemIds(items, collectItems(table, gitReader(root, base)));
const { required, problems } = checkPullRequestDeclaration({
  table,
  body: process.env.PR_BODY,
  changedFiles: git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean),
  changedItems: items.filter(item => changedIds.has(item.id)),
});

if (!required) console.log('environment declaration: not needed (no item folder changed)');
for (const problem of problems) console.log(`✗ ${problem}`);
if (required && !problems.length) console.log('environment declaration: ✓ the Environment: line matches the changed items');
process.exit(problems.length ? 1 : 0);
