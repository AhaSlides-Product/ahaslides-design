/*
 * sync-skills.mjs — PHASE-1 SEEDER (one-time, retired in Phase 2).
 *
 * Reads an aha-design *judge* SKILL.md and writes that surface's binary criteria
 * into the DS-owned store anti-slop/criteria.json under origin:"seeded". The store
 * is the source of truth from here on; this script only bootstraps a seeded surface.
 *
 * Usage:
 *   node sync-skills.mjs import ux-writing \
 *     --judge <path-to>/aha-design-ux-writing-judge/SKILL.md \
 *     --build aha-design:aha-design-ux-writing \
 *     --judge-ref aha-design:aha-design-ux-writing-judge \
 *     --surface copy \
 *     --plugin-version 1.80.0 --date 2026-09-28
 *
 * DS-authored fields on an existing surface (e.g. `links`) survive a re-seed.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const STORE = join(root, 'anti-slop', 'criteria.json');

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

const TEST_MAX_CHARS = 400;

function truncateAtWord(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—-]+$/, '') + '…';
}

// Parse `### Cn. <title> → PASS / FAIL` headers, then the first paragraph under each as the test text.
function parseCriteria(md) {
  const out = [];
  const re = /^###\s+(C\d+)\.\s+(.+?)\s*(?:→\s*PASS\s*\/\s*FAIL)?\s*$/gm;
  const heads = [...md.matchAll(re)];
  for (let k = 0; k < heads.length; k++) {
    const id = heads[k][1];
    const title = heads[k][2].trim();
    const start = heads[k].index + heads[k][0].length;
    const end = k + 1 < heads.length ? heads[k + 1].index : md.length;
    const paragraphs = md.slice(start, end).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    let body = paragraphs.shift() || '';
    // A lead-in ending in ":" introduces the actual test, so pull in the paragraph it points at.
    while (body.endsWith(':') && paragraphs.length) body += ' ' + paragraphs.shift();
    body = body.replace(/\s+/g, ' ');
    const test = truncateAtWord(body.split(/(?<=[.])\s/).slice(0, 2).join(' '), TEST_MAX_CHARS);
    out.push({ id, title, test });
  }
  return out;
}

const cmd = process.argv[2];
if (cmd !== 'import') { console.error('only "import" is supported'); process.exit(2); }
const surfaceKey = process.argv[3];
if (!surfaceKey) { console.error('give a surface key, e.g. ux-writing'); process.exit(2); }

const judgePath = arg('judge');
if (!judgePath || !existsSync(judgePath)) { console.error(`--judge SKILL.md not found: ${judgePath}`); process.exit(2); }
const criteria = parseCriteria(readFileSync(judgePath, 'utf8'));
if (!criteria.length) { console.error('parsed 0 criteria — check the SKILL.md heading format'); process.exit(1); }

mkdirSync(dirname(STORE), { recursive: true });
const store = existsSync(STORE)
  ? JSON.parse(readFileSync(STORE, 'utf8'))
  : { owner: 'ahaslides-design', surfaces: {} };

store.surfaces = store.surfaces || {};
store.surfaces[surfaceKey] = {
  ...store.surfaces[surfaceKey],
  surface: arg('surface', surfaceKey),
  origin: 'seeded',
  seededFrom: { plugin: 'aha-design', version: arg('plugin-version', 'unknown'), importedOn: arg('date', 'unknown') },
  skillRef: { build: arg('build', null), judge: arg('judge-ref', null) },
  criteria,
};

writeFileSync(STORE, JSON.stringify(store, null, 2) + '\n');
console.log(`✓ seeded surface "${surfaceKey}" with ${criteria.length} criteria → ${STORE}`);
