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

const gh = (...ghArgs) => execFileSync('gh', ghArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const fatal = (message) => { console.error(`version-drift: ${message}`); process.exit(1); };
const ghOrFatal = (what, ...ghArgs) => { try { return gh(...ghArgs); } catch (error) { return fatal(`${what} failed — ${String(error.stderr || error.message).trim().split('\n')[0]}`); } };
const SEMVER_PIN = /^[\^~]?v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const parseVersion = (v) => (String(v).match(/(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
const compareVersions = (a, b) => { const A = parseVersion(a), B = parseVersion(b); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };

const latestVersion = ghOrFatal(`listing tags of ${HOME_REPO}`, 'api', `repos/${HOME_REPO}/tags`, '--paginate', '--jq', '.[].name').split('\n')
  .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag)).map((tag) => tag.slice(1)).sort(compareVersions).pop();
if (!latestVersion) fatal(`no v<semver> tags found on ${HOME_REPO}`);

const found = new Map();
const hits = JSON.parse(ghOrFatal('code search', 'search', 'code', `"${PACKAGE}"`, '--owner', OWNER, '--filename', 'package.json', '--limit', '100', '--json', 'repository,path'));
for (const hit of hits) if (hit.repository.nameWithOwner !== HOME_REPO) found.set(`${hit.repository.nameWithOwner}:${hit.path}`, [hit.repository.nameWithOwner, hit.path]);
for (const repo of flagValue('--repos').split(',').filter(Boolean)) found.set(`${repo}:package.json`, [repo, 'package.json']);

const rows = [];
for (const [repo, path] of found.values()) {
  let pinned = null, status;
  try {
    const manifest = JSON.parse(Buffer.from(gh('api', `repos/${repo}/contents/${path}`, '--jq', '.content'), 'base64').toString('utf8'));
    pinned = ['dependencies', 'devDependencies', 'peerDependencies'].map((k) => manifest[k]?.[PACKAGE]).find(Boolean) || null;
    status = !pinned ? 'no-dependency' : SEMVER_PIN.test(pinned) ? 'pinned' : 'non-semver';
  } catch { status = 'unreadable'; }
  const [latestMajor, latestMinor] = parseVersion(latestVersion);
  const [pinnedMajor, pinnedMinor] = status === 'pinned' ? parseVersion(pinned) : [];
  const behind = status === 'pinned' && compareVersions(latestVersion, pinned) > 0;
  const gap = !behind ? '' : pinnedMajor < latestMajor ? `${latestMajor - pinnedMajor} major behind` : `${latestMinor - pinnedMinor} minor behind`;
  rows.push({ repo, path, pinned, status, behind, gap });
}
rows.sort((a, b) => a.repo.localeCompare(b.repo));

const describe = (r) => ({ pinned: r.pinned, 'non-semver': `${r.pinned} (not a semver pin)`, 'no-dependency': 'no dependency on the package', unreadable: 'unreadable' })[r.status];
const current = rows.filter((r) => r.status === 'pinned' && !r.behind);
const summary = `DS drift: latest ${latestVersion}; ${current.length}/${rows.length} consumers current` +
  (rows.length ? ' — ' + rows.map((r) => `${r.repo.split('/')[1]} ${describe(r)}${r.behind ? ` (${r.gap})` : ''}`).join(', ') : '');

if (args.includes('--json')) console.log(JSON.stringify({ latestVersion, consumers: rows, summary }, null, 2));
else if (args.includes('--line')) console.log(summary);
else {
  console.log(`${PACKAGE} latest: ${latestVersion}\n`);
  for (const r of rows) console.log(`${r.behind ? 'BEHIND ' : r.status === 'pinned' ? 'ok     ' : '?      '}${r.repo}/${r.path}  ${describe(r)}${r.behind ? `  (${r.gap})` : ''}`);
  console.log(`\n${summary}`);
}
