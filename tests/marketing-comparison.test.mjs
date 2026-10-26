import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const comparison = JSON.parse(readFileSync(new URL('../marketing/comparison.json', import.meta.url), 'utf8'));
const comparedColumns = { 'compare-2': 2, 'compare-3': 3, 'compare-3-plans': 3, 'compare-4': 4, 'compare-5': 5 };

test('the comparison table ships in two, three, four and five compared columns', () => {
  assert.deepEqual(Object.fromEntries(comparison.layouts.map((layout) => [layout.slug, (layout.html.match(/<th class="aha-comparison__column-head[^"]*" scope="col">/g) || []).length])), comparedColumns);
});

test('every row has one cell per compared column, and every group heading spans the whole table', () => {
  for (const layout of comparison.layouts) {
    const count = comparedColumns[layout.slug];
    for (const [row] of layout.html.matchAll(/<tr>\s*<th scope="row">[^]*?<\/tr>/g)) assert.equal((row.match(/<td\b/g) || []).length, count, layout.slug);
    for (const [, span] of layout.html.matchAll(/scope="colgroup" colspan="(\d+)"/g)) assert.equal(Number(span), count + 1, layout.slug);
    assert.match(layout.html, /<caption class="aha-comparison__sr">/, layout.slug);
  }
});

test('ticks and crosses are DS icons with a spoken Yes or No', () => {
  for (const layout of comparison.layouts) {
    for (const [icon] of layout.html.matchAll(/<aha-icon class="aha-comparison__mark[^>]*><\/aha-icon><span class="aha-comparison__sr">(Yes|No)<\/span>/g)) assert.match(icon, /name="system-(check|x)"/);
    assert.equal((layout.html.match(/<aha-icon /g) || []).length, (layout.html.match(/__sr">(Yes|No)</g) || []).length, layout.slug);
  }
});

test('a highlighted column is outlined from its header to its last row', () => {
  for (const layout of comparison.layouts) {
    const highlighted = (layout.html.match(/__col--highlight/g) || []).length;
    if (layout.slug === 'compare-3-plans') { assert.equal(highlighted, 0); continue; }
    const rows = (layout.html.match(/<th scope="row">/g) || []).length;
    assert.equal(highlighted, rows + 1, layout.slug);
    assert.equal((layout.html.match(/__col--last/g) || []).length, 1, layout.slug);
  }
});

test('on a phone four and five columns scroll in a focusable region with the feature column held; two and three stay a table', () => {
  for (const layout of comparison.layouts) {
    const scrolls = comparedColumns[layout.slug] >= 4;
    assert.equal(layout.html.includes('aha-comparison--scroll'), scrolls, layout.slug);
    assert.equal(/class="aha-comparison__table-wrap" role="region" aria-labelledby="[^"]+" tabindex="0"/.test(layout.html), scrolls, layout.slug);
    if (scrolls) assert.match(layout.css, /@container aha-comparison \(max-width:767px\)\{\n  \.aha-comparison--compare-\d \.aha-comparison__table\{min-width:/, layout.slug);
  }
  assert.match(comparison.baseCss, /\.aha-comparison--scroll \.aha-comparison__table :is\(thead td:first-child,tbody th\[scope="row"\]\)\{position:sticky;left:0/);
  assert.match(comparison.baseCss, /ds-lint-allow: overflow-x-scroll/);
});
