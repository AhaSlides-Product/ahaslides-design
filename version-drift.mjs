#!/usr/bin/env node
/**
 * version-drift.mjs — which repos consume @ahaslides-product/design, and how far behind each is.
 *
 *   node version-drift.mjs                       # table + one-line summary
 *   node version-drift.mjs --line                # only the one-line summary (for a report)
 *   node version-drift.mjs --json                # machine-readable
 *   node version-drift.mjs --repos org/a,org/b   # also check repos code search may not index
 *
 * Needs an authenticated `gh` (any token that can read the consumer repos' package.json).
 * Consumers are found by GitHub code search for the package name in package.json files, so a
 * repo the search index misses can be added with --repos. Latest = highest v<semver> tag here.
 */
import { execFileSync } from 'node:child_process';

const PACKAGE = '@ahaslides-product/design';
const OWNER = process.env.DS_OWNER || 'AhaSlides-Product';
const HOME_REPO = `${OWNER}/ahaslides-design`;
const args = process.argv.slice(2);
const flagValue = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; };

const gh = (...ghArgs) => execFileSync('gh', ghArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const parseVersion = (v) => (String(v).match(/(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
const compareVersions = (a, b) => { const A = parseVersion(a), B = parseVersion(b); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };

const latestVersion = gh('api', `repos/${HOME_REPO}/tags`, '--paginate', '--jq', '.[].name').split('\n')
  .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag)).map((tag) => tag.slice(1)).sort(compareVersions).pop();
if (!latestVersion) { console.error('no v<semver> tags found on ' + HOME_REPO); process.exit(1); }

const found = new Map();
const hits = JSON.parse(gh('search', 'code', `"${PACKAGE}"`, '--owner', OWNER, '--filename', 'package.json', '--limit', '100', '--json', 'repository,path'));
for (const hit of hits) if (hit.repository.nameWithOwner !== HOME_REPO) found.set(`${hit.repository.nameWithOwner}:${hit.path}`, [hit.repository.nameWithOwner, hit.path]);
for (const repo of flagValue('--repos').split(',').filter(Boolean)) found.set(`${repo}:package.json`, [repo, 'package.json']);

const rows = [];
for (const [repo, path] of found.values()) {
  let pinned = null;
  try {
    const manifest = JSON.parse(Buffer.from(gh('api', `repos/${repo}/contents/${path}`, '--jq', '.content'), 'base64').toString('utf8'));
    pinned = ['dependencies', 'devDependencies', 'peerDependencies'].map((k) => manifest[k]?.[PACKAGE]).find(Boolean) || null;
  } catch { /* unreadable manifest — reported as "unreadable" */ }
  const behind = pinned && /\d/.test(pinned) ? compareVersions(latestVersion, pinned) > 0 : null;
  rows.push({ repo, path, pinned, behind, minorsBehind: pinned && /\d/.test(pinned) ? parseVersion(latestVersion)[1] - parseVersion(pinned)[1] : null });
}
rows.sort((a, b) => a.repo.localeCompare(b.repo));

const stale = rows.filter((r) => r.behind);
const summary = `DS drift: latest ${latestVersion}; ${rows.length - stale.length}/${rows.length} consumers current` +
  (rows.length ? ' — ' + rows.map((r) => `${r.repo.split('/')[1]} ${r.pinned || 'unreadable'}${r.behind ? ` (${r.minorsBehind} minor behind)` : ''}`).join(', ') : '');

if (args.includes('--json')) console.log(JSON.stringify({ latestVersion, consumers: rows, summary }, null, 2));
else if (args.includes('--line')) console.log(summary);
else {
  console.log(`${PACKAGE} latest: ${latestVersion}\n`);
  for (const r of rows) console.log(`${(r.behind ? 'BEHIND ' : r.pinned ? 'ok     ' : '?      ')}${r.repo}/${r.path}  pins ${r.pinned || 'unreadable'}${r.behind ? `  (${r.minorsBehind} minor behind)` : ''}`);
  console.log(`\n${summary}`);
}
