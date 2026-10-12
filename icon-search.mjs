#!/usr/bin/env node
/**
 * icon-search.mjs — find an existing DS icon by what it means, before drawing a new one.
 *
 *   npm run icon-search help                     (in this repo)
 *   node node_modules/@ahaslides-product/design/icon-search.mjs delete   (in an app)
 *   … --json                                     machine-readable
 *
 * Matches the words against each glyph's name and its meaning words (icons/meaning.json, carried in
 * icons/registry.json), so "help" finds system-question and "delete" finds system-trash.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ICON_GALLERY = 'https://design.ahaslides.io/icons/index.html';

const words = (text) => String(text).toLowerCase().split(/[^a-z0-9&+#]+/).filter(Boolean);
const singular = (word) => word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;

// An exact meaning word scores highest, more so the earlier it is listed; the glyph's own name adds to it.
function termScore(term, nameParts, meaningPhrases, meaningParts) {
  const position = meaningPhrases.indexOf(term);
  let score = position === 0 ? 6 : position > 0 && position < 3 ? 5 : position >= 3 ? 4 : 0;
  if (nameParts.includes(term)) score += 2;
  if (score) return score;
  if (meaningParts.includes(term)) return 3;
  const prefix = (part) => term.length >= 3 && part.startsWith(term);
  if (nameParts.some(prefix) || meaningParts.some(prefix)) return 2;
  if (term.length >= 4 && [...nameParts, ...meaningParts].some(part => part.includes(term))) return 1;
  return 0;
}

/** Glyphs ranked by how well their name and meaning words match the query; aliases fold into their glyph. */
export function searchIcons(registryIcons, query, limit = 10) {
  const terms = words(query).map(singular);
  const phrase = words(query).join(' ');
  if (!terms.length) return [];
  const results = [];
  for (const [name, glyph] of Object.entries(registryIcons)) {
    if (glyph.aliasOf) continue;
    const nameParts = words(name.replace(/^(system|slidetype|filetype)-/, '')).map(singular);
    const meaning = glyph.meaning || [];
    const meaningPhrases = meaning.map(entry => words(entry).map(singular).join(' '));
    const meaningParts = meaningPhrases.flatMap(entry => entry.split(' '));
    let score = 0, matched = 0;
    for (const term of terms) {
      const value = termScore(term, nameParts, meaningPhrases, meaningParts);
      score += value;
      if (value) matched++;
    }
    if (!matched) continue;
    if (terms.length > 1 && meaningPhrases.includes(words(phrase).map(singular).join(' '))) score += 4;
    score += matched === terms.length ? 2 : 0;
    results.push({ name, family: glyph.family, meaning, score });
  }
  return results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
}

/** The text of a pull request's "Icon search:" section: from that label to the next blank line. */
export function iconSearchDeclaration(pullRequestBody) {
  const label = /^[ \t*_>-]*Icon search[*_]*:/i;
  const lines = String(pullRequestBody || '').split('\n');
  const start = lines.findIndex(line => label.test(line));
  if (start < 0) return null;
  const section = [lines[start].replace(label, '')];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) break;
    section.push(line);
  }
  const text = section.filter(line => !line.trim().startsWith('<!--')).join('\n').trim();
  return text || null;
}

const shortName = (name) => name.replace(/^(system|slidetype|filetype)-/, '');
const names = (text, name) => new RegExp(`(^|[^a-z0-9-])(${name}|${shortName(name)})(?![a-z0-9-])`, 'i').test(text);

/* closeMatches: { addedGlyph → [existing glyphs it must be weighed against] } */
export function checkIconSearchDeclaration({ body, addedGlyphs, closeMatches }) {
  if (!addedGlyphs.length) return { required: false, problems: [] };
  const text = iconSearchDeclaration(body);
  if (!text) {
    return { required: true, problems: [`this pull request adds ${addedGlyphs.join(', ')}, so its body needs an "Icon search:" line: the words you searched (npm run icon-search <words>) and, for each close match, why it does not fit`] };
  }
  const problems = [];
  for (const glyph of addedGlyphs) {
    const unexplained = (closeMatches[glyph] || []).filter(name => !names(text, name));
    if (unexplained.length) problems.push(`Icon search: says nothing about ${unexplained.join(', ')}, the closest existing icon(s) to ${glyph} — name each one and why it does not fit`);
  }
  return { required: true, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const query = args.filter(arg => !arg.startsWith('--')).join(' ');
  if (!query) {
    console.error('usage: npm run icon-search <words>   e.g. npm run icon-search help');
    process.exit(2);
  }
  const registry = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'icons', 'registry.json'), 'utf8'));
  const results = searchIcons(registry.icons, query);
  if (args.includes('--json')) {
    console.log(JSON.stringify({ query, gallery: `${ICON_GALLERY}?q=${encodeURIComponent(query)}`, results }, null, 2));
    process.exit(0);
  }
  if (!results.length) console.log(`No icon matches "${query}". Try a synonym, or browse ${ICON_GALLERY}`);
  for (const { name, meaning } of results) console.log(`${name.padEnd(40)} ${meaning.join(', ')}`);
  console.log(`\nUse one by name: <aha-icon name="${results[0]?.name || 'system-bell'}" size="16">. Browse: ${ICON_GALLERY}?q=${encodeURIComponent(query)}`);
  console.log('Nothing fits? Only then add a glyph to the DS (icons/svg/<family>/), and say in the pull request what you searched and why each close match did not fit.');
}
