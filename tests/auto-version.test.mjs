import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferBump, parseBumpLine, pickBump, rewriteChangelog, unreleasedGate, readUnreleased } from '../auto-version.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'auto-version.mjs');
const HEADER = '# Changelog\n\nNewest first. Format:\n\n```\n## X.Y.Z — YYYY-MM-DD\n## Unreleased\n### Fixed\n- a bullet (#PR)\n```\n';
const RELEASED = '## 0.4.2 — 2026-10-01\n### Fixed\n- older fix (#40)\n';
const changelogWith = (unreleased) => `${HEADER}\n${unreleased}\n${RELEASED}`;

test('the bump follows the entry: Fixed only is a patch, Added / Changed / Removed is a minor', () => {
  assert.equal(inferBump(['### Fixed', '- a fix (#PR)']), 'patch');
  for (const section of ['Added', 'Changed', 'Removed'])
    assert.equal(inferBump(['### Fixed', '- a fix', `### ${section}`, '- more']), 'minor', section);
});

test('a Version-bump line overrides the entry, the largest bump across pull requests wins, all "none" releases nothing', () => {
  const fixOnly = ['### Fixed', '- a fix'];
  assert.equal(pickBump(fixOnly, [{ bump: 'minor' }]), 'minor');
  assert.equal(pickBump(['### Added', '- a prop'], [{ bump: 'patch' }]), 'patch');
  assert.equal(pickBump(fixOnly, [{ bump: 'major' }, {}]), 'major');
  assert.equal(pickBump(fixOnly, [{ bump: 'none' }, { bump: 'none' }]), null);
  assert.deepEqual(parseBumpLine('What changed\n\nVersion-Bump: MINOR\n'), { kind: 'minor' });
  assert.deepEqual(parseBumpLine('Version-bump: huge'), { invalid: 'huge' });
});

test('the rewrite turns "## Unreleased" into the version heading, fills each PR ref from the PR that added it, and keeps every other line', () => {
  const unreleased = '## Unreleased\n### Added\n- a new prop (#PR)\n\n## Unreleased\n### Fixed\n- a fix (#PR)\n- already numbered (#7)\n';
  const pullRequests = [
    { number: '11', addedLines: ['- a new prop (#PR)'] },
    { number: '12', addedLines: ['## Unreleased', '- a fix (#PR)'] },
  ];
  const { changelog, unfilled } = rewriteChangelog(changelogWith(unreleased), '0.5.0', '2026-10-31', pullRequests);
  assert.deepEqual(unfilled, []);
  assert.equal(changelog, changelogWith('## 0.5.0 — 2026-10-31\n### Added\n- a new prop (#11)\n\n### Fixed\n- a fix (#12)\n- already numbered (#7)\n'));
  assert.equal(readUnreleased(changelog), null);

  const orphan = rewriteChangelog(changelogWith('## Unreleased\n### Fixed\n- nobody added this (#PR)\n'), '0.4.3', '2026-10-31', pullRequests);
  assert.deepEqual(orphan.unfilled, ['- nobody added this (#PR)']);
});

test('gate: no "## Unreleased" on top adds nothing, so the strict versioned-entry checks run as before', () => {
  assert.deepEqual(unreleasedGate({ changelog: changelogWith(''), env: { AUTO_VERSION: 'on' }, packageVersion: '0.4.2' }), { active: false, checks: [] });
  const below = unreleasedGate({ changelog: `${HEADER}\n${RELEASED}\n## Unreleased\n- stray\n`, env: { AUTO_VERSION: 'on' }, packageVersion: '0.4.2' });
  assert.equal(below.active, false, 'an Unreleased heading below a released entry is not pending');
});

test('gate: "## Unreleased" fails while AUTO_VERSION is off and passes while it is on', () => {
  const changelog = changelogWith('## Unreleased\n### Fixed\n- a fix (#PR)\n');
  for (const env of [{}, { AUTO_VERSION: 'off' }]) {
    const off = unreleasedGate({ changelog, env, packageVersion: '0.4.2' });
    assert.equal(off.active, false);
    assert.deepEqual(off.checks.map(([name, ok]) => [name, ok]), [['"## Unreleased" entry needs AUTO_VERSION=on', false]]);
  }
  const on = unreleasedGate({ changelog, env: { AUTO_VERSION: 'on' }, packageVersion: '0.4.2' });
  assert.equal(on.active, true);
  assert.ok(on.checks.every(([, ok]) => ok), JSON.stringify(on.checks));
});

test('gate with AUTO_VERSION on: a pull request must leave the version at its base, list bullets and use a number or (#PR)', () => {
  const changelog = changelogWith('## Unreleased\n### Fixed\n- a fix (#PR)\n');
  const env = { AUTO_VERSION: 'on', GITHUB_BASE_REF: 'master' };
  const failing = (result) => result.checks.filter(([, ok]) => !ok).map(([name]) => name);
  assert.deepEqual(failing(unreleasedGate({ changelog, env, packageVersion: '0.4.2', readBaseVersion: () => '0.4.2' })), []);
  assert.deepEqual(failing(unreleasedGate({ changelog, env, packageVersion: '0.4.3', readBaseVersion: () => '0.4.2' })),
    ["version 0.4.3 stays at master's 0.4.2 (the release sets it)"]);
  assert.deepEqual(failing(unreleasedGate({ changelog, env, packageVersion: '0.4.2', readBaseVersion: () => null })),
    ["version 0.4.2 stays at master's (unreadable) (the release sets it)"]);
  assert.deepEqual(failing(unreleasedGate({ changelog: changelogWith('## Unreleased\n### Fixed\n'), env: { AUTO_VERSION: 'on' }, packageVersion: '0.4.2' })),
    ['"## Unreleased" entry lists ≥1 change bullet']);
  assert.deepEqual(failing(unreleasedGate({ changelog: changelogWith('## Unreleased\n### Fixed\n- a fix (#123abc)\n'), env: { AUTO_VERSION: 'on' }, packageVersion: '0.4.2' })),
    ['"## Unreleased" PR refs are a number or (#PR)']);
});

/* ===== the release CLI against a local bare remote ============================================ */

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'auto-version-test-'));
  const env = {
    PATH: process.env.PATH, HOME: dir, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com',
    GITHUB_OUTPUT: join(dir, 'output.txt'),
  };
  const remote = join(dir, 'remote.git');
  const clone = join(dir, 'clone');
  const git = (args, cwd = clone) => execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
  git(['init', '-q', '--bare', '-b', 'master', remote], dir);
  git(['init', '-q', '-b', 'master', clone], dir);
  git(['remote', 'add', 'origin', remote]);
  mkdirSync(join(clone, 'agent/.claude-plugin'), { recursive: true });
  const land = (subject, changelog, body = '') => {
    if (changelog !== undefined) writeFileSync(join(clone, 'CHANGELOG.md'), changelog);
    git(['add', '-A']);
    git(['commit', '-q', '--allow-empty', '-m', subject, ...(body ? ['-m', body] : [])]);
    git(['push', '-q', 'origin', 'HEAD:master']);
  };
  writeFileSync(join(clone, 'package.json'), '{\n  "name": "@x/design",\n  "version": "0.4.2",\n  "type": "module"\n}\n');
  writeFileSync(join(clone, 'agent/.claude-plugin/plugin.json'), '{\n  "name": "ahaslides-design",\n  "version": "0.4.2"\n}\n');
  land('0.4.2 release (#40)', changelogWith(''));
  const run = () => {
    writeFileSync(env.GITHUB_OUTPUT, '');
    const result = spawnSync(process.execPath, [SCRIPT], { cwd: clone, env, encoding: 'utf8' });
    return { code: result.status, out: result.stdout + result.stderr, outputs: readFileSync(env.GITHUB_OUTPUT, 'utf8') };
  };
  const onRemote = (path) => git(['--git-dir', remote, 'show', `master:${path}`], dir);
  const remoteSubject = () => git(['--git-dir', remote, 'log', '-1', '--format=%s', 'master'], dir);
  const pull = () => git(['pull', '-q', '--ff-only', 'origin', 'master']);
  return { dir, remote, land, run, onRemote, remoteSubject, pull, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const today = () => new Date().toISOString().slice(0, 10);
const versionOn = (box, path) => JSON.parse(box.onRemote(path)).version;

test('release: a merged Unreleased fix ships as the next patch, with its PR number, in all three files, once', (t) => {
  const box = sandbox(); t.after(box.cleanup);
  box.land('DESY-1: fix the chip (#41)', changelogWith('## Unreleased\n### Fixed\n- the chip keeps its plus (#PR)\n'));
  const first = box.run();
  assert.equal(first.code, 0, first.out);
  assert.equal(box.remoteSubject(), 'chore(release): 0.4.3');
  assert.equal(versionOn(box, 'package.json'), '0.4.3');
  assert.equal(versionOn(box, 'agent/.claude-plugin/plugin.json'), '0.4.3');
  assert.equal(box.onRemote('CHANGELOG.md'), changelogWith(`## 0.4.3 — ${today()}\n### Fixed\n- the chip keeps its plus (#41)\n`).trimEnd());
  assert.match(first.outputs, /^released=true$/m);
  assert.match(first.outputs, /^version=0\.4\.3$/m);
  assert.match(first.outputs, /^pushed_with=github-token$/m);

  const again = box.run();
  assert.equal(again.code, 0, again.out);
  assert.match(again.out, /Nothing to release/);
  assert.match(again.outputs, /^released=false$/m);
  assert.equal(box.remoteSubject(), 'chore(release): 0.4.3');
});

test('release: "Version-bump:" in the merged commit overrides the entry, and "none" releases nothing', (t) => {
  const box = sandbox(); t.after(box.cleanup);
  box.land('DESY-2: quiet change (#42)', changelogWith('## Unreleased\n### Fixed\n- internal (#PR)\n'), 'Version-bump: none');
  const skipped = box.run();
  assert.equal(skipped.code, 0, skipped.out);
  assert.match(skipped.out, /Version-bump: none/);
  assert.equal(versionOn(box, 'package.json'), '0.4.2');

  box.land('DESY-3: a fix that adds an API (#43)', changelogWith('## Unreleased\n### Fixed\n- internal (#PR)\n- a fix (#PR)\n'), 'Version-bump: minor');
  const released = box.run();
  assert.equal(released.code, 0, released.out);
  assert.equal(versionOn(box, 'package.json'), '0.5.0');
  assert.match(box.onRemote('CHANGELOG.md'), /## 0\.5\.0 — \d{4}-\d{2}-\d{2}\n### Fixed\n- internal \(#42\)\n- a fix \(#43\)\n/);
});

test('release: a refused push fails red naming the fix and releases nothing; the next run releases it', (t) => {
  const box = sandbox(); t.after(box.cleanup);
  box.land('DESY-4: new prop (#44)', changelogWith('## Unreleased\n### Added\n- a new prop (#PR)\n'));
  const hook = join(box.remote, 'hooks', 'pre-receive');
  writeFileSync(hook, '#!/bin/sh\necho "GH013: Repository rule violations found for refs/heads/master" >&2\nexit 1\n');
  chmodSync(hook, 0o755);
  const refused = box.run();
  assert.equal(refused.code, 1, refused.out);
  assert.match(refused.out, /::error::the push of 0\.5\.0 to master was refused/);
  assert.match(refused.out, /AUTO_VERSION_PUSH_TOKEN/);
  assert.equal(versionOn(box, 'package.json'), '0.4.2');

  rmSync(hook);
  const retried = box.run();
  assert.equal(retried.code, 0, retried.out);
  assert.equal(versionOn(box, 'package.json'), '0.5.0');
});

test('release: a placeholder no merged pull request added stops the release before anything is pushed', (t) => {
  const box = sandbox(); t.after(box.cleanup);
  box.land('DESY-5: first (#45)', changelogWith('## Unreleased\n### Fixed\n- first (#45)\n'));
  box.land('direct push without a PR number', changelogWith('## Unreleased\n### Fixed\n- first (#45)\n- second (#PR)\n'));
  box.land('DESY-6: unrelated (#46)', undefined);
  const result = box.run();
  assert.equal(result.code, 2, result.out);
  assert.match(result.out, /could not tell which pull request added: - second \(#PR\)/);
  assert.equal(versionOn(box, 'package.json'), '0.4.2');
});
