import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('lib/static-icons matches the icon registry', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, [join(root, 'build-static-icons.mjs'), '--check'], { stdio: 'pipe' }));
});

test('every static glyph is single-colour with the colour baked in', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'lib/static-icons/manifest.json'), 'utf8'));
  for (const { name } of manifest.glyphs) {
    for (const [ink, hex] of Object.entries(manifest.inks)) {
      for (const size of manifest.sizes) {
        const svg = readFileSync(join(root, 'lib/static-icons', ink, String(size), `${name}.svg`), 'utf8');
        assert.ok(!svg.includes('currentColor'), `${ink}/${size}/${name} still uses currentColor`);
        const colours = new Set(svg.match(/#[0-9A-Fa-f]{6}\b/g));
        assert.deepEqual([...colours], [hex], `${ink}/${size}/${name} uses ${[...colours]}`);
        assert.match(svg, new RegExp(`width="${size}" height="${size}"`));
      }
    }
  }
});
