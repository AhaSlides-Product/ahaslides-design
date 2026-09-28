#!/usr/bin/env node
/**
 * evals-harness.mjs — validates the anti-slop eval sets (deterministic, gated by standards.mjs) and
 * scores a model against them (live, run by hand). Usage and the eval-set format: anti-slop/README.md.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
export const STORE_PATH = join(HERE, 'criteria.json');
export const EVALS_DIR = join(HERE, 'evals');

export const PASS = 'PASS', FAIL = 'FAIL', NOT_APPLICABLE = 'N/A';
export const OK_TO_SHIP = 'OK_TO_SHIP', NEEDS_FIX = 'NEEDS_FIX';
const LABEL_OVERALL = { 'good-control': OK_TO_SHIP, 'bad-example': NEEDS_FIX };
const FROZEN_SNAPSHOT = /contract\.json|typography\.json|review\.html|references\//;

export const evalSetPath = (surface) => join(EVALS_DIR, surface, 'evals.json');

/* ---------- verdict parsing + grading ---------- */

const ROW = /^\s*\|?\s*([A-Z]\d{1,2})\s*\|.*?\b(PASS|FAIL|N\/A)\b/i;
const OVERALL = /Overall\b[^\n]*?\b(OK[\s-]*TO[\s-]*SHIP|NEEDS[\s-]*FIX)/i;

const normaliseOverall = (token) => (/^OK/i.test(token.replace(/[\s-]/g, '')) ? OK_TO_SHIP : NEEDS_FIX);

/** Parse a judge's verdict report (a `| C1 | … | PASS |` table + an `Overall:` line). First row per id wins. */
export function parseVerdict(report) {
  const criteria = {};
  for (const line of String(report || '').split('\n')) {
    const match = line.match(ROW);
    if (match && !(match[1].toUpperCase() in criteria)) criteria[match[1].toUpperCase()] = match[2].toUpperCase();
  }
  const overallMatch = String(report || '').match(OVERALL);
  let overall = overallMatch ? normaliseOverall(overallMatch[1]) : null;
  if (!overall && Object.keys(criteria).length) overall = Object.values(criteria).includes(FAIL) ? NEEDS_FIX : OK_TO_SHIP;
  return { criteria, overall };
}

// A judge may mark an absent feature N/A; that is not a failure, so it satisfies an expected PASS.
const asVerdict = (value) => (value === NOT_APPLICABLE ? PASS : value);

/** Hard-grade a parsed verdict against a case's explicit `expected` block. */
export function grade(parsed, testCase) {
  const expected = testCase.expected || {};
  const mismatches = [];
  if (expected.overall && parsed.overall !== expected.overall)
    mismatches.push(`overall: expected ${expected.overall}, got ${parsed.overall ?? 'MISSING'}`);
  for (const [id, want] of Object.entries(expected.criteria || {})) {
    const got = asVerdict(parsed.criteria[id]);
    if (got !== want) mismatches.push(`${id}: expected ${want}, got ${parsed.criteria[id] ?? 'MISSING'}`);
  }
  if (testCase.label === 'good-control') {
    const surprise = Object.entries(parsed.criteria).filter(([id, v]) => v === FAIL && expected.criteria?.[id] !== FAIL).map(([id]) => id);
    if (surprise.length) mismatches.push(`good-control over-fired on ${surprise.join(', ')}`);
  }
  return { ok: mismatches.length === 0, mismatches };
}

/* ---------- deterministic tier: dataset integrity ---------- */

/**
 * Validate every surface's eval set against the store. Returns { checks: [name, ok, note][], warnings: [name, note][] }
 * — the shape standards.mjs prints. Warnings are unmeasured criteria (no FAIL case), never a failure.
 */
export function validateEvalSets(store) {
  const checks = [], warnings = [];
  const check = (name, condition, note = '') => checks.push([name, !!condition, condition ? '' : note]);
  const surfaces = store?.surfaces || {};

  for (const [surface, definition] of Object.entries(surfaces)) {
    const path = evalSetPath(surface);
    check(`evals "${surface}": has an eval set (anti-slop/evals/${surface}/evals.json)`, existsSync(path),
      'every store surface needs a labelled PASS + FAIL eval set — port the judge dataset or author one from the criteria');
    if (!existsSync(path)) continue;
    let set;
    try { set = JSON.parse(readFileSync(path, 'utf8')); }
    catch (error) { check(`evals "${surface}": evals.json parses`, false, error.message); continue; }

    const cases = Array.isArray(set.evals) ? set.evals : [];
    const storeIds = new Set((definition.criteria || []).map(c => c.id));
    const ids = cases.map(c => c?.id);
    check(`evals "${surface}": names its surface`, set.surface === surface, `surface="${set.surface}"`);
    check(`evals "${surface}": ≥1 case, unique ids`, cases.length >= 1 && new Set(ids).size === ids.length && ids.every(id => id != null),
      'each case needs a unique id');

    const malformed = [], unknownIds = new Set(), missingFixtures = [], frozen = [];
    for (const testCase of cases) {
      const tag = `case ${testCase?.id}`;
      const expected = testCase?.expected;
      const expectedCriteria = Object.entries(expected?.criteria || {});
      const fails = expectedCriteria.filter(([, v]) => v === FAIL);
      if (typeof testCase?.prompt !== 'string' || !testCase.prompt.trim()) malformed.push(`${tag}: no prompt`);
      if (!(testCase?.label in LABEL_OVERALL)) malformed.push(`${tag}: label "${testCase?.label}" is not good-control | bad-example`);
      else if (expected?.overall !== LABEL_OVERALL[testCase.label]) malformed.push(`${tag}: ${testCase.label} must expect overall ${LABEL_OVERALL[testCase.label]}`);
      if (expectedCriteria.some(([, v]) => v !== PASS && v !== FAIL)) malformed.push(`${tag}: expected criteria must be PASS | FAIL`);
      if (testCase?.label === 'bad-example' && !fails.length) malformed.push(`${tag}: a bad-example must expect ≥1 FAIL criterion`);
      if (testCase?.label === 'good-control' && fails.length) malformed.push(`${tag}: a good-control cannot expect a FAIL`);
      for (const [id] of expectedCriteria) if (!storeIds.has(id)) unknownIds.add(id);
      for (const file of testCase?.files || []) {
        const filePath = typeof file === 'string' ? file : file?.path;
        const absolute = resolve(dirname(path), String(filePath));
        const inside = absolute.startsWith(dirname(path) + sep);
        if (!filePath || !inside || !existsSync(absolute) || !statSync(absolute).isFile()) missingFixtures.push(`${tag}: ${filePath}`);
      }
      const text = [testCase?.prompt, testCase?.expected_output, ...(testCase?.assertions || [])].join(' ');
      if (FROZEN_SNAPSHOT.test(text)) frozen.push(tag);
    }
    check(`evals "${surface}": every case well-formed`, malformed.length === 0, malformed.join('; '));
    check(`evals "${surface}": every expected criterion id exists in criteria.json`, unknownIds.size === 0,
      `${[...unknownIds].join(', ')} not in surfaces.${surface} — remap to a DS criterion id`);
    check(`evals "${surface}": has both PASS (good-control) and FAIL (bad-example) cases`,
      cases.some(c => c?.label === 'good-control') && cases.some(c => c?.label === 'bad-example'),
      'a PASS-only set cannot catch under-firing; a FAIL-only set cannot catch over-firing');
    check(`evals "${surface}": every fixture resolves`, missingFixtures.length === 0, `missing: ${missingFixtures.join(', ')}`);
    check(`evals "${surface}": cases judge against the live DS, not a frozen plugin snapshot`, frozen.length === 0,
      `${frozen.join(', ')} cite contract.json / typography.json / review.html / references/`);

    const measured = new Set(cases.flatMap(c => Object.entries(c?.expected?.criteria || {}).filter(([, v]) => v === FAIL).map(([id]) => id)));
    const unmeasured = [...storeIds].filter(id => !measured.has(id));
    if (unmeasured.length)
      warnings.push([`evals "${surface}": ${unmeasured.join(', ')} has no FAIL case`, 'an unmeasured criterion — add a bad-example that makes it fire']);
  }

  if (existsSync(EVALS_DIR))
    for (const entry of readdirSync(EVALS_DIR, { withFileTypes: true }).filter(e => e.isDirectory()))
      check(`evals "${entry.name}": is a store surface`, entry.name in surfaces, `anti-slop/evals/${entry.name}/ has no surface in criteria.json — remove it or add the surface`);

  return { checks, warnings };
}

/** Parser/grader golden tests. Returns the list of failures (empty = green). */
export function selfTest() {
  const failures = [];
  const expect = (condition, message) => { if (!condition) failures.push(message); };

  const failReport = `## Verdict — Table.tsx
| # | Criterion | Verdict |
|---|---|---|
| C1 | Shared DataTable | ✅ PASS |
| C2 | Theme-driven look | ❌ FAIL |
| C5 | DS V3 behaviour | ➖ N/A |
**Overall: NEEDS FIX** (1 failing criterion)
## Fails
| C1 | mentioned again | FAIL |`;
  const parsed = parseVerdict(failReport);
  expect(parsed.criteria.C1 === PASS, 'parser: first row per id wins');
  expect(parsed.criteria.C2 === FAIL, 'parser: reads a FAIL row');
  expect(parsed.criteria.C5 === NOT_APPLICABLE, 'parser: reads an N/A row');
  expect(parsed.overall === NEEDS_FIX, 'parser: reads the Overall line');

  const judgeLetter = parseVerdict('| J3 | Size snaps to the scale | ❌ FAIL |\nOverall verdict: OK-TO-SHIP');
  expect(judgeLetter.criteria.J3 === FAIL, "parser: accepts a judge's own letter (J3)");
  expect(judgeLetter.overall === OK_TO_SHIP, 'parser: normalises OK-TO-SHIP');
  expect(parseVerdict('| C1 | x | FAIL |').overall === NEEDS_FIX, 'parser: derives Overall from a FAIL row when the line is missing');
  expect(parseVerdict('no table here').overall === null, 'parser: an empty report has no overall');

  const bad = { label: 'bad-example', expected: { overall: NEEDS_FIX, criteria: { C2: FAIL } } };
  expect(grade(parsed, bad).ok, 'grader: a matching bad-example passes');
  expect(!grade(parsed, { label: 'bad-example', expected: { overall: NEEDS_FIX, criteria: { C1: FAIL } } }).ok, 'grader: a missed FAIL is caught');
  const control = { label: 'good-control', expected: { overall: OK_TO_SHIP, criteria: { C1: PASS, C5: PASS } } };
  const overFired = grade(parseVerdict('| C1 | x | PASS |\n| C5 | x | N/A |\n| C7 | x | FAIL |\nOverall: NEEDS FIX'), control);
  expect(!overFired.ok && overFired.mismatches.some(m => /over-fired on C7/.test(m)), 'grader: a good-control that over-fires is caught');
  expect(grade(parseVerdict('| C1 | x | PASS |\n| C5 | x | N/A |\nOverall: OK TO SHIP'), control).ok, 'grader: N/A satisfies an expected PASS');
  return failures;
}

/* ---------- live tier: model in the loop ---------- */

export function buildPrompt(surface, definition, testCase) {
  const criteria = definition.criteria.map(c => `- ${c.id} — ${c.title}: ${c.test}`).join('\n');
  const targets = (definition.targets || []).map(t => `- ${t.source}: ${t.use}`).join('\n');
  const parts = [
    `You are the AhaSlides design-system anti-slop judge for the "${surface}" surface. Score the material below against`,
    'EXACTLY these binary criteria from the DS store (anti-slop/criteria.json). Mark a criterion N/A only when the material',
    'has nothing it could apply to.\n',
    `## Criteria\n${criteria}\n`,
    targets ? `## Judged against these live DS sources\n${targets}\n` : '',
    'Emit ONLY this verdict report:\n',
    '| # | Criterion | Verdict |\n|---|---|---|\n| <id> | <title> | PASS / FAIL / N/A |   (one row per criterion)\n\n**Overall: OK TO SHIP** or **Overall: NEEDS FIX**\n',
    `## Task\n${testCase.prompt}\n`,
  ];
  for (const file of testCase.files || []) {
    const filePath = typeof file === 'string' ? file : file.path;
    parts.push(`## File: ${filePath}\n\`\`\`\n${readFileSync(join(EVALS_DIR, surface, filePath), 'utf8')}\n\`\`\`\n`);
  }
  return parts.filter(Boolean).join('\n');
}

function majority(values) {
  const counts = new Map();
  for (const v of values) if (v != null) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function scoreSurface(surface, definition, options) {
  const set = JSON.parse(readFileSync(evalSetPath(surface), 'utf8'));
  const confusion = {};
  let correct = 0;
  for (const testCase of set.evals) {
    const prompt = buildPrompt(surface, definition, testCase);
    if (options.dryRun) { console.log(`\n===== ${surface} case ${testCase.id} (${testCase.label}) =====\n${prompt}`); continue; }
    const samples = [];
    for (let i = 0; i < options.samples; i++) {
      const [command, ...args] = options.judgeCmd.split(/\s+/);
      const run = spawnSync(command, args, { input: prompt, encoding: 'utf8', timeout: options.timeout * 1000, maxBuffer: 16 << 20 });
      samples.push(parseVerdict(run.stdout));
    }
    const ids = new Set(samples.flatMap(s => Object.keys(s.criteria)));
    const consensus = {
      criteria: Object.fromEntries([...ids].map(id => [id, majority(samples.map(s => s.criteria[id]))])),
      overall: majority(samples.map(s => s.overall)),
    };
    const result = grade(consensus, testCase);
    if (result.ok) correct++;
    for (const [id, want] of Object.entries(testCase.expected.criteria || {})) {
      const got = consensus.criteria[id] ?? 'MISSING';
      const key = `${want}→${got}`;
      (confusion[id] ||= {})[key] = (confusion[id][key] || 0) + 1;
    }
    console.log(`[${result.ok ? 'PASS' : 'FAIL'}] ${surface} case ${String(testCase.id).padStart(2)} (${testCase.label})${result.ok ? '' : `  << ${result.mismatches.join('; ')}`}`);
  }
  if (!options.dryRun) {
    console.log(`  ${surface} per-criterion (expected→got : n)`);
    for (const id of Object.keys(confusion).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })))
      console.log(`    ${id}: ${Object.entries(confusion[id]).map(([k, n]) => `${k}:${n}`).join(', ')}`);
  }
  return { correct, graded: options.dryRun ? 0 : set.evals.length };
}

function parseArguments(argv) {
  const options = { samples: 3, judgeCmd: 'claude -p', timeout: 300, minAccuracy: null, dryRun: false, all: false, surface: null, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--surface') options.surface = argv[++i];
    else if (flag === '--all') options.all = true;
    else if (flag === '--samples') options.samples = Number(argv[++i]);
    else if (flag === '--judge-cmd') options.judgeCmd = argv[++i];
    else if (flag === '--timeout') options.timeout = Number(argv[++i]);
    else if (flag === '--min-accuracy') options.minAccuracy = Number(argv[++i]);
    else if (flag === '--dry-run') options.dryRun = true;
    else if (flag === '--self-test') options.selfTest = true;
    else throw new Error(`unknown flag ${flag}`);
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const store = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
  if (options.selfTest) {
    const failures = selfTest();
    const { checks, warnings } = validateEvalSets(store);
    for (const [name, ok, note] of checks) if (!ok) failures.push(`${name}  [${note}]`);
    for (const [name, note] of warnings) console.log(`⚠ ${name}  [${note}]`);
    console.log(failures.length ? failures.map(f => `✗ ${f}`).join('\n') : `✓ parser, grader and ${Object.keys(store.surfaces).length} eval set(s) OK`);
    return failures.length ? 1 : 0;
  }
  const surfaces = options.all ? Object.keys(store.surfaces) : [options.surface];
  if (!surfaces[0] || !surfaces.every(s => s in store.surfaces)) {
    console.error(`pass --surface <${Object.keys(store.surfaces).join('|')}> or --all`);
    return 2;
  }
  let correct = 0, graded = 0;
  for (const surface of surfaces) {
    const result = scoreSurface(surface, store.surfaces[surface], options);
    correct += result.correct; graded += result.graded;
  }
  if (options.dryRun) return 0;
  const accuracy = graded ? correct / graded : 0;
  console.log(`\noverall: ${correct}/${graded} cases graded correct (${Math.round(accuracy * 100)}%)`);
  if (options.minAccuracy != null && accuracy < options.minAccuracy) {
    console.log(`FAIL: below --min-accuracy ${options.minAccuracy}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
