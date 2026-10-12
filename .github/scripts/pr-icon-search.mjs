// Usage: PR_BODY="…" node .github/scripts/pr-icon-search.mjs <base-ref>
// Fails a pull request that adds a glyph under icons/svg/ without an "Icon search:" line in its body
// naming every close existing match (by look or by meaning) and why it does not fit.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchIcons, checkIconSearchDeclaration } from '../../icon-search.mjs';
import { readGlyphSources, rasteriseAll, closestIcons, isVariantPair } from '../../icon-similarity.mjs';

const CLOSE_BY_LOOK = 0.7;
const MATCHES_PER_KIND = 3;

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
git('fetch', '--quiet', '--depth=1', 'origin', process.argv[2]);
const base = git('rev-parse', 'FETCH_HEAD');

const addedGlyphs = git('diff', '--name-status', '--diff-filter=ACR', base, 'HEAD', '--', 'icons/svg')
  .split('\n').filter(Boolean).map(line => line.split('\t').pop())
  .filter(file => file.endsWith('.svg')).map(file => file.split('/').pop().replace(/\.svg$/, ''));

const registry = JSON.parse(readFileSync(join(root, 'icons', 'registry.json'), 'utf8')).icons;
const drawings = rasteriseAll(readGlyphSources(root));
const existing = (name, glyph) => name !== glyph && !addedGlyphs.includes(name) && !isVariantPair(name, glyph);
const closeMatches = {};
for (const glyph of addedGlyphs) {
  const byLook = drawings[glyph]
    ? closestIcons(drawings[glyph], Object.fromEntries(Object.entries(drawings).filter(([name]) => existing(name, glyph))), MATCHES_PER_KIND)
      .filter(({ score }) => score >= CLOSE_BY_LOOK).map(({ name }) => name)
    : [];
  const byMeaning = searchIcons(registry, (registry[glyph]?.meaning || []).slice(0, 3).join(' '), MATCHES_PER_KIND + addedGlyphs.length + 1)
    .map(({ name }) => name).filter(name => existing(name, glyph)).slice(0, MATCHES_PER_KIND);
  closeMatches[glyph] = [...new Set([...byLook, ...byMeaning])];
}

const { required, problems } = checkIconSearchDeclaration({ body: process.env.PR_BODY, addedGlyphs, closeMatches });
if (!required) console.log('icon search declaration: not needed (no glyph added under icons/svg/)');
for (const glyph of addedGlyphs) console.log(`  ${glyph}: close matches to explain: ${closeMatches[glyph].join(', ') || 'none'}`);
for (const problem of problems) console.log(`✗ ${problem}`);
if (required && !problems.length) console.log('icon search declaration: ✓ the Icon search: line explains every close match');
process.exit(problems.length ? 1 : 0);
