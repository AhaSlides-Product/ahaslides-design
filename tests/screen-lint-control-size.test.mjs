import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lintHtml } from '../lib/screen-lint.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/control-size/${name}`, import.meta.url), 'utf8');
const hits = (source, rule, surface = 'product') =>
  lintHtml(source, { surface }).findings.filter((f) => f.rule === rule).map((f) => [f.line, f.severity]);

test('the shipped editor header entry fails on its lg tooltip and warns on its unsized icon button; the fixed file is clean', () => {
  assert.deepEqual(hits(fixture('editor-entry.before.vue'), 'tooltip-size'), [[3, 'hard']]);
  assert.deepEqual(hits(fixture('editor-entry.before.vue'), 'button-size-unset'), [[4, 'warn']]);
  assert.deepEqual(lintHtml(fixture('editor-entry.after.vue'), { surface: 'product' }).findings, []);
});

test('size="lg" on any tooltip tag hard-fails on every surface but canvas; a default tooltip passes', () => {
  const lg = ['<aha-tooltip text="Share" size="lg"><aha-button size="md">Share</aha-button></aha-tooltip>',
    '<AhaTooltip size={"lg"} text="Share" />', '<base-tooltip\n  :size="\'lg\'"\n  text="Share"></base-tooltip>'];
  for (const surface of ['product', 'settings', 'audience', 'website'])
    for (const source of lg) assert.equal(hits(source, 'tooltip-size', surface).length, 1, `${surface}: ${source}`);
  for (const source of lg) assert.equal(hits(source, 'tooltip-size', 'canvas').length, 0);
  assert.equal(hits('<aha-tooltip text="Share" placement="bottom"></aha-tooltip><aha-icon size="lg"></aha-icon>', 'tooltip-size').length, 0);
  assert.equal(hits('<!-- <aha-tooltip size="lg" text="x"> -->', 'tooltip-size').length, 0);
  assert.equal(hits('<aha-tooltip size="lg" text="Annotate" shortcut="D"> <!-- ds-lint-allow: tooltip-size (presenter control bar) -->', 'tooltip-size').length, 0);
});

test('an unsized button warns in a header or toolbar, beside sized siblings, or when icon-only', () => {
  const row = '<div class="editor-header">\n  <aha-button variant="secondary">Preview</aha-button>\n</div>';
  assert.match(lintHtml(row, { surface: 'product' }).findings[0].message, /header or toolbar row/);
  assert.deepEqual(hits('<div role="toolbar">\n<DesignSystemButton>Bold</DesignSystemButton>\n</div>', 'button-size-unset'), [[2, 'warn']]);
  assert.deepEqual(hits('<aha-button size="md">Preview</aha-button>\n<aha-button>Present</aha-button>', 'button-size-unset'), [[2, 'warn']]);
  assert.deepEqual(hits('<AhaButton icon-only aria-label="More" />', 'button-size-unset'), [[1, 'warn']]);
  assert.deepEqual(hits('<div id="top" class="editor-header">\n<aha-button>Share</aha-button>\n</div>', 'button-size-unset'), [[2, 'warn']]);
  assert.deepEqual(hits('<header>\n<aha-button :style="{ ...base }">Share</aha-button>\n</header>', 'button-size-unset'), [[2, 'warn']]);
});

test('a sized, bound or spread button passes, a lone text button passes, and only the product surface is checked', () => {
  assert.equal(hits('<header>\n<aha-button size="md">A</aha-button>\n<aha-button :size="s">B</aha-button>\n<aha-button v-bind="$attrs">C</aha-button>\n</header>', 'button-size-unset').length, 0);
  assert.equal(hits('<div class="card"><aha-button variant="primary">Save</aha-button></div>', 'button-size-unset').length, 0);
  assert.equal(hits('<aha-button :icon-only="false">Save</aha-button>', 'button-size-unset').length, 0);
  assert.deepEqual(hits('<header><aha-button>Back</aha-button></header>\n<aha-button>Next</aha-button>', 'button-size-unset'), [[1, 'warn']]);
  assert.equal(hits('<header><aha-button icon-only aria-label="x"></aha-button></header>', 'button-size-unset', 'canvas').length, 0);
  assert.equal(hits('<header></header>\n<aha-button>Next</aha-button>', 'button-size-unset').length, 0);
});
