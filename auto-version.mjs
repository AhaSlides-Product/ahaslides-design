#!/usr/bin/env node
// Auto-versioning on merge, active only while the repo variable AUTO_VERSION is "on".
// A pull request writes its CHANGELOG entry under "## Unreleased" and leaves every version file
// alone; on merge to master, publish.yml runs `node auto-version.mjs`, which picks the number,
// turns "## Unreleased" into "## X.Y.Z — YYYY-MM-DD" with the real PR numbers, sets package.json
// and agent/.claude-plugin/plugin.json to X.Y.Z, and pushes "chore(release): X.Y.Z" to master.
//
// Usage: node auto-version.mjs [--dry-run] [--remote <name>] [--branch <name>]   (run in the repo root)
// Exit: 0 released, or nothing to release · 1 the push was refused · 2 bad input (nothing pushed)
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASE_SUBJECT_PREFIX = 'chore(release): ';
export const VERSION_FILES = ['package.json', 'agent/.claude-plugin/plugin.json'];
const UNRELEASED_HEADING = /^##\s+Unreleased\s*$/i;
const ANY_ENTRY_HEADING = /^##\s/;
const TRAILING_REF = /\(#([^)\n]*)\)\s*$/;
const BUMP_RANK = { none: 0, patch: 1, minor: 2, major: 3 };

export const isAutoVersionOn = (env = process.env) => (env.AUTO_VERSION || '').trim().toLowerCase() === 'on';

/** The pending entry when CHANGELOG.md's first "## " heading outside a code fence is "## Unreleased",
 *  else null. Several Unreleased headings in a row (two merges released together) read as one entry. */
export function readUnreleased(changelog) {
  const lines = changelog.split('\n');
  let fenced = false;
  const isEntryHeading = lines.map(line => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    return !fenced && ANY_ENTRY_HEADING.test(line);
  });
  const first = isEntryHeading.indexOf(true);
  if (first === -1 || !UNRELEASED_HEADING.test(lines[first])) return null;
  let end = first + 1;
  while (end < lines.length && (!isEntryHeading[end] || UNRELEASED_HEADING.test(lines[end]))) end++;
  const body = lines.slice(first + 1, end).filter(line => !UNRELEASED_HEADING.test(line));
  return { lines, start: first, end, body };
}

const bulletLines = (body) => body.filter(line => /^\s*-\s+\S/.test(line));
const placeholderRef = (line) => { const ref = line.match(TRAILING_REF); return ref && !/^\d+$/.test(ref[1]) ? ref[0].trim() : null; };

/** Pre-1.0 SemVer as this CHANGELOG has applied it: an entry with only "### Fixed" is a patch; any Added, Changed or Removed makes it a minor. */
export function inferBump(body) {
  const sections = body.map(line => line.match(/^###\s+(\w+)/)?.[1]?.toLowerCase()).filter(Boolean);
  return sections.some(section => section !== 'fixed') ? 'minor' : 'patch';
}

/** The first "Version-bump: <kind>" line of a commit message or PR body: { kind } or { invalid }. */
export function parseBumpLine(text) {
  const line = (text || '').split('\n').find(row => /^version-bump:/i.test(row.trim()));
  if (!line) return {};
  const value = line.trim().slice('version-bump:'.length).trim().toLowerCase().match(/^[a-z]*/)[0];
  return value in BUMP_RANK ? { kind: value } : { invalid: value || '(empty)' };
}

export function nextVersion(version, kind) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** The largest bump across the released pull requests: each one's Version-bump line, else what its
 *  entry implies. Returns null when every pull request says "none". */
export function pickBump(body, pullRequests) {
  const inferred = inferBump(body);
  const kinds = pullRequests.length ? pullRequests.map(pr => pr.bump || inferred) : [inferred];
  const best = kinds.reduce((top, kind) => (BUMP_RANK[kind] > BUMP_RANK[top] ? kind : top), 'none');
  return best === 'none' ? null : best;
}

/** Replaces each "(#PR)"-style placeholder with the number of the pull request that added that line;
 *  with one pull request in the release, every placeholder is that one. */
export function fillPullRequestRefs(body, pullRequests) {
  const numbered = pullRequests.filter(pr => pr.number);
  const unfilled = [];
  const filled = body.map(line => {
    const placeholder = placeholderRef(line);
    if (!placeholder) return line;
    const owner = numbered.find(pr => (pr.addedLines || []).some(added => added.trim() === line.trim()))
      || (numbered.length === 1 ? numbered[0] : null);
    if (!owner) { unfilled.push(line.trim()); return line; }
    return line.replace(TRAILING_REF, `(#${owner.number})`);
  });
  return { body: filled, unfilled };
}

export function rewriteChangelog(changelog, version, date, pullRequests) {
  const pending = readUnreleased(changelog);
  if (!pending) throw new Error('CHANGELOG.md has no "## Unreleased" entry on top');
  const { body, unfilled } = fillPullRequestRefs(pending.body, pullRequests);
  const lines = [...pending.lines.slice(0, pending.start), `## ${version} — ${date}`, ...body, ...pending.lines.slice(pending.end)];
  return { changelog: lines.join('\n'), unfilled };
}

export function setJsonVersion(text, from, to) {
  const field = new RegExp(`("version"\\s*:\\s*")${from.replace(/\./g, '\\.')}(")`);
  if (!field.test(text)) throw new Error(`no "version": "${from}" field to update`);
  return text.replace(field, `$1${to}$2`);
}

/** Repo-gate checks for a top Unreleased entry. With none it adds nothing and the gate runs as before.
 *  With one: rejected while the switch is off; while on, the entry needs bullets and real or
 *  placeholder PR refs, and a pull request must leave the version at its base's (the release sets it). */
export function unreleasedGate({ changelog, env = process.env, packageVersion, readBaseVersion }) {
  const pending = changelog ? readUnreleased(changelog) : null;
  if (!pending) return { active: false, checks: [] };
  if (!isAutoVersionOn(env)) {
    return { active: false, checks: [['"## Unreleased" entry needs AUTO_VERSION=on', false,
      'auto-versioning is off: write the entry as "## X.Y.Z — YYYY-MM-DD" and bump package.json + agent/.claude-plugin/plugin.json (or, where the repo variable AUTO_VERSION is on, run with AUTO_VERSION=on)']] };
  }
  const bullets = bulletLines(pending.body);
  const badRef = bullets.map(line => line.match(TRAILING_REF)?.[0].trim()).find(ref => ref && !/^\(#(\d+|PR)\)$/i.test(ref));
  const checks = [
    ['"## Unreleased" entry lists ≥1 change bullet', bullets.length > 0, 'describe what changed as "- …" bullets under ### Added | Changed | Fixed | Removed'],
    ['"## Unreleased" PR refs are a number or (#PR)', !badRef, `${badRef} — write the real number, e.g. (#58), or (#PR) for the release to fill in`],
  ];
  const baseRef = env.GITHUB_BASE_REF || env.VERSION_BASE_REF;
  if (baseRef && readBaseVersion) {
    const baseVersion = readBaseVersion(baseRef);
    checks.push([`version ${packageVersion} stays at ${baseRef}'s ${baseVersion ?? '(unreadable)'} (the release sets it)`,
      baseVersion !== null && baseVersion === packageVersion,
      baseVersion === null
        ? `could not read package.json from origin/${baseRef} — the version gate fails closed`
        : `with "## Unreleased", leave package.json and agent/.claude-plugin/plugin.json at ${baseVersion}: merge origin/${baseRef} and undo the bump`]);
  }
  return { active: true, checks: checks.map(([name, ok, note]) => [name, ok, ok ? '' : note]) };
}

/* ===== release CLI ============================================================================ */

const git = (args, options = {}) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim();

async function pullRequestBody(number) {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repository } = process.env;
  if (!token || !repository || !number) return '';
  try {
    const response = await fetch(`${process.env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repository}/pulls/${number}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    return response.ok ? ((await response.json()).body || '') : '';
  } catch { return ''; }
}

async function releasedPullRequests(base, tip) {
  const shas = git(['rev-list', '--no-merges', `${base}..${tip}`]).split('\n').filter(Boolean);
  const pullRequests = [];
  for (const sha of shas) {
    const message = git(['log', '-1', '--format=%B', sha]);
    const number = message.split('\n')[0].match(/\(#(\d+)\)\s*$/)?.[1] || null;
    let bump = parseBumpLine(message);
    if (!bump.kind && !bump.invalid) bump = parseBumpLine(await pullRequestBody(number));
    if (bump.invalid) console.log(`::warning::${sha.slice(0, 7)} says "Version-bump: ${bump.invalid}"; expected patch, minor, major or none, so its CHANGELOG entry decides.`);
    const addedLines = git(['show', '--format=', '-U0', sha, '--', 'CHANGELOG.md']).split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++')).map(line => line.slice(1));
    pullRequests.push({ sha, number, bump: bump.kind, addedLines });
  }
  return pullRequests;
}

class ReleaseFailure extends Error { constructor(code, message) { super(message); this.code = code; } }
function fail(code, message) { throw new ReleaseFailure(code, message); }

function setOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
}

async function planRelease(remote, branch) {
  const trackingRef = `refs/remotes/${remote}/${branch}`;
  git(['fetch', '-q', remote, `+refs/heads/${branch}:${trackingRef}`]);
  const tip = git(['rev-parse', trackingRef]);
  const changelog = git(['show', `${tip}:CHANGELOG.md`]);
  const oldVersion = JSON.parse(git(['show', `${tip}:package.json`])).version;
  if (!/^\d+\.\d+\.\d+$/.test(oldVersion || '')) fail(2, `package.json version on ${branch} is "${oldVersion}", not X.Y.Z`);
  const pending = readUnreleased(changelog);
  if (!pending) return { tip, oldVersion };
  const base = git(['log', '-1', '--format=%H', `-S"version": "${oldVersion}"`, tip, '--', 'package.json']);
  if (!base) fail(2, `no commit on ${branch} sets package.json to ${oldVersion}, so the released range is unknown`);
  const pullRequests = await releasedPullRequests(base, tip);
  const kind = pickBump(pending.body, pullRequests);
  if (!kind) return { tip, oldVersion, skipped: true };
  const newVersion = nextVersion(oldVersion, kind);
  const date = new Date().toISOString().slice(0, 10);
  const { changelog: released, unfilled } = rewriteChangelog(changelog, newVersion, date, pullRequests);
  if (unfilled.length) fail(2, `could not tell which pull request added: ${unfilled.join(' | ')} — replace its (#PR) with the real number on ${branch}`);
  if (readUnreleased(released) || !released.includes(`\n## ${newVersion} — ${date}\n`)) fail(2, 'the CHANGELOG rewrite did not produce a versioned top entry');
  return { tip, oldVersion, newVersion, kind, released, pullRequests };
}

function pushArguments(remote, branch) {
  if (!process.env.AUTO_VERSION_PUSH_TOKEN) return { args: ['push', '-q', remote, `HEAD:refs/heads/${branch}`], pushedWith: 'github-token' };
  const url = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}.git`;
  // An empty extraheader drops actions/checkout's GITHUB_TOKEN header; the helper reads the secret from the environment, never argv.
  return {
    args: ['-c', 'http.https://github.com/.extraheader=', '-c', 'credential.helper=',
      '-c', 'credential.helper=!f() { echo username=x-access-token; echo "password=$AUTO_VERSION_PUSH_TOKEN"; }; f',
      'push', '-q', url, `HEAD:refs/heads/${branch}`],
    pushedWith: 'push-token',
  };
}

async function main(argv) {
  let remote = 'origin', branch = 'master', dryRun = false;
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--dry-run') dryRun = true;
    else if (argument === '--remote' && argv[index + 1]) remote = argv[++index];
    else if (argument === '--branch' && argv[index + 1]) branch = argv[++index];
    else fail(2, `auto-version.mjs: unknown argument "${argument}"`);
  }
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    const plan = await planRelease(remote, branch);
    if (!plan.newVersion) {
      console.log(plan.skipped
        ? `Nothing to release: every pull request in "## Unreleased" says Version-bump: none (${branch} stays ${plan.oldVersion}).`
        : `Nothing to release: CHANGELOG.md on ${branch} has no "## Unreleased" entry (${plan.oldVersion}).`);
      setOutputs({ released: 'false' });
      return;
    }
    const numbers = plan.pullRequests.map(pr => pr.number && `#${pr.number}`).filter(Boolean);
    console.log(`Releasing ${plan.oldVersion} -> ${plan.newVersion} (${plan.kind}; ${numbers.join(', ') || 'no pull request number found'}).`);
    if (dryRun) { console.log(plan.released.split('\n## ').slice(0, 2).join('\n## ')); setOutputs({ released: 'false' }); return; }

    const scratch = mkdtempSync(join(tmpdir(), 'auto-version-'));
    const worktree = join(scratch, 'release');
    try {
      git(['worktree', 'add', '-q', '--detach', worktree, plan.tip]);
      writeFileSync(join(worktree, 'CHANGELOG.md'), plan.released);
      for (const file of VERSION_FILES)
        writeFileSync(join(worktree, file), setJsonVersion(readFileSync(join(worktree, file), 'utf8'), plan.oldVersion, plan.newVersion));
      git(['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit', '-q', '-m', `${RELEASE_SUBJECT_PREFIX}${plan.newVersion}`,
        '-m', `Auto-version: ${plan.oldVersion} -> ${plan.newVersion} (${plan.kind}) for ${numbers.join(', ') || plan.tip.slice(0, 7)}.`,
        '--', 'CHANGELOG.md', ...VERSION_FILES], { cwd: worktree });
      const releaseSha = git(['rev-parse', 'HEAD'], { cwd: worktree });
      const push = pushArguments(remote, branch);
      try {
        git(push.args, { cwd: worktree });
      } catch (error) {
        git(['fetch', '-q', remote, `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`]);
        const reason = String(error.stderr || error.message).trim().split('\n').pop();
        if (git(['rev-parse', `refs/remotes/${remote}/${branch}`]) === plan.tip)
          fail(1, `the push of ${plan.newVersion} to ${branch} was refused: ${reason}. Nothing was released; the next merge retries. To fix it, let this workflow push straight to ${branch}: a bypass for GitHub Actions on the ${branch} ruleset, or the repo secret AUTO_VERSION_PUSH_TOKEN (a token allowed to push to ${branch}).`);
        if (attempt >= maxAttempts) fail(1, `${branch} kept moving; gave up after ${maxAttempts} push attempts. Nothing was released; the next merge retries.`);
        console.log(`${branch} moved during the release; planning again.`);
        continue;
      }
      git(['checkout', '-q', '--detach', releaseSha]);
      setOutputs({ released: 'true', version: plan.newVersion, pushed_with: push.pushedWith });
      console.log(`Pushed ${RELEASE_SUBJECT_PREFIX}${plan.newVersion} (${releaseSha.slice(0, 7)}) to ${branch}.`);
      return;
    } finally {
      try { git(['worktree', 'remove', '--force', worktree]); } catch { /* already gone */ }
      rmSync(scratch, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exitCode = error instanceof ReleaseFailure ? error.code : 2;
  }
}
